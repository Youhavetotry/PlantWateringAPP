import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { Slider as RNMSlider } from '@miblanchard/react-native-slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, update, get } from 'firebase/database';
import { useTheme } from './style/theme-context';
import { useEventLog } from './context/event-log-context';

export default function SettingCaptureInterval({ initialInterval = 1, onIntervalChange }: { initialInterval?: number, onIntervalChange?: (interval: number) => void }) {
  const [interval, setInterval] = useState<number>(initialInterval);
  const { theme } = useTheme();
  const { logEvent } = useEventLog();
  const savedIntervalRef = useRef<number>(initialInterval);

  // Workaround for TS JSX typing issue with library types
  const Slider = RNMSlider as unknown as React.ComponentType<any>;

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('captureIntervalHours');
        if (stored) {
          const v = Number(stored);
          setInterval(v);
          savedIntervalRef.current = v;
        }
      } catch (e) {
        logEvent({ source: 'system', category: 'error', action: 'async_storage_error', message: '讀取拍照間隔失敗', meta: { where: 'setting-capture-interval.init', error: String(e) } });
      }
    })();
  }, []);

  const handleSlidingComplete = async (value: number) => {
    const newVal = value;
    const oldVal = savedIntervalRef.current;
    if (newVal === oldVal) return; // no-op if unchanged

    try {
      await AsyncStorage.setItem('captureIntervalHours', newVal.toString());
    } catch (e) {
      logEvent({ source: 'system', category: 'error', action: 'async_storage_error', message: '寫入拍照間隔失敗', meta: { where: 'setting-capture-interval.set(captureIntervalHours)', error: String(e), value: newVal } });
    }
    if (onIntervalChange) onIntervalChange(newVal);
    try {
      const db = getDatabase();
      const modeSnap = await get(ref(db, 'photo/mode'));
      if (modeSnap.exists() && modeSnap.val() === 'scheduled') {
        const nextCapture = Math.floor(Date.now() / 1000) + newVal * 3600;
        try {
          await update(ref(db, 'photo'), { nextCapture });
        } catch (e) {
          logEvent({ source: 'system', category: 'error', action: 'firebase_update_error', message: '更新下一次拍照時間失敗', meta: { where: 'setting-capture-interval.update(photo.nextCapture)', error: String(e), nextCapture } });
        }
        try {
          await AsyncStorage.setItem('nextCapture', nextCapture.toString());
        } catch (e) {
          logEvent({ source: 'system', category: 'error', action: 'async_storage_error', message: '寫入下一次拍照時間失敗', meta: { where: 'setting-capture-interval.set(nextCapture)', error: String(e), nextCapture } });
        }
      }
    } catch (e) {
      logEvent({ source: 'system', category: 'error', action: 'firebase_get_error', message: '讀取拍照模式失敗', meta: { where: 'setting-capture-interval.get(photo/mode)', error: String(e) } });
    }

    // log event
    logEvent({
      source: 'user',
      category: 'settings',
      action: 'capture_interval_changed',
      message: '更新定時拍照間隔',
      meta: { old: oldVal, new: newVal }
    });

    savedIntervalRef.current = newVal;
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
        containerStyle={{ width: '100%', height: 40 }}
        minimumValue={1}
        maximumValue={24}
        step={1}
        value={interval}
        onValueChange={(v: number | number[]) => setInterval(Array.isArray(v) ? v[0] : v)}
        onSlidingComplete={(v: number | number[]) => handleSlidingComplete(Array.isArray(v) ? v[0] : v)}
        minimumTrackTintColor={sliderMinColor}
        maximumTrackTintColor={sliderMaxColor}
        thumbTintColor={sliderThumbColor}
      />
    </View>
  );
}