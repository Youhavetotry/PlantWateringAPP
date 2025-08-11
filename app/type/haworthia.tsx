import React, { useMemo } from 'react';
import { Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../style/theme-context';
import { getDynamicStyles } from "../style/dynamic-style";

export default function HaworthiaPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]); // 注意：container 不再需要 flex: 1

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'flex-start', paddingBottom: 48 }}>
      <Image source={require('../../assets/images/plant/haworthia.png')} style={{ width: 120, height: 120, borderRadius: 12, alignSelf: 'center', marginBottom: 18 }} />
      <Text style={styles.title}>玉露 (Haworthia)</Text>
      <Text style={styles.subtitle}>生長條件</Text>

      <Text style={styles.paramTitle}>★ 土壤濕度</Text>
      <Text style={styles.text}>玉露屬於多肉植物，對水分需求較低。建議等土壤完全乾燥後再澆水，避免積水導致根部腐爛。生長季（春秋）可每2週澆水一次，夏季高溫時減少澆水，冬季保持乾燥。適宜土壤濕度為10%~20%。</Text>

      <Text style={styles.paramTitle}>★ 生長溫度</Text>
      <Text style={styles.text}>玉露適合生長於15°C至25°C的溫暖環境。高於30°C時需遮陰並加強通風，低於5°C時應避免長時間戶外，以防凍傷。</Text>

      <Text style={styles.paramTitle}>★ 環境濕度</Text>
      <Text style={styles.text}>玉露對空氣濕度要求不高，一般家庭環境即可。最佳空氣濕度約為40%~60%，過高易引發病害，應保持通風。</Text>

      <Text style={styles.paramTitle}>★ 小貼士</Text>
      <Text style={styles.text}>玉露喜半陰環境，避免強光直射。選用排水良好的多肉專用土，盆底可加陶粒。夏季高溫時避免澆水過多，冬季保持乾燥。繁殖可用分株或葉插方式，適合新手種植。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
