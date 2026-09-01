import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  bio?: string;
  referral?: string;
}

interface SignUpFlowProps {
  initialMode?: 'signup' | 'login';
  onComplete?: (data: SignUpData) => Promise<void> | void;
  onLoginSubmit?: (email: string, password?: string) => Promise<void> | void;
  onClose?: () => void;
}

const REFERRAL_SOURCES = [
  'App Store / Play Store',
  'Friend / Family Referral',
  'Hackathon / Demo',
  'Social Media (Instagram / Twitter)',
  'Search Engine',
  'Other',
];

export function SignUpFlow({
  initialMode = 'signup',
  onComplete,
  onLoginSubmit,
  onClose,
}: SignUpFlowProps) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State - Starts completely blank (no pre-entered data)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [selectedReferral, setSelectedReferral] = useState(REFERRAL_SOURCES[0]);

  // Picker State
  const [pickerOpen, setPickerOpen] = useState(false);

  const totalSteps = 5;

  const isStepValid = () => {
    if (mode === 'login') {
      return (
        email.trim().includes('@') &&
        email.trim().includes('.') &&
        password.trim().length > 0
      );
    }
    switch (currentStep) {
      case 1:
        return firstName.trim().length > 0 && lastName.trim().length > 0;
      case 2:
        return email.trim().includes('@') && email.trim().includes('.');
      case 3:
        return password.trim().length >= 8;
      case 4:
        return true; // phone & bio are optional
      case 5:
        return selectedReferral.length > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    setErrorMessage('');
    if (mode === 'login') {
      try {
        setLoading(true);
        await onLoginSubmit?.(email.trim(), password);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Login failed. Please check credentials.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      try {
        setLoading(true);
        await onComplete?.({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          bio: bio.trim() || undefined,
          referral: selectedReferral,
        });
      } catch (err: any) {
        setErrorMessage(err?.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (mode === 'login') {
      onClose?.();
      return;
    }
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onClose?.();
    }
  };

  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);

  return (
    <View style={[styles.outerContainer, { paddingTop: topInset }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.sheetContainer}>
          {/* Top Navigation Row: Back Arrow, Mode Switch & Close Button */}
          <View style={styles.topNavRow}>
            <Pressable hitSlop={14} onPress={handleBack} style={styles.navButton}>
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </Pressable>

            <View style={styles.modeSwitchRow}>
              <Pressable
                onPress={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup');
                  setErrorMessage('');
                }}>
                <Text style={styles.modeSwitchText}>
                  {mode === 'signup' ? 'Already have account? Login' : 'New to Settlr? Sign Up'}
                </Text>
              </Pressable>
            </View>

            <Pressable hitSlop={14} onPress={onClose} style={styles.navButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </Pressable>
          </View>

          {/* Segmented Progress Bar (Only in SignUp Mode) */}
          {mode === 'signup' && (
            <View style={styles.segmentedProgressRow}>
              {[1, 2, 3, 4, 5].map((step) => {
                const isFilled = step <= currentStep;
                return (
                  <View
                    key={step}
                    style={[
                      styles.progressSegment,
                      isFilled ? styles.progressSegmentFilled : styles.progressSegmentUnfilled,
                    ]}
                  />
                );
              })}
            </View>
          )}

          {errorMessage.length > 0 && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Scrollable Step Form Content */}
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <Animated.View
                key="mode-login"
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}>
                <Text style={styles.stepTitle}>WELCOME BACK</Text>
                <Text style={styles.stepSubtitle}>
                  Enter your email and password to access your Settlr wallet & balances
                </Text>

                <View style={styles.inputsGroup}>
                  <TextInput
                    placeholder="Email address"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                  />

                  {/* Password Input with Show/Hide Toggle */}
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={styles.passwordTextInput}
                    />
                    <Pressable
                      hitSlop={10}
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.eyeButton}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#64748B"
                      />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* SIGNUP MODE: Step 1 NAME */}
            {mode === 'signup' && currentStep === 1 && (
              <Animated.View
                key="step-1"
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}>
                <Text style={styles.stepTitle}>YOUR NAME</Text>
                <Text style={styles.stepSubtitle}>
                  Add your details so friends can recognize you in group splits
                </Text>

                <View style={styles.inputsGroup}>
                  <TextInput
                    placeholder="First name"
                    placeholderTextColor="#94A3B8"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.textInput}
                  />

                  <TextInput
                    placeholder="Last name"
                    placeholderTextColor="#94A3B8"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.textInput}
                  />
                </View>
              </Animated.View>
            )}

            {/* SIGNUP MODE: Step 2 EMAIL */}
            {mode === 'signup' && currentStep === 2 && (
              <Animated.View
                key="step-2"
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}>
                <Text style={styles.stepTitle}>EMAIL ADDRESS</Text>
                <Text style={styles.stepSubtitle}>
                  Used for instant balance alerts, split invites, and account security
                </Text>

                <View style={styles.inputsGroup}>
                  <TextInput
                    placeholder="e.g. yourname@example.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                </View>
              </Animated.View>
            )}

            {/* SIGNUP MODE: Step 3 PASSWORD */}
            {mode === 'signup' && currentStep === 3 && (
              <Animated.View
                key="step-3"
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}>
                <Text style={styles.stepTitle}>SECURE PASSWORD</Text>
                <Text style={styles.stepSubtitle}>
                  Create a password with at least 8 characters
                </Text>

                <View style={styles.inputsGroup}>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      placeholder="Password (minimum 8 characters)"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={styles.passwordTextInput}
                    />
                    <Pressable
                      hitSlop={10}
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.eyeButton}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#64748B"
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.helperText}>
                    {password.length < 8
                      ? `Must be at least 8 characters (${8 - password.length} more needed)`
                      : '✓ Password meets requirements'}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* SIGNUP MODE: Step 4 PHONE & BIO (OPTIONAL) */}
            {mode === 'signup' && currentStep === 4 && (
              <Animated.View
                key="step-4"
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}>
                <Text style={styles.stepTitle}>PHONE & BIO</Text>
                <Text style={styles.stepSubtitle}>
                  Optional • For quick contact lookups and your group profile
                </Text>

                <View style={styles.inputsGroup}>
                  <View style={styles.iconInputWrapper}>
                    <TextInput
                      placeholder="+91 98765 00000"
                      placeholderTextColor="#94A3B8"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      style={styles.iconTextInput}
                    />
                    <Feather name="phone" size={20} color="#0F172A" />
                  </View>

                  <TextInput
                    placeholder="Short bio (e.g. Flatmate & coffee lover ☕)"
                    placeholderTextColor="#94A3B8"
                    value={bio}
                    onChangeText={setBio}
                    maxLength={120}
                    style={styles.textInput}
                  />

                  <Text style={styles.helperText}>
                    Both fields are optional. You can update them in Settings later.
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* SIGNUP MODE: Step 5 REFERRAL / DISCOVERY */}
            {mode === 'signup' && currentStep === 5 && (
              <Animated.View
                key="step-5"
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}>
                <Text style={styles.stepTitle}>DISCOVERY</Text>
                <Text style={styles.stepSubtitle}>
                  Where did you hear about Settlr?
                </Text>

                <View style={styles.inputsGroup}>
                  <Pressable
                    onPress={() => setPickerOpen(true)}
                    style={styles.floatingDropdown}>
                    <View style={styles.floatingLabelBadge}>
                      <Text style={styles.floatingLabelText}>Source</Text>
                    </View>
                    <Text style={styles.dropdownValueText}>
                      {selectedReferral}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#000000" />
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {/* Privacy Link */}
            <Pressable style={styles.dataExplainedRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#161A36"
              />
              <Text style={styles.dataExplainedText}>Settlr Secure & Private</Text>
            </Pressable>
          </ScrollView>

          {/* Bottom Action Button */}
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 12) },
            ]}>
            <Pressable
              onPress={isStepValid() && !loading ? handleNext : undefined}
              style={[
                styles.nextButton,
                isStepValid() && !loading ? styles.nextButtonActive : styles.nextButtonDisabled,
              ]}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.nextButtonText,
                    isStepValid()
                      ? styles.nextButtonTextActive
                      : styles.nextButtonTextDisabled,
                  ]}>
                  {mode === 'login'
                    ? 'Sign In 👉'
                    : currentStep === totalSteps
                    ? 'Create Account 🎉'
                    : 'Next 👉'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Modal Picker */}
        <Modal
          visible={pickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerOpen(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setPickerOpen(false)}>
            <Animated.View
              entering={SlideInDown.duration(250)}
              exiting={SlideOutDown.duration(200)}
              style={styles.pickerModalContent}>
              <View style={styles.pickerToolbar}>
                <Text style={styles.toolbarTitle}>Select Option</Text>
                <Pressable
                  hitSlop={12}
                  onPress={() => setPickerOpen(false)}
                  style={styles.doneButton}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.pickerScrollList}>
                {REFERRAL_SOURCES.map((item) => {
                  const isSelected = selectedReferral === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setSelectedReferral(item);
                        setPickerOpen(false);
                      }}
                      style={[
                        styles.pickerItem,
                        isSelected && styles.pickerItemSelected,
                      ]}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          isSelected && styles.pickerItemTextSelected,
                        ]}>
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#2738F5',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#2738F5',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  modeSwitchRow: {
    alignItems: 'center',
  },
  modeSwitchText: {
    color: '#2738F5',
    fontSize: 13,
    fontWeight: '700',
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 26,
  },
  progressSegment: {
    flex: 1,
    height: 4.5,
    borderRadius: 3,
  },
  progressSegmentFilled: {
    backgroundColor: '#2738F5',
  },
  progressSegmentUnfilled: {
    backgroundColor: '#E0E7FF',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepTitle: {
    color: '#000000',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stepSubtitle: {
    color: '#475569',
    fontSize: 15.5,
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputsGroup: {
    gap: 16,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  passwordInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
    height: '100%',
  },
  eyeButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  helperText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 4,
  },
  floatingDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.8,
    borderColor: '#000000',
    borderRadius: 14,
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    marginTop: 10,
  },
  floatingLabelBadge: {
    position: 'absolute',
    top: -10,
    left: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
  },
  floatingLabelText: {
    color: '#000000',
    fontSize: 12.5,
    fontWeight: '700',
  },
  dropdownValueText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  dataExplainedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 24,
    paddingVertical: 8,
  },
  dataExplainedText: {
    color: '#161A36',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomBar: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  nextButton: {
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonActive: {
    backgroundColor: '#2738F5',
    shadowColor: '#2738F5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  nextButtonTextActive: {
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#E2E8F0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 280,
    paddingBottom: 20,
  },
  pickerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  doneButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doneButtonText: {
    color: '#2738F5',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerScrollList: {
    paddingVertical: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#CBD5E1',
    marginHorizontal: 16,
    borderRadius: 10,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
});
