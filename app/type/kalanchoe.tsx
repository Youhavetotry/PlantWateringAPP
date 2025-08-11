import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";

export default function KalanchoePage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]); // 注意：container 不再需要 flex: 1

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'flex-start', paddingBottom: 48 }}>
      <Image source={require('../../assets/images/plant/kalanchoe.png')} style={{ width: 120, height: 120, borderRadius: 12, alignSelf: 'center', marginBottom: 18 }} />
      <Text style={styles.title}>長壽花 (Kalanchoe blossfeldiana)</Text>
      <Text style={styles.subtitle}>生長條件</Text>

      <Text style={styles.paramTitle}>★ 土壤濕度</Text>
      <Text style={styles.text}>長壽花屬多肉植物，耐旱怕積水。建議土壤完全乾燥後再澆水，澆水時務必澆透但避免盆內積水。適宜土壤濕度為10%~20%。生長季可每2週澆水一次，冬季減少澆水頻率。</Text>

      <Text style={styles.paramTitle}>★ 生長溫度</Text>
      <Text style={styles.text}>最適生長溫度為15°C至25°C，低於10°C時需注意防寒。高溫時應加強通風，避免悶熱導致植株腐爛。</Text>

      <Text style={styles.paramTitle}>★ 環境濕度</Text>
      <Text style={styles.text}>長壽花對空氣濕度要求不高，普通家庭環境即可。建議維持空氣濕度在30%~50%。空氣過於潮濕時需加強通風，防止病害。</Text>

      <Text style={styles.paramTitle}>★ 小貼士</Text>
      <Text style={styles.text}>長壽花需充足陽光，每日4小時以上直射光有助於花芽分化。選用排水良好的多肉土壤。花期後可適當修剪促進分枝。繁殖可用葉插或扦插，適合新手栽培。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
