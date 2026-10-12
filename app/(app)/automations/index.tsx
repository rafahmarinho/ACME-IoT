import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useAutomations } from '../../../src/hooks/useAutomations';
import { useDevices } from '../../../src/hooks/useDevices';
import { useOrg } from '../../../src/context/OrgContext';
import { useAuth } from '../../../src/context/AuthContext';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { Button } from '../../../src/components/common/Button';
import { Modal } from '../../../src/components/common/Modal';
import { Input } from '../../../src/components/common/Input';
import { Automation, ConditionType, ActionType } from '../../../src/types/iot';
import { dataStore } from '../../../src/services/supabase';
import { colors } from '../../../src/utils/colors';
import { formatTimeAgo } from '../../../src/utils/formatters';

export default function AutomationsScreen() {
  const { automations, toggleAutomationActive, refreshAutomations } = useAutomations();
  const { devices } = useDevices();
  const { activeOrg } = useOrg();
  const { canManageAutomations } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conditionType, setConditionType] = useState<ConditionType>('temperature_above');
  const [conditionValue, setConditionValue] = useState('24.0');
  const [actionType, setActionType] = useState<ActionType>('set_temperature');
  const [intervalMinutes, setIntervalMinutes] = useState('15');
  const [selectedTriggerDevId, setSelectedTriggerDevId] = useState(devices[0]?.id || '');
  const [selectedActionDevId, setSelectedActionDevId] = useState(devices[1]?.id || '');

  const handleCreate = async () => {
    if (!name || !conditionValue) return;

    const newAuto: Automation = {
      id: `c-${Date.now()}`,
      organizationId: activeOrg.id,
      name,
      description,
      isActive: true,
      triggerDeviceId: selectedTriggerDevId || devices[0]?.id,
      conditionType,
      conditionValue: parseFloat(conditionValue) || 24.0,
      actionDeviceId: actionType === 'send_alert' ? undefined : selectedActionDevId || devices[1]?.id,
      actionType,
      actionPayload:
        actionType === 'set_temperature'
          ? { target_temperature: 21.0, mode: 'cool' }
          : actionType === 'toggle_power'
          ? { power: false }
          : { severity: 'warning', title: `Automation: ${name}`, message: `Trigger condition exceeded` },
      intervalMinutes: parseInt(intervalMinutes, 10) || 15,
      lastTriggeredAt: null,
      createdAt: new Date().toISOString(),
    };

    await dataStore.saveAutomation(newAuto);
    await refreshAutomations();
    setModalVisible(false);
    setName('');
    setDescription('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Condition & Action Automations</Text>
          <Text style={styles.subtitle}>
            Autonomous edge rules with cooldown intervals and notification alerts
          </Text>
        </View>
        {canManageAutomations && (
          <Button
            title="+ New Automation Rule"
            onPress={() => setModalVisible(true)}
          />
        )}
      </View>

      {/* Rules List */}
      <View style={styles.rulesList}>
        {automations.map((auto) => {
          const triggerDev = devices.find((d) => d.id === auto.triggerDeviceId);
          const actionDev = devices.find((d) => d.id === auto.actionDeviceId);

          return (
            <Card key={auto.id} style={styles.ruleCard}>
              <View style={styles.ruleTop}>
                <View style={styles.ruleTitleGroup}>
                  <Text style={styles.ruleIcon}>⚙️</Text>
                  <View>
                    <Text style={styles.ruleName}>{auto.name}</Text>
                    <Text style={styles.ruleDesc}>{auto.description || 'Autonomous loop'}</Text>
                  </View>
                </View>

                <View style={styles.switchWrapper}>
                  <Text style={[styles.switchStatus, auto.isActive ? styles.statusActive : styles.statusInactive]}>
                    {auto.isActive ? 'ACTIVE' : 'PAUSED'}
                  </Text>
                  <Switch
                    value={auto.isActive}
                    onValueChange={() => toggleAutomationActive(auto.id)}
                    trackColor={{ false: colors.surfaceBorder, true: colors.primaryLight }}
                    thumbColor={auto.isActive ? colors.primary : colors.surfaceBorderDark}
                    disabled={!canManageAutomations}
                  />
                </View>
              </View>

              {/* Logic Flow Box */}
              <View style={styles.logicBox}>
                <View style={styles.conditionCol}>
                  <Text style={styles.logicLabel}>IF TRIGGER</Text>
                  <Text style={styles.logicValue}>
                    {triggerDev?.name || 'Sensor'} {auto.conditionType.replace(/_/g, ' ')} {auto.conditionValue}
                  </Text>
                </View>

                <Text style={styles.logicArrow}>➔</Text>

                <View style={styles.actionCol}>
                  <Text style={styles.logicLabel}>THEN ACTION</Text>
                  <Text style={styles.logicValue}>
                    {auto.actionType.replace(/_/g, ' ').toUpperCase()}{' '}
                    {actionDev ? `on ${actionDev.name}` : '(Dispatch Notification Alert)'}
                  </Text>
                </View>
              </View>

              {/* Cooldown & Last Execution Row */}
              <View style={styles.footerRow}>
                <View style={styles.cooldownPill}>
                  <Text style={styles.cooldownText}>
                    ⏱️ Interval Between Runs: {auto.intervalMinutes}m
                  </Text>
                </View>
                <Text style={styles.lastTriggerText}>
                  Last run: {formatTimeAgo(auto.lastTriggeredAt)}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Create Automation Modal */}
      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="Create Automation Rule">
        <Input
          label="Rule Friendly Name"
          placeholder="e.g. Server Room Thermal Protection"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Description / Purpose"
          placeholder="e.g. Dispatches emergency cooling when temperature exceeds 23C"
          value={description}
          onChangeText={setDescription}
        />

        {/* Condition Type */}
        <Text style={styles.fieldLabel}>Trigger Condition</Text>
        <View style={styles.conditionTypesGrid}>
          {(
            [
              ['temperature_above', 'Temp > Threshold'],
              ['temperature_below', 'Temp < Threshold'],
              ['occupancy_true', 'Occupancy Detected'],
              ['occupancy_false', 'Room Vacant'],
              ['power_above', 'Power Watts > Limit'],
            ] as const
          ).map(([ct, lbl]) => {
            const active = conditionType === ct;
            return (
              <TouchableOpacity
                key={ct}
                style={[styles.typePill, active && styles.typePillActive]}
                onPress={() => setConditionType(ct)}
              >
                <Text style={[styles.typePillText, active && styles.typePillTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Threshold Value (deg C / Watts)"
          placeholder="24.0"
          keyboardType="numeric"
          value={conditionValue}
          onChangeText={setConditionValue}
        />

        {/* Action Type */}
        <Text style={styles.fieldLabel}>Resulting Action</Text>
        <View style={styles.conditionTypesGrid}>
          {(
            [
              ['set_temperature', 'Set Thermostat Target'],
              ['toggle_power', 'Toggle Smart Plug Power'],
              ['send_alert', 'Generate Alert Notification'],
            ] as const
          ).map(([at, lbl]) => {
            const active = actionType === at;
            return (
              <TouchableOpacity
                key={at}
                style={[styles.typePill, active && styles.typePillActive]}
                onPress={() => setActionType(at)}
              >
                <Text style={[styles.typePillText, active && styles.typePillTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Minimum Interval Between Runs (Minutes)"
          placeholder="15"
          keyboardType="numeric"
          value={intervalMinutes}
          onChangeText={setIntervalMinutes}
        />

        <View style={styles.btnRow}>
          <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
          <Button title="Save Automation Rule" onPress={handleCreate} style={{ flex: 2 }} />
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
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
  rulesList: {
    gap: 16,
  },
  ruleCard: {
    padding: 18,
  },
  ruleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  ruleTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ruleIcon: {
    fontSize: 24,
  },
  ruleName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ruleDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchStatus: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusActive: {
    color: colors.primary,
  },
  statusInactive: {
    color: colors.textMuted,
  },
  logicBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  conditionCol: {
    flex: 1,
  },
  actionCol: {
    flex: 1,
  },
  logicLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  logicValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  logicArrow: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: 8,
  },
  cooldownPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cooldownText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  lastTriggerText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 6,
  },
  conditionTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typePill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typePillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typePillTextActive: {
    color: colors.primary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
});
