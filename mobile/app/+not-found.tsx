import { Link, Stack, useRouter, useNavigation } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function NotFoundScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 인증 상태에 따라 적절한 화면으로 리다이렉트
    const checkAuthAndRedirect = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        
        if (token) {
       // 로그인된 상태: 이전 페이지가 있으면 뒤로 가고, 없으면 fridge로 이동
       if (window.history.length > 1) {
        router.back();
      } else {
        router.replace('/(tabs)/fridge');
      }
        } else {
          // 로그인되지 않은 상태: 홈/로그인 화면으로 이동
          router.replace("/auth/login");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsChecking(false); // 오류 발생 시 화면 표시
      }
    };
    
    checkAuthAndRedirect();
  }, []);

  // 리다이렉트 중일 때는 화면 표시하지 않음
  if (isChecking) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Redirecting...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen doesn't exist.</ThemedText>
        
        <TouchableOpacity onPress={() => router.replace('/(tabs)/fridge')} style={styles.link}>
          <ThemedText type="link">Go to home screen</ThemedText>
        </TouchableOpacity>
        
        {/* <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen</ThemedText>
        </Link> */}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
