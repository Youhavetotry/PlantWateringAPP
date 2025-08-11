import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";

export default function BirdOfParadisePage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]); // 注意：container 不再需要 flex: 1

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'flex-start', paddingBottom: 48 }}>
      <Image source={require('../../assets/images/plant/birdofparadise.png')} style={{ width: 120, height: 120, borderRadius: 12, alignSelf: 'center', marginBottom: 18 }} />
      <Text style={styles.title}>天堂鳥 (Strelitzia reginae)</Text>
      <Text style={styles.subtitle}>生長條件</Text>

      <Text style={styles.paramTitle}>★ 土壤濕度</Text>
      <Text style={styles.text}>天堂鳥喜歡排水良好且微濕的土壤，建議土壤表層乾燥後再澆水。適宜土壤濕度為20%~30%，避免長期積水導致根部腐爛。夏季可每週澆水1~2次，冬季減少頻率。</Text>

      <Text style={styles.paramTitle}>★ 生長溫度</Text>
      <Text style={styles.text}>最適生長溫度為18°C至28°C，低於10°C時需防寒。高溫時應加強通風，避免悶熱導致葉片枯黃。</Text>

      <Text style={styles.paramTitle}>★ 環境濕度</Text>
      <Text style={styles.text}>天堂鳥適合中等至高濕度環境，建議維持空氣濕度在40%~60%。乾燥時可適度噴霧，並保持空氣流通。</Text>

      <Text style={styles.paramTitle}>★ 小貼士</Text>
      <Text style={styles.text}>天堂鳥需充足陽光，適合放置於明亮處但避免烈日直射。選用排水良好的腐殖質土壤。生長季每月施用稀薄液肥。花期後可修剪枯葉促進新芽。適合大型室內或陽台觀賞。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
