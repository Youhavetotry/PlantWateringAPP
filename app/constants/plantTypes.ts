// 全局最高溫度閾值
const GLOBAL_MAX_TEMPERATURE = 35; // 統一最高溫度閾值 35°C

export interface PlantType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  image?: any; // 使用 require 引入的圖片資源
  aliases?: string[];
  defaultSettings: {
    soilMoistureThreshold: number; // 土壤濕度閾值 (%)
    minTemperatureThreshold: number; // 最低溫度閾值 (°C)
    humidityThreshold: number;      // 空氣濕度閾值 (%)
  };
}

export const plantCategories = [
  {
    id: 'all',
    name: '全部植物',
    image: require('../../assets/images/plant/aloe.png'), // 蘆薈
  },
  {
    id: 'succulent',
    name: '多肉植物',
    image: require('../../assets/images/plant/haworthia.png'), // 現有多肉
  },
  {
    id: 'foliage',
    name: '觀葉植物',
    image: require('../../assets/images/plant/monstera.png'), // 龜背芋
  },
  {
    id: 'flower',
    name: '開花植物',
    image: require('../../assets/images/plant/orchid.png'), // 蝴蝶蘭
  },
  {
    id: 'fern',
    name: '蕨類植物',
    image: require('../../assets/images/plant/bostonfern.png'), // 波士頓蕨
  },
];

export const plantTypes: PlantType[] = [
  // 多肉植物
  {
    id: 'aloe',
    name: '蘆薈',
    description: '多肉植物，具有藥用價值',
    icon: '🌵',
    category: 'succulent',
    image: require('../../assets/images/plant/aloe.png'),
    aliases: ['蘆薈', 'Aloe Vera'],
    defaultSettings: {
      soilMoistureThreshold: 15,  // 多肉植物特性，耐旱
      minTemperatureThreshold: 10,
      humidityThreshold: 30
    }
  },
  {
    id: 'haworthia',
    name: '玉露',
    description: '小型多肉植物，葉片帶有白色斑紋',
    icon: '🌵',
    category: 'succulent',
    image: require('../../assets/images/plant/haworthia.png'),
    aliases: ['玉露', 'Haworthia'],
    defaultSettings: {
      soilMoistureThreshold: 15,  // 多肉植物特性，耐旱
      minTemperatureThreshold: 10,
      humidityThreshold: 40
    }
  },
  {
    id: 'tigertail',
    name: '虎尾蘭',
    description: '耐旱性強，適合室內種植',
    icon: '🌱',
    category: 'succulent',
    image: require('../../assets/images/plant/tigertail.png'),
    aliases: ['虎尾蘭', 'Snake Plant', 'Sansevieria', 'Mother-in-law\'s Tongue'],
    defaultSettings: {
      soilMoistureThreshold: 20,  // 耐旱，表土完全乾燥後再澆水
      minTemperatureThreshold: 10,
      humidityThreshold: 40
    }
  },
  {
    id: 'monstera',
    name: '龜背竹',
    description: '熱帶觀葉植物，葉片有獨特的孔洞',
    icon: '🌿',
    category: 'foliage',
    image: require('../../assets/images/plant/monstera.png'),
    aliases: ['龜背竹', 'Monstera', 'Swiss Cheese Plant'],
    defaultSettings: {
      soilMoistureThreshold: 40,  // 保持土壤微濕
      minTemperatureThreshold: 15,
      humidityThreshold: 60
    }
  },
  {
    id: 'orchid',
    name: '蘭花',
    description: '優雅的開花植物，需要適當濕度',
    icon: '🌸',
    category: 'flower',
    image: require('../../assets/images/plant/orchid.png'),
    aliases: ['蘭花', 'Orchid', 'Phalaenopsis'],
    defaultSettings: {
      soilMoistureThreshold: 30,  // 使用蘭花專用介質，保持微濕
      minTemperatureThreshold: 15,
      humidityThreshold: 60
    }
  },
  {
    id: 'boston-fern',
    name: '波士頓腎蕨',
    description: '常見的室內蕨類植物，需要高濕度',
    icon: '🌱',
    category: 'fern',
    image: require('../../assets/images/plant/bostonfern.png'),
    aliases: ['波士頓腎蕨', 'Boston Fern'],
    defaultSettings: {
      soilMoistureThreshold: 50,  // 保持土壤濕潤
      minTemperatureThreshold: 15,  // 提高最低溫度要求
      humidityThreshold: 70
    }
  },
  {
    id: 'maidenhair',
    name: '鐵線蕨',
    description: '精緻的蕨類植物，需要高濕度',
    icon: '🌱',
    category: 'fern',
    image: require('../../assets/images/plant/maidenhair.png'),
    aliases: ['鐵線蕨', 'Maidenhair Fern', 'Adiantum'],
    defaultSettings: {
      soilMoistureThreshold: 60,  // 保持土壤濕潤但不積水
      minTemperatureThreshold: 15,  // 提高最低溫度要求
      humidityThreshold: 75
    }
  },
  {
    id: 'moneytree',
    name: '金錢樹',
    description: '象徵財富，耐旱性強',
    icon: '🌿',
    category: 'foliage',
    image: require('../../assets/images/plant/moneytree.png'),
    aliases: ['金錢樹', '馬拉巴栗'],
    defaultSettings: {
      soilMoistureThreshold: 20,  // 耐旱，表土乾燥後再澆水
      minTemperatureThreshold: 10,
      humidityThreshold: 40
    }
  },
  {
    id: 'kalanchoe',
    name: '長壽花',
    category: 'flower',
    icon: '🌸',
    description: '花期長，花色豐富，易於養護',
    image: require('../../assets/images/plant/kalanchoe.png'),
    aliases: ['長壽花', '聖誕伽藍菜'],
    defaultSettings: {
      soilMoistureThreshold: 20,  // 多肉植物特性，耐旱
      minTemperatureThreshold: 10,
      humidityThreshold: 40  // 降低濕度要求
    }
  },
  // 蕨類植物
  {
    id: 'bird-of-paradise',
    name: '天堂鳥',
    category: 'fern',
    icon: '🌱',
    description: '葉片大而美觀，需要較高濕度',
    image: require('../../assets/images/plant/birdofparadise.png'),
    aliases: ['天堂鳥', '鶴望蘭'],
    defaultSettings: {
      soilMoistureThreshold: 40,  // 保持土壤微濕
      minTemperatureThreshold: 15,  // 提高最低溫度要求
      humidityThreshold: 70
    }
  }
  // 可以在這裡繼續添加更多植物...
];

export default plantTypes;