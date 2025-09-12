import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";

export default function MonsteraPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]); // 注意：container 不再需要 flex: 1

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'flex-start', paddingBottom: 48 }}>
      <Image source={require('../../assets/images/plant/monstera.png')} style={{ width: 120, height: 120, borderRadius: 12, alignSelf: 'center', marginBottom: 18 }} />
      <Text style={styles.title}>龜背竹 (Monstera deliciosa)</Text>
      <Text style={styles.subtitle}>生長條件</Text>

      <Text style={styles.paramTitle}>★ 土壤濕度</Text>
      <Text style={styles.text}>龜背竹喜歡微濕但不積水的土壤，建議土壤表層乾燥後再澆水。保持土壤濕度約30%~40%，避免長期積水導致根部腐爛。夏季可每週澆水1~2次，冬季則減少頻率。</Text>

      <Text style={styles.paramTitle}>★ 生長溫度</Text>
      <Text style={styles.text}>龜背竹適合生長於20°C至30°C，低於10°C時生長緩慢甚至停止。應避免長時間處於寒冷環境，冬季需注意保暖。</Text>

      <Text style={styles.paramTitle}>★ 環境濕度</Text>
      <Text style={styles.text}>龜背竹適合高濕度環境，建議維持空氣濕度60%以上。若環境乾燥可用噴霧增加濕度，或將植株放置於濕度較高的空間。</Text>

      <Text style={styles.paramTitle}>★ 小貼士</Text>
      <Text style={styles.text}>龜背竹喜半陰環境，避免強光直射以防葉片灼傷。可定期擦拭葉面保持潔淨並促進光合作用。生長季可每月施薄肥一次，有助於葉片生長及孔洞發展。適合室內大型綠植裝飾。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
