import React, { useEffect, useState, useMemo } from 'react';
import { Text, View, ScrollView, Dimensions } from 'react-native';
import Svg, { Polyline, Text as SvgText, Circle } from 'react-native-svg';
import { useTheme } from '../style/theme-context'; // 引入 useTheme
import { getDynamicStyles } from '../style/dynamic-style';
import { database } from '../configs/firebase-config'; // 引入 Firebase 配置
import { ref, onChildAdded, off } from 'firebase/database'; // Firebase 引入相關方法

const { width } = Dimensions.get('window');
const marginLeft = 25; // 左邊邊距
const marginRight = 75; // 右邊邊距

// 生成折線圖的點和對應數據標籤
const generatePointsWithLabels = (data: number[]) => {
  if (data.length < 2) return { points: '', labels: [] };

  const points: string[] = [];
  const labels: { x: number; y: number; value: number }[] = [];

  data.forEach((value, index) => {
    // 檢查是否是 NaN，如果是則設為 0
    if (isNaN(value)) value = 0;

    const x = ((width - marginLeft - marginRight) / (data.length - 1)) * index + marginLeft; // x 坐標加入邊距
    const y = 200 - (value / 100) * 150; // y 坐標根據數據調整
    points.push(`${x},${y}`);
    labels.push({ x, y, value });
  });

  return {
    points: points.join(' '),
    labels,
  };
};


export default function SensorData() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);

  const [historyData, setHistoryData] = useState({
    soilMoisture: [] as number[],
    temperature: [] as number[],
    humidity: [] as number[],
  });

  // Firebase 監聽新數據並更新歷史數據
  useEffect(() => {
    const sensorDataRef = ref(database, 'sensorData');
    
    // 監聽數據變動
    onChildAdded(sensorDataRef, (snapshot) => {
      const newData = snapshot.val();
  
      // 確保每個數據都是有效數字，並避免 NaN
      const validSoilMoisture = isNaN(newData.soil_moisture) ? 0 : newData.soil_moisture;
      const validTemperature = isNaN(newData.temperature_c) ? 0 : newData.temperature_c;
      const validHumidity = isNaN(newData.humidity) ? 0 : newData.humidity;
  
      // 更新歷史數據，保持最大數據為 10 筆
      setHistoryData((prev) => ({
        soilMoisture: [...prev.soilMoisture.slice(-9), validSoilMoisture],
        temperature: [...prev.temperature.slice(-9), validTemperature],
        humidity: [...prev.humidity.slice(-9), validHumidity],
      }));
    });
  
    // Cleanup on component unmount
    return () => {
      // 解除監聽
      off(sensorDataRef, 'child_added');
    };
  }, []);
  

  return (
    <ScrollView style={styles.container}>
      <View style={styles.dataContainer}>
        <Text style={styles.text}>土壤濕度: {historyData.soilMoisture[historyData.soilMoisture.length - 1]}%</Text>
        <Text style={styles.text}>室內溫度: {historyData.temperature[historyData.temperature.length - 1]}°C</Text>
        <Text style={styles.text}>環境濕度: {historyData.humidity[historyData.humidity.length - 1]}%</Text>
      </View>

      <Text style={styles.subtitle}>感測器歷史數據</Text>

      <View style={styles.chartContainer}>
        {(['soilMoisture', 'temperature', 'humidity'] as const).map((key) => {
          const { points, labels } = generatePointsWithLabels(historyData[key]);
          return (
            <View key={key} style={styles.chartWrapper}>
              <Text style={styles.chartTitle}>
                {key === 'soilMoisture' ? '土壤濕度' : key === 'temperature' ? '室內溫度' : '環境濕度'}
              </Text>

              <Svg height="200" width={width}>
                {/* 繪製折線 */}
                <Polyline
                  points={points}
                  fill="none"
                  stroke={key === 'soilMoisture' ? '#1abc9c' : key === 'temperature' ? '#f39c12' : '#3498db'}
                  strokeWidth="2"
                />

                {/* 添加數據點和標籤 */}
                {labels.map((label, idx) => (
                    <React.Fragment key={idx}>
                      <Circle
                        cx={label.x}
                        cy={label.y}
                        r="3"
                        fill={key === 'soilMoisture' ? '#16a085' : key === 'temperature' ? '#e67e22' : '#2c98ff'}
                      />
                      <SvgText
                        x={label.x}
                        y={label.y -11} // 位置微調，減少空間
                        fontSize="8" // 減小文字大小
                        fill={theme === 'light' ? 'black' : 'white'}
                        textAnchor="middle"
                      >
                        {isNaN(label.value) ? 0 : label.value.toFixed(1)}{key === 'temperature' ? '°C' : '%'}
                      </SvgText>
                    </React.Fragment>
                  ))}
              </Svg>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
