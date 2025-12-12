// global.d.ts
/// <reference types="expo/tsconfig.base" />

// 為 expo-router 添加類型聲明
declare module 'expo-router' {
  export * from 'expo-router/build/index';
}

// 為 react-native-gesture-handler 添加類型聲明
declare module '@miblanchard/react-native-slider' {
  import { ViewStyle } from 'react-native';
  import { Component } from 'react';

  export interface SliderProps {
    value?: number;
    minimumValue?: number;
    maximumValue?: number;
    step?: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    onValueChange?: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
    style?: ViewStyle;
    disabled?: boolean;
  }

  export default class Slider extends Component<SliderProps> {}
}

// 為 expo-notifications 添加類型聲明
declare module 'expo-notifications' {
  export * from 'expo-notifications/build/index';
}

// 為 @react-navigation/native 添加類型聲明
declare module '@react-navigation/native' {
  export * from '@react-navigation/native/lib/typescript';
}