import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from './style/theme-context';
import { plantCategories } from './constants/plantTypes';
import { PlantCategoryCard } from '../components/PlantCategoryCard';

export default function CategorySelection() {
  const router = useRouter();
  const { theme } = useTheme();

  const handleSelectCategory = (categoryId: string) => {
    router.push({
      pathname: '/plant-selection',
      params: { category: categoryId }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#25292e' : '#fff' }]}>
      <Stack.Screen 
        options={{ 
          title: '選擇植物類別',
          headerBackTitle: '返回',
        }} 
      />
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          請選擇植物類別
        </Text>
        <Text style={[styles.subtitle, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
          選擇您想種植的植物類別
        </Text>
        
        <FlatList
          data={plantCategories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PlantCategoryCard
              category={item}
              onPress={() => handleSelectCategory(item.id)}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
