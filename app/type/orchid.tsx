import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";

export default function OrchidPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]); // 注意：container 不再需要 flex: 1

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'flex-start', paddingBottom: 48 }}>
      <Image source={require('../../assets/images/plant/orchid.png')} style={{ width: 120, height: 120, borderRadius: 12, alignSelf: 'center', marginBottom: 18 }} />
      <Text style={styles.title}>蘭花 (Orchidaceae)</Text>
      <Text style={styles.subtitle}>生長條件</Text>

      <Text style={styles.paramTitle}>★ 土壤濕度</Text>
      <Text style={styles.text}>蘭花多為氣生根，喜歡濕潤但不積水的介質。建議介質表層乾燥後再澆水，保持濕潤但避免過度潮濕。一般每週澆水1~2次，夏季可適度增加，冬季減少。適宜濕度約為20%~30%。</Text>

      <Text style={styles.paramTitle}>★ 生長溫度</Text>
      <Text style={styles.text}>蘭花適合生長於18°C至28°C，低於12°C時生長緩慢。避免極端高溫或低溫，並注意通風良好。</Text>

      <Text style={styles.paramTitle}>★ 環境濕度</Text>
      <Text style={styles.text}>蘭花喜歡高濕度環境，適宜空氣濕度為50%~80%。乾燥季節可用噴霧或加濕器提高濕度，並保持空氣流通以防病害。</Text>

      <Text style={styles.paramTitle}>★ 小貼士</Text>
      <Text style={styles.text}>蘭花需散射光，避免直射日曬。選用透氣性佳的植料（如水苔、樹皮）。生長期可每月施用稀薄液肥。花期後適當修剪花梗，有助於新芽生長。澆水時避免積水於葉腋，以防腐爛。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
