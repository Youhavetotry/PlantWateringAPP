import React, { useEffect, useState, useMemo } from 'react';
import { Text, View, ScrollView, Dimensions } from 'react-native';
import Svg, { Polyline, Text as SvgText, Circle } from 'react-native-svg';
import { useTheme } from '../style/theme-context'; // 引入 useTheme
import { getDynamicStyles } from '../style/dynamic-style';
import { useSensorData } from '../context/sensor-data-context'; // 引入 useSensorData

const { width } = Dimensions.get('window');
const marginLeft = 25; // 左邊邊距
const marginRight = 75; // 右邊邊距

// 生成折線圖的點和對應數據標籤
const generatePointsWithLabels = (data: number[]) => {
  if (data.length < 2) return { points: '', labels: [] };

  const points: string[] = [];
  const labels: { x: number; y: number; value: number }[] = [];

  data.forEach((value, index) => {
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

  const { sensorData } = useSensorData(); // 從 context 獲取數據

  const [historyData, setHistoryData] = useState({
    soilMoisture: [] as number[],
    temperature: [] as number[],
    humidity: [] as number[],
  });

  useEffect(() => {
    setHistoryData((prev) => ({
      soilMoisture: [...prev.soilMoisture.slice(-9), sensorData.soilMoisture],
      temperature: [...prev.temperature.slice(-9), sensorData.temperature],
      humidity: [...prev.humidity.slice(-9), sensorData.humidity],
    }));
  }, [sensorData]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.dataContainer}>
        <Text style={styles.text}>土壤濕度: {sensorData.soilMoisture}%</Text>
        <Text style={styles.text}>室內溫度: {sensorData.temperature}°C</Text>
        <Text style={styles.text}>環境濕度: {sensorData.humidity}%</Text>
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
                  stroke={
                    key === 'soilMoisture'
                      ? '#1abc9c'
                      : key === 'temperature'
                      ? '#f39c12'
                      : '#3498db'
                  }
                  strokeWidth="2"
                />

                {/* 添加數據點和標籤 */}
                {labels.map((label, idx) => (
                    <React.Fragment key={idx}>
                    <Circle
                      cx={label.x}
                      cy={label.y}
                      r="3"
                      fill={
                        key === 'soilMoisture'
                          ? '#16a085' // 深綠色
                          : key === 'temperature'
                          ? '#e67e22' // 深橙色
                          : '#2c98ff' // 深藍色
                      }
                    />
                    <SvgText
                      x={label.x-4}
                      y={label.y - 13} // 標籤位置稍微上移
                      fontSize="11"
                      fill={theme === 'light' ? 'black' : 'white'}
                      textAnchor="middle"
                    >
                      {label.value}
                      {key === 'temperature' ? '°C' : '%'}
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
