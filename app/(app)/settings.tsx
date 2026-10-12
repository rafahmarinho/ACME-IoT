import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrg } from '../../src/context/OrgContext';
import { useNetwork } from '../../src/context/NetworkContext';
import { simulationService } from '../../src/services/simulationService';
import { isSupabaseConfigured } from '../../src/services/supabase';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { SimulationScenario } from '../../src/types/iot';
import { colors } from '../../src/utils/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { activeOrg, refreshOrgData } = useOrg();
  const { isEffectiveOnline, simulateOffline, setSimulateOffline } = useNetwork();

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const scenarios: { id: SimulationScenario; title: string; desc: string; icon: string }[] = [
    {
      id: 'normal_jitter',
      title: 'Normal Ambient Drift',
      desc: 'Simulate regular slight room temperature fluctuations (±0.2°C) and smart plug wattage jitter.',
      icon: '🍃',
    },
    {
      id: 'overheat_spike',
      title: 'HVAC Overheat Spike',
      desc: 'Spikes thermal load in Boardroom and Atrium to 27.8°C; triggers high temp alarm and cooling automations.',
      icon: '🔥',
    },
    {
      id: 'offline_wave',
      title: 'Gateway Outage (3 Devices Offline)',
      desc: 'Simulate wireless packet loss. 3 fringe devices enter offline state and trigger disconnect alerts.',
      icon: '⚠️',
    },
    {
      id: 'battery_drain',
      title: 'Battery Drain Wave',
      desc: 'Depletes charge on wireless sensors. Drops one unit below 20% to trigger low battery warnings.',
      icon: '🪫',
    },
    {
      id: 'firmware_tick',
      title: 'Advance OTA Firmware (+25%)',
      desc: 'Progresses firmware download and flash stages on devices with pending updates.',
      icon: '📦',
    },
    {
      id: 'reconnect_all',
      title: 'Reconnect All Gateways',
      desc: 'Restores all offline and warning sensors back to healthy online state and resolves disconnection alerts.',
      icon: '📶',
    },
  ];

  const handleApply = async (sc: SimulationScenario) => {
    setLoading(true);
    try {
      const res = await simulationService.applyScenario(sc);
      setStatusMsg(res.message);
      await refreshOrgData();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (e: any) {
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async () => {
    setLoading(true);
    try {
      const res = await simulationService.advanceTick();
      setStatusMsg(`Tick advanced: ${res.devicesUpdated} telemetry updates, ${res.automationsTriggered} automations triggered.`);
      await refreshOrgData();
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await simulationService.applyScenario('reset');
      setStatusMsg('All demo data reset to 2 organizations & 20 baseline devices.');
      await refreshOrgData();
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Scenarios Lab & Platform Settings</Text>
        <Text style={styles.subtitle}>
          Interactive testbed to trigger thermal spikes, network drops, OTA updates, and data resets
        </Text>
      </View>

      {statusMsg && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>✓ {statusMsg}</Text>
        </View>
      )}

      {/* Global Simulation Actions Card */}
      <Card style={styles.actionCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Simulation Engine Execution</Text>
            <Text style={styles.cardSub}>Step forward the environmental physics engine</Text>
          </View>
          <View style={styles.actionsBtnRow}>
            <Button
              title="⚡ Advance Simulation Tick"
              loading={loading}
              onPress={handleAdvance}
            />
            <Button
              title="📜 Inspect Events"
              variant="outline"
              onPress={() => router.push('/events')}
            />
            <Button
              title="↺ Reset Demo Data"
              variant="danger"
              loading={loading}
              onPress={handleReset}
            />
          </View>
        </View>
      </Card>

      {/* Scenarios Grid */}
      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>
        Preconfigured Demo Scenarios
      </Text>
      <View style={styles.scenariosGrid}>
        {scenarios.map((sc) => (
          <Card key={sc.id} style={styles.scenarioCard}>
            <View style={styles.scenarioTop}>
              <Text style={styles.scenarioIcon}>{sc.icon}</Text>
              <Text style={styles.scenarioTitle}>{sc.title}</Text>
            </View>
            <Text style={styles.scenarioDesc}>{sc.desc}</Text>
            <Button
              title={`Trigger ${sc.title}`}
              size="sm"
              variant="secondary"
              loading={loading}
              onPress={() => handleApply(sc.id)}
              style={{ marginTop: 12 }}
            />
          </Card>
        ))}
      </View>

      {/* Network & Offline Simulation Card */}
      <Card style={[styles.actionCard, { marginTop: 24 }]}>
        <Text style={styles.cardTitle}>Network State & Offline Mode</Text>
        <Text style={styles.cardSub}>
          Simulate losing Wi-Fi / cellular connectivity. Tests offline read-only cached view.
        </Text>

        <View style={styles.offlineRow}>
          <View>
            <Text style={styles.offlineStatus}>
              Current Mode: <Text style={{ fontWeight: '700', color: isEffectiveOnline ? colors.online : colors.warning }}>
                {isEffectiveOnline ? 'Live Connection Active' : 'Offline Cached View (Read-Only)'}
              </Text>
            </Text>
            <Text style={styles.offlineHelp}>
              When offline, real-time updates pause and control actions are safely locked.
            </Text>
          </View>

          <Button
            title={simulateOffline ? 'Disable Simulation (Go Online)' : 'Simulate Offline Mode'}
            variant={simulateOffline ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setSimulateOffline(!simulateOffline)}
          />
        </View>
      </Card>

      {/* Supabase Connection Metadata Card */}
      <Card style={[styles.actionCard, { marginTop: 16 }]}>
        <View style={styles.supabaseHeader}>
          <Text style={styles.cardTitle}>Supabase Cloud Backend Status</Text>
          <Badge
            label={isSupabaseConfigured ? 'Supabase Connected' : 'Local Fallback Engine (Demo)'}
            variant={isSupabaseConfigured ? 'online' : 'info'}
          />
        </View>
        <Text style={styles.cardSub}>
          Shared backend project for Web, iOS, Android, and Vercel serverless functions
        </Text>

        <View style={styles.supabaseInfoBox}>
          <Text style={styles.infoRowText}>
            • Target: <Text style={{ fontWeight: '600' }}>PostgreSQL 15 + RLS + Realtime Publication</Text>
          </Text>
          <Text style={styles.infoRowText}>
            • Database Schema: <Text style={{ fontWeight: '600' }}>supabase/schema.sql (12 tables + RLS)</Text>
          </Text>
          <Text style={styles.infoRowText}>
            • Seed Data: <Text style={{ fontWeight: '600' }}>supabase/seed.sql (2 Organizations, 20 Devices)</Text>
          </Text>
          <Text style={styles.infoRowText}>
            • Storage & Caching: <Text style={{ fontWeight: '600' }}>AsyncStorage Persistent Cache Active</Text>
          </Text>
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
  statusBanner: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  actionCard: {
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsBtnRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scenariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scenarioCard: {
    flex: 1,
    minWidth: 260,
    padding: 16,
  },
  scenarioTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scenarioIcon: {
    fontSize: 20,
  },
  scenarioTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scenarioDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  offlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    flexWrap: 'wrap',
    gap: 12,
  },
  offlineStatus: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  offlineHelp: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  supabaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  supabaseInfoBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 6,
  },
  infoRowText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
