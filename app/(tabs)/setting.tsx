import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../style/theme-context'; // 引入 useTheme
import { getDynamicStyles } from "../style/dynamic-style";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);

  return (
    <View
      style={[
        styles.container
      ]}
    >
      <TouchableOpacity
        onPress={toggleTheme}
        style={[
          styles.button
        ]}
      >
        <Text style={{ color: theme === 'light' ? '#fff' : '#000' }}>
          切換主題：{theme === 'light' ? '深色模式' : '淺色模式'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
