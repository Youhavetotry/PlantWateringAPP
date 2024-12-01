import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'; // 使用 expo-router 的 useRouter

const plantData = [
  {
    id: '1',
    name: '虎尾蘭',
    image: require('../../assets/images/plant/tigertail.png'), // 替換成真實的圖片路徑
    page: 'tigertail', // 頁面名稱
    params: {
      soilMoisture: '50%-70%',
      temperature: '15°C-25°C',
      humidity: '50%-60%',
    },
  },
  {
    id: '2',
    name: '金錢樹',
    image: require('../../assets/images/plant/moneytree.png'),
    page: 'moneytree', // 頁面名稱
    params: {
      soilMoisture: '10%-30%',
      temperature: '20°C-35°C',
      humidity: '10%-20%',
    },
  },
];

export default function PlantType() {
  const router = useRouter();  // 使用 useRouter

  const renderItem = ({ item }: { item: typeof plantData[0] }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`../type/${item.page}?soilMoisture=${item.params.soilMoisture}&temperature=${item.params.temperature}&humidity=${item.params.humidity}`)}  // 使用 router.push
    >
      <Image source={item.image} style={styles.image} />
      <Text style={styles.text}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: '#fff' }]}>選擇植物種類</Text>
      <FlatList
        data={plantData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2} // 每行顯示兩個
      />
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
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '100',
    color: '#fff',
  },
});
