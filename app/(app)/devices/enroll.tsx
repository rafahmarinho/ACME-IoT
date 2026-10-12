import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrg } from '../../../src/context/OrgContext';
import { useDevices } from '../../../src/hooks/useDevices';
import { Card } from '../../../src/components/common/Card';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { Device, DeviceType } from '../../../src/types/iot';
import { dataStore } from '../../../src/services/supabase';
import { colors } from '../../../src/utils/colors';

export default function EnrollDeviceScreen() {
  const router = useRouter();
  const { rooms, activeOrg } = useOrg();
  const { refreshDevices } = useDevices();

  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('thermostat');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulateQuickFill = (type: DeviceType, sampleName: string, prefix: string) => {
    setName(sampleName);
    setSerialNumber(`ACME-${prefix}-${Math.floor(100 + Math.random() * 900)}`);
    setEnrollmentCode(`ENR-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
    setDeviceType(type);
    setError(null);
  };

  const handleEnroll = async () => {
    if (!name || !serialNumber || !enrollmentCode) {
      setError('Please provide Device Name, Serial Number, and Security Enrollment Code');
      return;
    }
    setLoading(true);

    const newDevice: Device = {
      id: `dev-${Date.now()}`,
      organizationId: activeOrg.id,
      roomId: selectedRoomId || rooms[0]?.id || 'r1111111-0000-0000-0000-000000000001',
      name,
      serialNumber,
      enrollmentCode,
      type: deviceType,
      status: 'online',
      batteryLevel: deviceType === 'thermostat' || deviceType === 'smart_plug' ? null : 100,
      signalStrength: -52,
      firmwareVersion: 'v2.4.0',
      targetFirmwareVersion: null,
      firmwareStatus: 'up_to_date',
      firmwareProgress: 0,
      desiredState:
        deviceType === 'thermostat'
          ? { target_temperature: 22.0, mode: 'cool' }
          : deviceType === 'smart_plug'
          ? { power: true }
          : {},
      reportedState:
        deviceType === 'thermostat'
          ? { current_temperature: 22.1, target_temperature: 22.0, mode: 'cool' }
          : deviceType === 'smart_plug'
          ? { power: true, current_watts: 190, voltage: 120 }
          : deviceType === 'temperature_sensor'
          ? { temperature: 22.0, min_24h: 21.0, max_24h: 23.0 }
          : deviceType === 'humidity_sensor'
          ? { humidity: 46.0, dew_point: 9.0 }
          : { occupied: false, motion_count_today: 0 },
      isReconnecting: false,
      position3D: { x: 0, y: 1.2, z: 0 },
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await dataStore.addDevice(newDevice);
    await refreshDevices();
    setLoading(false);
    router.replace(`/devices/${newDevice.id}` as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.breadcrumbRow}>
        <TouchableOpacity onPress={() => router.push('/devices')}>
          <Text style={styles.breadcrumbLink}>Devices</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSeparator}>/</Text>
        <Text style={styles.breadcrumbCurrent}>Enroll New Device</Text>
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>Provision & Claim IoT Node</Text>
        <Text style={styles.formSubtitle}>
          Register device into {activeOrg.name} and configure initial shadow desired state.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Quick Demo Pre-fills */}
        <Text style={styles.quickFillLabel}>OR QUICK-FILL HARDWARE SPECIMEN:</Text>
        <View style={styles.quickFillRow}>
          <TouchableOpacity
            style={styles.quickFillPill}
            onPress={() => handleSimulateQuickFill('thermostat', 'Zone B Thermostat', 'TH')}
          >
            <Text style={styles.quickFillText}>🌡️ Thermostat Pro</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickFillPill}
            onPress={() => handleSimulateQuickFill('smart_plug', 'Workstation Power Bar', 'PL')}
          >
            <Text style={styles.quickFillText}>🔌 15A Smart Plug</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickFillPill}
            onPress={() => handleSimulateQuickFill('temperature_sensor', 'Cold Storage Probe', 'TMP')}
          >
            <Text style={styles.quickFillText}>☀️ Temp Sensor</Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Device Display Name"
          placeholder="e.g. Executive Boardroom Chiller"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(null);
          }}
        />

        <Input
          label="Hardware Serial Number (EUI-64 / MAC)"
          placeholder="e.g. ACME-TH-8821"
          value={serialNumber}
          onChangeText={(t) => {
            setSerialNumber(t);
            setError(null);
          }}
        />

        <Input
          label="Claim / Enrollment Security Token"
          placeholder="e.g. ENR-TH-9021"
          value={enrollmentCode}
          onChangeText={(t) => {
            setEnrollmentCode(t);
            setError(null);
          }}
        />

        {/* Device Type Select */}
        <Text style={styles.fieldLabel}>Device Type</Text>
        <View style={styles.typeGrid}>
          {(
            [
              ['thermostat', 'Thermostat', '🌡️'],
              ['smart_plug', 'Smart Plug', '🔌'],
              ['temperature_sensor', 'Temp Sensor', '☀️'],
              ['humidity_sensor', 'Humidity Sensor', '💧'],
              ['occupancy_sensor', 'Occupancy Radar', '🚶'],
            ] as const
          ).map(([t, lbl, ic]) => {
            const active = deviceType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typeOption, active && styles.typeOptionActive]}
                onPress={() => setDeviceType(t as DeviceType)}
              >
                <Text style={styles.typeIcon}>{ic}</Text>
                <Text style={[styles.typeText, active && styles.typeTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Room Assignment */}
        <Text style={styles.fieldLabel}>Assigned Facility Room</Text>
        <View style={styles.roomList}>
          {rooms.map((r) => {
            const selected = (selectedRoomId || rooms[0]?.id) === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.roomPill, selected && styles.roomPillSelected]}
                onPress={() => setSelectedRoomId(r.id)}
              >
                <Text style={[styles.roomPillText, selected && styles.roomPillTextSelected]}>
                  {r.name} (Fl {r.floor})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.btnRow}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => router.push('/devices')}
            style={{ flex: 1 }}
          />
          <Button
            title="Complete Enrollment"
            loading={loading}
            onPress={handleEnroll}
            style={{ flex: 2 }}
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
  formCard: {
    padding: 24,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  formSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: 12,
  },
  quickFillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickFillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickFillPill: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickFillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  typeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeIcon: {
    fontSize: 14,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeTextActive: {
    color: colors.primary,
  },
  roomList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  roomPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  roomPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roomPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  roomPillTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
