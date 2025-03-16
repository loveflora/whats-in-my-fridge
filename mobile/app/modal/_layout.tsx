import { Stack } from 'expo-router';
import React from 'react';

export default function ModalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name="index" /> */}
      {/* <Stack.Screen name="addItem" /> */}
      {/* <Stack.Screen name="addMenu" /> */}
    </Stack>
  );
}
