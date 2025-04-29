import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, Modal, Button, FlatList } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";
import { notificationStyles } from '../style/notification-style';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSensorData } from '../context/sensor-data-context';
import { database } from "../configs/firebase-config";
import { ref, set, onValue, update } from "firebase/database";

// 帶動畫的自定義進度條元件
const AnimatedProgressBar = ({ progress, color }: { progress: number; color: string }) => {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clampedProgress * 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress]);

  // 直接定義進度條樣式，避免依賴外部 styles
  const progressBarContainer = {
    height: 18,
    backgroundColor: "#e0e0e0",
    borderRadius: 9,
    overflow: "hidden" as 'hidden',
    marginVertical: 6,
  } as const;
  const progressBarFill = {
    height: 18,
    borderRadius: 9,
    backgroundColor: color,
  } as const;

  return (
    <View style={progressBarContainer}>
      <Animated.View
        style={[
          progressBarFill,
          {
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
};

// 格式化時間的函式
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 使用 24 小時制
  }).format(date);
};

type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  timestamp: string;
};

export default function IndexScreen() {
  // --- 門檻設定 state ---
  const [soilMoistureThreshold, setSoilMoistureThreshold] = useState(10);
  const [temperatureThreshold, setTemperatureThreshold] = useState(30);
  const [humidityThreshold, setHumidityThreshold] = useState(20);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<'soil' | 'temp' | 'humidity' | null>(null);
  const [tempValue, setTempValue] = useState(0); // 用於 Slider 調整暫存
  // --- 通知 cooldown flag ---
  const notificationCooldown = useRef({ soil: false, temp: false, humidity: false });

  // 通知訊息本地狀態
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // 先取得感測器數據
  const { sensorData } = useSensorData() || {};
  const soilMoisture = sensorData?.soilMoisture ?? 0;
  const temperature = sensorData?.temperature ?? 0;
  const humidity = sensorData?.humidity ?? 0;
  const timestamp = sensorData?.timestamp ?? new Date().toISOString();

  // 請求通知權限（建議只做一次）
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  // --- 自動檢查門檻並發送通知 ---
  const checkAndNotify = () => {
    // 防呆：sensorData 尚未初始化時不推播
    if (!sensorData || soilMoisture === 0 && temperature === 0 && humidity === 0) {
      console.log('[DEBUG] 跳過通知：感測值未初始化', { soilMoisture, temperature, humidity, sensorData });
      return;
    }
    console.log('[DEBUG] checkAndNotify 執行', {
      soilMoisture,
      temperature,
      humidity,
      soilMoistureThreshold,
      temperatureThreshold,
      humidityThreshold,
      cooldown: notificationCooldown.current
    });
    const now = new Date().toISOString();
    // 土壤濕度
    if (soilMoisture <= soilMoistureThreshold && !notificationCooldown.current.soil) {
      const title = '植物提醒';
      const body = `土壤濕度過低（≤${soilMoistureThreshold}%），請記得澆水！`;
      Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
      setNotifications(prev => [
        { id: `${now}-soil`, title, body, read: false, timestamp: now },
        ...prev
      ]);
      notificationCooldown.current.soil = true;
      setTimeout(() => { notificationCooldown.current.soil = false; }, 60 * 60 * 1000); // 1小時冷卻
    }
    // 溫度
    console.log('[DEBUG] 高溫條件判斷', { temp: temperature, cd: notificationCooldown.current.temp, result: temperature >= 32 && !notificationCooldown.current.temp });
    if (temperature >= 32 && !notificationCooldown.current.temp) {
      const title = '植物提醒';
      const body = `溫度過高（≥${temperatureThreshold}°C），請注意降溫！`;
      Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      }).then(() => {
        console.log('[DEBUG] 通知已發送');
      }).catch(e => {
        console.log('[DEBUG] 通知發送失敗', e);
      });
      setNotifications(prev => [
        { id: `${now}-temp`, title, body, read: false, timestamp: now },
        ...prev
      ]);
      notificationCooldown.current.temp = true;
      setTimeout(() => { notificationCooldown.current.temp = false; }, 60 * 60 * 1000);
    }
    // 環境濕度
    if (humidity <= humidityThreshold && !notificationCooldown.current.humidity) {
      const title = '植物提醒';
      const body = `環境濕度過低（≤${humidityThreshold}%），請注意加濕！`;
      Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
      setNotifications(prev => [
        { id: `${now}-humidity`, title, body, read: false, timestamp: now },
        ...prev
      ]);
      notificationCooldown.current.humidity = true;
      setTimeout(() => { notificationCooldown.current.humidity = false; }, 60 * 60 * 1000);
    }
  };


  useEffect(() => {
    checkAndNotify();
  }, [soilMoisture, temperature, humidity, soilMoistureThreshold, temperatureThreshold, humidityThreshold]);

  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);
  console.log('styles keys:', Object.keys(styles));
  // 計算進度條的比例值
  const validSoilMoisture = Math.round((soilMoisture / 100) * 100) / 100;
  const validTemperature = Math.min(1, Math.max(0, temperature / 40));
  const validHumidity = Math.round((humidity / 100) * 100) / 100;

  // 兩個水泵的狀態 (僅顯示狀態的文字，不作 toggle 而是上傳命令)
  const [waterPump1Status, setWaterPump1Status] = useState<string>('OFF');
  const [waterPump2Status, setWaterPump2Status] = useState<string>('OFF');
  const [loading, setLoading] = useState<{ pump1: boolean; pump2: boolean }>({ pump1: false, pump2: false });
  const [cooldown, setCooldown] = useState<{ pump1: boolean; pump2: boolean }>({ pump1: false, pump2: false });

  useEffect(() => {
    // 監聽 Firebase 內的水泵狀態更新 (如果狀態被樹莓派自動改回 OFF，也會更新)
    const pump1Ref = ref(database, "waterPump/pump1");
    const pump2Ref = ref(database, "waterPump/pump2");

    onValue(pump1Ref, (snapshot) => {
      const status = snapshot.val();
      // 假設從 Firebase 取得的狀態直接為 "ON" 或 "OFF"
      setWaterPump1Status(status || "OFF");
    });

    onValue(pump2Ref, (snapshot) => {
      const status = snapshot.val();
      setWaterPump2Status(status || "OFF");
    });

  }, []);

  const toggleWaterPump = async (pump: 'pump1' | 'pump2') => {
    if (cooldown[pump]) return; // 如果處於冷卻狀態則不執行

    // 開始冷卻（10秒）
    setCooldown((prev) => ({ ...prev, [pump]: true }));
    setLoading((prev) => ({ ...prev, [pump]: true }));

    try {
      // 當按下按鈕，將水泵狀態更新為 "ON" 到 Firebase
      await update(ref(database, 'waterPump'), {
        [pump]: "ON",
      });
      // 選擇同步更新本地狀態 (雖然 onValue 會自動更新)
      if (pump === 'pump1') {
        setWaterPump1Status("ON");
      } else {
        setWaterPump2Status("ON");
      }

      // 5秒後自動更新 Firebase 水泵狀態為 "OFF"
      setTimeout(async () => {
        try {
          await update(ref(database, 'waterPump'), {
            [pump]: "OFF",
          });
          if (pump === 'pump1') {
            setWaterPump1Status("OFF");
          } else {
            setWaterPump2Status("OFF");
          }
        } catch (error) {
          console.error(`自動關閉 ${pump} 失敗`, error);
        }
      }, 5000);

      // 10秒後解除冷卻
      setTimeout(() => {
        setCooldown((prev) => ({ ...prev, [pump]: false }));
      }, 10000);

    } catch (error) {
      console.error(`更新 ${pump} 狀態失敗`, error);
    }
    setLoading((prev) => ({ ...prev, [pump]: false }));
  };

  // 根據土壤濕度禁用按鈕 (當 soilMoisture 大於 50 時，按鈕一直禁用)
  const isButtonDisabled = soilMoisture > 50;

  // 未讀通知數
  const unreadCount = notifications.filter(n => !n.read).length;

  // 標記單筆為已讀
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  // 全部標記為已讀
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <View style={styles.container}>
      {/* 通知鈴鐺按鈕（右上角） */}
      <View style={notificationStyles.bellContainer}>
        <TouchableOpacity style={notificationStyles.bellButton} onPress={() => setDropdownVisible(v => !v)}>
          <Ionicons name="notifications-outline" size={28} color="#444" />
          {unreadCount > 0 && (
            <View style={notificationStyles.badge}>
              <Text style={notificationStyles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* 通知下拉列表 */}
        {dropdownVisible && (
          <View style={notificationStyles.notificationDropdown}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>未讀通知</Text>
            {notifications.length === 0 && (
              <Text style={{ color: '#888', textAlign: 'center', marginVertical: 20 }}>目前沒有通知</Text>
            )}
            <FlatList
              data={notifications.filter(n => !n.read)}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={notificationStyles.notificationItem}
                  onPress={() => markAsRead(item.id)}
                >
                  <Text style={notificationStyles.notificationTitle}>{item.title}</Text>
                  <Text style={notificationStyles.notificationBody}>{item.body}</Text>
                  <Text style={notificationStyles.notificationTimestamp}>{formatTimestamp(item.timestamp)}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 180 }}
            />
            {unreadCount > 0 && (
              <TouchableOpacity style={notificationStyles.markAllAsRead} onPress={markAllAsRead}>
                <Text style={notificationStyles.markAllText}>全部標記為已讀</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* 兩個水泵開關按鈕 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          onPress={() => toggleWaterPump('pump1')} 
          style={[styles.button, waterPump1Status === "ON" ? styles.activeButton : null]}
          disabled={loading.pump1 || isButtonDisabled || cooldown.pump1}
        >
          {loading.pump1 ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>水泵 1 ({waterPump1Status})</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => toggleWaterPump('pump2')} 
          style={[styles.button, waterPump2Status === "ON" ? styles.activeButton : null]}
          disabled={loading.pump2 || isButtonDisabled || cooldown.pump2}
        >
          {loading.pump2 ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>水泵 2 ({waterPump2Status})</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 顯示土壤濕度、溫度、濕度進度條 */}
      <View style={styles.sensorDataContainer}>
        {/* 土壤濕度區塊 */}
        <TouchableOpacity onPress={() => { setEditingType('soil'); setTempValue(soilMoistureThreshold); setModalVisible(true); }}>
          <Text style={{ ...styles.title, fontWeight: 'bold' as 'bold', textAlign: 'center' as 'center' }}>土壤濕度: {soilMoisture}%</Text>
          <AnimatedProgressBar progress={validSoilMoisture} color="#1abc9c" />
        </TouchableOpacity>

        {/* 溫度區塊 */}
        <TouchableOpacity onPress={() => { setEditingType('temp'); setTempValue(temperatureThreshold); setModalVisible(true); }}>
          <Text style={{ ...styles.title, fontWeight: 'bold' as 'bold', textAlign: 'center' as 'center' }}>溫度: {temperature}°C</Text>
          <AnimatedProgressBar progress={validTemperature} color="#f39c12" />
        </TouchableOpacity>

        {/* 環境濕度區塊 */}
        <TouchableOpacity onPress={() => { setEditingType('humidity'); setTempValue(humidityThreshold); setModalVisible(true); }}>
          <Text style={{ ...styles.title, fontWeight: 'bold' as 'bold', textAlign: 'center' as 'center' }}>環境濕度: {humidity}%</Text>
          <AnimatedProgressBar progress={validHumidity} color="#3498db" />
        </TouchableOpacity>

        {/* 顯示資料最後更新時間 */}
        <Text style={{ ...styles.timestampText, textAlign: 'center' as 'center' }}>
          資料最後更新時間: {timestamp ? formatTimestamp(timestamp) : "無資料"}
        </Text>

        {/* DEBUG: 重置通知冷卻按鈕 */}
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Button title="重置通知冷卻" color="#e67e22" onPress={() => {
            notificationCooldown.current.soil = false;
            notificationCooldown.current.temp = false;
            notificationCooldown.current.humidity = false;
            console.log('[DEBUG] 已重置 cooldown', notificationCooldown.current);
            checkAndNotify();
          }} />
        </View>
      </View>

      {/* 門檻設定 Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.2)' }}>
          <View style={{
            width: '80%',
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
            alignItems: 'center',
          }}>
            <Text style={{ color: '#333', fontSize: 16, fontWeight: 'bold' as 'bold', marginTop: 8, marginBottom: 4, textAlign: 'center' as 'center' }}>
              設定{editingType === 'soil' ? '土壤濕度' : editingType === 'temp' ? '溫度' : '環境濕度'}警告門檻
            </Text>
            {editingType === 'temp' && (
              <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>
                可設定範圍：0 ~ 50°C
              </Text>
            )}
            {editingType !== 'temp' && (
              <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>
                可設定範圍：0 ~ 100%
              </Text>
            )}
            <Slider
               style={{ width: '100%', height: 40 }}
               minimumValue={editingType === 'temp' ? 0 : 0}
               maximumValue={editingType === 'temp' ? 50 : 100}
               step={1}
               value={tempValue}
               onValueChange={setTempValue}
               minimumTrackTintColor="#1abc9c"
               maximumTrackTintColor="#ccc"
             />
            <Text style={{ color: '#333', fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 12, fontWeight: 'bold' }}>
               {editingType === 'soil' && `目前門檻: ${tempValue}%`}
               {editingType === 'temp' && `目前門檻: ${tempValue}°C`}
               {editingType === 'humidity' && `目前門檻: ${tempValue}%`}
             </Text>
            <View style={{ flexDirection:'row', justifyContent:'space-between', width: '100%', marginTop: 8 }}>
               <View style={{ flex: 1, marginRight: 8 }}>
                 <Button title="取消" color="#888" onPress={() => setModalVisible(false)} />
               </View>
               <View style={{ flex: 1, marginLeft: 8 }}>
                 <Button title="確認" color="#1abc9c" onPress={() => {
                   if(editingType === 'soil') setSoilMoistureThreshold(tempValue);
                   if(editingType === 'temp') setTemperatureThreshold(tempValue);
                   if(editingType === 'humidity') setHumidityThreshold(tempValue);
                   setModalVisible(false);
                 }} />
               </View>
             </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
