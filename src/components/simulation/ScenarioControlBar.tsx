import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { simulationService } from '../../services/simulationService';
import { SimulationScenario } from '../../types/iot';
import { colors } from '../../utils/colors';

interface ScenarioControlBarProps {
  onScenarioApplied?: () => void;
}

export const ScenarioControlBar: React.FC<ScenarioControlBarProps> = ({ onScenarioApplied }) => {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>('normal_jitter');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const scenarios: { id: SimulationScenario; label: string; icon: string }[] = [
    { id: 'normal_jitter', label: 'Normal Ambient Drift', icon: '🍃' },
    { id: 'overheat_spike', label: 'HVAC Overheat Spike', icon: '🔥' },
    { id: 'offline_wave', label: 'Gateway Outage (3 Offline)', icon: '⚠️' },
    { id: 'battery_drain', label: 'Battery Drain Wave', icon: '🪫' },
    { id: 'firmware_tick', label: 'Advance OTA Firmware (+25%)', icon: '📦' },
    { id: 'reconnect_all', label: 'Reconnect All Gateways', icon: '📶' },
  ];

  const handleApplyScenario = async (sc: SimulationScenario) => {
    setLoading(true);
    setSelectedScenario(sc);
    try {
      const res = await simulationService.applyScenario(sc);
      setStatusMessage(res.message);
      onScenarioApplied?.();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceTick = async () => {
    setLoading(true);
    try {
      const res = await simulationService.advanceTick();
      setStatusMessage(
        `Tick advanced: ${res.devicesUpdated} telemetry updates, ${res.automationsTriggered} automations evaluated.`
      );
      onScenarioApplied?.();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    setLoading(true);
    try {
      const res = await simulationService.applyScenario('reset');
      setStatusMessage(res.message);
      onScenarioApplied?.();
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.titleIcon}>🧪</Text>
          <View>
            <Text style={styles.title}>Interactive Simulation & Scenarios Lab</Text>
            <Text style={styles.subtitle}>
              Test shadow states, disconnects, weak batteries, and automation loops live.
            </Text>
          </View>
        </View>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={styles.advanceBtn}
            onPress={handleAdvanceTick}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.advanceIcon}>⚡</Text>
                <Text style={styles.advanceText}>Advance Tick</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => router.push('/(app)/events')}
          >
            <Text style={styles.inspectText}>📜 Inspect Events</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetData}
            disabled={loading}
          >
            <Text style={styles.resetText}>↺ Reset Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scenario Presets Pill Row */}
      <View style={styles.scenariosRow}>
        {scenarios.map((sc) => {
          const isActive = selectedScenario === sc.id;
          return (
            <TouchableOpacity
              key={sc.id}
              style={[styles.scenarioPill, isActive && styles.scenarioPillActive]}
              onPress={() => handleApplyScenario(sc.id)}
              disabled={loading}
            >
              <Text style={styles.scenarioIcon}>{sc.icon}</Text>
              <Text style={[styles.scenarioLabel, isActive && styles.scenarioLabelActive]}>
                {sc.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feedback status banner */}
      {statusMessage && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>✓ {statusMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 260,
  },
  titleIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  advanceIcon: {
    fontSize: 14,
  },
  advanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inspectBtn: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inspectText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  resetBtn: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  scenariosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  scenarioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scenarioPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  scenarioIcon: {
    fontSize: 13,
  },
  scenarioLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scenarioLabelActive: {
    color: colors.primary,
  },
  statusBanner: {
    marginTop: 10,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
