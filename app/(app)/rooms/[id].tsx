import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrg } from '../../../src/context/OrgContext';
import { useDevices } from '../../../src/hooks/useDevices';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { Button } from '../../../src/components/common/Button';
import { DeviceCard } from '../../../src/components/devices/DeviceCard';
import { Room3DViewer } from '../../../src/components/3d/Room3DViewer';
import { QRScannerModal } from '../../../src/components/devices/QRScannerModal';
import { colors } from '../../../src/utils/colors';

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { rooms, buildings, activeOrg } = useOrg();
  const { devices, refreshDevices } = useDevices(id);

  const [enrollModalVisible, setEnrollModalVisible] = useState(false);

  const room = rooms.find((r) => r.id === id) || rooms[0];
  const building = buildings.find((b) => b.id === room?.buildingId);

  // Environmental telemetry aggregation
  const thermostat = devices.find((d) => d.type === 'thermostat');
  const tempSensor = devices.find((d) => d.type === 'temperature_sensor');
  const humiditySensor = devices.find((d) => d.type === 'humidity_sensor');
  const occupancySensor = devices.find((d) => d.type === 'occupancy_sensor');

  const currentTemp =
    thermostat?.reportedState?.current_temperature ??
    tempSensor?.reportedState?.temperature ??
    room?.targetTemp;

  const currentHumidity =
    humiditySensor?.reportedState?.humidity ?? room?.targetHumidity;

  const isOccupied = occupancySensor?.reportedState?.occupied;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Breadcrumbs */}
      <View style={styles.breadcrumbRow}>
        <TouchableOpacity onPress={() => router.push('/buildings')}>
          <Text style={styles.breadcrumbLink}>Buildings</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSeparator}>/</Text>
        <TouchableOpacity onPress={() => router.push(`/buildings/${building?.id}` as any)}>
          <Text style={styles.breadcrumbLink}>{building?.name || 'Building'}</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSeparator}>/</Text>
        <Text style={styles.breadcrumbCurrent}>{room?.name}</Text>
      </View>

      {/* Room Overview Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roomTitle}>{room?.name}</Text>
          <Text style={styles.roomSubtitle}>
            Floor {room?.floor} • Zone Type: {room?.roomType?.replace('_', ' ')}
          </Text>
        </View>
        <Button
          title="Enroll Device"
          size="sm"
          onPress={() => setEnrollModalVisible(true)}
        />
      </View>

      {/* Environment Indicators Bar */}
      <View style={styles.envMetricsRow}>
        <Card style={styles.envCard}>
          <Text style={styles.envLabel}>TEMPERATURE</Text>
          <Text style={styles.envValue}>{currentTemp}°C</Text>
          <Text style={styles.envTarget}>Target: {room?.targetTemp}°C</Text>
        </Card>

        <Card style={styles.envCard}>
          <Text style={styles.envLabel}>HUMIDITY</Text>
          <Text style={styles.envValue}>{currentHumidity}%</Text>
          <Text style={styles.envTarget}>Target: {room?.targetHumidity}%</Text>
        </Card>

        <Card style={styles.envCard}>
          <Text style={styles.envLabel}>OCCUPANCY</Text>
          <Text
            style={[
              styles.envValue,
              { color: isOccupied ? colors.primary : colors.textSecondary },
            ]}
          >
            {isOccupied ? 'Occupied' : 'Vacant'}
          </Text>
          <Text style={styles.envTarget}>
            {occupancySensor?.reportedState?.motion_count_today ?? 0} detections today
          </Text>
        </Card>
      </View>

      {/* 3D Room Twin Section */}
      <View style={styles.twinHeader}>
        <Text style={styles.sectionTitle}>3D Digital Twin Simulation</Text>
        <Text style={styles.sectionSubtitle}>
          Interactive spatial view of {room?.name}. Devices placed at actual coordinates.
        </Text>
      </View>

      <Room3DViewer
        room={room}
        devices={devices}
        height={320}
      />

      {/* Devices in Room */}
      <View style={styles.devicesHeader}>
        <Text style={styles.sectionTitle}>Room Devices & Nodes ({devices.length})</Text>
        <Badge
          label={`${devices.filter((d) => d.status === 'online').length} Online`}
          variant="online"
        />
      </View>

      <View style={styles.devicesGrid}>
        {devices.map((dev) => (
          <DeviceCard key={dev.id} device={dev} roomName={room?.name} />
        ))}
      </View>

      <QRScannerModal
        visible={enrollModalVisible}
        onClose={() => setEnrollModalVisible(false)}
        onEnrolled={() => refreshDevices()}
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  roomSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  envMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  envCard: {
    flex: 1,
    padding: 14,
  },
  envLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  envValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  envTarget: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  twinHeader: {
    marginBottom: 10,
  },
  devicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
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
  devicesGrid: {
    marginTop: 4,
  },
});
