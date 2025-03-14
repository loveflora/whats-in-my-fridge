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
  
  useEffect(() => {
    console.log("Current path:", pathname);

    if (isAuthenticated === false) {
      // ✅ useEffect 안에서 setTimeout 사용하여 Root Layout이 마운트된 후 실행
      setTimeout(() => {
        router.replace("/auth/login");
      }, 0);
    }
  }, [isAuthenticated, pathname]);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
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
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}
