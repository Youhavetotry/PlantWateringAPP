import React, { createContext, useContext } from 'react';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error';

interface VoiceContextValue {
  isVisible: boolean;
  setVisible: (v: boolean) => void;
  status: VoiceStatus;
  partialText: string;
  finalText: string;
  startListening: () => void;
  stopListening: () => void;
  simulateResult: (text: string) => void;
}

// 完全 no-op 的預設值，確保即使被呼叫也不會造成任何實際行為
const defaultValue: VoiceContextValue = {
  isVisible: false,
  setVisible: () => {},
  status: 'idle',
  partialText: '',
  finalText: '',
  startListening: () => {},
  stopListening: () => {},
  simulateResult: () => {},
};

const VoiceContext = createContext<VoiceContextValue>(defaultValue);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 直接提供預設的 no-op 值，不持有任何狀態
  return <VoiceContext.Provider value={defaultValue}>{children}</VoiceContext.Provider>;
};

export const useVoice = () => {
  return useContext(VoiceContext);
};
