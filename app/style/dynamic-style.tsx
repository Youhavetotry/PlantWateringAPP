import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

type Theme = 'light' | 'dark';

// Define all possible style types
type DynamicStyles = {
  // Common styles
  container: ViewStyle;
  text: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  button: ViewStyle & { color: string };
  
  // Chart styles
  chartTitle: TextStyle;
  chartContainer: ViewStyle;
  chartWrapper: ViewStyle;
  
  // Layout
  labelContainer: ViewStyle;
  topContainer: ViewStyle;
  contentContainer: ViewStyle;
  
  // Button related
  buttonContainer: ViewStyle;
  activeButton: ViewStyle;
  buttonText: TextStyle;
  
  // Sensor data
  sensorDataContainer: ViewStyle;
  timestampText: TextStyle;
  
  // Plant page specific
  plantContainer: ViewStyle;
  plantTitle: TextStyle;
  plantSubtitle: TextStyle;
  paramTitle: TextStyle;
  plantText: TextStyle;
  
  // Plant info card
  noPlantContainer: ViewStyle;
  noPlantText: TextStyle;
  selectPlantButton: ViewStyle;
  selectPlantButtonText: TextStyle;
  plantInfoContainer: ViewStyle;
  plantImageContainer: ViewStyle;
  plantImage: ViewStyle;
  plantIcon: TextStyle;
  plantDetails: ViewStyle;
  plantName: TextStyle;
  plantDescription: TextStyle;
  changePlantButton: ViewStyle;
};

// Generate dynamic styles based on theme
export const getDynamicStyles = (theme: Theme): DynamicStyles => {
  const textColor = theme === 'light' ? '#25292e' : '#e0e0e0';
  const backgroundColor = theme === 'light' ? '#fff' : '#25292e';
  const borderColor = theme === 'light' ? '#e0e0e0' : '#222';
  const shadowColor = theme === 'light' ? '#ccc' : '#000';

  return {
    // Base container
    container: {
      flex: 1,
      backgroundColor,
      padding: 20,
      paddingTop: 60, // Add padding to prevent overlap with notification bell
    },
    
    // Text
    text: {
      color: textColor,
      fontSize: 16,
      marginTop: 10,
    },
    
    // Title
    title: {
      color: textColor,
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 20,
      textAlign: 'center',
    },
    
    // Subtitle
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      marginTop: 24,
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    
    // Button
    button: {
      backgroundColor: theme === 'light' ? '#2196F3' : '#006994',
      width: 140, // Fixed width
      height: 48, // Fixed height
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 24,
      color: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    
    // Chart styles
    chartTitle: {
      fontSize: 18,
      marginTop: 10,
      marginBottom: 0,
      color: textColor,
    },
    
    chartContainer: {
      width: '100%',
    },
    
    chartWrapper: {
      marginBottom: 40,
    },
    
    // Label container
    labelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 0,
    },
    
    // Top container
    topContainer: {
      backgroundColor: theme === 'dark' ? '#181c20' : '#fff',
      paddingTop: 16,
      paddingBottom: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      shadowColor: shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    
    // Button container
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 0, // Increase top margin to ensure space below notification bell
      marginBottom: 30,
      paddingHorizontal: 16,
      position: 'relative',
      zIndex: 1, // Ensure buttons stay above other content
    },
    
    // Active button
    activeButton: {
      backgroundColor: '#ff3b30', // Red color for active state
      width: 140, // Fixed width
      height: 48, // Fixed height
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    
    // Button text
    buttonText: {
      color: '#fff',
      fontSize: 16,
      textAlign: 'center',
    },
    
    // Sensor data container
    sensorDataContainer: {
      marginTop: 10,
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    
    // Timestamp text
    timestampText: {
      fontSize: 12,
      color: theme === 'light' ? '#666' : '#999',
      textAlign: 'right',
      marginTop: 4,
    },
    
    // Plant page specific styles
    plantContainer: {
      marginBottom: 20,
      padding: 15,
      borderRadius: 12,
      backgroundColor: theme === 'dark' ? '#2c2c2e' : '#f8f8f8',
    },
    plantTitle: {
      color: textColor,
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 20,
      textAlign: 'center',
    },
    plantSubtitle: {
      color: textColor,
      fontSize: 20,
      marginTop: 10,
      marginBottom: 20,
      textAlign: 'left',
    },
    paramTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: textColor,
      marginTop: 20,
    },
    plantText: {
      color: textColor,
      fontSize: 16,
      marginTop: 10,
      lineHeight: 24,
    },
    
    // Plant info card
    noPlantContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: theme === 'dark' ? '#2c2c2e' : '#f8f8f8',
      borderRadius: 12,
      marginBottom: 16,
    },
    noPlantText: {
      fontSize: 16,
      color: theme === 'dark' ? '#e0e0e0' : '#25292e',
    },
    selectPlantButton: {
      backgroundColor: '#4CAF50',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    selectPlantButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    plantInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme === 'dark' ? '#2c2c2e' : '#f8f8f8',
      borderRadius: 12,
      marginBottom: 16,
    },
    plantImageContainer: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: theme === 'dark' ? '#3a3a3c' : '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginRight: 16,
    },
    plantImage: {
      width: '100%',
      height: '100%',
    },
    plantIcon: {
      fontSize: 32,
      color: theme === 'dark' ? '#e0e0e0' : '#25292e',
    },
    plantDetails: {
      flex: 1,
      marginRight: 12,
    },
    plantName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#25292e',
      marginBottom: 4,
    },
    plantDescription: {
      fontSize: 14,
      color: theme === 'dark' ? '#aaa' : '#666',
    },
    changePlantButton: {
      padding: 8,
    },
    
    // Content container
    contentContainer: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#23272F' : '#f4f6fa',
      paddingTop: 0,
      paddingHorizontal: 0,
    },
  };
};

// For TypeScript module augmentation
declare module 'react-native' {
  interface ViewStyle {
    elevation?: number;
  }
}

export default getDynamicStyles;