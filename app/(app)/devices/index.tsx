import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useDevices } from '../../../src/hooks/useDevices';
import { useOrg } from '../../../src/context/OrgContext';
import { DeviceCard } from '../../../src/components/devices/DeviceCard';
import { Button } from '../../../src/components/common/Button';
import { QRScannerModal } from '../../../src/components/devices/QRScannerModal';
import { DeviceType, DeviceStatus } from '../../../src/types/iot';
import { colors } from '../../../src/utils/colors';

export default function DevicesListScreen() {
  const router = useRouter();
  const { devices, refreshDevices } = useDevices();
  const { rooms, activeOrg } = useOrg();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<DeviceType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | 'all'>('all');
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.serialNumber.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || d.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const deviceTypes: { id: DeviceType | 'all'; label: string }[] = [
    { id: 'all', label: 'All Types' },
    { id: 'thermostat', label: 'Thermostats' },
    { id: 'smart_plug', label: 'Smart Plugs' },
    { id: 'temperature_sensor', label: 'Temp Sensors' },
    { id: 'humidity_sensor', label: 'Humidity' },
    { id: 'occupancy_sensor', label: 'Occupancy' },
  ];

  const statuses: { id: DeviceStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All Status' },
    { id: 'online', label: 'Online' },
    { id: 'warning', label: 'Warning / Low Bat' },
    { id: 'offline', label: 'Offline' },
    { id: 'updating', label: 'Updating' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Device Inventory</Text>
          <Text style={styles.subtitle}>
            {devices.length} registered nodes across {activeOrg.name}
          </Text>
        </View>
        <Button
          title="+ Enroll Device (QR / Code)"
          onPress={() => setEnrollModalVisible(true)}
        />
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Search devices by name, MAC address, serial number..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Row - Types */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterGroup}>
          {deviceTypes.map((t) => {
            const active = selectedType === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setSelectedType(t.id)}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Filter Row - Status */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterGroup}>
          {statuses.map((s) => {
            const active = selectedStatus === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setSelectedStatus(s.id)}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Device Cards List */}
      <View style={styles.deviceList}>
        {filteredDevices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No matching devices found</Text>
            <Text style={styles.emptyDesc}>Try clearing your search query or filters.</Text>
          </View>
        ) : (
          filteredDevices.map((dev) => {
            const room = rooms.find((r) => r.id === dev.roomId);
            return (
              <DeviceCard
                key={dev.id}
                device={dev}
                roomName={room?.name}
              />
            );
          })
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearSearch: {
    fontSize: 14,
    color: colors.textMuted,
    padding: 4,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.primary,
  },
  deviceList: {
    marginTop: 12,
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
