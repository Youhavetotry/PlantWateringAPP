import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "./style/theme-context";

function RootLayoutContent() {
  const { theme } = useTheme();

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
    <ThemeProvider>
        <RootLayoutContent />
    </ThemeProvider>
  );
}
