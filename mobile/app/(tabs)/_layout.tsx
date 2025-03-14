import { Tabs, router, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

// 간단한 TabBarBackground 컴포넌트
function CustomTabBarBackground() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#1c1c1c' : '#ffffff';
  
  return (
    <View 
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        borderRadius: 15,
        backgroundColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
      }}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

//   const pathname = usePathname();

//   console.log(">>>>>>>", pathname)



//      // // 유효하지 않은 경로 처리
//  useEffect(() => {
//   //   // 유효한 탭 경로 목록
//   //   const validTabPaths = ['/(tabs)/fridge', '/(tabs)/shopping', '/(tabs)/menu', '/(tabs)/settings'];
    
//   //   // 현재 경로가 유효한지 확인
//   //   const isValidPath = pathname && validTabPaths.some(path => pathname.startsWith(path));
    
//   //   // 유효하지 않은 경로면 fridge로 리디렉션
//     // if (pathname && !isValidPath ) {

//     const timeout = setTimeout(() => {
//     if (pathname === "/" ) {
//       console.log('유효하지 않은 경로 감지:', pathname);
//       router.replace('/fridge');
//     }
//   }, 100); // 100ms 대기 후 실행
//   }, [pathname, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        tabBarBackground: () => <CustomTabBarBackground />,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
        tabBarButton: (props: BottomTabBarButtonProps) => (
          <Pressable
            {...props}
            style={[
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                gap: 2
              },
              props.style,
            ]}
          />
        ),
      }}>
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'Fridge',
          tabBarIcon: ({ focused, color, size }: TabBarIconProps) => (
            <MaterialCommunityIcons 
              name={focused ? 'fridge' : 'fridge-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ focused, color, size }: TabBarIconProps) => (
            <Ionicons 
              name={focused ? 'list' : 'list-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ focused, color, size }: TabBarIconProps) => (
            <Ionicons 
              name={focused ? 'calendar' : 'calendar-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color, size }: TabBarIconProps) => (
            <Ionicons 
              name={focused ? 'settings' : 'settings-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
