import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../style/theme-context';
import { useVoice } from '../context/voice-context';
import { database } from '../configs/firebase-config';
import { ref, set, update } from 'firebase/database';

// Very small zh-only rule-based intent matcher (placeholder)
function parseIntentZh(text: string) {
  // 標準化：去掉空白與常見標點
  const t = (text || '')
    .trim()
    .replace(/[\s，。！？、,.!?:；;]/g, '')
    .toLowerCase();
  if (!t) return null;

  // 常見客氣前綴：請/幫我/麻煩/拜託
  const prefix = '(請|幫我|幫忙|麻煩|拜託)?';

  // 開泵/澆水
  const openPump = new RegExp(`^${prefix}(開啟|開|開始)?(澆水|水泵|水幫)`);
  if (openPump.test(t)) return { type: 'pump_on', pump: 'pump1' } as const;

  // 關泵/停止澆水
  const closePump = new RegExp(`^${prefix}(關閉|關|停止)?(澆水|水泵|水幫)`);
  if (closePump.test(t)) return { type: 'pump_off', pump: 'pump1' } as const;

  // 拍照
  const takePhoto = new RegExp(`${prefix}(拍照|拍一張|拍相片|拍照片)`);
  if (takePhoto.test(t)) return { type: 'take_photo' } as const;

  // 智慧模式開/關
  const smartOn = new RegExp(`${prefix}((智慧模式|智慧澆水)(打開|開啟|開)|開啟?智慧(模式|澆水)?)`);
  if (smartOn.test(t)) return { type: 'set_mode', mode: 'smart' } as const;
  const smartOff = new RegExp(`${prefix}((智慧模式|智慧澆水)(關閉|關)|關閉?智慧(模式|澆水)?)`);
  if (smartOff.test(t)) return { type: 'set_mode', mode: 'manual' } as const;

  // 狀態/幫助
  if (/狀態|現在怎樣|目前怎樣|現在如何|目前如何/.test(t)) return { type: 'status_query' } as const;
  if (/幫助|說明|怎麼用/.test(t)) return { type: 'help' } as const;
  return null;
}

export default function VoiceSheet() {
  const { theme } = useTheme();
  const { isVisible, setVisible, status, startListening, stopListening, simulateResult, finalText } = useVoice();
  const [manualText, setManualText] = useState('');

  const bg = theme === 'dark' ? '#2c313a' : '#ffffff';
  const fg = theme === 'dark' ? '#e0e0e0' : '#25292e';
  const sub = theme === 'dark' ? '#a0a0a0' : '#666';

  async function handleFinalText() {
    const intent = parseIntentZh(finalText);
    if (!intent) return;
    switch (intent.type) {
      case 'pump_on':
        await update(ref(database, 'waterPump'), { pump1: 'ON' });
        break;
      case 'pump_off':
        await update(ref(database, 'waterPump'), { pump1: 'OFF' });
        break;
      case 'take_photo':
        await update(ref(database, 'photo'), { request: true });
        break;
      case 'set_mode':
        await set(ref(database, 'mode'), intent.mode === 'smart' ? 'smart' : 'manual');
        break;
      case 'status_query':
      case 'help':
      default:
        break;
    }
  }

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '86%', backgroundColor: bg, borderRadius: 12, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: fg, fontSize: 16, fontWeight: 'bold' }}>語音操作</Text>
            <TouchableOpacity onPress={() => setVisible(false)}><Ionicons name="close" size={22} color={fg} /></TouchableOpacity>
          </View>

          <Text style={{ color: sub, marginTop: 6 }}>支援：開水泵 / 關水泵 / 拍照 / 開啟智慧模式 / 關閉智慧模式</Text>

          <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={status === 'listening' ? stopListening : startListening} style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: theme === 'dark' ? '#3a7bd5' : '#1abc9c', borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{status === 'listening' ? '停止' : '開始'}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Text style={{ color: sub }}>{status === 'listening' ? '聆聽中…' : status === 'processing' ? '處理中…' : ''}</Text>
          </View>

          {/* Emulator/manual input */}
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: sub, marginBottom: 6 }}>模擬辨識（模擬器可輸入文字測試）</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput value={manualText} onChangeText={setManualText} placeholder="例如：開水泵、拍照、開啟智慧模式" placeholderTextColor={sub} style={{ flex: 1, color: fg, borderColor: theme === 'dark' ? '#3a3f47' : '#e6e6e6', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 40 }} />
              <TouchableOpacity onPress={() => simulateResult(manualText)} style={{ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme === 'dark' ? '#444b55' : '#f0f0f0', borderRadius: 8 }}>
                <Text style={{ color: fg }}>送出</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!!finalText && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: sub, marginBottom: 6 }}>辨識結果</Text>
              <Text style={{ color: fg }}>{finalText}</Text>
              <TouchableOpacity onPress={handleFinalText} style={{ marginTop: 10, alignSelf: 'flex-end', backgroundColor: theme === 'dark' ? '#3a7bd5' : '#1abc9c', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>執行</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
