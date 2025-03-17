import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, Stack, router, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { AppProvider } from "@/context/AppContext";
import { useAppContext } from "@/context/AppContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // 앱 컨텍스트에서 테마 설정 가져오기
  const { settings } = useAppContext();
  const actualTheme = settings.theme === "dark" ? "dark" : "light";

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const pathname = usePathname();
  
  // 인증이 필요한 경로 목록
  const protectedPaths = [
    "/fridge", 
    "/menu", 
    "/menu-details", 
    "/shopping",
    "/settings"
  ];
  
  // 현재 경로가 인증이 필요한지 확인
  const requiresAuth = () => {
    if (!pathname) return false;
    
    // 인증이 필요한 경로 확인
    return protectedPaths.some(path => 
      pathname.startsWith(path) || 
      pathname.includes(`(tabs)${path}`)
    );
  };
  
  useEffect(() => {
    console.log("Current path:", pathname);

    // 경로가 인증이 필요하고 인증되지 않은 상태인 경우
    if (requiresAuth() && isAuthenticated === false) {
      console.log("인증이 필요한 경로에 접근했지만 인증되지 않았습니다. 로그인 화면으로 이동합니다.");
      // useEffect 안에서 setTimeout 사용하여 Root Layout이 마운트된 후 실행
      setTimeout(() => {
        router.replace("/auth/login");
      }, 0);
    }
  }, [isAuthenticated, pathname]);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      // 토큰이 null, undefined 또는 빈 문자열인 경우 인증되지 않은 것으로 처리
      const isValid = token && typeof token === 'string' && token.trim() !== '';
      
      console.log("토큰 유효성 검사 결과:", isValid ? "유효함" : "유효하지 않음");
      setIsAuthenticated(isValid);
      
      // 인증이 필요한 경로에 있는데 유효한 토큰이 없는 경우
      if (!isValid && requiresAuth()) {
        console.log("인증이 필요한 경로에 있지만 유효한 토큰이 없습니다.");
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      
      // 오류 발생 시 인증이 필요한 경로에 있는 경우 로그인 화면으로 이동
      if (requiresAuth()) {
        router.replace("/auth/login");
      }
    }
  };

  if (!loaded || isAuthenticated === null) {
    return null;
  }

  // 로그인이 필요하면 로그인 화면으로 리디렉션
  // if (!isAuthenticated) {
  //   return <Redirect href="/auth/login" />;
  // }

  return (
    <ThemeProvider value={actualTheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={actualTheme === "dark" ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="menu-details" options={{ headerShown: false }} />
        <Stack.Screen name="item-details" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <RootLayoutNav />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
