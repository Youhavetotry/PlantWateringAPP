import { useState, useEffect, useContext, useMemo, useRef } from "react";
import { View, Button, Switch, Text, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Animated, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, update, onValue } from "firebase/database";
import { useTheme } from "../style/theme-context";
import { getDynamicStyles } from "../style/dynamic-style";

export default function CameraControl() {
  const { theme } = useTheme();
  const db = getDatabase();
  const [isScheduled, setIsScheduled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current; // for toast animation
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => getDynamicStyles(theme), [theme]);

  useEffect(() => {
    // 監聽 "photo/mode" 的變化
    const modeRef = ref(db, "photo/mode");
    onValue(modeRef, (snapshot) => {
      setIsScheduled(snapshot.val() === "scheduled");
    });

    // 監聽 "latestImage" 的變化
    const imageRef = ref(db, "latestImage");
    onValue(imageRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.url) {
        setImageUrl(data.url);
        setLoading(false);
      }
    });

  }, []);

  // 觸發手動拍照
  const takePhoto = async () => {
    await update(ref(db, "photo"), { request: true });
  };

  // 切換模式 (手動 / 定時)
  const toggleMode = async () => {
    const newMode = isScheduled ? "manual" : "scheduled";
    let interval = 1;
    try {
      const stored = await AsyncStorage.getItem('captureIntervalHours');
      interval = stored ? Number(stored) : 1;
      if (!interval || interval < 1 || interval > 24) interval = 1;
    } catch (e) {
      interval = 1;
    }
    const nextCapture = isScheduled ? 0 : Math.floor(Date.now() / 1000) + interval * 3600;
    await update(ref(db, "photo"), { mode: newMode, nextCapture });
    setIsScheduled(!isScheduled);
    // 寫入 AsyncStorage
    await AsyncStorage.setItem('photoMode', newMode);
    await AsyncStorage.setItem('nextCapture', nextCapture.toString());
    // 顯示提示
    setShowToast(true);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setShowToast(false));
      }, 1200);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}>

      <Text style={styles.text}>最新圖片:</Text>
      {loading ? (
        <ActivityIndicator size="large"/>
      ) : (
        <Image
          source={{ uri: imageUrl || '' }}
          style={{ width: '100%', aspectRatio: 4/3, marginBottom: 20, alignSelf: 'center' }}
          resizeMode="contain"
        />
      )}
      <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
        <Text style={styles.text}>定時模式</Text>
        <Switch value={isScheduled} onValueChange={toggleMode} />
      </View>
      <TouchableOpacity 
          onPress={() => takePhoto()} 
          style={[styles.button]}
        >
          <Text style={{ color: theme === 'light' ? '#ffffff' : '#f0f0f0' ,alignSelf: 'center'}}>手動拍照</Text>
        </TouchableOpacity>
      {/* Toast 提示 */}
      {showToast && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 60,
            alignSelf: 'center',
            backgroundColor: 'rgba(50,50,50,0.93)',
            paddingHorizontal: 28,
            paddingVertical: 13,
            borderRadius: 18,
            opacity: toastOpacity,
            zIndex: 1000,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', letterSpacing: 1 }}>
            {isScheduled ? '已打開定時拍照模式' : '已關閉定時拍照模式'}
          </Text>
        </Animated.View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}
