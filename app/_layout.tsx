import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "./style/theme-context";
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { EventLogProvider } from './context/event-log-context';

function RootLayoutContent() {
  const { theme } = useTheme();

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
      } catch (e) {
        // Avoid blocking app on permission errors
        console.warn('Notifications init failed:', e);
      }
    };
    initNotifications();
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="type" options={{ headerShown: false }} />
        <Stack.Screen 
          name="plant-selection" 
          options={{ 
            title: '選擇植物類型',
            headerShown: true,
            headerBackTitle: '返回',
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      {/* 狀態列樣式和背景顏色 */}
      <StatusBar
        style={theme === "light" ? "dark" : "light"} // 文字和圖標顏色
        backgroundColor={theme === "light" ? "#f9f9f9" : "#25292e"} // 背景色
        translucent={false} // 避免背景穿透
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <EventLogProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </EventLogProvider>
  );
}
