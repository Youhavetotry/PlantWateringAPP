import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";
import { useSensorData } from '../context/sensor-data-context';
import { database } from "../configs/firebase-config";
import { ref, set, onValue, update } from "firebase/database";



// 帶動畫的自定義進度條元件
const AnimatedProgressBar = ({ progress, color }: { progress: number; color: string }) => {
  const clampedProgress = Math.min(1, Math.max(0, progress)); // 確保範圍在 0-1 之間
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clampedProgress * 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress]);

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View
        style={[
          styles.progressBarFill,
          {
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: color,
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

export default function IndexScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);

  // 從 SensorDataProvider 獲取感測器數據
  const { sensorData } = useSensorData() || {};
  const soilMoisture = sensorData?.soilMoisture ?? 0;
  const temperature = sensorData?.temperature ?? 0;
  const humidity = sensorData?.humidity ?? 0;
  const timestamp = sensorData?.timestamp ?? new Date().toISOString();

  // 計算進度條的比例值
  const validSoilMoisture = Math.round((soilMoisture / 100) * 100) / 100;
  const validTemperature = Math.min(1, Math.max(0, temperature / 40));
  const validHumidity = Math.round((humidity / 100) * 100) / 100;


 // 兩個水泵的狀態
 const [waterPump1Status, setWaterPump1Status] = useState<string>('OFF');
 const [waterPump2Status, setWaterPump2Status] = useState<string>('OFF');
 const [loading, setLoading] = useState<{ pump1: boolean; pump2: boolean }>({ pump1: false, pump2: false });

 useEffect(() => {
   // 監聽 Firebase 內的水泵狀態
   const pump1Ref = ref(database, "waterPump/pump1");
   const pump2Ref = ref(database, "waterPump/pump2");

   onValue(pump1Ref, (snapshot) => {
     const status = snapshot.val();
     setWaterPump1Status(status || "OFF"); // 設定 pump1 狀態
   });

   onValue(pump2Ref, (snapshot) => {
     const status = snapshot.val();
     setWaterPump2Status(status || "OFF"); // 設定 pump2 狀態
   });

 }, []);

 const toggleWaterPump = async (pump: 'pump1' | 'pump2') => {
  setLoading((prev) => ({ ...prev, [pump]: true }));
  try {
    // 切換水泵狀態
    const newStatus = (pump === 'pump1' ? waterPump1Status : waterPump2Status) === "ON" ? "OFF" : "ON";

    // 使用 update 來僅更新指定的 pump 狀態
    await update(ref(database, 'waterPump'), {
      [pump]: newStatus,  // 僅更新對應的 pump
    });

    // 確保更新後 UI 和 Firebase 狀態同步
    if (pump === 'pump1') {
      setWaterPump1Status(newStatus);
    } else {
      setWaterPump2Status(newStatus);
    }
  } catch (error) {
    console.error(`更新 ${pump} 狀態失敗`, error);
  }
  setLoading((prev) => ({ ...prev, [pump]: false }));
};

 return (
   <View style={styles.container}>
     {/* 兩個水泵開關按鈕 */}
     <View style={styles.buttonContainer}>
       <TouchableOpacity 
         onPress={() => toggleWaterPump('pump1')} 
         style={[styles.button, waterPump1Status === "ON" ? styles.activeButton : null]}
         disabled={loading.pump1}
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
         disabled={loading.pump2}
       >
         {loading.pump2 ? (
           <ActivityIndicator color="#fff" />
         ) : (
           <Text style={styles.buttonText}>水泵 2 ({waterPump2Status})</Text>
         )}
       </TouchableOpacity>
     </View>

      {/* 通知按鈕 */}
      <View style={styles.notificationButtonContainer}>
        <TouchableOpacity onPress={() => {}} style={[styles.button]}>
          <Text style={{ color: theme === 'light' ? '#fff' : '#000' }}>通知</Text>
        </TouchableOpacity>
      </View>

      {/* 顯示土壤濕度、溫度、濕度進度條 */}
      <View style={styles.sensorDataContainer}>
        <Text style={styles.title}>土壤濕度: {soilMoisture}%</Text>
        <AnimatedProgressBar progress={validSoilMoisture} color="#1abc9c" />

        <Text style={styles.title}>溫度: {temperature}°C</Text>
        <AnimatedProgressBar progress={validTemperature} color="#f39c12" />

        <Text style={styles.title}>環境濕度: {humidity}%</Text>
        <AnimatedProgressBar progress={validHumidity} color="#3498db" />

        {/* 顯示資料最後更新時間 */}
        <Text style={styles.timestampText}>
          資料最後更新時間: {timestamp ? formatTimestamp(timestamp) : "無資料"}
        </Text>
      </View>
    </View>
  );
}

// 樣式表
const styles = StyleSheet.create({
  progressBarContainer: {
    height: 10,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden', // 確保填充條不會超出範圍
    marginVertical: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },

});
