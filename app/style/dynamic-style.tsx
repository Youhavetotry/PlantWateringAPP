import { StyleSheet } from 'react-native';

// 這裡會根據主題動態設置樣式
export const getDynamicStyles = (theme: 'light' | 'dark') => {
  return {
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#25292e', // 背景顏色根據主題設置
      padding: 20,
    },
    text: {
      color: theme === 'light' ? '#25292e' : '#fff', // 文字顏色根據主題設置
      fontSize: 16,
      marginTop: 10,
    },
    title: {
        color: theme === 'light' ? '#25292e' : '#fff', // 文字顏色根據主題設置
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
      },
    button: {
        backgroundColor: theme === 'light' ? '#25292e' : '#fff', // 按鈕背景顏色根據主題設置
        padding: 10,
        borderRadius: 5,
      },
      chartTitle: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 0,
        color: theme === 'light' ? '#25292e' : '#fff', // 文字顏色根據主題設置
      },
      chartContainer: {
        width: '100%',
      },
      chartWrapper: {
        marginBottom: 40,
      },
      labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 0,
      },
      buttonContainer: {
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 20,
      },
      dataContainer: {
        marginBottom:20,
      },
      subtitle: {
        fontSize: 18,
        marginTop: 20,
        marginBottom: 40,
        color: theme === 'light' ? '#25292e' : '#fff', // 文字顏色根據主題設置
        textAlign: 'center',
      },
      paramTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 50,
        color: theme === 'light' ? '#25292e' : '#fff', // 文字顏色根據主題設置
      },
      notificationButtonContainer: {
        position: 'absolute',
        top: 40,
        right: 20,
      },
      WateringButtonContainer: {
        position: 'absolute',
        top: 40,
        left: 20,
      },
      sensorDataContainer: {
        marginTop: 100,
      },
      timestampText: {
        marginTop: 20,
        fontSize: 11,
        color: theme === 'light' ? '#25292e' : '#fff', // 文字顏色根據主題設置
        textAlign: 'right',
      },
  };
};

export default function DynamicStylesScreen() {
  
}