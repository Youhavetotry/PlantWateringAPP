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
import RPi.GPIO as GPIO

# ---------- 初始化 Firebase ----------
cred = credentials.Certificate("config/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://plantwateringdbase-default-rtdb.asia-southeast1.firebasedatabase.app/'
})
sensor_ref = db.reference('sensorData')
pump_ref = db.reference('waterPump/pump1')

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
PUMP_MAX_ON_TIME = 30  # 最長允許水泵開啟秒數，單位：秒

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

# ---------- 感測器資料上傳 ----------
last_uploaded_data = {
    'temperature_c': None,
    'humidity': None,
    'soil_moisture': None,
    'timestamp': None
}
TEMP_THRESHOLD = 0.2
HUMIDITY_THRESHOLD = 2
MOISTURE_THRESHOLD = 5

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

        temp_change = last_uploaded_data['temperature_c'] is None or abs(temperature_c - last_uploaded_data['temperature_c']) >= TEMP_THRESHOLD
        humidity_change = last_uploaded_data['humidity'] is None or abs(humidity - last_uploaded_data['humidity']) >= HUMIDITY_THRESHOLD
        moisture_change = last_uploaded_data['soil_moisture'] is None or abs(soil_moisture - last_uploaded_data['soil_moisture']) >= MOISTURE_THRESHOLD

        if temp_change or humidity_change or moisture_change:
            sensor_data = {
                'temperature_c': temperature_c,
                'temperature_f': round(temperature_c * (9 / 5) + 32, 1),
                'humidity': humidity,
                'soil_moisture': soil_moisture,
                'timestamp': datetime.datetime.now().isoformat()
            }
            try:
                sensor_ref.push(sensor_data)
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

# ---------- 主程式 ----------
if __name__ == "__main__":
    try:
        threading.Thread(target=listen_for_pump, daemon=True).start()
        while True:
            upload_sensor_data()
            time.sleep(10)
    except KeyboardInterrupt:
        GPIO.cleanup()
        spi.close()
        print("\n[結束] 中斷程式，清理 GPIO 與 SPI")
