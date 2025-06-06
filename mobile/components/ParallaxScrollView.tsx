import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
// import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';  // 주석 처리
import { useColorScheme } from '@/hooks/useColorScheme';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  // const scrollRef = useAnimatedRef<Animated.ScrollView>();
  // const scrollOffset = useScrollViewOffset(scrollRef);
  // const bottom = useBottomTabOverflow();  // 주석 처리
  const bottom = 0;  // 임시로 0으로 설정
  // const headerAnimatedStyle = useAnimatedStyle(() => {
  //   return {
  //     transform: [
  //       {
  //         translateY: interpolate(
  //           scrollOffset.value,
  //           [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
  //           [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
  //         ),
  //       },
  //       {
  //         scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
  //       },
  //     ],
  //   };
  // });

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        // ref={scrollRef}
        scrollEventThrottle={16}
        // scrollIndicatorInsets={{ bottom }}
        // contentContainerStyle={{ paddingBottom: bottom }}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: headerBackgroundColor[colorScheme] },
            // headerAnimatedStyle,
          ]}>
          {headerImage}
        </View>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
