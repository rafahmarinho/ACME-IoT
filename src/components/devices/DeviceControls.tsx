import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Device } from '../../types/iot';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { dataStore } from '../../services/supabase';
import { colors } from '../../utils/colors';

interface DeviceControlsProps {
  device: Device;
  onUpdate?: (updated: Device) => void;
}

export const DeviceControls: React.FC<DeviceControlsProps> = ({ device, onUpdate }) => {
  const { canControlDevices, role } = useAuth();
  const { isEffectiveOnline } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isOffline = device.status === 'offline';
  const disabled = !isEffectiveOnline || !canControlDevices || isOffline;

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Thermostat Target Change
  const adjustTargetTemp = async (delta: number) => {
    if (disabled) return;
    setLoading(true);
    const currentTarget = device.desiredState?.target_temperature ?? 22.0;
    const newTarget = +(currentTarget + delta).toFixed(1);

    const updated = await dataStore.updateDevice(device.id, {
      desiredState: {
        ...device.desiredState,
        target_temperature: newTarget,
      },
    });

    if (updated) {
      await dataStore.addEvent({
        id: `ev-ctrl-${Date.now()}`,
        organizationId: device.organizationId,
        deviceId: device.id,
        category: 'control',
        message: `Target temperature changed to ${newTarget}°C`,
        payload: { target_temperature: newTarget },
        createdAt: new Date().toISOString(),
      });
      onUpdate?.(updated);
      showToast(`Target set to ${newTarget}°C`);
    }
    setLoading(false);
  };

  // Thermostat Mode Change
  const setThermostatMode = async (mode: 'cool' | 'heat' | 'eco' | 'off') => {
    if (disabled) return;
    setLoading(true);
    const updated = await dataStore.updateDevice(device.id, {
      desiredState: {
        ...device.desiredState,
        mode,
      },
    });

    if (updated) {
      await dataStore.addEvent({
        id: `ev-ctrl-${Date.now()}`,
        organizationId: device.organizationId,
        deviceId: device.id,
        category: 'control',
        message: `Thermostat mode set to ${mode.toUpperCase()}`,
        payload: { mode },
        createdAt: new Date().toISOString(),
      });
      onUpdate?.(updated);
      showToast(`Mode set to ${mode.toUpperCase()}`);
    }
    setLoading(false);
  };

  // Smart Plug Toggle
  const togglePlugPower = async () => {
    if (disabled) return;
    setLoading(true);
    const currentDesired = device.desiredState?.power ?? true;
    const newDesired = !currentDesired;

    const updated = await dataStore.updateDevice(device.id, {
      desiredState: {
        ...device.desiredState,
        power: newDesired,
      },
    });

    if (updated) {
      await dataStore.addEvent({
        id: `ev-ctrl-${Date.now()}`,
        organizationId: device.organizationId,
        deviceId: device.id,
        category: 'control',
        message: `Smart plug power switched ${newDesired ? 'ON' : 'OFF'}`,
        payload: { power: newDesired },
        createdAt: new Date().toISOString(),
      });
      onUpdate?.(updated);
      showToast(`Plug switched ${newDesired ? 'ON' : 'OFF'}`);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Live Device Controls</Text>
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {/* Warning banner if controls cannot be used */}
      {!isEffectiveOnline ? (
        <View style={styles.disabledBanner}>
          <Text style={styles.disabledBannerText}>
            🔒 Controls locked: Device commands require an active internet connection.
          </Text>
        </View>
      ) : !canControlDevices ? (
        <View style={styles.disabledBanner}>
          <Text style={styles.disabledBannerText}>
            🔒 Read-only view: Role "{role}" cannot issue hardware control commands.
          </Text>
        </View>
      ) : isOffline ? (
        <View style={styles.disabledBanner}>
          <Text style={styles.disabledBannerText}>
            ⚠️ Device is offline. Reconnect gateway before issuing commands.
          </Text>
        </View>
      ) : null}

      {/* Thermostat Controls */}
      {device.type === 'thermostat' && (
        <View style={styles.controlGroup}>
          <Text style={styles.groupLabel}>Target Temperature</Text>
          <View style={styles.tempAdjustRow}>
            <TouchableOpacity
              style={[styles.tempBtn, disabled && styles.btnDisabled]}
              onPress={() => adjustTargetTemp(-0.5)}
              disabled={disabled}
            >
              <Text style={styles.tempBtnText}>−</Text>
            </TouchableOpacity>

            <View style={styles.tempDisplay}>
              <Text style={styles.tempValue}>
                {device.desiredState?.target_temperature ?? 22.0}°C
              </Text>
              <Text style={styles.tempSub}>Desired Target</Text>
            </View>

            <TouchableOpacity
              style={[styles.tempBtn, disabled && styles.btnDisabled]}
              onPress={() => adjustTargetTemp(0.5)}
              disabled={disabled}
            >
              <Text style={styles.tempBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Mode selector */}
          <Text style={[styles.groupLabel, { marginTop: 16 }]}>Operating Mode</Text>
          <View style={styles.modeRow}>
            {(['cool', 'heat', 'eco', 'off'] as const).map((m) => {
              const active = (device.desiredState?.mode || 'cool') === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.modeBtn,
                    active && styles.modeBtnActive,
                    disabled && styles.btnDisabled,
                  ]}
                  onPress={() => setThermostatMode(m)}
                  disabled={disabled}
                >
                  <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Smart Plug Controls */}
      {device.type === 'smart_plug' && (
        <View style={styles.controlGroup}>
          <Text style={styles.groupLabel}>Relay Power State</Text>
          <View style={styles.plugRow}>
            <View>
              <Text style={styles.plugStatusText}>
                Desired: {device.desiredState?.power ? 'ON' : 'OFF'}
              </Text>
              <Text style={styles.plugMetricSub}>
                Load: {device.reportedState?.current_watts || 0} W @ {device.reportedState?.voltage || 120} V
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.powerSwitchBtn,
                device.desiredState?.power ? styles.powerSwitchOn : styles.powerSwitchOff,
                disabled && styles.btnDisabled,
              ]}
              onPress={togglePlugPower}
              disabled={disabled}
            >
              <Text style={styles.powerSwitchText}>
                {device.desiredState?.power ? 'TURN OFF' : 'TURN ON'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sensor Info Summary */}
      {(device.type === 'temperature_sensor' ||
        device.type === 'humidity_sensor' ||
        device.type === 'occupancy_sensor') && (
        <View style={styles.sensorInfoBox}>
          <Text style={styles.sensorInfoTitle}>Telemetry Node Characteristics</Text>
          <Text style={styles.sensorInfoSub}>
            Low-power wireless node transmitting telemetry via HTTP ingestion bridge. Periodic sampling active.
          </Text>
        </View>
      )}

      {feedback && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 16,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  disabledBanner: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  disabledBannerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  controlGroup: {
    paddingVertical: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tempAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: colors.surfaceSubtle,
    padding: 16,
    borderRadius: 10,
  },
  tempBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  tempBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  tempDisplay: {
    alignItems: 'center',
  },
  tempValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tempSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  plugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    padding: 16,
    borderRadius: 10,
  },
  plugStatusText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  plugMetricSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  powerSwitchBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  powerSwitchOn: {
    backgroundColor: colors.danger,
  },
  powerSwitchOff: {
    backgroundColor: colors.online,
  },
  powerSwitchText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  sensorInfoBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: 12,
    borderRadius: 8,
  },
  sensorInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sensorInfoSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  feedbackBanner: {
    marginTop: 10,
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
