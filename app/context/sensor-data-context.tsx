import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SensorData {
  soilMoisture: number;
  temperature: number;
  humidity: number;
}

interface SensorDataContextType {
  sensorData: SensorData;
  setSensorData: React.Dispatch<React.SetStateAction<SensorData>>;
}

interface SensorDataProviderProps {
  children: ReactNode;
}

const defaultSensorData: SensorData = { soilMoisture: 0, temperature: 0, humidity: 0 };

const SensorDataContext = createContext<SensorDataContextType | undefined>(undefined);

export const SensorDataProvider: React.FC<SensorDataProviderProps> = ({ children }) => {
  const [sensorData, setSensorData] = useState<SensorData>(defaultSensorData);

  // 使用 useEffect 在組件加載時抓取數據
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch("http://192.168.50.11:8000/sensor/");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 確保數據結構符合預期
        if (data?.sensor_data) {
          const { temperature, humidity, soil_moisture } = data.sensor_data;

          // 更新 state 只有在數據有效時
          setSensorData({
            temperature: temperature,
            humidity: humidity,
            soilMoisture: soil_moisture,
          });
        } else {
          console.error("Invalid data structure:", data);
        }
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    // 初次加載時調用一次 fetchSensorData
    fetchSensorData();

    // 設置每 3 秒更新一次
    const intervalId = setInterval(fetchSensorData, 3000);

    // 清理定時器
    return () => clearInterval(intervalId);
  }, []); // 空依賴陣列，表示只會在組件加載時開始定時器

  return (
    <SensorDataContext.Provider value={{ sensorData, setSensorData }}>
      {children}
    </SensorDataContext.Provider>
  );
};

export const useSensorData = (): SensorDataContextType => {
  const context = useContext(SensorDataContext);
  if (!context) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
};

export default function SensorContextScreen() {
}