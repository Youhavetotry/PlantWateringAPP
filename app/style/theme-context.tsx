import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEventLog } from '../context/event-log-context';

const ThemeContext = createContext<any>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { logEvent } = useEventLog();

  // 初始化時從 AsyncStorage 讀取主題
  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setTheme(storedTheme);
        }
      } catch (e) {
        logEvent({
          source: 'system', category: 'error', action: 'async_storage_error',
          message: '讀取主題設定失敗', meta: { where: 'theme-context.init', error: String(e) }
        });
      }
    })();
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      (async () => {
        try {
          await AsyncStorage.setItem('theme', newTheme);
        } catch (e) {
          logEvent({ source: 'system', category: 'error', action: 'async_storage_error', message: '寫入主題設定失敗', meta: { where: 'theme-context.toggleTheme.set(theme)', error: String(e), value: newTheme } });
        }
        const fromLabel = prevTheme === 'light' ? '淺色' : '深色';
        const toLabel = newTheme === 'light' ? '淺色' : '深色';
        logEvent({ source: 'user', category: 'settings', action: 'theme_toggled', message: `切換主題(${fromLabel}->${toLabel})` });
      })();
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default function ThemeContextScreen() {
}