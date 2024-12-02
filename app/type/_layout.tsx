import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../style/theme-context'; // 引入 useTheme


export default function StackLayout() {

  const { theme } = useTheme(); // 使用 useTheme 獲取當前主題

  return (
    <Stack
      screenOptions={({ route }) => {
        let title = '';

        // 根據路由名稱設定標題
        if (route.name === 'moneytree') {
          title = '金錢樹';
        } else if (route.name === 'tigertail') {
          title = '虎尾蘭';
        } else {
          title = '植物頁面'; // 預設標題
        }

        return {
          headerStyle: {
            backgroundColor: theme === "light" ? "#f9f9f9" : "#25292e",
          },
          headerShadowVisible: false,
          headerTintColor: theme === "light" ? "#000" : "#fff", // 根據主題設定 header 文字顏色
          title, // 使用動態標題
        };
      }}
    >
    </Stack>
  );
}
