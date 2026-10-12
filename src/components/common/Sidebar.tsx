import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../utils/colors';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuth();

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: '📊' },
    { label: 'Buildings & Rooms', path: '/buildings', icon: '🏢' },
    { label: 'Device Inventory', path: '/devices', icon: '⚡' },
    { label: 'Automations', path: '/automations', icon: '⚙️' },
    { label: 'Alerts & Incidents', path: '/alerts', icon: '🔔' },
    { label: 'Event Stream', path: '/events', icon: '📜' },
    { label: 'Firmware & OTA', path: '/firmware', icon: '📦', roles: ['owner', 'admin'] },
    { label: 'Integrations', path: '/integrations', icon: '🔌', roles: ['owner', 'admin'] },
    { label: 'Team & Roles', path: '/team', icon: '👥', roles: ['owner'] },
    { label: 'Scenarios & Controls', path: '/settings', icon: '🧪' },
  ];

  const filteredNav = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  const isActive = (itemPath: string) => {
    if (itemPath === '/' && (pathname === '/' || pathname === '/(app)')) return true;
    return pathname.includes(itemPath) && itemPath !== '/';
  };

  return (
    <View style={styles.sidebar}>
      {/* Brand Logo & Name */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>⚡</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>ACME IoT</Text>
          <Text style={styles.brandSubtitle}>Industrial Cloud Core</Text>
        </View>
      </View>

      {/* Navigation List */}
      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>PLATFORM</Text>
        {filteredNav.map((item) => {
          const active = isActive(item.path);
          return (
            <TouchableOpacity
              key={item.path}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.path as any)}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
              {active && <View style={styles.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer / System Status */}
      <View style={styles.footer}>
        <View style={styles.systemStatusRow}>
          <View style={styles.onlinePing} />
          <Text style={styles.systemStatusText}>Telemetry Mesh Active</Text>
        </View>
        <Text style={styles.versionText}>v1.0.4 • 20 Devices Synced</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.surfaceBorder,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  brandContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeText: {
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  navScroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: colors.primaryLight,
  },
  navIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeBar: {
    position: 'absolute',
    right: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceSubtle,
  },
  systemStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlinePing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.online,
  },
  systemStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  versionText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
