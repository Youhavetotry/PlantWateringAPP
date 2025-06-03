import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";
import SettingCaptureInterval from '../setting-capture-interval';
import { Stack, useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 定義自定義樣式類型
type CustomStyles = {
  container: object;
  sectionTitle: object;
  settingItem: object;
  [key: string]: object;
};

// 定義路由參數類型
type RootStackParamList = {
  'plant-selection': undefined;
  'settings': undefined;
  // 添加其他路由參數類型
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const dynamicStyles = useMemo(() => getDynamicStyles(theme), [theme]);
  const router = useRouter();
  const bgColor = theme === 'dark' ? '#25292e' : '#fff';
  
  // 合併動態樣式和本地樣式
  const styles: CustomStyles = useMemo(() => ({
    ...dynamicStyles,
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#f0f0f0' : '#333',
      marginBottom: 12,
    },
    settingItem: {
      backgroundColor: theme === 'dark' ? '#2c2c2e' : '#f8f8f8',
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
  }), [dynamicStyles, theme]);
  
  // 處理導航到分類選擇頁面
  const navigateToPlantSelection = () => {
    // 先導航到分類選擇頁面
    router.push('/category-selection');
  };

  const resetPlantSelection = async () => {
    Alert.alert(
      '重設植物選擇',
      '確定要重設植物選擇嗎？這將清除當前的植物設定。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '確定',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('selectedPlant');
              Alert.alert('成功', '已重設植物選擇，請重新選擇植物類型');
            } catch (error) {
              console.error('重設植物選擇失敗:', error);
              Alert.alert('錯誤', '重設植物選擇失敗，請稍後再試');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor, flex: 1, padding: 16 }]}>
      <Stack.Screen options={{ title: '設定' }} />
      
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.sectionTitle}>外觀設定</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.settingItem}>
          <Text style={{ color: theme === 'dark' ? '#f0f0f0' : '#333' }}>
            切換主題：{theme === 'light' ? '深色模式' : '淺色模式'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 24 }}>
        <Text style={styles.sectionTitle}>植物設定</Text>
        <TouchableOpacity onPress={navigateToPlantSelection} style={[styles.settingItem, { marginBottom: 8 }]}>
          <Text style={{ color: theme === 'dark' ? '#f0f0f0' : '#333' }}>變更植物類型</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={resetPlantSelection} style={styles.settingItem}>
          <Text style={{ color: 'red' }}>重設植物選擇</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={styles.sectionTitle}>相機設定</Text>
        <View style={[styles.settingItem, { padding: 8 }]}>
          <SettingCaptureInterval />
        </View>
      </View>
    </View>
  );
}