import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../style/theme-context'; // 引入 useTheme
import { getDynamicStyles } from "../style/dynamic-style";
import SettingCaptureInterval from '../setting-capture-interval';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);
  const bgColor = theme === 'dark' ? '#25292e' : '#fff'; // 更深的底色

  return (
    <View style={[styles.container, { backgroundColor: bgColor, flex: 1 }]}>
      <TouchableOpacity
        onPress={toggleTheme}
        style={[styles.button]}
      >
        <Text style={{ color: theme === 'light' ? '#ffffff' : '#f0f0f0' }}>
          切換主題：{theme === 'light' ? '深色模式' : '淺色模式'}
        </Text>
      </TouchableOpacity>
      <SettingCaptureInterval />
    </View>
  );
}