import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';

const mockDevices = [
  { id: 'deviceA', name: '測試樹莓派 A' },
  { id: 'deviceB', name: '測試樹莓派 B' },
];

export default function DeviceSelectScreen() {
  // 設定 header 標題
  return (
    <>
      <Stack.Screen options={{ title: '選擇設備', headerTitleAlign: 'center' }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          請確保手機與設備在同一 Wi-Fi
        </Text>
        <Text style={{ fontSize: 15, marginBottom: 24, color: '#888' }}>
          選擇要連線的設備
        </Text>
        <FlatList
          data={mockDevices}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                padding: 18,
                backgroundColor: '#f5f5f5',
                borderRadius: 12,
                marginBottom: 16,
                width: 220,
                alignItems: 'center',
              }}
              onPress={async () => {
                await AsyncStorage.setItem('deviceId', item.id);
                router.replace('/');
              }}
            >
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: '#888' }}>{item.id}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </>
  );
}