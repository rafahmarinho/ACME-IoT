import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal as RNModal } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrg } from '../../context/OrgContext';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { colors } from '../../utils/colors';
import { UserRole } from '../../types/iot';

export const Header: React.FC = () => {
  const router = useRouter();
  const { organizations, activeOrg, setActiveOrgId } = useOrg();
  const { user, role, switchRole } = useAuth();
  const { isEffectiveOnline, simulateOffline, setSimulateOffline } = useNetwork();

  const [orgPickerOpen, setOrgPickerOpen] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const rolesList: UserRole[] = ['owner', 'admin', 'operator', 'viewer'];

  return (
    <View style={styles.headerContainer}>
      {/* Left: Organization Switcher */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.orgDropdown}
          onPress={() => setOrgPickerOpen(true)}
        >
          <View style={styles.orgIconBox}>
            <Text style={styles.orgIconText}>🏢</Text>
          </View>
          <View>
            <Text style={styles.orgLabel}>Organization</Text>
            <View style={styles.orgNameRow}>
              <Text style={styles.orgName} numberOfLines={1}>
                {activeOrg?.name || 'Select Org'}
              </Text>
              <Text style={styles.dropdownCaret}>▾</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right: Role badge, Online/Offline pill, Profile avatar */}
      <View style={styles.rightSection}>
        {/* Connection status badge */}
        <TouchableOpacity
          style={[
            styles.statusPill,
            isEffectiveOnline ? styles.statusPillOnline : styles.statusPillOffline,
          ]}
          onPress={() => setSimulateOffline(!simulateOffline)}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isEffectiveOnline ? colors.online : colors.warning },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isEffectiveOnline ? colors.online : colors.warning },
            ]}
          >
            {isEffectiveOnline ? 'Live' : 'Offline Mode'}
          </Text>
        </TouchableOpacity>

        {/* Role Switcher Pill */}
        <TouchableOpacity
          style={styles.rolePill}
          onPress={() => setRolePickerOpen(true)}
        >
          <Text style={styles.roleLabel}>Role:</Text>
          <Text style={styles.roleValue}>{role.toUpperCase()}</Text>
          <Text style={styles.roleCaret}>▾</Text>
        </TouchableOpacity>

        {/* Profile Avatar / Settings */}
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => router.push('/(app)/profile')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>
              {user?.fullName?.slice(0, 2).toUpperCase() || 'AI'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Org Selector Modal */}
      <RNModal visible={orgPickerOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setOrgPickerOpen(false)}
        >
          <View style={styles.pickerBox}>
            <Text style={styles.pickerTitle}>Select Organization</Text>
            {organizations.map((org) => {
              const isSelected = org.id === activeOrg.id;
              return (
                <TouchableOpacity
                  key={org.id}
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                  onPress={() => {
                    setActiveOrgId(org.id);
                    setOrgPickerOpen(false);
                  }}
                >
                  <View>
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                      {org.name}
                    </Text>
                    <Text style={styles.pickerItemSub}>Plan: {org.plan} • {org.address}</Text>
                  </View>
                  {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </RNModal>

      {/* Role Switcher Modal (to test owner, admin, operator, viewer) */}
      <RNModal visible={rolePickerOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setRolePickerOpen(false)}
        >
          <View style={styles.pickerBox}>
            <Text style={styles.pickerTitle}>Switch Testing Role</Text>
            <Text style={styles.pickerSubtitle}>
              Test role-adapted navigation and permission restrictions:
            </Text>
            {rolesList.map((r) => {
              const isSelected = r === role;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                  onPress={() => {
                    switchRole(r);
                    setRolePickerOpen(false);
                  }}
                >
                  <View>
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                      {r.toUpperCase()}
                    </Text>
                    <Text style={styles.pickerItemSub}>
                      {r === 'owner' && 'Full root access: billing, team, automations & controls.'}
                      {r === 'admin' && 'Manage devices, rooms, buildings and automations.'}
                      {r === 'operator' && 'Operate switches, thermostats and acknowledge alerts.'}
                      {r === 'viewer' && 'Read-only view of telemetry, rooms and status.'}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </RNModal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 64,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  orgIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgIconText: {
    fontSize: 16,
  },
  orgLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orgNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: 240,
  },
  dropdownCaret: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  statusPillOnline: {
    backgroundColor: colors.onlineLight,
  },
  statusPillOffline: {
    backgroundColor: colors.warningLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  roleLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  roleValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  roleCaret: {
    fontSize: 10,
    color: colors.textMuted,
  },
  avatarBtn: {
    padding: 2,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pickerBox: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pickerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 8,
  },
  pickerItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickerItemTextActive: {
    color: colors.primary,
  },
  pickerItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
});
