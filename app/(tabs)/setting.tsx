import { Text, View, StyleSheet } from 'react-native';

export default function settingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>目前沒有任何設定...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
