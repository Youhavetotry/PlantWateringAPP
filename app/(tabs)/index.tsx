import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, ScrollView, Modal, Button, Animated, ActivityIndicator, Switch, Platform } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { PlantType } from '../constants/plantTypes';
// @ts-ignore
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// @ts-ignore
import { Slider } from '@miblanchard/react-native-slider';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";
import { getNotificationStyles } from '../style/notification-style';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSensorData } from '../context/sensor-data-context';
import { database } from "../configs/firebase-config";
import { ref, set, onValue, update } from "firebase/database";
import { Image, ImageStyle } from 'react-native';
import { useEventLog } from '../context/event-log-context';

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

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  'plant-selection': undefined;
  'category-selection': undefined;
};

const IndexScreen = () => {
    //useEffect(() => {
    //(async () => {
      //const deviceId = await AsyncStorage.getItem('deviceId');
      //if (!deviceId) {
        //router.replace('/device_select');
              //}
    //})();
  //}, []);

  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('deviceId').then(setDeviceId);
  }, []);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // --- 水泵控制相關 state/ref 統一宣告 ---
  const [isWatering, setIsWatering] = useState<{ [key in 'pump1' | 'pump2']: boolean }>({ pump1: false, pump2: false });
  const [waterPump1Status, setWaterPump1Status] = useState<'ON' | 'OFF'>('OFF');
  const [waterPump2Status, setWaterPump2Status] = useState<'ON' | 'OFF'>('OFF');
  const [smartMode, setSmartMode] = useState(false);
  const pumpStartTimeRef = useRef<{ [key in 'pump1' | 'pump2']: number }>({ pump1: 0, pump2: 0 });
  const pumpTimeoutTriggeredRef = useRef<{ [key in 'pump1' | 'pump2']: boolean }>({ pump1: false, pump2: false });
  const wateringTimeoutRef = useRef<{ [key in 'pump1' | 'pump2']: NodeJS.Timeout | number | null }>({ pump1: null, pump2: null });
  const wateringUnsubscribeRef = useRef<{ [key in 'pump1' | 'pump2']: (() => void) | null }>({ pump1: null, pump2: null });
  const soilMoistureRef = ref(database, 'sensorData/latest');
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean, 
    pump: 'pump1' | 'pump2' | null,
    message?: string
  }>({visible: false, pump: null, message: ''});

  // 統一的最大澆水時間（毫秒），可由 AsyncStorage 覆寫，預設 10 秒
  const [maxWateringTimeMs, setMaxWateringTimeMs] = useState<number>(10000);
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('maxWateringTimeMs');
        if (stored) {
          const n = parseInt(stored, 10);
          if (!isNaN(n) && n > 0 && n <= 5 * 60 * 1000) {
            setMaxWateringTimeMs(n);
          }
        }
      } catch (e) {
        console.warn('Failed to load maxWateringTimeMs:', e);
      }
    })();
  }, []);

  // --- 門檻設定 state ---
  const [selectedPlant, setSelectedPlant] = useState<PlantType | null>(null);
  const [soilMoistureThreshold, setSoilMoistureThreshold] = useState(30);
  const [minTemperatureThreshold, setMinTemperatureThreshold] = useState(10); // 最低溫度閾值
  const [humidityThreshold, setHumidityThreshold] = useState(20);
  const GLOBAL_MAX_TEMPERATURE = 35; // 全局最高溫度閾值

  // 定義狀態類型
  type Thresholds = {
    soilMoisture: number;
    temperature: number;
    humidity: number;
  };

  // 載入設定
  const loadSettings = useCallback(async (params: any = {}) => {
    try {
      const [
        storedSoilMoisture,
        storedMinTemperature,
        storedHumidity,
        selectedPlantData
      ] = await Promise.all([
        AsyncStorage.getItem('soilMoistureThreshold'),
        AsyncStorage.getItem('minTemperatureThreshold'),
        AsyncStorage.getItem('humidityThreshold'),
        AsyncStorage.getItem('selectedPlant')
      ]);

      // 先載入 selectedPlant
      if (selectedPlantData) setSelectedPlant(JSON.parse(selectedPlantData));

      // 使用 params > 儲存值 > 預設值
      setSoilMoistureThreshold(
        params.soilMoistureThreshold
          ? parseInt(params.soilMoistureThreshold)
          : storedSoilMoisture
            ? parseInt(storedSoilMoisture)
            : 30
      );
      setMinTemperatureThreshold(
        params.minTemperatureThreshold
          ? parseInt(params.minTemperatureThreshold)
          : storedMinTemperature
            ? parseInt(storedMinTemperature)
            : 10
      );
      setHumidityThreshold(
        params.humidityThreshold
          ? parseInt(params.humidityThreshold)
          : storedHumidity
            ? parseInt(storedHumidity)
            : 20
      );
    } catch (error) {
      console.error('載入設定失敗:', error);
    }
  }, []);

  // APP 啟動時只呼叫一次
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 監聽 params 變化
  const params = useLocalSearchParams();
  useEffect(() => {
    if (
      params.soilMoistureThreshold ||
      params.minTemperatureThreshold ||
      params.humidityThreshold
    ) {
      loadSettings(params);
    }
  }, [params, loadSettings]);

  // 當閾值變動時寫入 AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem('soilMoistureThreshold', soilMoistureThreshold.toString());
  }, [soilMoistureThreshold]);
  useEffect(() => {
    AsyncStorage.setItem('minTemperatureThreshold', minTemperatureThreshold.toString());
  }, [minTemperatureThreshold]);
  useEffect(() => {
    AsyncStorage.setItem('humidityThreshold', humidityThreshold.toString());
  }, [humidityThreshold]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<'soil' | 'temp' | 'humidity' | null>(null);
  const [tempValue, setTempValue] = useState(0); // 用於 Slider 調整暫存
  // --- 通知 cooldown flag  // 通知冷卻計時器
  const notificationCooldown = useRef({
    soil: false,
    tempLow: false,  // 低溫警告冷卻
    tempHigh: false, // 高溫警告冷卻
    humidity: false
  });

  // 通知訊息本地狀態
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // 先取得感測器數據
  const { sensorData } = useSensorData() || {};
  const soilMoisture = sensorData?.soilMoisture ?? 0;
  const temperature = sensorData?.temperature ?? 0;
  const humidity = sensorData?.humidity ?? 0;
  const timestamp = sensorData?.timestamp ?? new Date().toISOString();

  // --- 智慧模式自動開啟水泵 ---
  useEffect(() => {
    if (smartMode && soilMoisture < soilMoistureThreshold && waterPump1Status !== 'ON' && !isWatering.pump1) {
      // 透過 toggleWaterPump，以便記錄開始時間與統一日誌
      toggleWaterPump('pump1', 'smart');
    }
  }, [smartMode, soilMoisture, soilMoistureThreshold, waterPump1Status, isWatering.pump1]);

  // 通知權限初始化已集中於 app/_layout.tsx 中
  useEffect(() => {
    // no-op
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
      if (Platform.OS !== 'web') {
        Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: null,
        })
        .then(() => logEvent({ source: 'system', category: 'notification', action: 'notification_sent', message: title, meta: { body } }))
        .catch((e) => logEvent({ source: 'system', category: 'notification', action: 'notification_failed', message: `${title} 發送失敗`, meta: { body, error: String(e) } }));
      }
      setNotifications(prev => [
        { id: `${now}-soil`, title, body, read: false, timestamp: now },
        ...prev
      ]);
      notificationCooldown.current.soil = true;
      setTimeout(() => { notificationCooldown.current.soil = false; }, 3 * 60 * 60 * 1000); // 3小時冷卻
    }
    // 溫度檢查
    // 低溫警告
    if (temperature < minTemperatureThreshold && !notificationCooldown.current.tempLow) {
      const title = '植物提醒';
      const body = `溫度過低（<${minTemperatureThreshold}°C），請注意保溫！`;
      if (Platform.OS !== 'web') {
        Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: null,
        })
        .then(() => logEvent({ source: 'system', category: 'notification', action: 'notification_sent', message: title, meta: { body } }))
        .catch((e) => logEvent({ source: 'system', category: 'notification', action: 'notification_failed', message: `${title} 發送失敗`, meta: { body, error: String(e) } }));
      }
      setNotifications(prev => [
        { id: `${now}-temp-low`, title, body, read: false, timestamp: now },
        ...prev
      ]);
      notificationCooldown.current.tempLow = true;
      setTimeout(() => { notificationCooldown.current.tempLow = false; }, 3 * 60 * 60 * 1000); // 3小時冷卻
    }
    
    // 高溫警告
    if (temperature > GLOBAL_MAX_TEMPERATURE && !notificationCooldown.current.tempHigh) {
      const title = '植物提醒';
      const body = `溫度過高（>${GLOBAL_MAX_TEMPERATURE}°C），請注意降溫！`;
      if (Platform.OS !== 'web') {
        Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: null,
        })
        .then(() => logEvent({ source: 'system', category: 'notification', action: 'notification_sent', message: title, meta: { body } }))
        .catch((e) => logEvent({ source: 'system', category: 'notification', action: 'notification_failed', message: `${title} 發送失敗`, meta: { body, error: String(e) } }));
      }
      setNotifications(prev => [
        { id: `${now}-temp-high`, title, body, read: false, timestamp: now },
        ...prev
      ]);
      notificationCooldown.current.tempHigh = true;
      setTimeout(() => { notificationCooldown.current.tempHigh = false; }, 3 * 60 * 60 * 1000); // 3小時冷卻
    }
    // 環境濕度
    if (humidity <= humidityThreshold && !notificationCooldown.current.humidity) {
      const title = '植物提醒';
      const body = `環境濕度過低（≤${humidityThreshold}%），請注意加濕！`;
      if (Platform.OS !== 'web') {
        Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: null,
        })
        .then(() => logEvent({ source: 'system', category: 'notification', action: 'notification_sent', message: title, meta: { body } }))
        .catch((e) => logEvent({ source: 'system', category: 'notification', action: 'notification_failed', message: `${title} 發送失敗`, meta: { body, error: String(e) } }));
      }
      setNotifications(prev => [
        { id: `${now}-humidity`, title, body, read: false, timestamp: now },
        ...prev
      ]);
      notificationCooldown.current.humidity = true;
      setTimeout(() => { notificationCooldown.current.humidity = false; }, 3 * 60 * 60 * 1000); // 3小時冷卻
    }
  };


  useEffect(() => {
    checkAndNotify();
  }, [soilMoisture, temperature, humidity, soilMoistureThreshold, minTemperatureThreshold, humidityThreshold]);

  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);
  const notificationStyles = useMemo(() => getNotificationStyles(theme), [theme]);
  
  // 當前選擇的植物狀態
  const [currentPlant, setCurrentPlant] = useState<PlantType | null>(null);
  // 智慧模式說明彈窗
  const [smartInfoVisible, setSmartInfoVisible] = useState(false);
  
  // 從 AsyncStorage 讀取選擇的植物
  useEffect(() => {
    const loadSelectedPlant = async () => {
      try {
        const plantJson = await AsyncStorage.getItem('selectedPlant');
        if (plantJson) {
          const plant = JSON.parse(plantJson);
          setCurrentPlant(plant);
        }
      } catch (error) {
        console.error('讀取選擇的植物失敗:', error);
        logEvent({
          source: 'system',
          category: 'error',
          action: 'async_storage_error',
          message: '讀取已選植物失敗',
          meta: { where: 'tabs/index.loadSelectedPlant', error: String(error) }
        });
      }
    };
    
    loadSelectedPlant();
  }, []);
  
  // 將所選植物同步到 RTDB，便於 Pi 或其他用戶端讀取
  useEffect(() => {
    if (currentPlant) {
      try {
        set(ref(database, 'settings/selectedPlant'), currentPlant);
      } catch (e) {
        // ignore transient errors
      }
    }
  }, [currentPlant]);
  
  // 計算進度條的比例值
  const validSoilMoisture = Math.round((soilMoisture / 100) * 100) / 100;
  const validTemperature = Math.min(1, Math.max(0, temperature / 40));
  const validHumidity = Math.round((humidity / 100) * 100) / 100;

  // 兩個水泵的狀態 (僅顯示狀態的文字，不作 toggle 而是上傳命令)
  const [loading, setLoading] = useState<{ pump1: boolean; pump2: boolean }>({ pump1: false, pump2: false });
  const [cooldown, setCooldown] = useState<{ pump1: boolean; pump2: boolean }>({ pump1: false, pump2: false });
  const [cooldownSeconds, setCooldownSeconds] = useState<{ pump1: number | null; pump2: number | null }>({ pump1: null, pump2: null });
  const cooldownIntervalRef = useRef<{ [key in 'pump1' | 'pump2']: NodeJS.Timeout | number | null }>({ pump1: null, pump2: null });
  const cooldownTimeoutRef = useRef<{ [key in 'pump1' | 'pump2']: NodeJS.Timeout | number | null }>({ pump1: null, pump2: null });

  // 冷卻計時器清理（避免記憶體洩漏）
  useEffect(() => {
    return () => {
      (['pump1', 'pump2'] as const).forEach(p => {
        if (cooldownIntervalRef.current[p]) {
          clearInterval(cooldownIntervalRef.current[p]!);
          cooldownIntervalRef.current[p] = null;
        }
        if (cooldownTimeoutRef.current[p]) {
          clearTimeout(cooldownTimeoutRef.current[p]!);
          cooldownTimeoutRef.current[p] = null;
        }
      });
    };
  }, []);

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
// reason:
//  - 'manual'   : 使用者按按鈕停止
//  - 'auto'     : 土壤濕度達標（智慧或自動邏輯）
//  - 'timeout'  : 超過最大澆水時間
//  - 'smart_off': 你關閉智慧模式時為防呆自動關閉
const stopWaterPump = (pump: 'pump1' | 'pump2', reason: 'manual' | 'auto' | 'timeout' | 'smart_off' = 'manual') => {
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
  const startedAt = pumpStartTimeRef.current[pump];
  const elapsedMs = startedAt ? Date.now() - startedAt : 0;
  const elapsedTime = Math.max(0, Math.round(elapsedMs / 1000));
  const now = new Date().toISOString();
  let title = '';
  let body = '';
  
  if (reason === 'manual') {
    title = `水泵 ${pump === 'pump1' ? '1' : '2'} 已手動停止`;
    body = `運行時間：${elapsedTime} 秒\n原因：你手動停止`;
    setCooldown(prev => ({ ...prev, [pump]: true }));
    setCooldownSeconds(prev => ({ ...prev, [pump]: 3 }));
    if (cooldownIntervalRef.current[pump]) {
      clearInterval(cooldownIntervalRef.current[pump]!);
      cooldownIntervalRef.current[pump] = null;
    }
    if (cooldownTimeoutRef.current[pump]) {
      clearTimeout(cooldownTimeoutRef.current[pump]!);
      cooldownTimeoutRef.current[pump] = null;
    }
    const interval = setInterval(() => {
      setCooldownSeconds(prev => {
        const cur = (prev[pump] ?? 0) - 1;
        return { ...prev, [pump]: cur > 0 ? cur : 0 };
      });
    }, 1000);
    cooldownIntervalRef.current[pump] = interval;
    const timeout = setTimeout(() => {
      if (cooldownIntervalRef.current[pump]) {
        clearInterval(cooldownIntervalRef.current[pump]!);
        cooldownIntervalRef.current[pump] = null;
      }
      setCooldown(prev => ({ ...prev, [pump]: false }));
      setCooldownSeconds(prev => ({ ...prev, [pump]: null }));
    }, 3000);
    cooldownTimeoutRef.current[pump] = timeout;
  } else if (reason === 'timeout') {
    title = `水泵 ${pump === 'pump1' ? '1' : '2'} 已自動停止`;
    body = `運行時間：${elapsedTime} 秒\n原因：超過最大澆水時間`;
    // 系統事件：超時自動關閉
    logEvent({
      source: 'system',
      category: 'pump',
      action: 'auto_off_timeout',
      message: `超過安全時限，自動關閉水泵 ${pump === 'pump1' ? '1' : '2'}`,
      meta: { durationSec: elapsedTime }
    });
  } else if (reason === 'smart_off') {
    title = `水泵 ${pump === 'pump1' ? '1' : '2'} 已自動停止`;
    body = `運行時間：${elapsedTime} 秒\n原因：你關閉智慧模式，系統為安全自動關閉`;
    logEvent({
      source: 'system',
      category: 'smart_watering',
      action: 'smart_mode_force_pump_off',
      message: `你關閉智慧模式時，系統自動關閉水泵 ${pump === 'pump1' ? '1' : '2'}`,
      meta: { durationSec: elapsedTime }
    });
  } else {
    title = `水泵 ${pump === 'pump1' ? '1' : '2'} 已自動停止`;
    body = `運行時間：${elapsedTime} 秒\n原因：土壤濕度已達標`;
    // 系統事件：智慧自動關閉（達標）
    logEvent({
      source: 'system',
      category: 'pump',
      action: 'auto_off_moisture_reached',
      message: `土壤濕度達標，自動關閉水泵 ${pump === 'pump1' ? '1' : '2'}`,
      meta: { durationSec: elapsedTime }
    });
  }
  
  // 添加通知到通知列表
  setNotifications(prev => [
    { id: `${now}-${reason}-${pump}`, title, body, read: false, timestamp: now },
    ...prev
  ]);
  
  // 發送系統通知
  if (Platform.OS !== 'web') {
    Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    })
    .then(() => logEvent({ source: 'system', category: 'notification', action: 'notification_sent', message: title, meta: { body } }))
    .catch((e) => logEvent({ source: 'system', category: 'notification', action: 'notification_failed', message: `${title} 發送失敗`, meta: { body, error: String(e) } }));
  }
};

// --- 啟動/切換水泵 ---
const toggleWaterPump = async (pump: 'pump1' | 'pump2', source: 'user' | 'smart' = 'user') => {
  updateWateringStats();
  if (cooldown[pump]) return;
  if (isWatering[pump]) {
    // 手動強制停止
    logEvent({
      source: 'user',
      category: 'pump',
      action: 'pump_off',
      message: `你手動關閉了水泵 ${pump === 'pump1' ? '1' : '2'}`,
    });
    stopWaterPump(pump);
    return;
  }
  pumpStartTimeRef.current[pump] = Date.now();
  pumpTimeoutTriggeredRef.current[pump] = false;
  try {
    await updatePumpStatus(pump, "ON");
    setIsWatering(prev => ({ ...prev, [pump]: true }));
    if (source === 'user') {
      logEvent({
        source: 'user',
        category: 'pump',
        action: 'pump_on',
        message: `你手動打開了水泵 ${pump === 'pump1' ? '1' : '2'}`,
      });
    } else {
      logEvent({
        source: 'system',
        category: 'smart_watering',
        action: 'smart_auto_on',
        message: `智慧澆水自動開啟水泵 ${pump === 'pump1' ? '1' : '2'}`,
        meta: { soilMoisture, soilMoistureThreshold }
      });
    }
    const unsubscribe = onValue(soilMoistureRef, (snapshot) => {
      const currentMoisture = snapshot.val()?.moisture;
      const elapsedTime = Date.now() - pumpStartTimeRef.current[pump];
      if (typeof currentMoisture === 'number' && currentMoisture >= 45) {
        stopWaterPump(pump, 'auto');
      }
    });
    wateringUnsubscribeRef.current[pump] = unsubscribe;
    const timeout = setTimeout(() => {
      pumpTimeoutTriggeredRef.current[pump] = true;
      stopWaterPump(pump, 'timeout');
    }, maxWateringTimeMs);
    wateringTimeoutRef.current[pump] = timeout;
  } catch (error) {
    setIsWatering(prev => ({ ...prev, [pump]: false }));
  }
};

// --- 處理水泵按鈕點擊 ---
const handleWaterPumpPress = (pump: 'pump1' | 'pump2') => {
  if (isWatering[pump]) {
    // 手動關閉
    logEvent({
      source: 'user',
      category: 'pump',
      action: 'pump_off',
      message: `你手動關閉了水泵 ${pump === 'pump1' ? '1' : '2'}`,
    });
    stopWaterPump(pump);
    return;
  }
  
  // 計算安全閾值：植物的最低土壤濕度閾值 + 30%
  const safeMoistureThreshold = soilMoistureThreshold + 30;
  
  if (soilMoisture > safeMoistureThreshold) {
    // 如果土壤濕度高於安全閾值，顯示確認對話框
    setConfirmModal({ 
      visible: true, 
      pump,
      message: `目前土壤濕度為 ${soilMoisture}%，高於建議值 ${Math.round(safeMoistureThreshold)}%。確定要啟動水泵嗎？`
    });
  } else {
    toggleWaterPump(pump);
  }
};

  const { logs, logEvent, clearLogs } = useEventLog();

  // --- 智慧澆水模式 state ---
  
  // --- 將門檻/安全時限同步到 RTDB（供樹莓派智慧模式使用） ---
  useEffect(() => {
    try {
      set(ref(database, 'thresholds/soilMoisture'), soilMoistureThreshold);
    } catch (e) {
      // no-op in case of offline; will retry on next change
    }
  }, [soilMoistureThreshold]);

  useEffect(() => {
    try {
      set(ref(database, 'thresholds/maxWateringTimeMs'), maxWateringTimeMs);
    } catch (e) {
      // no-op
    }
  }, [maxWateringTimeMs]);

  // 非必須：若需要也可同步下列兩個環境門檻（目前 Pi 端未使用）
  useEffect(() => {
    try { set(ref(database, 'thresholds/minTemperature'), minTemperatureThreshold); } catch {}
  }, [minTemperatureThreshold]);
  useEffect(() => {
    try { set(ref(database, 'thresholds/humidity'), humidityThreshold); } catch {}
  }, [humidityThreshold]);

  // --- 禁用按鈕條件 ---
  const isButtonDisabled = soilMoisture > 70 || smartMode;

  // 新增一個函數來更新 Firebase 中的閾值
  const updateThresholdInFirebase = async (type: 'soil' | 'temp' | 'humidity' | 'waterTime', value: number) => {
    try {
      const updates: Record<string, any> = {};
      
      // 根據類型設置對應的 Firebase 路徑
      switch (type) {
        case 'soil':
          updates['/thresholds/soilMoisture'] = value;
          break;
        case 'temp':
          updates['/thresholds/minTemperature'] = value;
          break;
        case 'humidity':
          updates['/thresholds/humidity'] = value;
          break;
        case 'waterTime':
          updates['/thresholds/maxWateringTimeMs'] = value * 1000; // 轉換為毫秒
          break;
      }

      await update(ref(database), updates);
      console.log(`成功更新 ${type} 閾值為:`, value);
    } catch (error) {
      console.error(`更新 ${type} 閾值到 Firebase 失敗:`, error);
      throw error; // 重新拋出錯誤，讓上層處理
    }
  };
  // --- 監聽/同步 Smart Mode 狀態 ---
  useEffect(() => {
    // 讀取本地與 Firebase 狀態
    const loadMode = async () => {
      const local = await AsyncStorage.getItem('smartMode');
      if (local !== null) setSmartMode(local === 'true');
      // 監聽 Firebase
      const modeRef = ref(database, 'mode');
      onValue(modeRef, (snapshot) => {
        if (snapshot.exists()) setSmartMode(snapshot.val() === 'smart');
      });
    };
    loadMode();
  }, []);

  const handleSmartModeToggle = async (value: boolean) => {
    setSmartMode(value);
    await AsyncStorage.setItem('smartMode', value ? 'true' : 'false');
    await set(ref(database, 'mode'), value ? 'smart' : 'manual');
    logEvent({
      source: 'user',
      category: 'smart_watering',
      action: value ? 'smart_mode_enabled' : 'smart_mode_disabled',
      message: value ? '你開啟了智慧澆水模式' : '你關閉了智慧澆水模式',
    });
    // 若關閉智慧模式，為防呆立即關閉正在運行的水泵（不觸發手動冷卻）
    if (!value) {
      if (isWatering.pump1 || waterPump1Status === 'ON') {
        stopWaterPump('pump1', 'smart_off');
      }
      if (isWatering.pump2 || waterPump2Status === 'ON') {
        stopWaterPump('pump2', 'smart_off');
      }
    }
  };

  
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

  // --- 清除全部通知 ---
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // --- 其餘缺失的宣告補充於頂部 ---
  // 已於頂部統一宣告: pumpStartTimeRef, wateringTimeoutRef, wateringUnsubscribeRef, pumpTimeoutTriggeredRef, cooldown, loading, soilMoisture, temperature, humidity, timestamp, notifications, setNotifications, dropdownVisible, setDropdownVisible, validSoilMoisture, validTemperature, validHumidity, styles, notificationStyles

  // 渲染當前選擇的植物資訊
  const renderSelectedPlant = () => {
    if (!currentPlant) {
      return (
        <View style={styles.noPlantContainer}>
          <Text style={styles.noPlantText}>尚未選擇植物</Text>
          <TouchableOpacity 
            style={styles.selectPlantButton}
            onPress={() => router.push('/plant-selection')}
          >
            <Text style={styles.selectPlantButtonText}>選擇植物</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.plantInfoContainer}>
        <View style={styles.plantImageContainer}>
          {currentPlant.image ? (
            <Image 
              source={currentPlant.image} 
              style={styles.plantImage as ImageStyle}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.plantIcon}>{currentPlant.icon}</Text>
          )}
        </View>
        <View style={styles.plantDetails}>
          <Text style={styles.plantName}>{currentPlant.name}</Text>
          <Text 
            style={styles.plantDescription}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {currentPlant.description}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.changePlantButton}
          onPress={() => router.push('/plant-selection')}
        >
          <Ionicons name="swap-horizontal" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { flex: 1 }]}>
      {renderSelectedPlant()}

      {/* 兩個水泵開關按鈕 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          onPress={() => handleWaterPumpPress('pump1')} 
          style={[
            styles.button, 
            (waterPump1Status === "ON" || isWatering.pump1) && styles.activeButton
          ]}
          disabled={loading.pump1 || isButtonDisabled || cooldown.pump1}
        >
          {loading.pump1 ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {cooldown.pump1 && typeof cooldownSeconds.pump1 === 'number'
                ? `冷卻 ${cooldownSeconds.pump1}s`
                : (isButtonDisabled && soilMoisture > 70
                    ? '禁用(土壤濕度高)'
                    : `水泵 1 (${waterPump1Status})`)}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => handleWaterPumpPress('pump2')} 
          style={[
            styles.button, 
            (waterPump2Status === "ON" || isWatering.pump2) && styles.activeButton
          ]}
          disabled={loading.pump2 || isButtonDisabled || cooldown.pump2}
        >
          {loading.pump2 ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {cooldown.pump2 && typeof cooldownSeconds.pump2 === 'number'
                ? `冷卻 ${cooldownSeconds.pump2}s`
                : (isButtonDisabled && soilMoisture > 70
                    ? '禁用(土壤濕度高)'
                    : `水泵 2 (${waterPump2Status})`)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 智慧澆水模式 Switch */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        backgroundColor: theme === 'dark' ? '#23272F' : '#f4f6fa',
        borderRadius: 12,
        padding: 8,
      }}>
        <Text style={{
          marginRight: 8,
          fontSize: 16,
          color: theme === 'dark' ? '#e0e0e0' : '#25292e',
          fontWeight: 'bold',
        }}>
          智慧澆水模式
        </Text>
        <Switch
          value={smartMode}
          onValueChange={handleSmartModeToggle}
          trackColor={{ false: theme === 'dark' ? '#444' : '#767577', true: '#1abc9c' }}
          thumbColor={smartMode ? (theme === 'dark' ? '#fff' : '#fff') : (theme === 'dark' ? '#333' : '#f4f3f4')}
          ios_backgroundColor={theme === 'dark' ? '#444' : '#ccc'}
          disabled={dropdownVisible}
        />
        <TouchableOpacity
          onPress={() => setSmartInfoVisible(true)}
          style={{ marginLeft: 8, padding: 6 }}
          accessibilityLabel="智慧模式說明"
        >
          <Ionicons name="help-circle-outline" size={22} color={theme === 'dark' ? '#e0e0e0' : '#25292e'} />
        </TouchableOpacity>
      </View>

      {/* 智慧模式說明 Modal */}
      <Modal
        visible={smartInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSmartInfoVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: '82%',
            backgroundColor: theme === 'dark' ? '#2c313a' : '#ffffff',
            borderRadius: 12,
            padding: 16,
            shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 4
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              marginBottom: 8,
              color: theme === 'dark' ? '#e0e0e0' : '#25292e'
            }}>什麼是智慧澆水模式？</Text>
            <Text style={{
              fontSize: 14,
              lineHeight: 20,
              color: theme === 'dark' ? '#cfd3da' : '#444'
            }}>
              開啟後，系統會依據土壤濕度自動啟停水泵：
              {'\n'}• 當濕度低於你的門檻時自動開啟。
              {'\n'}• 達到目標濕度或超過安全時間會自動關閉。
              {'\n'}• 手動控制將暫停，避免與自動邏輯衝突。
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => setSmartInfoVisible(false)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme === 'dark' ? '#3a7bd5' : '#1abc9c', borderRadius: 8 }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>了解</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 通知鈴鐺按鈕（右上角） */}
      <View style={notificationStyles.bellContainer}>
        <TouchableOpacity 
          style={notificationStyles.bellButton} 
          onPress={() => setDropdownVisible(v => !v)}
        >
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
            <View style={notificationStyles.dropdownHeader}>
              <Text style={[notificationStyles.notificationTitle, { fontSize: 16, marginBottom: 0 }]}>
                通知
              </Text>
            </View>
            <ScrollView 
              style={notificationStyles.notificationsContainer}
              contentContainerStyle={notificationStyles.scrollContainer}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <View style={notificationStyles.scrollViewContent}>
                {notifications.length === 0 ? (
                  <Text style={notificationStyles.emptyNotificationText}>目前沒有通知</Text>
                ) : (
                  notifications.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={notificationStyles.notificationItem}
                      onPress={() => markAsRead(item.id)}
                    >
                      <Text style={notificationStyles.notificationTitle}>{item.title}</Text>
                      <Text style={notificationStyles.notificationBody}>{item.body}</Text>
                      <Text style={notificationStyles.notificationTimestamp}>
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </ScrollView>
            {notifications.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={notificationStyles.clearAllButton} onPress={clearAllNotifications}>
                  <Text style={notificationStyles.clearAllText}>清除全部通知</Text>
                </TouchableOpacity>
                <TouchableOpacity style={notificationStyles.markAllAsRead} onPress={markAllAsRead}>
                  <Text style={notificationStyles.markAllText}>全部標記為已讀</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
          <TouchableOpacity onPress={() => { setEditingType('temp'); setTempValue(minTemperatureThreshold); setModalVisible(true); }}>
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
          <View style={{
            flexDirection: 'row' as const,
            marginTop: 16,
            marginBottom: 8,
            paddingHorizontal: 16,
          }}>
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
                {temperature > GLOBAL_MAX_TEMPERATURE ? '⚠️ 溫度偏高，注意通風降溫。\n' : ''}
                {temperature < minTemperatureThreshold ? '⚠️ 溫度偏低，注意保溫。\n' : ''}
                {humidity < humidityThreshold ? '⚠️ 濕度偏低，建議加濕。\n' : ''}
                {soilMoisture >= soilMoistureThreshold && 
                 temperature >= minTemperatureThreshold && 
                 temperature <= GLOBAL_MAX_TEMPERATURE && 
                 humidity >= humidityThreshold ? '👍 植物狀態良好，請持續保持！' : ''}
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
      {/* 土壤濕度過高的澆水確認提示框 */}
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
              土壤濕度已高於建議值
            </Text>      
            <Text style={{ 
              color: '#333', 
              fontSize: 15, 
              textAlign: 'center', 
              marginBottom: 16, 
              lineHeight: 22, 
              width: '100%' 
            }}>
              {confirmModal.message || `目前土壤濕度為 ${soilMoisture}%。確定要強制啟動水泵嗎？`}
            </Text>
            <View style={{ flexDirection:'row', justifyContent:'space-between', width: '100%', marginTop: 8 }}>
               <View style={{ flex: 1, marginRight: 8 }}>
                 <Button title="取消" color="#888" onPress={() => setConfirmModal({visible:false, pump:null})} />
               </View>
               <View style={{ flex: 1, marginLeft: 8 }}>
                 <Button title="確認" color="#1abc9c" onPress={() => {
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
                可設定低於範圍：0 ~ 35°C
              </Text>
            )}
            {editingType !== 'temp' && (
              <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>
                可設定低於範圍：0 ~ 100%
              </Text>
            )}
              <Slider
                containerStyle={{ width: '100%', height: 40 }}
                minimumValue={editingType === 'temp' ? 0 : 0}
                maximumValue={editingType === 'temp' ? 35 : 100}
                step={1}
                value={tempValue}
                onValueChange={(v: number | number[]) => setTempValue(Array.isArray(v) ? v[0] : v)}
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
                 <Button title="確認" color="#1abc9c" onPress={async () => {
                  if(editingType === 'soil') {
                    const oldVal = soilMoistureThreshold;
                    const newVal = tempValue;
                    if (oldVal !== newVal) {
                      logEvent({
                        source: 'user',
                        category: 'settings',
                        action: 'threshold_changed',
                        message: '更新土壤濕度警告門檻',
                        meta: { type: 'soil', old: oldVal, new: newVal }
                      });
                    }
                    setSoilMoistureThreshold(newVal);
                    await updateThresholdInFirebase('soil', newVal);
                  }
                  if(editingType === 'temp') {
                    const oldVal = minTemperatureThreshold;
                    const newVal = tempValue;
                    if (oldVal !== newVal) {
                      logEvent({
                        source: 'user',
                        category: 'settings',
                        action: 'threshold_changed',
                        message: '更新溫度警告門檻',
                        meta: { type: 'temp', old: oldVal, new: newVal }
                      });
                    }
                    setMinTemperatureThreshold(newVal);
                    await updateThresholdInFirebase('temp', newVal);
                  }
                  if(editingType === 'humidity') {
                    const oldVal = humidityThreshold;
                    const newVal = tempValue;
                    if (oldVal !== newVal) {
                      logEvent({
                        source: 'user',
                        category: 'settings',
                        action: 'threshold_changed',
                        message: '更新環境濕度警告門檻',
                        meta: { type: 'humidity', old: oldVal, new: newVal }
                      });
                    }
                    setHumidityThreshold(newVal);
                    await updateThresholdInFirebase('humidity', newVal);
                  }
                  setModalVisible(false);
                }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 行為日誌面板 */}
      <View style={{ 
        marginTop: 12, 
        padding: 12, 
        backgroundColor: theme === 'dark' ? '#23272F' : '#f5f5f5', 
        borderRadius: 8 
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', color: theme === 'dark' ? '#e0e0e0' : '#25292e' }}>行為日誌</Text>
          <TouchableOpacity onPress={clearLogs} style={{ 
            paddingHorizontal: 10, 
            paddingVertical: 4, 
            backgroundColor: theme === 'dark' ? '#33373e' : '#eee', 
            borderRadius: 6 
          }}>
            <Text style={{ color: theme === 'dark' ? '#e0e0e0' : '#25292e' }}>清除</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 200 }}>
          {logs.slice(0, 20).map((log) => (
            <View key={log.id} style={{ 
              paddingVertical: 6, 
              borderBottomWidth: 1, 
              borderBottomColor: theme === 'dark' ? '#3a3f47' : '#e6e6e6' 
            }}>
              <Text style={{ color: theme === 'dark' ? '#a0a0a0' : '#666', fontSize: 12 }}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
              <Text style={{ color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{log.message}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

    </View>
  );
}

export default IndexScreen;