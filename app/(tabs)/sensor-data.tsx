import React, { useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Polyline, Text as SvgText, Circle } from 'react-native-svg';
import { useTheme } from '../style/theme-context'; // 引入 useTheme
import { getDynamicStyles } from '../style/dynamic-style';
import { database } from '../configs/firebase-config'; // 引入 Firebase 配置
import { ref, onChildAdded, off } from 'firebase/database'; // Firebase 引入相關方法
import { useEventLog } from '../context/event-log-context';

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

// 狀態與建議邏輯
// 狀態與建議邏輯（根據用戶設定的門檻）
function interpretSensor(
  type: 'soil' | 'temp' | 'humidity',
  value: number,
  thresholds: { soilMoisture: number; temperature: number; humidity: number }
): { status: string, advice: string, color: string } {
  if (type === 'soil') {
    if (value < thresholds.soilMoisture) return { status: '乾燥', advice: `土壤濕度低於門檻（≤${thresholds.soilMoisture}%），建議立即澆水`, color: '#e74c3c' };
    if (value < thresholds.soilMoisture + 10) return { status: '偏乾', advice: '土壤即將乾燥，建議準備澆水', color: '#f39c12' };
    if (value < thresholds.soilMoisture + 35) return { status: '適中', advice: '濕度良好，維持現狀', color: '#27ae60' };
    return { status: '過濕', advice: '土壤過濕，避免積水', color: '#2980b9' };
  }
  if (type === 'temp') {
    if (value < 10) return { status: '過低', advice: '溫度過低，注意保暖', color: '#3498db' };
    if (value < thresholds.temperature) return { status: '適中', advice: '溫度適宜，維持現狀', color: '#27ae60' };
    if (value < thresholds.temperature + 5) return { status: '偏高', advice: `溫度略高於門檻（≥${thresholds.temperature}°C），注意通風`, color: '#e67e22' };
    return { status: '過高', advice: '溫度過高，需降溫', color: '#e74c3c' };
  }
  if (type === 'humidity') {
    if (value < thresholds.humidity) return { status: '乾燥', advice: `環境濕度低於門檻（≤${thresholds.humidity}%），建議加濕`, color: '#e74c3c' };
    if (value < thresholds.humidity + 20) return { status: '偏乾', advice: '濕度略低，適度加濕', color: '#f39c12' };
    if (value < thresholds.humidity + 50) return { status: '適中', advice: '濕度良好，維持現狀', color: '#27ae60' };
    return { status: '過濕', advice: '濕度過高，注意通風', color: '#2980b9' };
  }
  return { status: '', advice: '', color: '#888' };
}

function getTrend(history: number[]): string {
  if (!history || history.length < 3) return '—';
  const last = history.length - 1;
  const trend = history[last] - history[last - 2];
  if (trend > 2) return '快速上升 ↑';
  if (trend > 0.5) return '緩慢上升 ↗';
  if (trend < -2) return '快速下降 ↓';
  if (trend < -0.5) return '緩慢下降 ↘';
  return '穩定 →';
}

// 數據卡片元件

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  history: number[];
  type: 'soil' | 'temp' | 'humidity';
  theme: 'light' | 'dark';
  thresholds: { soilMoisture: number; temperature: number; humidity: number };
}

const SensorCard = ({ label, value, unit, history, type, theme, thresholds }: SensorCardProps) => {
  const { status, advice, color } = interpretSensor(type, value ?? 0, thresholds);
  const trend = getTrend(history);
  const [expanded, setExpanded] = useState(false);

  // 統計資料
  const validHistory = history.filter(v => typeof v === 'number' && !isNaN(v));
  const max = validHistory.length ? Math.max(...validHistory) : '—';
  const min = validHistory.length ? Math.min(...validHistory) : '—';
  const avg = validHistory.length ? (validHistory.reduce((a, b) => a + b, 0) / validHistory.length).toFixed(1) : '—';

  // 主題樣式
  const cardBg = theme === 'light' ? '#fff' : '#23272f';
  const textMain = theme === 'light' ? '#222' : '#fff';
  const textSub = theme === 'light' ? '#888' : '#bbb';
  const borderColor = theme === 'light' ? '#eee' : '#444';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded(e => !e)}
      style={{
        backgroundColor: cardBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: theme === 'light' ? 0.08 : 0,
        shadowRadius: 6,
        elevation: theme === 'light' ? 2 : 0,
        borderWidth: theme === 'dark' ? 1 : 0,
        borderColor,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: textMain }}>{label}</Text>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color }}>{value ?? '—'}{unit}</Text>
      <Text style={{ fontSize: 15, color }}>{status}</Text>
      <Text style={{ fontSize: 13, color: textSub, marginTop: 2 }}>{advice}</Text>
      <Text style={{ fontSize: 13, color: textSub, marginTop: 2 }}>趨勢：{trend}</Text>
      {expanded && (
        <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: borderColor, paddingTop: 8 }}>
          <Text style={{ fontSize: 13, color: textSub }}>最高值：{max}{unit}</Text>
          <Text style={{ fontSize: 13, color: textSub }}>最低值：{min}{unit}</Text>
          <Text style={{ fontSize: 13, color: textSub }}>平均值：{avg}{unit}</Text>
        </View>
      )}
      <Text style={{ fontSize: 12, color: textSub, marginTop: 8, textAlign: 'right' as const }}>{expanded ? '點擊收合 ▲' : '點擊展開更多 ▼'}</Text>
    </TouchableOpacity>
  );
};

export default function SensorData() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);
  const { logEvent } = useEventLog();

  // 門檻設定：預設值與從 AsyncStorage 讀取
  const [soilMoistureThreshold, setSoilMoistureThreshold] = useState(15);
  const [temperatureThreshold, setTemperatureThreshold] = useState(32);
  const [humidityThreshold, setHumidityThreshold] = useState(20);

  useEffect(() => {
    (async () => {
      try {
        const soil = await AsyncStorage.getItem('soilMoistureThreshold');
        const temp = await AsyncStorage.getItem('temperatureThreshold');
        const hum = await AsyncStorage.getItem('humidityThreshold');
        if (soil !== null) setSoilMoistureThreshold(Number(soil));
        if (temp !== null) setTemperatureThreshold(Number(temp));
        if (hum !== null) setHumidityThreshold(Number(hum));
      } catch (e) {
        logEvent({
          source: 'system',
          category: 'error',
          action: 'async_storage_error',
          message: '讀取感測器門檻設定失敗',
          meta: { where: 'sensor-data.initThresholds', error: String(e) }
        });
      }
    })();
  }, []);

  // 當土壤濕度門檻值變更時，儲存到 AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('soilMoistureThreshold', soilMoistureThreshold.toString());
      } catch (e) {
        console.error('Failed to save soil moisture threshold', e);
        logEvent({
          source: 'system', category: 'error', action: 'async_storage_error',
          message: '寫入土壤濕度門檻失敗', meta: { where: 'sensor-data.saveSoil', error: String(e), value: soilMoistureThreshold }
        });
      }
    })();
  }, [soilMoistureThreshold]);

  // 當溫度門檻值變更時，儲存到 AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('temperatureThreshold', temperatureThreshold.toString());
      } catch (e) {
        console.error('Failed to save temperature threshold', e);
        logEvent({
          source: 'system', category: 'error', action: 'async_storage_error',
          message: '寫入溫度門檻失敗', meta: { where: 'sensor-data.saveTemp', error: String(e), value: temperatureThreshold }
        });
      }
    })();
  }, [temperatureThreshold]);

  // 當濕度門檻值變更時，儲存到 AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('humidityThreshold', humidityThreshold.toString());
      } catch (e) {
        console.error('Failed to save humidity threshold', e);
        logEvent({
          source: 'system', category: 'error', action: 'async_storage_error',
          message: '寫入環境濕度門檻失敗', meta: { where: 'sensor-data.saveHumidity', error: String(e), value: humidityThreshold }
        });
      }
    })();
  }, [humidityThreshold]);

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

  // 門檻組合物件
  const thresholds = useMemo(() => ({
    soilMoisture: soilMoistureThreshold,
    temperature: temperatureThreshold,
    humidity: humidityThreshold,
  }), [soilMoistureThreshold, temperatureThreshold, humidityThreshold]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.sensorDataContainer}>
        {/* 數據卡片顯示區塊 */}
        <SensorCard
          label="土壤濕度"
          value={historyData.soilMoisture[historyData.soilMoisture.length - 1]}
          unit="%"
          history={historyData.soilMoisture}
          type="soil"
          theme={theme}
          thresholds={thresholds}
        />
        <SensorCard
          label="室內溫度"
          value={historyData.temperature[historyData.temperature.length - 1]}
          unit="°C"
          history={historyData.temperature}
          type="temp"
          theme={theme}
          thresholds={thresholds}
        />
        <SensorCard
          label="環境濕度"
          value={historyData.humidity[historyData.humidity.length - 1]}
          unit="%"
          history={historyData.humidity}
          type="humidity"
          theme={theme}
          thresholds={thresholds}
        />
        {/* END 數據卡片顯示區塊 */}
      </View>

      {/* @ts-ignore */}
      <Text style={styles.subtitle}>感測器歷史數據</Text>

      {/* @ts-ignore */}
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
