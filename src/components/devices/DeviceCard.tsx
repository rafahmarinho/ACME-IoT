import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Device } from '../../types/iot';
import { Badge } from '../common/Badge';
import { colors } from '../../utils/colors';
import { formatTimeAgo, formatDeviceTypeLabel } from '../../utils/formatters';

interface DeviceCardProps {
  device: Device;
  roomName?: string;
  onQuickToggle?: (device: Device) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  roomName,
  onQuickToggle,
}) => {
  const router = useRouter();

  const getDeviceIcon = () => {
    switch (device.type) {
      case 'thermostat':
        return '🌡️';
      case 'smart_plug':
        return '🔌';
      case 'temperature_sensor':
        return '☀️';
      case 'humidity_sensor':
        return '💧';
      case 'occupancy_sensor':
        return '🚶';
      default:
        return '⚡';
    }
  };

  const isBatteryLow = device.batteryLevel !== null && device.batteryLevel <= 20;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.card}
      onPress={() => router.push(`/devices/${device.id}` as any)}
    >
      {/* Top Header: Icon, Name, Type, Status */}
      <View style={styles.header}>
        <View style={styles.iconAndTitle}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>{getDeviceIcon()}</Text>
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.name} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={styles.subtext}>
              {formatDeviceTypeLabel(device.type)} {roomName ? `• ${roomName}` : ''}
            </Text>
          </View>
        </View>

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

      {/* Primary Metric & Telemetry preview */}
      <View style={styles.metricsBox}>
        {device.type === 'thermostat' && (
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricBig}>
                {device.reportedState?.current_temperature ?? '--'}°C
              </Text>
              <Text style={styles.metricLabel}>Current Reported</Text>
            </View>
            <View style={styles.desiredBox}>
              <Text style={styles.desiredLabel}>TARGET</Text>
              <Text style={styles.desiredValue}>
                {device.desiredState?.target_temperature ?? '--'}°C
              </Text>
            </View>
          </View>
        )}

        {device.type === 'smart_plug' && (
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricBig}>
                {device.reportedState?.current_watts ?? 0} W
              </Text>
              <Text style={styles.metricLabel}>Active Power Load</Text>
            </View>
            <View style={styles.desiredBox}>
              <Text style={styles.desiredLabel}>POWER</Text>
              <Text
                style={[
                  styles.desiredValue,
                  device.desiredState?.power ? { color: colors.online } : { color: colors.offline },
                ]}
              >
                {device.desiredState?.power ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>
        )}

        {device.type === 'temperature_sensor' && (
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricBig}>
                {device.reportedState?.temperature ?? '--'}°C
              </Text>
              <Text style={styles.metricLabel}>Ambient Temperature</Text>
            </View>
            <Text style={styles.rangeText}>
              24h: {device.reportedState?.min_24h}° - {device.reportedState?.max_24h}°
            </Text>
          </View>
        )}

        {device.type === 'humidity_sensor' && (
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricBig}>
                {device.reportedState?.humidity ?? '--'}%
              </Text>
              <Text style={styles.metricLabel}>Relative Humidity</Text>
            </View>
            <Text style={styles.rangeText}>
              Dew: {device.reportedState?.dew_point ?? '--'}°C
            </Text>
          </View>
        )}

        {device.type === 'occupancy_sensor' && (
          <View style={styles.metricRow}>
            <View>
              <Text
                style={[
                  styles.metricBig,
                  device.reportedState?.occupied ? { color: colors.primary } : { color: colors.textSecondary },
                ]}
              >
                {device.reportedState?.occupied ? 'Occupied' : 'Vacant'}
              </Text>
              <Text style={styles.metricLabel}>Room Detection</Text>
            </View>
            <Text style={styles.rangeText}>
              {device.reportedState?.motion_count_today ?? 0} events today
            </Text>
          </View>
        )}
      </View>

      {/* Firmware Update Progress (if updating) */}
      {device.status === 'updating' && (
        <View style={styles.otaBarContainer}>
          <View style={styles.otaHeader}>
            <Text style={styles.otaLabel}>OTA Firmware Flash</Text>
            <Text style={styles.otaPercent}>{device.firmwareProgress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${device.firmwareProgress}%` }]} />
          </View>
        </View>
      )}

      {/* Footer: Battery, Signal, Last Seen */}
      <View style={styles.footer}>
        <View style={styles.footerBadges}>
          {device.batteryLevel !== null ? (
            <View
              style={[
                styles.footerPill,
                isBatteryLow && { backgroundColor: colors.dangerLight },
              ]}
            >
              <Text style={styles.pillText}>
                🔋 {device.batteryLevel}% {isBatteryLow ? '(Weak)' : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.footerPill}>
              <Text style={styles.pillText}>⚡ Line Power</Text>
            </View>
          )}

          <View style={styles.footerPill}>
            <Text style={styles.pillText}>📶 {device.signalStrength} dBm</Text>
          </View>
        </View>

        <Text style={styles.lastSeenText}>
          Seen {formatTimeAgo(device.lastSeenAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  titleArea: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricsBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricBig: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  desiredBox: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  desiredLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  desiredValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  rangeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  otaBarContainer: {
    marginBottom: 12,
  },
  otaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  otaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  otaPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceBorderDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  footerBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  footerPill: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  lastSeenText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
