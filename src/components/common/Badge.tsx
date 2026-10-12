import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

interface BadgeProps {
  label: string;
  variant?: 'online' | 'offline' | 'warning' | 'updating' | 'critical' | 'info' | 'primary' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'md' }) => {
  const getColors = () => {
    switch (variant) {
      case 'online':
        return { bg: colors.onlineLight, text: colors.online };
      case 'offline':
        return { bg: colors.offlineLight, text: colors.offline };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'updating':
        return { bg: colors.updatingLight, text: colors.primary };
      case 'critical':
        return { bg: colors.dangerLight, text: colors.danger };
      case 'info':
        return { bg: '#EFF6FF', text: '#2563EB' };
      case 'primary':
        return { bg: colors.primaryLight, text: colors.primary };
      case 'neutral':
      default:
        return { bg: colors.surfaceSubtle, text: colors.textSecondary };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.badgeText, { color: c.text }, size === 'sm' && styles.badgeTextSm]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  badgeTextSm: {
    fontSize: 10,
  },
});
