import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // <--- 加這行
import { useTheme } from '../style/theme-context'; // 引入 useTheme


export default function StackLayout() {

  const { theme } = useTheme(); // 使用 useTheme 獲取當前主題

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={({ route }) => {
          let title = '';

          // 根據路由名稱設定標題
          switch (route.name) {
            case 'aloe':
              title = '蘆薈';
              break;
            case 'haworthia':
              title = '玉露';
              break;
            case 'monstera':
              title = '龜背竹';
              break;
            case 'orchid':
              title = '蘭花';
              break;
            case 'boston-fern':
              title = '波士頓腎蕨';
              break;
            case 'maidenhair':
              title = '鐵線蕨';
              break;
            case 'kalanchoe':
              title = '長壽花';
              break;
            case 'bird-of-paradise':
              title = '天堂鳥';
              break;
            case 'moneytree':
              title = '金錢樹';
              break;
            case 'tigertail':
              title = '虎尾蘭';
              break;
            default:
              title = '植物頁面';
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
    </SafeAreaProvider>
  );
}
