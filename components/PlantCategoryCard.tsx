import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { useTheme } from '../app/style/theme-context';

interface PlantCategoryCardProps {
  category: {
    id: string;
    name: string;
    image: any;
  };
  onPress: () => void;
  isSelected?: boolean;
}

export const PlantCategoryCard: React.FC<PlantCategoryCardProps> = ({
  category,
  onPress,
  isSelected = false,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme === 'dark' ? '#2c2c2e' : '#f8f8f8',
          borderColor: isSelected 
            ? '#4CAF50' 
            : theme === 'dark' ? '#444' : '#ddd',
        },
        isSelected && styles.selectedCard,
      ]}
    >
      <View style={{ marginBottom: 8 }}>
        <Image source={category.image} style={{ width: 64, height: 64, borderRadius: 12 }} />
      </View>
      <Text style={[styles.name, { color: theme === 'dark' ? '#fff' : '#333' }]}>
        {category.name}
      </Text>
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
