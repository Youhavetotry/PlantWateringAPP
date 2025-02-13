import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";
import { useSensorData } from '../context/sensor-data-context';

// 帶動畫的自定義進度條元件
const AnimatedProgressBar = ({ progress, color }: { progress: number; color: string }) => {
  const clampedProgress = Math.min(1, Math.max(0, progress)); // 確保範圍在 0-1 之間
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 以動畫方式更新進度
    Animated.timing(animatedWidth, {
      toValue: clampedProgress * 100, // 將比例轉為百分比
      duration: 500, // 動畫持續時間
      useNativeDriver: false, // 使用非原生動畫處理寬度變化
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
  const { sensorData } = useSensorData();

  // 處理感測器數據
  const soilMoisture = sensorData.soilMoisture;
  const temperature = sensorData.temperature;
  const humidity = sensorData.humidity;
  const timestamp = sensorData.timestamp;

  // 計算進度條的比例值
  const validSoilMoisture = Math.round((soilMoisture / 100) * 100) / 100;
  const validTemperature = Math.round((temperature / 40) * 100) / 100;
  const validHumidity = Math.round((humidity / 100) * 100) / 100;

  return (
    <View style={styles.container}>
      {/* 澆水開關按鈕 */}
      <View style={styles.WateringButtonContainer}>
        <TouchableOpacity onPress={() => {}} style={[styles.button]}>
          <Text style={{ color: theme === 'light' ? '#fff' : '#000' }}>澆水開關</Text>
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
          資料最後更新時間: {formatTimestamp(timestamp)}
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
  timestampText: {
    marginTop: 10,
    fontSize: 10,
    color: '#7f8c8d',
  },

});
