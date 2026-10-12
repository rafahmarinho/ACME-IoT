import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrg } from '../../../src/context/OrgContext';
import { useAuth } from '../../../src/context/AuthContext';
import { useNetwork } from '../../../src/context/NetworkContext';
import { dataStore, subscribeToKey } from '../../../src/services/supabase';
import { simulationService } from '../../../src/services/simulationService';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { Button } from '../../../src/components/common/Button';
import { DesiredVsReported } from '../../../src/components/devices/DesiredVsReported';
import { DeviceControls } from '../../../src/components/devices/DeviceControls';
import { Device } from '../../../src/types/iot';
import { colors } from '../../../src/utils/colors';
import { formatTimeAgo, formatDeviceTypeLabel } from '../../../src/utils/formatters';

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { rooms } = useOrg();
  const { canDeployFirmware } = useAuth();
  const { isEffectiveOnline } = useNetwork();

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [firmwareBusy, setFirmwareBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDevice();

    const unsubscribe = subscribeToKey<Device[]>('devices', (list) => {
      const match = list.find((d) => d.id === id);
      if (match) setDevice(match);
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  const loadDevice = async () => {
    setLoading(true);
    const d = await dataStore.getDeviceById(id as string);
    if (d) setDevice(d);
    setLoading(false);
  };

  const handleReconnect = async () => {
    if (!device) return;
    setReconnecting(true);
    await simulationService.reconnectDevice(device.id);
    await loadDevice();
    setReconnecting(false);
    setActionMessage('Device reconnected successfully via HTTP gateway heartbeat.');
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleStartFirmwareUpdate = async () => {
    if (!device) return;
    setFirmwareBusy(true);
    await simulationService.startFirmwareUpdate(device.id, 'v2.4.1');
    await loadDevice();
    setFirmwareBusy(false);
    setActionMessage('OTA firmware distribution started! Advance simulation tick to complete download.');
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRollbackFirmware = async () => {
    if (!device) return;
    setFirmwareBusy(true);
    await simulationService.rollbackFirmware(device.id);
    await loadDevice();
    setFirmwareBusy(false);
    setActionMessage('Firmware rolled back to stable recovery build v2.3.8.');
    setTimeout(() => setActionMessage(null), 4000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.title}>Device Not Found</Text>
        <Button title="Back to Devices" onPress={() => router.push('/devices')} />
      </View>
    );
  }

  const room = rooms.find((r) => r.id === device.roomId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Breadcrumbs */}
      <View style={styles.breadcrumbRow}>
        <TouchableOpacity onPress={() => router.push('/devices')}>
          <Text style={styles.breadcrumbLink}>Devices</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSeparator}>/</Text>
        {room && (
          <>
            <TouchableOpacity onPress={() => router.push(`/rooms/${room.id}` as any)}>
              <Text style={styles.breadcrumbLink}>{room.name}</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSeparator}>/</Text>
          </>
        )}
        <Text style={styles.breadcrumbCurrent}>{device.name}</Text>
      </View>

      {/* Main Header Info Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.titleGroup}>
            <View style={styles.deviceIconBox}>
              <Text style={styles.deviceIconText}>
                {device.type === 'thermostat'
                  ? '🌡️'
                  : device.type === 'smart_plug'
                  ? '🔌'
                  : device.type === 'temperature_sensor'
                  ? '☀️'
                  : device.type === 'humidity_sensor'
                  ? '💧'
                  : '🚶'}
              </Text>
            </View>
            <View>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceSubtitle}>
                {formatDeviceTypeLabel(device.type)} • S/N: {device.serialNumber}
              </Text>
            </View>
          </View>

          <View style={styles.headerBadges}>
            <Badge
              label={device.status}
              variant={
                device.status === 'online'
                  ? 'online'
                  : device.status === 'warning'
                  ? 'warning'
                  : device.status === 'updating'
                  ? 'updating'
                  : 'offline'
              }
            />
          </View>
        </View>

        {/* Quick actions for offline / reconnect */}
        {device.status === 'offline' && (
          <View style={styles.reconnectBanner}>
            <View style={styles.reconnectTextGroup}>
              <Text style={styles.reconnectTitle}>Device Offline</Text>
              <Text style={styles.reconnectDesc}>
                Device missed heartbeats. Cellular connection or gateway is down.
              </Text>
            </View>
            <Button
              title="Ping & Reconnect"
              size="sm"
              loading={reconnecting}
              onPress={handleReconnect}
            />
          </View>
        )}

        {actionMessage && (
          <View style={styles.actionBanner}>
            <Text style={styles.actionBannerText}>✓ {actionMessage}</Text>
          </View>
        )}
      </Card>

      {/* Desired vs Device-Reported State (Requirement) */}
      <DesiredVsReported device={device} />

      {/* Live Device Controls (Thermostats, Smart Plugs) */}
      <DeviceControls
        device={device}
        onUpdate={(updated) => setDevice(updated)}
      />

      {/* Reading Inspection & Telemetry Timeseries */}
      <Card style={styles.telemetryCard}>
        <Text style={styles.sectionTitle}>Telemetry Reading Inspection</Text>
        <Text style={styles.sectionSub}>Recent sample stream from device HTTP ingestion bridge</Text>

        <View style={styles.telemetryGrid}>
          {device.type === 'thermostat' && (
            <>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.current_temperature ?? '--'}°C
                </Text>
                <Text style={styles.telemetryLbl}>Current Measured Temperature</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.humidity ?? 45}%
                </Text>
                <Text style={styles.telemetryLbl}>Internal Humidity</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.fan?.toUpperCase() ?? 'AUTO'}
                </Text>
                <Text style={styles.telemetryLbl}>Circulation Fan</Text>
              </View>
            </>
          )}

          {device.type === 'smart_plug' && (
            <>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.current_watts ?? 0} W
                </Text>
                <Text style={styles.telemetryLbl}>Active Power Draw</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.voltage ?? 120} V
                </Text>
                <Text style={styles.telemetryLbl}>Mains Line Voltage</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.energy_kwh ?? 12.4} kWh
                </Text>
                <Text style={styles.telemetryLbl}>Lifetime Energy Consumed</Text>
              </View>
            </>
          )}

          {device.type === 'temperature_sensor' && (
            <>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.temperature ?? '--'}°C
                </Text>
                <Text style={styles.telemetryLbl}>Ambient Temp</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.min_24h ?? '--'}°C
                </Text>
                <Text style={styles.telemetryLbl}>24-Hour Low</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.max_24h ?? '--'}°C
                </Text>
                <Text style={styles.telemetryLbl}>24-Hour High</Text>
              </View>
            </>
          )}

          {device.type === 'humidity_sensor' && (
            <>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.humidity ?? '--'}%
                </Text>
                <Text style={styles.telemetryLbl}>Relative Humidity</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.dew_point ?? '--'}°C
                </Text>
                <Text style={styles.telemetryLbl}>Calculated Dew Point</Text>
              </View>
            </>
          )}

          {device.type === 'occupancy_sensor' && (
            <>
              <View style={styles.telemetryItem}>
                <Text
                  style={[
                    styles.telemetryVal,
                    { color: device.reportedState?.occupied ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {device.reportedState?.occupied ? 'Occupied' : 'Vacant'}
                </Text>
                <Text style={styles.telemetryLbl}>Real-Time Presence</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryVal}>
                  {device.reportedState?.motion_count_today ?? 0}
                </Text>
                <Text style={styles.telemetryLbl}>Motion Triggers Today</Text>
              </View>
            </>
          )}
        </View>
      </Card>

      {/* Firmware Management, OTA & Rollback Card */}
      <Card style={styles.firmwareCard}>
        <View style={styles.firmwareHeader}>
          <Text style={styles.sectionTitle}>Firmware & OTA Updates</Text>
          <Badge
            label={device.firmwareStatus.replace(/_/g, ' ')}
            variant={device.firmwareStatus === 'up_to_date' ? 'online' : 'updating'}
          />
        </View>

        <Text style={styles.firmwareVersionText}>
          Current Running Firmware: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{device.firmwareVersion}</Text>
        </Text>

        {device.targetFirmwareVersion && (
          <Text style={styles.firmwareTargetText}>
            Target Pending Version: <Text style={{ fontWeight: '700', color: colors.primary }}>{device.targetFirmwareVersion}</Text>
          </Text>
        )}

        {device.firmwareStatus === 'installing' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Flashing Microcontroller Flash ROM</Text>
              <Text style={styles.progressPercent}>{device.firmwareProgress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${device.firmwareProgress}%` }]} />
            </View>
          </View>
        )}

        {canDeployFirmware && (
          <View style={styles.firmwareActionsRow}>
            {device.firmwareStatus !== 'installing' ? (
              <Button
                title="Deploy OTA Update v2.4.1"
                size="sm"
                loading={firmwareBusy}
                onPress={handleStartFirmwareUpdate}
              />
            ) : null}

            <Button
              title="Rollback to v2.3.8"
              size="sm"
              variant="outline"
              loading={firmwareBusy}
              onPress={handleRollbackFirmware}
            />
          </View>
        )}
      </Card>

      {/* Hardware Specifications */}
      <Card style={styles.specsCard}>
        <Text style={styles.sectionTitle}>Hardware & Network Metadata</Text>
        <View style={styles.specsList}>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Enrollment Security Code</Text>
            <Text style={styles.specVal}>{device.enrollmentCode}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Signal Strength (RSSI)</Text>
            <Text style={styles.specVal}>{device.signalStrength} dBm</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Power Source</Text>
            <Text style={styles.specVal}>
              {device.batteryLevel !== null ? `Battery (${device.batteryLevel}%)` : 'Hardwired AC/DC Line'}
            </Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Last Heartbeat Timestamp</Text>
            <Text style={styles.specVal}>{formatTimeAgo(device.lastSeenAt)}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Assigned Zone</Text>
            <Text style={styles.specVal}>{room?.name || 'Unassigned'}</Text>
          </View>
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
    paddingBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundContainer: {
    padding: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  breadcrumbLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  breadcrumbSeparator: {
    fontSize: 13,
    color: colors.textMuted,
  },
  breadcrumbCurrent: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerCard: {
    padding: 20,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceIconText: {
    fontSize: 24,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  deviceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerBadges: {
    flexDirection: 'row',
  },
  reconnectBanner: {
    marginTop: 16,
    backgroundColor: colors.dangerLight,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  reconnectTextGroup: {
    flex: 1,
  },
  reconnectTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  reconnectDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  actionBanner: {
    marginTop: 12,
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: 6,
  },
  actionBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  telemetryCard: {
    padding: 18,
    marginBottom: 16,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  telemetryItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
  },
  telemetryVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  telemetryLbl: {
    fontSize: 11,
    color: colors.textMuted,
  },
  firmwareCard: {
    padding: 18,
    marginBottom: 16,
  },
  firmwareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  firmwareVersionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  firmwareTargetText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  progressContainer: {
    marginVertical: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceBorderDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  firmwareActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  specsCard: {
    padding: 18,
  },
  specsList: {
    marginTop: 12,
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  specKey: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
