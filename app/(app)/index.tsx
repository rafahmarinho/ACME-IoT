import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOrg } from '../../src/context/OrgContext';
import { useDevices } from '../../src/hooks/useDevices';
import { useAlerts } from '../../src/hooks/useAlerts';
import { useAutomations } from '../../src/hooks/useAutomations';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { DeviceCard } from '../../src/components/devices/DeviceCard';
import { Room3DViewer } from '../../src/components/3d/Room3DViewer';
import { ScenarioControlBar } from '../../src/components/simulation/ScenarioControlBar';
import { QRScannerModal } from '../../src/components/devices/QRScannerModal';
import { Device } from '../../src/types/iot';
import { colors } from '../../src/utils/colors';

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { activeOrg, rooms } = useOrg();
  const { devices, loading: devicesLoading, refreshDevices } = useDevices();
  const { alerts, activeAlerts, criticalCount, warningCount, refreshAlerts } = useAlerts();
  const { automations } = useAutomations();

  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeRoom = rooms[selectedRoomIndex] || rooms[0];
  const roomDevices = devices.filter((d) => d.roomId === activeRoom?.id);

  // KPIs
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'online').length;
  const warningDevices = devices.filter((d) => d.status === 'warning').length;
  const offlineDevices = devices.filter((d) => d.status === 'offline').length;
  const onlinePercent = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

  // Aggregate power from plugs
  const totalWatts = devices
    .filter((d) => d.type === 'smart_plug' && d.reportedState?.power)
    .reduce((sum, d) => sum + (d.reportedState?.current_watts || 0), 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDevices(), refreshAlerts()]);
    setRefreshing(false);
  };

  const isWide = width >= 900;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Simulation Scenario Control Lab */}
      <ScenarioControlBar onScenarioApplied={handleRefresh} />

      {/* KPI Cards Row */}
      <View style={styles.kpiRow}>
        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>TOTAL FLEET</Text>
            <Text style={styles.kpiIcon}>⚡</Text>
          </View>
          <Text style={styles.kpiValue}>{totalDevices}</Text>
          <View style={styles.kpiSubRow}>
            <View style={[styles.kpiDot, { backgroundColor: colors.online }]} />
            <Text style={styles.kpiSubText}>{onlinePercent}% Connected Online</Text>
          </View>
        </Card>

        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>DEVICE STATUS</Text>
            <Text style={styles.kpiIcon}>📶</Text>
          </View>
          <View style={styles.statusBreakdown}>
            <Text style={[styles.kpiValue, { fontSize: 20 }]}>
              {onlineDevices} <Text style={{ fontSize: 13, color: colors.online }}>Live</Text>
            </Text>
            <Text style={styles.kpiSubText}>
              {warningDevices} Warning • {offlineDevices} Offline
            </Text>
          </View>
        </Card>

        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>ACTIVE ALERTS</Text>
            <Text style={styles.kpiIcon}>🔔</Text>
          </View>
          <Text style={[styles.kpiValue, criticalCount > 0 ? { color: colors.danger } : {}]}>
            {activeAlerts.length}
          </Text>
          <Text style={styles.kpiSubText}>
            {criticalCount} Critical • {warningCount} Warnings
          </Text>
        </Card>

        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>POWER LOAD</Text>
            <Text style={styles.kpiIcon}>⚡</Text>
          </View>
          <Text style={styles.kpiValue}>
            {totalWatts >= 1000 ? `${(totalWatts / 1000).toFixed(2)} kW` : `${Math.round(totalWatts)} W`}
          </Text>
          <Text style={styles.kpiSubText}>
            Across {devices.filter((d) => d.type === 'smart_plug').length} Smart Plugs
          </Text>
        </Card>
      </View>

      {/* 3D Digital Twin Viewer Section */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Room Digital Twin (3D Simulator)</Text>
          <Text style={styles.sectionSubtitle}>
            Interactive spatial visualization of sensors, HVAC thermostats, and plug relays. Drag to rotate angle.
          </Text>
        </View>

        {/* Room Switcher Pills */}
        <View style={styles.roomSelectorRow}>
          {rooms.slice(0, 4).map((r, idx) => {
            const active = idx === selectedRoomIndex;
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.roomPill, active && styles.roomPillActive]}
                onPress={() => {
                  setSelectedRoomIndex(idx);
                  setSelectedDevice(null);
                }}
              >
                <Text style={[styles.roomPillText, active && styles.roomPillTextActive]}>
                  {r.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3D Canvas Box */}
      <Room3DViewer
        room={activeRoom}
        devices={roomDevices}
        selectedDeviceId={selectedDevice?.id}
        onSelectDevice={(d) => setSelectedDevice(d)}
        height={340}
      />

      {/* Quick Actions Bar */}
      <View style={styles.quickActionsRow}>
        <View style={styles.quickActionsLeft}>
          <Text style={styles.quickActionTitle}>
            Active Devices in {activeRoom?.name || 'Zone'} ({roomDevices.length})
          </Text>
        </View>
        <View style={styles.quickActionsRight}>
          <Button
            title="Enroll Device (QR / Manual)"
            size="sm"
            onPress={() => setEnrollModalVisible(true)}
          />
          <Button
            title="View All Devices"
            size="sm"
            variant="secondary"
            onPress={() => router.push('/(app)/devices')}
          />
        </View>
      </View>

      {/* Devices in Active Room Grid */}
      <View style={[styles.devicesGrid, isWide && styles.devicesGridWide]}>
        {roomDevices.map((dev) => (
          <View key={dev.id} style={[styles.deviceCol, isWide && styles.deviceColWide]}>
            <DeviceCard device={dev} roomName={activeRoom?.name} />
          </View>
        ))}
      </View>

      {/* Active Incidents & Alerts Preview */}
      {activeAlerts.length > 0 && (
        <View style={styles.alertsSection}>
          <View style={styles.alertsHeader}>
            <Text style={styles.alertsTitle}>Recent Active Incidents</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/alerts')}>
              <Text style={styles.viewAllText}>View All ({activeAlerts.length}) →</Text>
            </TouchableOpacity>
          </View>

          {activeAlerts.slice(0, 2).map((alt) => (
            <Card key={alt.id} style={styles.alertCard}>
              <View style={styles.alertRow}>
                <View style={styles.alertIconCol}>
                  <Text style={styles.alertIcon}>
                    {alt.severity === 'critical' ? '🚨' : alt.severity === 'warning' ? '⚠️' : 'ℹ️'}
                  </Text>
                </View>
                <View style={styles.alertTextCol}>
                  <View style={styles.alertTitleRow}>
                    <Text style={styles.alertItemTitle}>{alt.title}</Text>
                    <Badge
                      label={alt.severity}
                      variant={alt.severity === 'critical' ? 'critical' : 'warning'}
                      size="sm"
                    />
                  </View>
                  <Text style={styles.alertDesc}>{alt.message}</Text>
                </View>
                <Button
                  title="Inspect"
                  size="sm"
                  variant="outline"
                  onPress={() => router.push('/(app)/alerts')}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* QR Enrollment Modal */}
      <QRScannerModal
        visible={enrollModalVisible}
        onClose={() => setEnrollModalVisible(false)}
        onEnrolled={() => handleRefresh()}
        rooms={rooms}
        organizationId={activeOrg.id}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    padding: 16,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  kpiIcon: {
    fontSize: 16,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statusBreakdown: {
    marginBottom: 4,
  },
  kpiSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kpiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kpiSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roomSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roomPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  roomPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  roomPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roomPillTextActive: {
    color: colors.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
    marginBottom: 12,
  },
  quickActionsLeft: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quickActionsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  devicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  devicesGridWide: {
    marginHorizontal: -8,
  },
  deviceCol: {
    width: '100%',
    paddingHorizontal: 6,
  },
  deviceColWide: {
    width: '50%',
    paddingHorizontal: 8,
  },
  alertsSection: {
    marginTop: 24,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  alertCard: {
    padding: 12,
    marginBottom: 8,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconCol: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 18,
  },
  alertTextCol: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  alertItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  alertDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
