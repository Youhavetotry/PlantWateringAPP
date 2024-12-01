import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MoneyTreePage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>金錢樹 (Zamioculcas zamiifolia)</Text>
      <Text style={styles.subtitle}>生長條件</Text>
      
      <Text style={styles.paramTitle}>★ 土壤濕度</Text>
      <Text style={styles.text}>金錢樹耐旱，每次澆水前最好確保土壤已完全乾燥。避免過度澆水以免根部腐爛。澆水時機建議土壤濕度要低於 20% 到 30% 。</Text>
      
      <Text style={styles.paramTitle}>★ 生長溫度</Text>
      <Text style={styles.text}>理想的生長溫度為 18°C 到 27°C（64°F 到 81°F）。避免低於 7°C（45°F）的寒冷環境。</Text>
      
      <Text style={styles.paramTitle}>★ 環境濕度</Text>
      <Text style={styles.text}>金錢樹適應不同濕度的環境，無需特別濕潤的空氣，普通家庭環境即可。最佳環境濕度為40% 到 60% 。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#25292e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 50,
    color: '#fff',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 0,
    color: '#fff',
  },
  paramTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 50,
    color: '#fff',
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
});
