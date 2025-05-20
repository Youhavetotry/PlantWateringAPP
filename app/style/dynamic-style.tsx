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
      color: theme === 'light' ? '#25292e' : '#e0e0e0', // 文字顏色根據主題設置
      fontSize: 16,
      marginTop: 10,
    },
    title: {
        color: theme === 'light' ? '#25292e' : '#e0e0e0', // 文字顏色根據主題設置
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
      },
    button: {
        backgroundColor: theme === 'light' ? '#2196F3' : '#006994', // 深色模式使用與感測器卡片相同的背景
        padding: 10,
        borderRadius: 5,
        color: theme === 'light' ? '#fff' : '#fff', // 按鈕文字顏色
      },
      chartTitle: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 0,
        color: theme === 'light' ? '#25292e' : '#e0e0e0', // 文字顏色根據主題設置
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
      topContainer: {
        backgroundColor: theme === 'dark' ? '#181c20' : '#fff',
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 10,
        borderBottomWidth: theme === 'dark' ? 0 : 1,
        borderBottomColor: theme === 'dark' ? '#222' : '#e0e0e0',
        shadowColor: theme === 'dark' ? '#000' : '#ccc',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
      },
      contentContainer: {
        flex: 1,
        backgroundColor: theme === 'dark' ? '#23272F' : '#f4f6fa',
        paddingTop: 0,
        paddingHorizontal: 0,
      },
      buttonContainer: {
        flexDirection: 'column', // 直向排列
        justifyContent: 'flex-start', // 從上方開始
        alignItems: 'flex-start', // 靠左（可改 center/ right）
        marginTop: 0,
        marginBottom: 10,
        paddingHorizontal: 20,
        gap: 8, // 若支援 React Native 0.71+ 可用 gap
      },

      dataContainer: {
        marginBottom:20,
      },
      subtitle: {
        fontSize: 18,
        marginTop: 20,
        marginBottom: 40,
        color: theme === 'light' ? '#25292e' : '#e0e0e0', // 文字顏色根據主題設置
        textAlign: 'center',
      },
      paramTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 50,
        color: theme === 'light' ? '#25292e' : '#e0e0e0', // 文字顏色根據主題設置
      },
      notificationButtonContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 20,
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
        color: theme === 'light' ? '#25292e' : '#e0e0e0', // 文字顏色根據主題設置
        textAlign: 'right',
      },
      activeButton: {
        backgroundColor: '#e74c3c', // 當水泵開啟時，按鈕變紅
        padding: 10,
        borderRadius: 5,
      },
      buttonText: {
        color: theme === 'light' ? '#ffffff' : '#f0f0f0',
        fontSize: 16,
      },
  };
};

export default function DynamicStylesScreen() {
  
}