import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { KinetixTheme } from '../constants/theme';
import ActiveWorkoutStatusBar from './ActiveWorkoutStatusBar';

interface KinetixBottomNavProps {
  activeTab?: 'today' | 'workouts' | 'active' | 'progress';
}

export default function KinetixBottomNav({ activeTab }: KinetixBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = (): 'today' | 'workouts' | 'active' | 'progress' => {
    if (activeTab) return activeTab;
    if (pathname === '/' || pathname === '/index') return 'today';
    if (pathname.includes('/plans')) return 'workouts';
    if (pathname.includes('/active-workout')) return 'active';
    if (pathname.includes('/history')) return 'progress';
    return 'today';
  };

  const current = getActiveTab();

  const tabs = [
    {
      id: 'today' as const,
      label: 'Today',
      route: '/',
      iconOutline: 'home-outline' as const,
      iconFilled: 'home' as const,
    },
    {
      id: 'workouts' as const,
      label: 'Workouts',
      route: '/plans',
      iconOutline: 'barbell-outline' as const,
      iconFilled: 'barbell' as const,
    },
    {
      id: 'active' as const,
      label: 'Active',
      route: '/active-workout',
      iconOutline: 'play-circle-outline' as const,
      iconFilled: 'play-circle' as const,
    },
    {
      id: 'progress' as const,
      label: 'Progress',
      route: '/history',
      iconOutline: 'analytics-outline' as const,
      iconFilled: 'analytics' as const,
    },
  ];

  return (
    <View style={styles.navContainer}>
      {/* Floating In-Progress Status Bar (visible across other screens when a session is active) */}
      <ActiveWorkoutStatusBar />

      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const isActive = current === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => router.replace(tab.route as any)}
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.activeTopIndicator} />}
              <Ionicons
                name={isActive ? tab.iconFilled : tab.iconOutline}
                size={22}
                color={isActive ? KinetixTheme.colors.primary : KinetixTheme.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: 'transparent',
  },
  navBar: {
    height: Platform.OS === 'ios' ? 76 : 64,
    paddingBottom: Platform.OS === 'ios' ? 18 : 6,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: KinetixTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  activeTopIndicator: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 3,
    backgroundColor: KinetixTheme.colors.primary,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: KinetixTheme.colors.primary,
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: KinetixTheme.colors.textMuted,
  },
});
