import React, { useMemo, useRef, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, Modal, Button, FlatList, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";
import { getNotificationStyles } from '../style/notification-style';
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
  // --- 水泵控制相關 state/ref 統一宣告 ---
  const [isWatering, setIsWatering] = useState<{ [key in 'pump1' | 'pump2']: boolean }>({ pump1: false, pump2: false });
  const pumpStartTimeRef = useRef<{ [key in 'pump1' | 'pump2']: number }>({ pump1: 0, pump2: 0 });
  const pumpTimeoutTriggeredRef = useRef<{ [key in 'pump1' | 'pump2']: boolean }>({ pump1: false, pump2: false });
  const wateringTimeoutRef = useRef<{ [key in 'pump1' | 'pump2']: NodeJS.Timeout | null }>({ pump1: null, pump2: null });
  const wateringUnsubscribeRef = useRef<{ [key in 'pump1' | 'pump2']: (() => void) | null }>({ pump1: null, pump2: null });
  const soilMoistureRef = ref(database, 'sensorData/latest');
  const [confirmModal, setConfirmModal] = useState<{visible: boolean, pump: 'pump1' | 'pump2' | null}>({visible: false, pump: null});

  // --- 門檻設定 state ---
  const [soilMoistureThreshold, setSoilMoistureThreshold] = useState(15);
  const [temperatureThreshold, setTemperatureThreshold] = useState(32);
  const [humidityThreshold, setHumidityThreshold] = useState(20);

  // 土壤濕度、溫度與環境濕度門檻：APP 啟動時從 AsyncStorage 讀取
  useEffect(() => {
    (async () => {
      try {
        const soil = await AsyncStorage.getItem('soilMoistureThreshold');
        if (soil !== null) {
          setSoilMoistureThreshold(Number(soil));
        }
        const temp = await AsyncStorage.getItem('temperatureThreshold');
        if (temp !== null) {
          setTemperatureThreshold(Number(temp));
        }
        const hum = await AsyncStorage.getItem('humidityThreshold');
        if (hum !== null) {
          setHumidityThreshold(Number(hum));
        }
      } catch (e) {
        // 讀取失敗時，仍使用預設值
      }
    })();
  }, []);

  // 當 soilMoistureThreshold 變動時寫入 AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem('soilMoistureThreshold', soilMoistureThreshold.toString());
  }, [soilMoistureThreshold]);
  // 當 temperatureThreshold 變動時寫入 AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem('temperatureThreshold', temperatureThreshold.toString());
  }, [temperatureThreshold]);
  // 當 humidityThreshold 變動時寫入 AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem('humidityThreshold', humidityThreshold.toString());
  }, [humidityThreshold]);
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
      
      return;
    }
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
      setTimeout(() => { notificationCooldown.current.soil = false; }, 3 * 60 * 60 * 1000); // 3小時冷卻
    }
    // 溫度
    
    if (temperature >= 32 && !notificationCooldown.current.temp) {
      const title = '植物提醒';
      const body = `溫度過高（≥${temperatureThreshold}°C），請注意降溫！`;
      Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      }).then(() => {
        
      }).catch(e => {
        
      });
      setNotifications(prev => [
        { id: `${now}-temp`, title, body, read: false, timestamp: now },
        ...prev
      ]);
      notificationCooldown.current.temp = true;
      setTimeout(() => { notificationCooldown.current.temp = false; }, 4 * 60 * 60 * 1000); // 4小時冷卻
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
      setTimeout(() => { notificationCooldown.current.humidity = false; }, 4 * 60 * 60 * 1000); // 4小時冷卻
    }
  };


  useEffect(() => {
    checkAndNotify();
  }, [soilMoisture, temperature, humidity, soilMoistureThreshold, temperatureThreshold, humidityThreshold]);

  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);
  const notificationStyles = useMemo(() => getNotificationStyles(theme), [theme]);
  
  // 計算進度條的比例值
  const validSoilMoisture = Math.round((soilMoisture / 100) * 100) / 100;
  const validTemperature = Math.min(1, Math.max(0, temperature / 40));
  const validHumidity = Math.round((humidity / 100) * 100) / 100;

  // 兩個水泵的狀態 (僅顯示狀態的文字，不作 toggle 而是上傳命令)
  const [waterPump1Status, setWaterPump1Status] = useState<string>('OFF');
  const [waterPump2Status, setWaterPump2Status] = useState<string>('OFF');
  const [loading, setLoading] = useState<{ pump1: boolean; pump2: boolean }>({ pump1: false, pump2: false });
  const [cooldown, setCooldown] = useState<{ pump1: boolean; pump2: boolean }>({ pump1: false, pump2: false });

  // 擴充資訊：澆水次數統計
  const [wateringStats, setWateringStats] = useState({ todayCount: 0, weekCount: 0, lastWateringTimestamp: null as string | null });
  // 每次啟動水泵時更新澆水次數
  const updateWateringStats = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = (() => {
      const d = new Date(now);
      d.setDate(now.getDate() - now.getDay());
      return d.toISOString().split('T')[0];
    })();
    setWateringStats(prev => {
      const newStats = { ...prev };
      if (!prev.lastWateringTimestamp || prev.lastWateringTimestamp.split('T')[0] !== today) {
        newStats.todayCount = 1;
      } else {
        newStats.todayCount += 1;
      }
      if (!prev.lastWateringTimestamp || prev.lastWateringTimestamp.split('T')[0] < weekStart) {
        newStats.weekCount = 1;
      } else {
        newStats.weekCount += 1;
      }
      newStats.lastWateringTimestamp = now.toISOString();
      // 寫入 AsyncStorage
      AsyncStorage.setItem('wateringStats', JSON.stringify(newStats));
      return newStats;
    });
  };

  // 啟動時讀取澆水統計
  useEffect(() => {
    (async () => {
      const stats = await AsyncStorage.getItem('wateringStats');
      if (stats) setWateringStats(JSON.parse(stats));
    })();
  }, []);

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

// --- 更新水泵狀態 ---
const updatePumpStatus = async (pump: 'pump1' | 'pump2', status: 'ON' | 'OFF') => {
  await update(ref(database, 'waterPump'), { [pump]: status });
  if (pump === 'pump1') setWaterPump1Status(status);
  else setWaterPump2Status(status);
};

// --- 停止水泵 ---
const stopWaterPump = (pump: 'pump1' | 'pump2', reason: 'manual' | 'auto' | 'timeout' = 'manual') => {
  updatePumpStatus(pump, "OFF");
  setIsWatering(prev => ({ ...prev, [pump]: false }));
  if (wateringUnsubscribeRef.current[pump]) {
    wateringUnsubscribeRef.current[pump]!();
    wateringUnsubscribeRef.current[pump] = null;
  }
  if (wateringTimeoutRef.current[pump]) {
    clearTimeout(wateringTimeoutRef.current[pump]!);
    wateringTimeoutRef.current[pump] = null;
  }
  const elapsedTime = Math.round((Date.now() - pumpStartTimeRef.current[pump]) / 1000);
  if (reason === 'manual') {
    const now = new Date().toISOString();
    const title = `水泵 ${pump === 'pump1' ? '1' : '2'} 已手動停止`;
    const body = `運行時間：${elapsedTime} 秒\n原因：使用者手動停止`;
    Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
    setNotifications(prev => [
      { id: `${now}-pump-${pump}`, title, body, read: false, timestamp: now },
      ...prev
    ]);
  }
};

// --- 啟動/切換水泵 ---
const toggleWaterPump = async (pump: 'pump1' | 'pump2') => {
  updateWateringStats();
  if (cooldown[pump]) return;
  if (isWatering[pump]) {
    stopWaterPump(pump); // 手動強制停止
    return;
  }
  pumpStartTimeRef.current[pump] = Date.now();
  pumpTimeoutTriggeredRef.current[pump] = false;
  try {
    await updatePumpStatus(pump, "ON");
    setIsWatering(prev => ({ ...prev, [pump]: true }));
    const maxWateringTime = 30000;
    const unsubscribe = onValue(soilMoistureRef, (snapshot) => {
      const currentMoisture = snapshot.val()?.moisture;
      const elapsedTime = Date.now() - pumpStartTimeRef.current[pump];
      if (typeof currentMoisture === 'number' && currentMoisture >= 45) {
        stopWaterPump(pump, 'auto');
        Notifications.scheduleNotificationAsync({
          content: {
            title: `水泵 ${pump === 'pump1' ? '1' : '2'} 已自動停止`,
            body: `運行時間：${Math.round(elapsedTime / 1000)} 秒\n原因：土壤濕度達標 (>45%)`,
          },
          trigger: null,
        });
      }
    });
    wateringUnsubscribeRef.current[pump] = unsubscribe;
    const timeout = setTimeout(() => {
      pumpTimeoutTriggeredRef.current[pump] = true;
      stopWaterPump(pump, 'timeout');
      const now = new Date().toISOString();
      const title = `水泵 ${pump === 'pump1' ? '1' : '2'} 已自動停止`;
      const body = `運行時間：30 秒\n原因：超過最大澆水時間`;
      Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
        },
        trigger: null,
      });
      setNotifications(prev => [
        { id: `${now}-timeout-${pump}`, title, body, read: false, timestamp: now },
        ...prev
      ]);
    }, maxWateringTime);
    wateringTimeoutRef.current[pump] = timeout;
  } catch (error) {
    setIsWatering(prev => ({ ...prev, [pump]: false }));
  }
};

// --- 處理水泵按鈕點擊 ---
const handleWaterPumpPress = (pump: 'pump1' | 'pump2') => {
  if (isWatering[pump]) {
    stopWaterPump(pump);
    return;
  }
  if (soilMoisture > 40) {
    setConfirmModal({ visible: true, pump });
  } else {
    toggleWaterPump(pump);
  }
};

  // --- 最大澆水時間（秒） ---
  const maxWateringTime = 30; // 30秒


  // --- 禁用按鈕條件 ---
  const isButtonDisabled = soilMoisture > 70;

  // --- 未讀通知數 ---
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  // --- 單筆標記為已讀 ---
  const markAsRead = (id: string) => {
    setNotifications((prev: Notification[]) => prev.map((n: Notification) => n.id === id ? { ...n, read: true } : n));
  };
  // --- 全部標記為已讀 ---
  const markAllAsRead = () => {
    setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, read: true })));
  };

  // --- 其餘缺失的宣告補充於頂部 ---
  // 已於頂部統一宣告: pumpStartTimeRef, wateringTimeoutRef, wateringUnsubscribeRef, pumpTimeoutTriggeredRef, cooldown, loading, soilMoisture, temperature, humidity, timestamp, notifications, setNotifications, dropdownVisible, setDropdownVisible, validSoilMoisture, validTemperature, validHumidity, styles, notificationStyles

  return (
    <View style={[styles.container, { flex: 1 }]}>
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
          <View style={[
          notificationStyles.notificationDropdown,
          theme === 'dark' && { backgroundColor: '#23272F' }
        ]}>

            <Text style={[notificationStyles.notificationTitle, { fontSize: 16, marginBottom: 8 }]}>未讀通知</Text>
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
          onPress={() => handleWaterPumpPress('pump1')} 
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
          onPress={() => handleWaterPumpPress('pump2')} 
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
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
          <Text style={{ ...styles.timestampText, textAlign: 'right' as 'right', marginBottom: 20 }}>
            資料最後更新時間: {timestamp ? formatTimestamp(timestamp) : "無資料"}
          </Text>
          {/* 擴充資訊卡片區塊 */}
          {/* 水平排列的卡片區塊 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', marginTop: 24, marginBottom: 24, paddingBottom: 0 }}>
            {/* 植物健康提示卡片 */}
            <View style={{
              flex: 1,
              backgroundColor: theme === 'dark' ? '#29352f' : '#f9fbe7',
              height: 130,
              borderRadius: 14,
              padding: 14,
              marginRight: 8,
              shadowColor: theme === 'dark' ? '#111' : '#ccc',
              shadowOpacity: 0.18,
              shadowRadius: 5,
              elevation: 2,
              minWidth: 0,
            }}>
              <Text style={{ fontWeight: 'bold', fontSize: 15, color: theme === 'dark' ? '#b7e4c7' : '#689f38', marginBottom: 12 }}>🌱 植物健康提示</Text>
              <Text style={{ color: theme === 'dark' ? '#d0e2cf' : '#666', fontSize: 11.5, marginLeft: 4}}>
                {soilMoisture < soilMoistureThreshold ? '⚠️ 土壤偏乾，建議立即澆水。\n' : ''}
                {temperature > temperatureThreshold ? '⚠️ 溫度偏高，注意通風降溫。\n' : ''}
                {humidity < humidityThreshold ? '⚠️ 濕度偏低，建議加濕。\n' : ''}
                {soilMoisture >= soilMoistureThreshold && temperature <= temperatureThreshold && humidity >= humidityThreshold ? '👍 植物狀態良好，請持續保持！' : ''}
              </Text>
            </View>
            {/* 澆水次數統計卡片 */}
            <View style={{
              flex: 1,
              backgroundColor: theme === 'dark' ? '#222c38' : '#e3f2fd',
              height: 130,
              borderRadius: 14,
              padding: 14,
              marginLeft: 8,
              shadowColor: theme === 'dark' ? '#111' : '#ccc',
              shadowOpacity: 0.18,
              shadowRadius: 5,
              elevation: 2,
              minWidth: 0,
            }}>
              <Text style={{ fontWeight: 'bold', fontSize: 15, color: theme === 'dark' ? '#90caf9' : '#1976d2', marginBottom: 12 }}>💧 澆水次數統計</Text>
              <Text style={{ color: theme === 'dark' ? '#b0bec5' : '#555', fontSize: 11.5, marginBottom: 4 , marginLeft: 4}}>今日澆水次數：{wateringStats?.todayCount ?? 0} </Text>
              <Text style={{ color: theme === 'dark' ? '#b0bec5' : '#555', fontSize: 11.5, marginBottom: 4 , marginLeft: 4}}>本週澆水次數：{wateringStats?.weekCount ?? 0} </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* 土壤濕度大於40% 的澆水確認提示框（與溫度警告提示框風格一致） */}
      <Modal visible={confirmModal.visible} transparent animationType="slide">
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
            <Text style={{ color: '#e67e22', fontSize: 16, fontWeight: 'bold', marginTop: 8, marginBottom: 8, textAlign: 'center' }}>
              土壤濕度已高於 40%
            </Text>      
            <Text style={{ 
              color: '#333', 
              fontSize: 15, 
              textAlign: 'center', 
              marginBottom: 16, 
              lineHeight: 22, 
              width: '100%' 
            }}>
              目前土壤濕度為 {soilMoisture}%{'\n'}確定要強制啟動水泵嗎？
            </Text>
            <View style={{ flexDirection:'row', justifyContent:'space-between', width: '100%', marginTop: 8 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Button title="取消" color="#888" onPress={() => setConfirmModal({visible:false, pump:null})} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Button title="確認啟動" color="#e67e22" onPress={() => {
                  if (confirmModal.pump) toggleWaterPump(confirmModal.pump);
                  setConfirmModal({visible:false, pump:null});
                }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
                可設定高於範圍：0 ~ 50°C
              </Text>
            )}
            {editingType !== 'temp' && (
              <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>
                可設定低於範圍：0 ~ 100%
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
