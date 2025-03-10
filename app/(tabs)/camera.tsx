import { useState, useEffect } from "react";
import { View, Button, Switch, Text, Image, ActivityIndicator } from "react-native";
import { getDatabase, ref, update, onValue } from "firebase/database";

export default function CameraControl() {
  const db = getDatabase();
  const [isScheduled, setIsScheduled] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    const nextCapture = isScheduled ? 0 : Math.floor(Date.now() / 1000) + 3600;
    await update(ref(db, "photo"), { mode: newMode, nextCapture });
    setIsScheduled(!isScheduled);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>最新圖片:</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Image source={{ uri: imageUrl || '' }} style={{ width: 370, height: 280, marginBottom: 20, alignSelf: 'center' }} />
      )}
      <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
        <Text>定時模式</Text>
        <Switch value={isScheduled} onValueChange={toggleMode} />
      </View>
      <Button title="手動拍照" onPress={takePhoto} />
    </View>
  );
}
