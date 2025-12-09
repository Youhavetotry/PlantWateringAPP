import time
import datetime
import board
import adafruit_dht
import spidev
import firebase_admin
from firebase_admin import credentials, db
import threading
import requests
import urllib3
import subprocess
import base64
import os
import RPi.GPIO as GPIO

# ---------- 初始化 Firebase ----------
cred = credentials.Certificate("config/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://plantwateringdbase-default-rtdb.asia-southeast1.firebasedatabase.app/'
})
sensor_ref = db.reference('sensorData')
latest_ref = db.reference('sensorData/latest')
mode_ref = db.reference('mode')
thresholds_ref = db.reference('thresholds')
status_ref = db.reference('status/heartbeat')
pump_ref = db.reference('waterPump/pump1')
photo_ref = db.reference('photo')
latest_image_ref = db.reference('latestImage')

# ---------- GPIO 設定 ----------
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
PUMP1_PIN = 17
GPIO.setup(PUMP1_PIN, GPIO.OUT)
GPIO.output(PUMP1_PIN, GPIO.LOW)

# ---------- 感測器初始化 ----------
def create_dht_sensor():
    return adafruit_dht.DHT11(board.D4)

sensor_dht = create_dht_sensor()

# ---------- SPI 初始化 ----------
spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 1350000

def read_adc(channel):
    if channel < 0 or channel > 7:
        return -1
    adc = spi.xfer2([1, (8 + channel) << 4, 0])
    data = ((adc[1] & 3) << 8) + adc[2]
    return data

def convert_to_moisture(adc_value):
    max_value = 1023
    min_value = 300
    moisture = (1 - ((adc_value - min_value) / (max_value - min_value))) * 100
    return max(0, min(100, moisture))

# ---------- 水泵控制與看門狗 ----------
pump_active = False
pump_watchdog_timer = None
PUMP_MAX_ON_TIME = 15  # 最長允許水泵開啟秒數，單位：秒（可由 thresholds 覆寫）

# 門檻（可由 thresholds 覆寫）
SOIL_MOISTURE_THRESHOLD = 30
MIN_TEMPERATURE_THRESHOLD = 10  # 保留（目前未用於自動化）
HUMIDITY_ENV_THRESHOLD = 20     # 保留（目前未用於自動化）

def activate_pump1():
    global pump_active, pump_watchdog_timer
    if not pump_active:
        print("[INFO] 啟動 pump1")
        pump_active = True
        GPIO.output(PUMP1_PIN, GPIO.HIGH)
        # 啟動看門狗計時器
        if pump_watchdog_timer:
            pump_watchdog_timer.cancel()
        pump_watchdog_timer = threading.Timer(PUMP_MAX_ON_TIME, watchdog_deactivate_pump1)
        pump_watchdog_timer.start()

def deactivate_pump1():
    global pump_active, pump_watchdog_timer
    if pump_active:
        print("[INFO] 關閉 pump1")
        pump_active = False
        GPIO.output(PUMP1_PIN, GPIO.LOW)
        if pump_watchdog_timer:
            pump_watchdog_timer.cancel()
            pump_watchdog_timer = None

def watchdog_deactivate_pump1():
    print(f"[看門狗] 水泵已超時自動關閉（{PUMP_MAX_ON_TIME}秒）")
    pump_ref.set("OFF")
    deactivate_pump1()

def control_water_pump(event):
    print("[DEBUG] 偵測到事件觸發")
    print(f"[DEBUG] event.path: {event.path}")
    print(f"[DEBUG] event.data: {event.data}")
    if event.data == "ON":
        threading.Thread(target=activate_pump1).start()
    elif event.data == "OFF":
        threading.Thread(target=deactivate_pump1).start()

def listen_for_pump():
    print("[INFO] Firebase pump1 監聽中...")
    pump_ref.listen(control_water_pump)

# 上傳變更門檻（差值判斷，可由 thresholds 覆寫）
DELTA_TEMP = 0.2
DELTA_HUMIDITY = 2
DELTA_SOIL = 5

# ---------- RTDB 設定讀取（poll 方式） ----------
def pull_settings():
    global SOIL_MOISTURE_THRESHOLD, PUMP_MAX_ON_TIME, MIN_TEMPERATURE_THRESHOLD, HUMIDITY_ENV_THRESHOLD
    global DELTA_TEMP, DELTA_HUMIDITY, DELTA_SOIL
    try:
        t = thresholds_ref.get() or {}
        if 'soilMoisture' in t:
            SOIL_MOISTURE_THRESHOLD = int(t['soilMoisture'])
        if 'minTemperature' in t:
            try:
                MIN_TEMPERATURE_THRESHOLD = float(t['minTemperature'])
            except Exception:
                pass
        if 'humidity' in t:
            try:
                HUMIDITY_ENV_THRESHOLD = float(t['humidity'])
            except Exception:
                pass
        if 'maxWateringTimeMs' in t:
            # 將毫秒轉為秒，保底 [3, 10]
            ms = int(t['maxWateringTimeMs'])
            sec = max(3, min(10, ms // 1000))
            if sec != PUMP_MAX_ON_TIME:
                print(f"[設定] 更新最大澆水時間為 {sec} 秒（由maxWateringTimeMs={ms}）")
            PUMP_MAX_ON_TIME = sec
        # 上傳變更的差值門檻（選填）
        if 'deltaTemp' in t:
            try: DELTA_TEMP = float(t['deltaTemp'])
            except Exception: pass
        if 'deltaHumidity' in t:
            try: DELTA_HUMIDITY = float(t['deltaHumidity'])
            except Exception: pass
        if 'deltaSoilMoisture' in t:
            try: DELTA_SOIL = float(t['deltaSoilMoisture'])
            except Exception: pass
    except Exception as e:
        print(f"[設定] 讀取 thresholds 失敗: {e}")

def pull_mode():
    try:
        m = mode_ref.get()
        return m if m in ('smart','manual') else 'manual'
    except Exception as e:
        print(f"[設定] 讀取 mode 失敗: {e}")
        return 'manual'

# ---------- 感測器資料上傳 ----------
last_uploaded_data = {
    'temperature_c': None,
    'humidity': None,
    'soil_moisture': None,
    'timestamp': None
}
TEMP_THRESHOLD = DELTA_TEMP
HUMIDITY_THRESHOLD = DELTA_HUMIDITY
MOISTURE_THRESHOLD = DELTA_SOIL

def upload_sensor_data():
    global sensor_dht, last_uploaded_data
    try:
        temperature_c = sensor_dht.temperature
        humidity = sensor_dht.humidity
        adc_value = read_adc(0)

        if temperature_c is None or humidity is None or adc_value is None or adc_value < 0:
            print("[略過] 感測值為 None/非法，等待下次讀取")
            return

        try:
            temperature_c = round(float(temperature_c), 1)
            humidity = round(float(humidity), 1)
            soil_moisture = round(float(convert_to_moisture(adc_value)), 1)
        except Exception as e:
            print(f"[略過] 數值轉換異常: {e}")
            return

        temp_change = last_uploaded_data['temperature_c'] is None or abs(temperature_c - last_uploaded_data['temperature_c']) >= DELTA_TEMP
        humidity_change = last_uploaded_data['humidity'] is None or abs(humidity - last_uploaded_data['humidity']) >= DELTA_HUMIDITY
        moisture_change = last_uploaded_data['soil_moisture'] is None or abs(soil_moisture - last_uploaded_data['soil_moisture']) >= DELTA_SOIL

        if temp_change or humidity_change or moisture_change:
            sensor_data = {
                'temperature_c': temperature_c,
                'temperature_f': round(temperature_c * (9 / 5) + 32, 1),
                'humidity': humidity,
                'soil_moisture': soil_moisture,
                'timestamp': datetime.datetime.now().isoformat()
            }
            try:
                # 寫入歷史
                sensor_ref.push(sensor_data)
                # 同步最新
                try:
                    latest_ref.set(sensor_data)
                except Exception as _:
                    pass
                print(f"[上傳] 感測數據: {sensor_data}")
                last_uploaded_data = sensor_data
            except (requests.exceptions.RequestException, urllib3.exceptions.HTTPError, ConnectionError) as e:
                print(f"[網路錯誤] 上傳失敗: {e}")
        else:
            print("[略過] 數據無顯著變化")

    except RuntimeError as error:
        print(f"[讀取錯誤] {error.args[0]}")
    except Exception as error:
        print(f"[非網路] 未分類錯誤: {error}")
        try:
            sensor_dht.exit()
        except:
            pass
        sensor_dht = create_dht_sensor()

# ---------- 智慧模式控制（在 Pi 端執行） ----------
def smart_control_step():
    """根據 soil 濕度與門檻自動開關泵。"""
    global pump_active
    try:
        # 僅用土壤濕度做判斷，快速讀 ADC 即可
        adc = read_adc(0)
        if adc is None or adc < 0:
            return
        soil = round(float(convert_to_moisture(adc)), 1)
        if soil < SOIL_MOISTURE_THRESHOLD and not pump_active:
            threading.Thread(target=activate_pump1).start()
        elif soil >= SOIL_MOISTURE_THRESHOLD and pump_active:
            threading.Thread(target=deactivate_pump1).start()
    except Exception as e:
        print(f"[smart] 控制步驟錯誤: {e}")

last_heartbeat = 0
def heartbeat_step():
    global last_heartbeat
    now = time.time()
    if now - last_heartbeat >= 30:
        try:
            status_ref.set(datetime.datetime.now().isoformat())
            last_heartbeat = now
        except Exception:
            pass


def capture_photo_with_usb():
    """使用 USB 攝影機拍照，並將結果寫入 latestImage (data URL)。"""
    filename = "/tmp/plant_photo.jpg"
    cmd = [
        "fswebcam",
        "-r", "1920x1080",
        "--no-banner",
        "--skip", "10",
        "--set", "Brightness=100%",
        "--set", "Contrast=50%",
        "--set", "Saturation=45%",
        "--set", "Exposure=auto",
        filename,
    ]
    try:
        # 透過系統指令拍照
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        if not os.path.exists(filename):
            raise FileNotFoundError(f"拍照後找不到檔案: {filename}")

        with open(filename, "rb") as f:
            img_bytes = f.read()

        b64 = base64.b64encode(img_bytes).decode("ascii")
        data_url = "data:image/jpeg;base64," + b64

        payload = {
            "url": data_url,
            "takenAt": datetime.datetime.now().isoformat(),
        }
        latest_image_ref.set(payload)
        print("[photo] 拍照並更新 latestImage 成功")
        return True
    except Exception as e:
        print(f"[photo] 拍照失敗: {e}")
        try:
            photo_ref.child("lastError").set(str(e))
        except Exception:
            pass
        return False


def process_photo_request_step():
    """輪詢 RTDB 的 photo 狀態，處理手動(request)與定時(scheduled + nextCapture)拍照。"""
    try:
        photo = photo_ref.get() or {}
        mode = photo.get("mode", "manual")
        request = photo.get("request", False)
        next_capture = int(photo.get("nextCapture", 0) or 0)
        current_time = int(time.time())

        # 1) 手動拍照請求
        if request:
            print("[photo] 收到手動拍照請求")
            ok = capture_photo_with_usb()

            update_payload = {"request": False}
            if ok:
                update_payload["lastCaptureAt"] = current_time

            try:
                photo_ref.update(update_payload)
            except Exception as e:
                print(f"[photo] 回寫 photo 狀態失敗: {e}")
            return

        # 2) 定時拍照（scheduled 模式，且時間已到）
        if mode == "scheduled" and current_time >= next_capture and next_capture > 0:
            print("[photo] 執行定時拍照...")
            ok = capture_photo_with_usb()

            # 暫時固定每小時一次，3600 秒；之後可改為由 app 端寫入的間隔
            next_time = current_time + 3600
            update_payload = {"nextCapture": next_time}
            if ok:
                update_payload["lastCaptureAt"] = current_time

            try:
                photo_ref.update(update_payload)
            except Exception as e:
                print(f"[photo] 回寫定時拍照狀態失敗: {e}")
    except Exception as e:
        print(f"[photo] 處理拍照請求時錯誤: {e}")

# ---------- 主程式 ----------
if __name__ == "__main__":
    try:
        threading.Thread(target=listen_for_pump, daemon=True).start()
        settings_t = 0
        sensor_t = 0
        control_t = 0
        photo_t = 0
        while True:
            now = time.time()
            # 1) 週期性上傳感測資料（10s）
            if now - sensor_t >= 10:
                upload_sensor_data()
                sensor_t = now
            # 2) 拉取設定（每 5s）
            if now - settings_t >= 5:
                pull_settings()
                settings_t = now
            # 3) 智慧模式（每 2s）
            if now - control_t >= 2:
                if pull_mode() == 'smart':
                    smart_control_step()
                control_t = now
            # 4) 拍照請求處理（每 2s）
            if now - photo_t >= 2:
                process_photo_request_step()
                photo_t = now
            # 5) 心跳
            heartbeat_step()
            time.sleep(0.2)
    except KeyboardInterrupt:
        GPIO.cleanup()
        spi.close()
        print("\n[結束] 中斷程式，清理 GPIO 與 SPI")
