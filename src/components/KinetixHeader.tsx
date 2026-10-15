import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KinetixTheme } from '../constants/theme';

interface KinetixHeaderProps {
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onNotificationsPress?: () => void;
  showBack?: boolean;
}

export default function KinetixHeader({
  subtitle = 'ATHLETIC LAB',
  iconName = 'barbell',
  onNotificationsPress,
  showBack = false,
}: KinetixHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={KinetixTheme.colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBox}>
            <Ionicons name={iconName} size={20} color={KinetixTheme.colors.primary} />
          </View>
        )}

        <View style={styles.titleCol}>
          <Text style={styles.brandTitle}>KINETIX</Text>
          <Text style={styles.brandSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={onNotificationsPress || (() => router.push('/settings'))}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={21} color={KinetixTheme.colors.textMuted} />
          <View style={styles.notifDot} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: KinetixTheme.colors.border,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: KinetixTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KinetixTheme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: KinetixTheme.colors.text,
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KinetixTheme.colors.surfaceContainerLow,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: KinetixTheme.colors.primary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#EFF6FF',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});
