import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import app from "../configs/firebase-config";

interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
  soilMoisture: number;  // 新增 soilMoisture 變數
}

interface SensorDataContextType {
  sensorData: SensorData;
  setSensorData: React.Dispatch<React.SetStateAction<SensorData>>;
}

interface SensorDataProviderProps {
  children: ReactNode;
}

const defaultSensorData: SensorData = { temperature: 0, humidity: 0, timestamp: '', soilMoisture: 0 };

const SensorDataContext = createContext<SensorDataContextType | undefined>(undefined);

export const SensorDataProvider: React.FC<SensorDataProviderProps> = ({ children }) => {
  const [sensorData, setSensorData] = useState<SensorData>(defaultSensorData);

  // 使用 useEffect 在組件加載時抓取數據
  useEffect(() => {
    const db = getDatabase(app);
    const sensorRef = ref(db, 'sensorData'); // 修改為 'sensorData'

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Received data from Firebase:", data);

      if (snapshot.exists()) {
        const sensorDataArray = Object.values(data);

        // 按照 timestamp 排序數據，選擇最新的一筆
        const latestSensorData = sensorDataArray
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        // 安全檢查最新數據是否有效
        if (latestSensorData && 'humidity' in latestSensorData && 'temperature_c' in latestSensorData) {
          const { humidity, temperature_c, timestamp } = latestSensorData;
          // 更新 sensorData，並保持 soilMoisture 預設為 0
          setSensorData({
            temperature: temperature_c,
            humidity,
            timestamp,
            soilMoisture: 0,  // 預設為 0
          });
        } else {
          console.error("Invalid data structure or missing fields in Firebase");
        }
      } else {
        console.error("No data available in Firebase");
      }
    });

    // 清理監聽器
    return () => unsubscribe();
  }, []);

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

export default SensorDataContext;
