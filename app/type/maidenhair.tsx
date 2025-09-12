import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";

export default function MaidenhairPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]); // 注意：container 不再需要 flex: 1

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'flex-start', paddingBottom: 48 }}>
      <Image source={require('../../assets/images/plant/maidenhair.png')} style={{ width: 120, height: 120, borderRadius: 12, alignSelf: 'center', marginBottom: 18 }} />
      <Text style={styles.title}>鐵線蕨 (Adiantum)</Text>
      <Text style={styles.subtitle}>生長條件</Text>

      <Text style={styles.paramTitle}>★ 土壤濕度</Text>
      <Text style={styles.text}>鐵線蕨喜歡保持濕潤但不積水的土壤，建議土壤表層略乾時即澆水，切勿讓土壤完全乾燥。適宜土壤濕度為40%~60%。夏季可每週澆水2~3次，冬季減少頻率。</Text>

      <Text style={styles.paramTitle}>★ 生長溫度</Text>
      <Text style={styles.text}>鐵線蕨適合生長於16°C至24°C，低於10°C時生長緩慢甚至休眠。高溫時需加強通風並適度噴霧降溫。</Text>

      <Text style={styles.paramTitle}>★ 環境濕度</Text>
      <Text style={styles.text}>鐵線蕨對空氣濕度要求高，適宜濕度為60%~80%。空氣乾燥時可用噴霧或加濕器，並避免放置於冷氣或暖氣直吹處。</Text>

      <Text style={styles.paramTitle}>★ 小貼士</Text>
      <Text style={styles.text}>鐵線蕨適合散射光或半陰環境，避免強光直射。可定期修剪枯黃葉片促進新葉生長。生長季每月施用稀薄液肥，有助於植株茂盛。適合室內綠化及浴室等高濕空間。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
