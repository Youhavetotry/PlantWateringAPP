import React from "react";
import { Tabs } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../style/theme-context"; // 引入 useTheme
import { SensorDataProvider } from '../context/sensor-data-context';  // 引入 SensorDataProvider

export default function TabLayout() {
  
  const { theme } = useTheme(); // 使用 useTheme 獲取當前主題

  const tabBarStyle = {
    backgroundColor: theme === "light" ? "#f9f9f9" : "#25292e", // 根據主題設定 tabBar 背景顏色
  };

  const headerStyle = {
    backgroundColor: theme === "light" ? "#f9f9f9" : "#25292e", // 根據主題設定 header 背景顏色
  };

  const headerTintColor = theme === "light" ? "#000" : "#fff"; // 根據主題設定 header 文字顏色

  return (
    <SensorDataProvider>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ffd33d", // 設置選中的 tab 顏色
        headerStyle: headerStyle, // 動態設定 headerStyle
        headerShadowVisible: false,
        headerTintColor: headerTintColor, // 動態設定 header 文字顏色
        tabBarStyle: tabBarStyle, // 動態設定 tabBar 背景顏色
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "澆水開關",
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
