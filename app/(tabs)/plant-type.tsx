import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'; // 使用 expo-router 的 useRouter
import { useTheme } from '../style/theme-context'; // 引入 useTheme
import { getDynamicStyles } from "../style/dynamic-style";

import { plantTypes } from '../constants/plantTypes';

const plantData = plantTypes.map(plant => ({
  id: plant.id,
  name: plant.name,
  image: plant.image,
  page: plant.id,
}));

export default function PlantType() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDynamicStyles(theme), [theme]);
  const router = useRouter();  // 使用 useRouter

  const renderItem = ({ item }: { item: typeof plantData[0] }) => (
    <TouchableOpacity
      style={sstyles.card}
      onPress={() => router.push(`../type/${item.page}`)}
    >
      <Image source={item.image} style={sstyles.image} />
      <Text style={styles.text}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* @ts-ignore */}
      <Text style={styles.title}>植物小百科</Text>
      <FlatList
        data={plantData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2} // 每行顯示兩個
      />
    </View>
  );
}

const sstyles = StyleSheet.create({
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
});