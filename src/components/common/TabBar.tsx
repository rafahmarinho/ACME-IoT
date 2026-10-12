import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '../../utils/colors';

export const TabBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { label: 'Dashboard', path: '/', icon: '📊' },
    { label: 'Buildings', path: '/buildings', icon: '🏢' },
    { label: 'Devices', path: '/devices', icon: '⚡' },
    { label: 'Alerts', path: '/alerts', icon: '🔔' },
    { label: 'Scenarios', path: '/settings', icon: '🧪' },
  ];

  const isActive = (itemPath: string) => {
    if (itemPath === '/' && (pathname === '/' || pathname === '/(app)')) return true;
    return pathname.includes(itemPath) && itemPath !== '/';
  };

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tabItem}
            onPress={() => router.push(tab.path as any)}
          >
            <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabIconActive: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
