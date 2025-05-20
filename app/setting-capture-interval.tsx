import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, update, get } from 'firebase/database';
import { useTheme } from './style/theme-context';

export default function SettingCaptureInterval({ initialInterval = 1, onIntervalChange }: { initialInterval?: number, onIntervalChange?: (interval: number) => void }) {
  const [interval, setInterval] = useState<number>(initialInterval);
  const { theme } = useTheme();

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('captureIntervalHours');
      if (stored) setInterval(Number(stored));
    })();
  }, []);

  const handleValueChange = async (value: number) => {
    setInterval(value);
    await AsyncStorage.setItem('captureIntervalHours', value.toString());
    if (onIntervalChange) onIntervalChange(value);
    try {
      const db = getDatabase();
      const modeSnap = await get(ref(db, 'photo/mode'));
      if (modeSnap.exists() && modeSnap.val() === 'scheduled') {
        const nextCapture = Math.floor(Date.now() / 1000) + value * 3600;
        await update(ref(db, 'photo'), { nextCapture });
        await AsyncStorage.setItem('nextCapture', nextCapture.toString());
      }
    } catch (e) {}
  };

  // 主題色彩
  const cardBg = theme === 'dark' ? '#232d36' : '#f7f7f7';
  const shadowColor = theme === 'dark' ? '#111' : '#ccc';
  const labelColor = theme === 'dark' ? '#90caf9' : '#1976d2';
  const sliderMinColor = theme === 'dark' ? '#90caf9' : '#1976d2';
  const sliderMaxColor = theme === 'dark' ? '#374151' : '#bdbdbd';
  const sliderThumbColor = theme === 'dark' ? '#90caf9' : '#1976d2';

  return (
    <View style={{
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 18,
      marginVertical: 16,
      elevation: 2,
      shadowColor: shadowColor,
      shadowOpacity: 0.15,
      shadowRadius: 4,
    }}>
      <Text style={{
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: labelColor,
      }}>
        定時拍照間隔：{interval} 小時
      </Text>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={1}
        maximumValue={24}
        step={1}
        value={interval}
        onValueChange={handleValueChange}
        minimumTrackTintColor={sliderMinColor}
        maximumTrackTintColor={sliderMaxColor}
        thumbTintColor={sliderThumbColor}
      />
    </View>
  );
}