import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useOrg } from '../../../src/context/OrgContext';
import { dataStore } from '../../../src/services/supabase';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { UserProfile } from '../../../src/types/iot';
import { colors } from '../../../src/utils/colors';

export default function TeamScreen() {
  const { activeOrg } = useOrg();
  const [members, setMembers] = useState<UserProfile[]>([]);

  useEffect(() => {
    loadMembers();
  }, [activeOrg.id]);

  const loadMembers = async () => {
    const data = await dataStore.getUserProfiles(activeOrg.id);
    setMembers(data);
  };

  const roleMatrix = [
    { role: 'Owner', view: '✓', control: '✓', automations: '✓', firmware: '✓', team: '✓' },
    { role: 'Administrator', view: '✓', control: '✓', automations: '✓', firmware: '✓', team: '—' },
    { role: 'Operator', view: '✓', control: '✓', automations: '—', firmware: '—', team: '—' },
    { role: 'Viewer', view: '✓', control: '—', automations: '—', firmware: '—', team: '—' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Team & Role-Based Access Control</Text>
        <Text style={styles.subtitle}>
          Authorized operators, building managers, and observers for {activeOrg.name}
        </Text>
      </View>

      {/* Members List */}
      <View style={styles.membersList}>
        {members.map((m) => (
          <Card key={m.id} style={styles.memberCard}>
            <View style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {m.fullName.slice(0, 2).toUpperCase()}
                </Text>
              </View>

              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.fullName}</Text>
                <Text style={styles.memberEmail}>{m.email}</Text>
              </View>

              <Badge
                label={m.role}
                variant={
                  m.role === 'owner'
                    ? 'critical'
                    : m.role === 'admin'
                    ? 'warning'
                    : m.role === 'operator'
                    ? 'primary'
                    : 'neutral'
                }
              />
            </View>
          </Card>
        ))}
      </View>

      {/* Role Permissions Matrix */}
      <Card style={styles.matrixCard}>
        <Text style={styles.matrixTitle}>Permissions Governance Matrix</Text>
        <Text style={styles.matrixSubtitle}>
          Enforces hardware control limitations and administrative security boundary
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.colRole]}>Role</Text>
            <Text style={styles.cell}>Telemetry</Text>
            <Text style={styles.cell}>Controls</Text>
            <Text style={styles.cell}>Automations</Text>
            <Text style={styles.cell}>OTA Firmware</Text>
            <Text style={styles.cell}>Team Mgmt</Text>
          </View>

          {roleMatrix.map((row) => (
            <View key={row.role} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colRole, styles.roleName]}>{row.role}</Text>
              <Text style={styles.cell}>{row.view}</Text>
              <Text style={styles.cell}>{row.control}</Text>
              <Text style={styles.cell}>{row.automations}</Text>
              <Text style={styles.cell}>{row.firmware}</Text>
              <Text style={styles.cell}>{row.team}</Text>
            </View>
          ))}
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
  membersList: {
    gap: 12,
    marginBottom: 24,
  },
  memberCard: {
    padding: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  matrixCard: {
    padding: 18,
  },
  matrixTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  matrixSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  tableHeader: {
    backgroundColor: colors.surfaceSubtle,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
  },
  colRole: {
    flex: 1.5,
    textAlign: 'left',
    fontWeight: '600',
  },
  roleName: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
