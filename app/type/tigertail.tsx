import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../style/theme-context'; // 引入 useTheme
import { getDynamicStyles } from "../style/dynamic-style";


export default function TigerTailPage() {

  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>虎尾蘭 (Sansevieria trifasciata)</Text>
      <Text style={styles.subtitle}>生長條件</Text>
      
      <Text style={styles.paramTitle}>★ 土壤濕度</Text>
      <Text style={styles.text}>虎尾蘭是非常耐旱的植物，過度澆水可能導致根部腐爛。它能在乾燥的土壤中生長，因此澆水時需要確保土壤已經完全乾燥。一般來說，虎尾蘭的土壤濕度應保持在10% 到 20%，這樣能夠避免過多水分導致的問題。</Text>
      
      <Text style={styles.paramTitle}>★ 生長溫度</Text>
      <Text style={styles.text}>虎尾蘭最適宜的生長溫度範圍為16°C 到 30°C（61°F 到 86°F）。它對溫度的耐受性較強，可以忍受偶爾的低溫，但不適合長時間處於寒冷環境。溫度低於5°C（41°F）會影響其生長，甚至可能導致凍傷。</Text>
      
      <Text style={styles.paramTitle}>★ 環境濕度</Text>
      <Text style={styles.text}>​虎尾蘭適應各種濕度範圍，無需過高的空氣濕度。它能夠在普通的家庭環境中生長，理想的環境濕度範圍為30% 到 50%，過高或過低的濕度會影響植物的生長，導致葉片發黃或縮小</Text>
    </View>
  );
}
