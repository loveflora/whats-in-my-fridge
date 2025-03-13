import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// BottomTabBarHeight를 수동으로 설정 (iOS나 Android의 기본 높이)
export function useBottomTabOverflow() {
  const [tabHeight, setTabHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      setTabHeight(83); // iOS 기본 탭 바 높이
    } else if (Platform.OS === 'android') {
      setTabHeight(56); // Android 기본 탭 바 높이
    }
  }, []);

  return tabHeight; // 높이 리턴
}

// import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
// import { BlurView } from 'expo-blur';
// import { StyleSheet } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// export default function BlurTabBarBackground() {
//   return (
//     <BlurView
//       // System chrome material automatically adapts to the system's theme
//       // and matches the native tab bar appearance on iOS.
//       tint="systemChromeMaterial"
//       intensity={100}
//       style={StyleSheet.absoluteFill}
//     />
//   );
// }

// export function useBottomTabOverflow() {
//   const tabHeight = useBottomTabBarHeight();
//   const { bottom } = useSafeAreaInsets();
//   return tabHeight - bottom;
// }
