import React, { useEffect, useState, useMemo} from 'react';
import { Text, View, StyleSheet, Button, ScrollView, Dimensions } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { useTheme } from '../style/theme-context'; // 引入 useTheme
import { getDynamicStyles } from "../style/dynamic-style";
import { useSensorData } from '../context/sensor-data-context'; // 引入 useSensorData

const { width } = Dimensions.get('window');

// 渲染折線圖的點，並保證x和y不會是NaN
const generatePoints = (data: number[]) => {
  if (data.length < 2) {
    return ''; // 如果數據點少於兩個，則不顯示任何折線圖
  }

  return data
    .map((value, index) => {
      // 如果數值無效，返回null
      if (isNaN(value)) {
        console.error('Invalid value at index:', index, value);
        return null;
      }

      // 生成有效的x, y坐標
      const x = ((width -50)/ (data.length - 1)) * index; // x坐標等分
      const y = 200 - (value / 100) * 150; // y坐標根據數據調整

      // 如果計算出來的x, y無效，返回null
      if (isNaN(x) || isNaN(y)) {
        console.error('Invalid x or y value:', { x, y });
        return null;
      }

      return `${x},${y}`;
    })
    .filter((point) => point !== null) // 過濾掉無效的點
    .join(' ');
};


export default function SensorData() {
  
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);
  const [sensorData, setSensorData] = useState<any>({
    soilMoisture: 50,
    temperature: 25,
    humidity: 60,
  });

  const [historyData, setHistoryData] = useState({
    soilMoisture: [] as number[],
    temperature: [] as number[],
    humidity: [] as number[],
  });

  const fetchSensorData = async () => {
    try {
      const randomSoilMoisture = Math.floor(Math.random() * 101); // 0 - 100
      const randomTemperature = Math.floor(Math.random() * 31) + 10; // 10 - 40
      const randomHumidity = Math.floor(Math.random() * 101); // 0 - 100

      setSensorData({
        soilMoisture: randomSoilMoisture,
        temperature: randomTemperature,
        humidity: randomHumidity,
      });

      setHistoryData((prevData) => ({
        soilMoisture: [...prevData.soilMoisture.slice(-9), randomSoilMoisture],
        temperature: [...prevData.temperature.slice(-9), randomTemperature],
        humidity: [...prevData.humidity.slice(-9), randomHumidity],
      }));
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchSensorData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>感測器檢測 (模擬數據)</Text>

      <View style={styles.dataContainer}>
        <Text style={styles.text}>土壤濕度: {sensorData.soilMoisture}%</Text>
        <Text style={styles.text}>室內溫度: {sensorData.temperature}°C</Text>
        <Text style={styles.text}>環境濕度: {sensorData.humidity}%</Text>
      </View>

      <Text style={styles.chartTitle}>感測器歷史數據</Text>

      <View style={styles.chartContainer}>
        {(['soilMoisture', 'temperature', 'humidity'] as const).map((key) => (
          <View key={key} style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>
              {key === 'soilMoisture' ? '土壤濕度' : key === 'temperature' ? '室內溫度' : '環境濕度'}
            </Text>

            <Svg height="200" width={width - 50}>
              <Polyline
                points={generatePoints(historyData[key])}
                fill="none"
                stroke={
                  key === 'soilMoisture'
                    ? 'rgb(134, 65, 244)'
                    : key === 'temperature'
                    ? 'rgb(255, 99, 71)'
                    : 'rgb(60, 179, 113)'
                }
                strokeWidth="2"
              />
            </Svg>

            <View style={styles.labelContainer}>
              {historyData[key].map((value, index) => (
                <Text
                  key={index}
                  style={{
                    width: (width-150) / historyData[key].length,
                    marginHorizontal: 5, // 增加間隔
                    textAlign: 'center',
                    color: theme === 'light' ? '#000' : '#fff',
                    fontSize: 12,
                  }}
                >
                  {value} {key === 'soilMoisture' ? '%' : key === 'temperature' ? '°C' : '%'}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="手動刷新數據" onPress={fetchSensorData} color="#1E90FF" />
      </View>
    </ScrollView>
  );
}

