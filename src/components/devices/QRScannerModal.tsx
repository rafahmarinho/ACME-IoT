import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Device, DeviceType, Room } from '../../types/iot';
import { dataStore } from '../../services/supabase';
import { colors } from '../../utils/colors';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onEnrolled?: (newDevice: Device) => void;
  rooms: Room[];
  organizationId: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  onClose,
  onEnrolled,
  rooms,
  organizationId,
}) => {
  const [tab, setTab] = useState<'qr' | 'manual'>('qr');
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('thermostat');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleQRs = [
    { label: 'Thermostat Pro (QR-TH-7721)', code: 'ENR-TH-7721', type: 'thermostat' as DeviceType, name: 'Zone B Smart Thermostat' },
    { label: 'High-Current Smart Plug (QR-PL-8902)', code: 'ENR-PL-8902', type: 'smart_plug' as DeviceType, name: 'Server Aux Supply Plug' },
    { label: 'Radar Motion Sensor (QR-OC-3419)', code: 'ENR-OC-3419', type: 'occupancy_sensor' as DeviceType, name: 'Hallway Motion Radar' },
    { label: 'Precision Temp Node (QR-TMP-5012)', code: 'ENR-TS-5012', type: 'temperature_sensor' as DeviceType, name: 'Storage Ceiling Temp Sensor' },
  ];

  const handleSimulateScan = (sample: (typeof sampleQRs)[0]) => {
    setScanning(true);
    setTimeout(() => {
      setName(sample.name);
      setSerialNumber(`ACME-${sample.type.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
      setEnrollmentCode(sample.code);
      setDeviceType(sample.type);
      setScanning(false);
      setTab('manual');
    }, 600);
  };

  const handleEnroll = async () => {
    if (!name || !serialNumber || !enrollmentCode) {
      setError('Please provide Device Name, Serial Number, and Enrollment Code');
      return;
    }

    const newDevice: Device = {
      id: `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organizationId,
      roomId: selectedRoomId || rooms[0]?.id || 'r1111111-0000-0000-0000-000000000001',
      name,
      serialNumber,
      enrollmentCode,
      type: deviceType,
      status: 'online',
      batteryLevel: deviceType === 'thermostat' || deviceType === 'smart_plug' ? null : 100,
      signalStrength: -54,
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
          ? { current_temperature: 22.2, target_temperature: 22.0, mode: 'cool' }
          : deviceType === 'smart_plug'
          ? { power: true, current_watts: 180, voltage: 120 }
          : deviceType === 'temperature_sensor'
          ? { temperature: 22.1, min_24h: 21.0, max_24h: 23.0 }
          : deviceType === 'humidity_sensor'
          ? { humidity: 45.0, dew_point: 8.5 }
          : { occupied: false, motion_count_today: 0 },
      isReconnecting: false,
      position3D: { x: (Math.random() - 0.5) * 6, y: 1.2, z: (Math.random() - 0.5) * 4 },
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await dataStore.addDevice(newDevice);
    onEnrolled?.(newDevice);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Enroll New IoT Device">
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'qr' && styles.tabBtnActive]}
          onPress={() => setTab('qr')}
        >
          <Text style={[styles.tabText, tab === 'qr' && styles.tabTextActive]}>
            📷 QR Code Scanner
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'manual' && styles.tabBtnActive]}
          onPress={() => setTab('manual')}
        >
          <Text style={[styles.tabText, tab === 'manual' && styles.tabTextActive]}>
            ⌨️ Manual Provisioning
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'qr' ? (
        <View style={styles.qrContent}>
          {/* Simulated Scanner Viewfinder */}
          <View style={styles.viewfinder}>
            <View style={styles.viewfinderFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <View style={styles.laserLine} />
              <Text style={styles.viewfinderText}>
                {scanning ? 'Decoding Optical Matrix...' : 'Point camera at device QR code sticker'}
              </Text>
            </View>
          </View>

          <Text style={styles.sampleHeader}>Quick-Scan Demo Barcodes:</Text>
          <View style={styles.sampleList}>
            {sampleQRs.map((sq, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.sampleItem}
                onPress={() => handleSimulateScan(sq)}
              >
                <Text style={styles.sampleLabel}>{sq.label}</Text>
                <Text style={styles.sampleSub}>{sq.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <ScrollView style={styles.manualContent}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <Input
            label="Device Friendly Name"
            placeholder="e.g. Lab Chiller Thermostat"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError(null);
            }}
          />

          <Input
            label="Hardware Serial Number (MAC/UID)"
            placeholder="e.g. ACME-TH-9941"
            value={serialNumber}
            onChangeText={(t) => {
              setSerialNumber(t);
              setError(null);
            }}
          />

          <Input
            label="Claim / Enrollment Security Code"
            placeholder="e.g. ENR-TH-9021"
            value={enrollmentCode}
            onChangeText={(t) => {
              setEnrollmentCode(t);
              setError(null);
            }}
          />

          {/* Device Type Select */}
          <Text style={styles.fieldLabel}>Device Hardware Type</Text>
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
          <Text style={styles.fieldLabel}>Assign to Room / Zone</Text>
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
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title="Confirm Enrollment"
              onPress={handleEnroll}
              style={{ flex: 2 }}
            />
          </View>
        </ScrollView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  qrContent: {
    alignItems: 'center',
  },
  viewfinder: {
    width: '100%',
    height: 180,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewfinderFrame: {
    width: 140,
    height: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.accent,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.accent,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.accent,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.accent,
  },
  laserLine: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: '#EF4444',
  },
  viewfinderText: {
    position: 'absolute',
    bottom: 8,
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  sampleHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  sampleList: {
    width: '100%',
    gap: 8,
  },
  sampleItem: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    padding: 10,
  },
  sampleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sampleSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  manualContent: {
    maxHeight: 420,
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
    paddingHorizontal: 10,
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
    marginBottom: 20,
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
    marginTop: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: 8,
  },
});
