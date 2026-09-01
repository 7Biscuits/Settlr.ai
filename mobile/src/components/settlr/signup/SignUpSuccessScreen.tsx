import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SuccessPartyHorns } from './SuccessPartyHorns';

interface SignUpSuccessScreenProps {
  onNext?: () => void;
}

export function SignUpSuccessScreen({ onNext }: SignUpSuccessScreenProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Background Bursting Horns & Golden Coins */}
        <SuccessPartyHorns />

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <Animated.View entering={FadeInUp.duration(350).springify()}>
            <Text style={styles.heroTitle}>
              THAT{'\n'}TOTALLY{'\n'}WORKED
            </Text>
            <Text style={styles.heroSubtitle}>
              Your Settlr wallet is live and ready for splits ✨
            </Text>
          </Animated.View>
        </View>

        {/* Bottom CTA Action Button */}
        <Animated.View
          entering={FadeIn.delay(200).duration(300)}
          style={[styles.bottomBar, { paddingBottom: Math.max(16, 24) }]}>
          <Pressable
            onPress={onNext}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.nextButtonText}>Enter Dashboard 👉</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D4F6DC',
  },
  container: {
    flex: 1,
    backgroundColor: '#D4F6DC',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 6,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 4,
    zIndex: 10,
  },
  heroTitle: {
    color: '#064E3B',
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 56,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    color: '#047857',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    lineHeight: 24,
  },
  bottomBar: {
    paddingTop: 12,
    paddingBottom: 4,
    zIndex: 20,
  },
  nextButton: {
    backgroundColor: '#2738F5',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2738F5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  homeIndicatorWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
});
