import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useOrg } from '../../src/context/OrgContext';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { colors } from '../../src/utils/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, role, switchRole, logout } = useAuth();
  const { activeOrg } = useOrg();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Operator Profile</Text>
        <Text style={styles.subtitle}>Current session credentials and security authorization</Text>
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.slice(0, 2).toUpperCase() || 'OP'}
            </Text>
          </View>

          <View style={styles.profileMeta}>
            <Text style={styles.fullName}>{user?.fullName || 'Active Operator'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              <Badge label={`Role: ${role.toUpperCase()}`} variant="primary" />
              <Badge label={activeOrg.plan} variant="neutral" />
            </View>
          </View>
        </View>

        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Active Organization</Text>
            <Text style={styles.infoVal}>{activeOrg.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Organization Slug</Text>
            <Text style={styles.infoVal}>{activeOrg.slug}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Session Authentication</Text>
            <Text style={styles.infoVal}>Supabase Auth / Local JWT</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>User Identifier (UUID)</Text>
            <Text style={styles.infoVal}>{user?.id}</Text>
          </View>
        </View>

        <Text style={styles.switchRoleTitle}>Switch Active Testing Role:</Text>
        <View style={styles.rolePickerRow}>
          {(['owner', 'admin', 'operator', 'viewer'] as const).map((r) => {
            const active = role === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.rolePickBtn, active && styles.rolePickBtnActive]}
                onPress={() => switchRole(r)}
              >
                <Text style={[styles.rolePickText, active && styles.rolePickTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.logoutRow}>
          <Button
            title="Sign Out of Session"
            variant="danger"
            onPress={handleLogout}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileCard: {
    padding: 24,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    paddingBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  infoList: {
    gap: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  infoKey: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchRoleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 6,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  rolePickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  rolePickBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rolePickText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  rolePickTextActive: {
    color: colors.primary,
  },
  logoutRow: {
    alignItems: 'flex-start',
  },
});
