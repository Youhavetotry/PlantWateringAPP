import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from "../configs/firebase-config";

interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
  soilMoisture: number;
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

  useEffect(() => {
    const db = getDatabase(app);
    const sensorRef = ref(db, 'sensorData');

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();

      if (snapshot.exists()) {
        const sensorDataArray = Object.values(data);

        const latestSensorData = sensorDataArray
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (latestSensorData && 'humidity' in latestSensorData && 'temperature_c' in latestSensorData) {
          const { humidity, temperature_c, timestamp, soil_moisture } = latestSensorData;

          setSensorData({
            temperature: temperature_c,
            humidity,
            timestamp,
            soilMoisture: soil_moisture ?? 0,  // 從 Firebase 讀取，若不存在則預設為 0
          });
        } else {
          console.error("Invalid data structure or missing fields in Firebase");
        }
      } else {
        console.error("No data available in Firebase");
      }
    });

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
