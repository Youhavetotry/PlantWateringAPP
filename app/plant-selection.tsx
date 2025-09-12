import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  TextInput,
  FlatList,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { plantTypes, PlantType, plantCategories } from './constants/plantTypes';
import { Stack } from 'expo-router';
import { useTheme } from './style/theme-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useEventLog } from './context/event-log-context';

// 定義樣式類型
type Styles = {
  container: ViewStyle;
  title: TextStyle;
  plantsContainer: ViewStyle;
  plantCard: ViewStyle;
  selectedCard: ViewStyle;
  plantName: TextStyle;
  plantDescription: TextStyle;
  checkmark: TextStyle;
  [key: string]: any; // 添加索引簽名以允許動態屬性
};

// 擴展 PlantType 以包含 emoji 屬性
interface ExtendedPlantType extends PlantType {
  emoji?: string;
}

// 定義 PlantCard 組件的屬性
interface PlantCardProps {
  plant: ExtendedPlantType;
  isSelected: boolean;
  onSelect: (plant: ExtendedPlantType) => void;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant, isSelected, onSelect }) => {
  const { theme } = useTheme();
  
  const cardStyles: ViewStyle[] = [
    {
      width: '100%',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: theme === 'dark' ? '#2c2c2e' : '#f8f8f8',
    },
    isSelected && {
      borderColor: '#4CAF50',
      backgroundColor: theme === 'dark' ? '#1e4620' : '#e8f5e9',
    }
  ].filter(Boolean) as ViewStyle[];

  const textStyles = {
    color: theme === 'dark' ? '#fff' : '#333',
  };

  return (
    <TouchableOpacity
      key={plant.id}
      style={cardStyles}
      onPress={() => onSelect(plant)}
    >
      <View style={styles.plantIconContainer}>
        {plant.image ? (
          <Image 
            source={plant.image} 
            style={styles.plantImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ fontSize: 24 }}>{plant.icon}</Text>
        )}
      </View>
      <View style={styles.plantInfo}>
        <Text style={[styles.plantName, textStyles]}>{plant.name}</Text>
        <Text 
          style={[styles.plantDescription, { color: theme === 'dark' ? '#aaa' : '#666' }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {plant.description}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const PlantSelection = () => {
  const [selectedPlant, setSelectedPlant] = useState<ExtendedPlantType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { theme } = useTheme();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { logEvent } = useEventLog();
  
  // 過濾植物列表
  const filteredPlants = plantTypes.filter(plant => {
    // 如果有搜尋關鍵字，則同時匹配名稱和別名
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        plant.name.toLowerCase().includes(query) ||
        (plant.aliases && plant.aliases.some(alias => 
          alias.toLowerCase().includes(query)
        ))
      );
    }
    
    // 如果選擇了'全部植物'或未選擇分類，則顯示所有植物
    // 否則根據選擇的分類過濾
    return !category || category === 'all' || plant.category === category;
  });
  
  // 獲取當前分類名稱
  const currentCategory = searchQuery 
    ? '搜尋結果'
    : category 
      ? plantCategories.find(cat => cat.id === category)?.name || ''
      : '所有植物';

  // 載入已選擇的植物
  useEffect(() => {
    const loadSelectedPlant = async () => {
      try {
        const plantData = await AsyncStorage.getItem('selectedPlant');
        if (plantData) {
          const plant = JSON.parse(plantData);
          setSelectedPlant(plant);
        }
      } catch (error) {
        console.error('載入植物設定失敗:', error);
        logEvent({
          source: 'system',
          category: 'error',
          action: 'async_storage_error',
          message: '載入已選植物失敗',
          meta: { where: 'plant-selection.loadSelectedPlant', error: String(error) }
        });
      }
    };

    loadSelectedPlant();
  }, []);

  const handleSelectPlant = async (plant: ExtendedPlantType) => {
    try {
      // 儲存植物選擇
      await AsyncStorage.setItem('selectedPlant', JSON.stringify(plant));
      
      // 更新閾值設定
      await AsyncStorage.multiSet([
        ['soilMoistureThreshold', plant.defaultSettings.soilMoistureThreshold.toString()],
        ['minTemperatureThreshold', plant.defaultSettings.minTemperatureThreshold.toString()],
        ['humidityThreshold', plant.defaultSettings.humidityThreshold.toString()],
      ]);
      // 記錄選擇植物事件
      logEvent({
        source: 'user',
        category: 'plant',
        action: 'plant_selected',
        message: `已選擇植物：${plant.name}`,
        meta: {
          id: plant.id,
          name: plant.name,
          category: plant.category,
          defaults: plant.defaultSettings
        }
      });
      
      // 返回上一頁並傳遞新的閾值參數
      router.push({
        pathname: '/',
        params: { 
          soilMoistureThreshold: plant.defaultSettings.soilMoistureThreshold.toString(),
          minTemperatureThreshold: plant.defaultSettings.minTemperatureThreshold.toString(),
          humidityThreshold: plant.defaultSettings.humidityThreshold.toString()
        }
      });
    } catch (error) {
      console.error('儲存植物選擇失敗', error);
      logEvent({
        source: 'system',
        category: 'error',
        action: 'async_storage_error',
        message: '儲存植物選擇或更新閾值失敗',
        meta: { where: 'plant-selection.handleSelectPlant', plantId: plant.id, error: String(error) }
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#25292e' : '#fff' }]}>
      <Stack.Screen 
        options={{ 
          title: `選擇植物${currentCategory ? ` - ${currentCategory}` : ''}`,
          headerBackTitle: '返回',
        }} 
      />
      
      <View style={styles.content}>
        {/* 搜尋框 */}
        <View style={[styles.searchContainer, { 
          backgroundColor: theme === 'dark' ? '#2c2c2e' : '#f0f0f0' 
        }]}>
          <MaterialIcons 
            name="search" 
            size={20} 
            color={theme === 'dark' ? '#888' : '#666'} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={[
              styles.searchInput, 
              { color: theme === 'dark' ? '#fff' : '#000' }
            ]}
            placeholder="搜尋植物..."
            placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <MaterialIcons 
                name="clear" 
                size={20} 
                color={theme === 'dark' ? '#888' : '#666'} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[styles.subtitle, { 
          color: theme === 'dark' ? '#aaa' : '#666',
          marginTop: 16,
          marginBottom: 8,
        }]}>
          {searchQuery 
            ? `找到 ${filteredPlants.length} 個符合「${searchQuery}」的植物`
            : `共 ${filteredPlants.length} 種${currentCategory ? currentCategory : '植物'}`}
        </Text>
        
        <FlatList
          data={filteredPlants}
          keyExtractor={item => item.id}
          renderItem={({ item: plant }) => {
            const plantWithEmoji = {
              ...plant,
              emoji: plant.icon || '🌱'
            };
            return (
              <PlantCard
                plant={plantWithEmoji}
                isSelected={selectedPlant?.id === plant.id}
                onSelect={handleSelectPlant}
              />
            );
          }}
          contentContainerStyle={styles.plantsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </View>
  );
};

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
  },
  // 搜尋框樣式
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  // 植物列表樣式
  plantsList: {
    paddingBottom: 24,
  },
  // 植物卡片樣式
  plantIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  plantInfo: {
    flex: 1,
    marginRight: 8,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  plantDescription: {
    fontSize: 12,
    opacity: 0.8,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});

export default PlantSelection;
