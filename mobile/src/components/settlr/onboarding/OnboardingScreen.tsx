import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CreditCardSvg } from './CreditCardSvg';
import { DollarHeartSvg } from './DollarHeartSvg';
import { FlyingMoneyBagSvg } from './FlyingMoneyBagSvg';
import { PeaceHandSvg } from './PeaceHandSvg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH > 500 ? 440 : SCREEN_WIDTH;

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  illustration: React.ReactNode;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    title: 'SPLIT BILLS &\nSETTLE INSTANTLY',
    subtitle: 'Track shared group expenses seamlessly in ₹',
    illustration: <FlyingMoneyBagSvg />,
  },
  {
    id: '2',
    title: 'SMART EXPENSE\nTRACKING & AI',
    subtitle: 'With instant voice bot and automated splits',
    illustration: <DollarHeartSvg />,
  },
  {
    id: '3',
    title: 'ZERO-FEE WALLET\n& DIRECT TRANSFERS',
    subtitle: 'Fast P2P settlements with 0 transaction fees',
    illustration: <CreditCardSvg />,
  },
  {
    id: '4',
    title: 'SIMPLIFY GROUP\nBALANCES & CHATS',
    subtitle: '1-tap balance resolution with friends & flatmates',
    illustration: <PeaceHandSvg />,
  },
];

interface OnboardingScreenProps {
  onSignUp?: () => void;
  onLogin?: () => void;
}

export function OnboardingScreen({ onSignUp, onLogin }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 12);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(SLIDE_WIDTH);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, index));
    setCurrentIndex(clamped);
    scrollViewRef.current?.scrollTo({
      x: clamped * containerWidth,
      animated: true,
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (containerWidth > 0) {
      const page = Math.round(offsetX / containerWidth);
      if (page !== currentIndex && page >= 0 && page < SLIDES.length) {
        setCurrentIndex(page);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollToSlide(currentIndex + 1);
    } else {
      scrollToSlide(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      scrollToSlide(currentIndex - 1);
    } else {
      scrollToSlide(SLIDES.length - 1);
    }
  };

  return (
    <View style={styles.safeArea}>
      <View
        style={[styles.container, { paddingBottom: bottomInset }]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - containerWidth) > 1) {
            setContainerWidth(w);
          }
        }}>
        {/* Top Settlr Logo Pill */}
        <View style={[styles.logoWrapper, { paddingTop: topInset + 6 }]}>
          <View style={styles.cleoLogoPill}>
            <Text style={styles.cleoLogoText}>SETTLR</Text>
          </View>
        </View>

        {/* Natively Swipeable Carousel View */}
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollViewStyle}
            contentContainerStyle={{ width: containerWidth * SLIDES.length }}>
            {SLIDES.map((slide) => (
              <View
                key={slide.id}
                style={[styles.slideWrapper, { width: containerWidth }]}>
                {/* Title */}
                <Text style={styles.slideTitle}>{slide.title}</Text>

                {/* Subtitle */}
                <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>

                {/* 3D Hero Illustration */}
                <View style={styles.illustrationWrapper}>
                  {slide.illustration}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Carousel Navigation: Left Arrow • 4 Dots • Right Arrow */}
        <View style={styles.navigationRow}>
          <Pressable
            hitSlop={14}
            onPress={handlePrev}
            style={styles.arrowButton}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </Pressable>

          <View style={styles.dotsRow}>
            {SLIDES.map((_, idx) => (
              <Pressable
                key={idx}
                onPress={() => scrollToSlide(idx)}
                hitSlop={10}
                style={[
                  styles.dot,
                  idx === currentIndex ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>

          <Pressable
            hitSlop={14}
            onPress={handleNext}
            style={styles.arrowButton}>
            <Ionicons name="chevron-forward" size={24} color="#000000" />
          </Pressable>
        </View>

        {/* Bottom CTA Action Buttons */}
        <View style={styles.bottomButtonsWrapper}>
          <Pressable
            onPress={onSignUp}
            style={({ pressed }) => [
              styles.signUpButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.signUpButtonText}>CREATE NEW ACCOUNT</Text>
          </Pressable>

          <Pressable
            onPress={onLogin}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.loginButtonText}>I already have an account</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  cleoLogoPill: {
    backgroundColor: '#2738F5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#2738F5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cleoLogoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  carouselContainer: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  scrollViewStyle: {
    flex: 1,
  },
  slideWrapper: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  slideTitle: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 33,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  slideSubtitle: {
    color: '#000000',
    fontSize: 15.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  arrowButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#000000',
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  inactiveDot: {
    backgroundColor: '#E2E8F0',
  },
  bottomButtonsWrapper: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 6,
  },
  signUpButton: {
    backgroundColor: '#2738F5',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2738F5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#161A36',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#161A36',
    fontSize: 15.5,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
