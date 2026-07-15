import { useEffect, type ReactNode } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Pressable,
  DimensionValue,
} from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  sheetStyle?: Record<string, unknown>;
  maxHeight?: DimensionValue;
}

const DISMISS_THRESHOLD = 120;
const SPRING_CONFIG = { damping: 28, stiffness: 320, mass: 0.8 };

export function SwipeableSheet({
  visible,
  onClose,
  children,
  sheetStyle,
  maxHeight = '92%',
}: Props) {
  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      backdropOpacity.value = withTiming(0.4, { duration: 220, easing: Easing.out(Easing.ease) });
    }
  }, [visible, translateY, backdropOpacity]);

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((e) => {
      'worklet';
      translateY.value = Math.max(0, e.translationY);
      backdropOpacity.value = interpolate(
        translateY.value,
        [0, 300],
        [0.4, 0],
        Extrapolation.CLAMP,
      );
    })
    .onEnd((e) => {
      'worklet';
      if (translateY.value > DISMISS_THRESHOLD || e.velocityY > 800) {
        translateY.value = withTiming(600, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
        backdropOpacity.value = withTiming(0.4, { duration: 180 });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleBackdropPress = () => {
    translateY.value = withTiming(600, { duration: 200 });
    backdropOpacity.value = withTiming(0, { duration: 200 });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
        <View style={StyleSheet.absoluteFillObject}>
          <Animated.View
            style={[styles.backdrop, animatedBackdropStyle]}
          />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleBackdropPress} />
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[styles.sheet, { maxHeight }, sheetStyle, animatedSheetStyle]}
            >
              {children}
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
