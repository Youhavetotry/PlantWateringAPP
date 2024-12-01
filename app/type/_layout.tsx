import React from 'react';
import { Stack } from 'expo-router';

export default function StackLayout() {
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
            backgroundColor: '#25292e',
          },
          headerShadowVisible: false,
          headerTintColor: '#fff',
          title, // 使用動態標題
        };
      }}
    >
    </Stack>
  );
}
