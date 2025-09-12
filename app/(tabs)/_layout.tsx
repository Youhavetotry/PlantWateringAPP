import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Tabs } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../style/theme-context";
import { SensorDataProvider } from '../context/sensor-data-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from "expo-router";
import { useEventLog } from '../context/event-log-context';

export default function TabLayout() {
  const { theme } = useTheme();
  const [isChecking, setIsChecking] = useState(true);
  const pathname = usePathname();
  const { logEvent } = useEventLog();

  useEffect(() => {
    const checkPlant = async () => {
      try {
        const plantJson = await AsyncStorage.getItem('selectedPlant');
        // 避免在 category-selection 頁面自己 redirect 自己
        if (!plantJson && pathname !== '/category-selection') {
          logEvent({ source: 'system', category: 'navigation', action: 'redirect_category_selection', message: '未找到已選植物，導向植物分類頁', meta: { from: pathname } });
          router.replace('/category-selection');
        }
      } catch (e) {
        console.warn('Failed to read selectedPlant:', e);
        logEvent({ source: 'system', category: 'error', action: 'async_storage_error', message: '讀取 selectedPlant 失敗', meta: { where: 'tabs/_layout.checkPlant', error: String(e) } });
      } finally {
        setIsChecking(false);
      }
    };
    checkPlant();
  }, [pathname]);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const tabBarStyle = {
    backgroundColor: theme === "light" ? "#f9f9f9" : "#25292e",
  };

  const headerStyle = {
    backgroundColor: theme === "light" ? "#f9f9f9" : "#25292e",
  };

  const headerTintColor = theme === "light" ? "#25292e" : "#fff";

  return (
    <SensorDataProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#ffd33d",
          headerStyle: headerStyle,
          headerShadowVisible: false,
          headerTintColor: headerTintColor,
          tabBarStyle: tabBarStyle,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "澆水設定",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="sensor-data"
        options={{
          title: "感測器檢測",
          tabBarIcon: ({ color }) => (
            <AntDesign name="dashboard" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          title: "鏡頭",
          tabBarIcon: ({ color }) => (
            <AntDesign name="camera" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="plant-type"
        options={{
          title: "植物分類",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "information-circle" : "information-circle-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="setting"
        options={{
          title: "設定",
          tabBarIcon: ({ color }) => (
            <AntDesign name="setting" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
    </SensorDataProvider>
  );
}
