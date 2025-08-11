import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";

export default function AloePage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]); // 注意：container 不再需要 flex: 1

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'flex-start', paddingBottom: 48 }}>
      <Image source={require('../../assets/images/plant/aloe.png')} style={{ width: 120, height: 120, borderRadius: 12, alignSelf: 'center', marginBottom: 18 }} />
      <Text style={styles.title}>蘆薈 (Aloe vera)</Text>
      <Text style={styles.subtitle}>生長條件</Text>

      <Text style={styles.paramTitle}>★ 土壤濕度</Text>
      <Text style={styles.text}>蘆薈屬於多肉植物，非常耐旱。建議等土壤完全乾燥後再澆水，避免積水造成根部腐爛。適宜的土壤濕度為10%~20%，澆水頻率可依季節調整，夏季約2~3週一次，冬季可更久。</Text>

      <Text style={styles.paramTitle}>★ 生長溫度</Text>
      <Text style={styles.text}>蘆薈適合生長在溫暖的環境，理想溫度為18°C至28°C。低於10°C時需避免長期戶外，過低溫度會影響生長甚至凍傷。</Text>

      <Text style={styles.paramTitle}>★ 環境濕度</Text>
      <Text style={styles.text}>蘆薈對空氣濕度要求不高，普通家庭環境即可。建議維持空氣濕度在30%~50%，避免過度潮濕。</Text>

      <Text style={styles.paramTitle}>★ 小貼士</Text>
      <Text style={styles.text}>蘆薈喜光但避免烈日直曬，適合放置於明亮但有散射光的位置。選用排水良好的沙質土壤，盆底可加陶粒增強排水。冬季注意防寒，澆水量減少。葉片可作為天然保養品，但建議使用前查閱相關安全資訊。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
