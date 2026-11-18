import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../context/TrainingContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [primaryFocus, setPrimaryFocus] = useState('Rehab Protocol');
  const [coachCode, setCoachCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        router.replace('/');
      } else {
        if (!fullName.trim()) {
          Alert.alert('Validation Error', 'Please enter your full name.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              primary_focus: primaryFocus,
              referral_code: coachCode.trim() || null,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace('/');
        } else {
          Alert.alert(
            'Account Created',
            'Your athlete account has been registered! Please check your email to verify your address.'
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Authentication Failed', error?.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'apple' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
      });
      if (error) {
        Alert.alert(
          `${provider === 'apple' ? 'Apple ID' : 'Google'} Sign In`,
          error.message || 'Please ensure OAuth is configured in your Supabase project.'
        );
      }
    } catch (e: any) {
      Alert.alert('Notice', e?.message || 'OAuth authentication is currently initializing.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Branding & Hero (Stitch Spec) */}
          <View style={styles.heroSection}>
            {/* Emblem */}
            <View style={styles.emblemContainer}>
              <Ionicons name="pulse" size={28} color="#FFFFFF" />
              <View style={styles.emblemBadge}>
                <Ionicons name="flash" size={9} color="#006C49" />
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.brandTitle}>KINETIX</Text>
            <Text style={styles.brandSubtitle}>CLINICAL PERFORMANCE & REHAB ENGINE</Text>

            {/* Value Prop */}
            <Text style={styles.valueProp}>
              Precision physical therapy synchronized with elite athletic progression.
            </Text>
          </View>

          {/* Segmented Mode Switcher (Sign In vs Create Account) */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, isLogin && styles.segmentBtnActive]}
              onPress={() => setIsLogin(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-in-outline"
                size={16}
                color={isLogin ? '#FFFFFF' : '#434655'}
              />
              <Text style={[styles.segmentText, isLogin && styles.segmentTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, !isLogin && styles.segmentBtnActive]}
              onPress={() => setIsLogin(false)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-add-outline"
                size={16}
                color={!isLogin ? '#FFFFFF' : '#434655'}
              />
              <Text style={[styles.segmentText, !isLogin && styles.segmentTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Container Card */}
          <View style={styles.formCard}>
            {isLogin ? (
              /* SIGN IN PANEL */
              <View style={styles.panelContent}>
                {/* Email Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>ATHLETE OR CLINICIAN EMAIL</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#737686" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="athlete@kinetix.io"
                      placeholderTextColor="#737686"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color="#737686" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••••••"
                      placeholderTextColor="#737686"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#737686"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Actions Row */}
                <View style={styles.quickActionsRow}>
                  <TouchableOpacity
                    style={styles.rememberRow}
                    onPress={() => setRememberDevice(!rememberDevice)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, rememberDevice && styles.checkboxActive]}>
                      {rememberDevice && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.rememberText}>Remember device</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Password Recovery',
                        'Please enter your email above and select OK to receive a password reset link.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Send Reset Link',
                            onPress: async () => {
                              if (!email) {
                                Alert.alert('Notice', 'Please enter your email address first.');
                                return;
                              }
                              const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
                              if (error) {
                                Alert.alert('Reset Failed', error.message);
                              } else {
                                Alert.alert('Check Your Inbox', 'A password reset link has been dispatched.');
                              }
                            },
                          },
                        ]
                      )
                    }
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Primary CTA Button */}
                <TouchableOpacity
                  style={styles.primaryCtaBtn}
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryCtaText}>Sign In to Athlete Portal</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* SSO Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Fast Auth SSO Options */}
                <View style={styles.ssoRow}>
                  <TouchableOpacity
                    style={styles.ssoBtn}
                    onPress={() => handleOAuthSignIn('apple')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-apple" size={17} color="#131B2E" />
                    <Text style={styles.ssoBtnText}>Apple ID</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.ssoBtn}
                    onPress={() => handleOAuthSignIn('google')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-google" size={16} color="#EA4335" />
                    <Text style={styles.ssoBtnText}>Google</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* CREATE ACCOUNT PANEL */
              <View style={styles.panelContent}>
                {/* Full Name Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color="#737686" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Marcus Vance"
                      placeholderTextColor="#737686"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Email Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#737686" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="m.vance@athlete.kinetix.io"
                      placeholderTextColor="#737686"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Password Field with Clinical Strength Gauge */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CREATE CLINICAL PASSKEY</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#737686" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••••••"
                      placeholderTextColor="#737686"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#737686"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Password Strength Gauge */}
                  <View style={styles.strengthBarRow}>
                    <View
                      style={[
                        styles.strengthSegment,
                        password.length > 0 && styles.strengthSegmentActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthSegment,
                        password.length >= 6 && styles.strengthSegmentActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthSegment,
                        password.length >= 8 && styles.strengthSegmentActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthSegment,
                        password.length >= 10 && styles.strengthSegmentActive,
                      ]}
                    />
                    <Text style={styles.strengthLabel}>
                      {password.length >= 8 ? 'Strong · HIPAA Met' : 'Min 8 chars'}
                    </Text>
                  </View>
                </View>

                {/* Primary Athletic Focus */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PRIMARY ATHLETIC FOCUS</Text>
                  <View style={styles.focusChipRow}>
                    {['Power / Speed', 'Rehab Protocol', 'Hybrid Load'].map((f) => {
                      const isSelected = primaryFocus === f;
                      return (
                        <TouchableOpacity
                          key={f}
                          style={[styles.focusChip, isSelected && styles.focusChipSelected]}
                          onPress={() => setPrimaryFocus(f)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.focusChipText,
                              isSelected && styles.focusChipTextSelected,
                            ]}
                          >
                            {f}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Referral Code Field */}
                <View style={styles.fieldGroup}>
                  <View style={styles.referralLabelRow}>
                    <Text style={styles.fieldLabel}>CLINICAL REFERRAL / PT CODE</Text>
                    <Text style={styles.optionalText}>Optional</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="ribbon-outline" size={18} color="#737686" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. APEX-REHAB-24"
                      placeholderTextColor="#737686"
                      value={coachCode}
                      onChangeText={setCoachCode}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* Submit Create Account Button */}
                <TouchableOpacity
                  style={styles.primaryCtaBtn}
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryCtaText}>Create Athlete Account</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Clinical & Security Trust Banner */}
          <View style={styles.trustBanner}>
            <Ionicons name="shield-checkmark" size={14} color="#006C49" />
            <Text style={styles.trustText}>
              256-bit Encrypted · HIPAA-Compliant Physical Therapy Telemetry
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  emblemContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#004AC6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#004AC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  emblemBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6CF8BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#131B2E',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#004AC6',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  valueProp: {
    fontSize: 13,
    color: '#434655',
    textAlign: 'center',
    maxWidth: 290,
    marginTop: 8,
    lineHeight: 18,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEDFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#004AC6',
    shadowColor: '#004AC6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#434655',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  panelContent: {
    gap: 14,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#434655',
    letterSpacing: 0.6,
  },
  referralLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionalText: {
    fontSize: 10,
    color: '#737686',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#131B2E',
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#C3C6D7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#004AC6',
    borderColor: '#004AC6',
  },
  rememberText: {
    fontSize: 12,
    color: '#434655',
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#004AC6',
  },
  primaryCtaBtn: {
    backgroundColor: '#004AC6',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: '#004AC6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAEDFF',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737686',
    letterSpacing: 0.6,
  },
  ssoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ssoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F2F3FF',
    borderRadius: 10,
    height: 42,
    borderWidth: 1,
    borderColor: '#EAEDFF',
  },
  ssoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#131B2E',
  },
  strengthBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EAEDFF',
  },
  strengthSegmentActive: {
    backgroundColor: '#006C49',
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#006C49',
    marginLeft: 4,
  },
  focusChipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  focusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EAEDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusChipSelected: {
    backgroundColor: '#006C49',
  },
  focusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#131B2E',
  },
  focusChipTextSelected: {
    color: '#FFFFFF',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 8,
  },
  trustText: {
    fontSize: 11,
    color: '#006C49',
    fontWeight: '500',
  },
});
