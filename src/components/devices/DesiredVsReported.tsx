import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Device } from '../../types/iot';
import { colors } from '../../utils/colors';

interface DesiredVsReportedProps {
  device: Device;
}

export const DesiredVsReported: React.FC<DesiredVsReportedProps> = ({ device }) => {
  const desired = device.desiredState || {};
  const reported = device.reportedState || {};

  // Check sync state
  let inSync = true;
  if (device.type === 'smart_plug' && desired.power !== undefined) {
    if (desired.power !== reported.power) inSync = false;
  } else if (device.type === 'thermostat' && desired.target_temperature !== undefined) {
    if (Math.abs((reported.target_temperature ?? 0) - desired.target_temperature) > 0.1) inSync = false;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Device Shadow State</Text>
        <View style={[styles.syncBadge, inSync ? styles.syncBadgeOk : styles.syncBadgeMismatch]}>
          <Text style={[styles.syncBadgeText, inSync ? styles.syncBadgeTextOk : styles.syncBadgeTextMismatch]}>
            {inSync ? '✓ State In Sync' : '⚠️ Pending Reconcile'}
          </Text>
        </View>
      </View>

      <View style={styles.columnsRow}>
        {/* Desired State Box */}
        <View style={styles.columnBox}>
          <View style={styles.columnHeader}>
            <View style={[styles.columnDot, { backgroundColor: colors.desiredBadge }]} />
            <Text style={styles.columnTitle}>DESIRED STATE (Cloud Target)</Text>
          </View>
          <View style={styles.stateBody}>
            {Object.keys(desired).length === 0 ? (
              <Text style={styles.emptyText}>No desired overrides</Text>
            ) : (
              Object.entries(desired).map(([key, val]) => (
                <View key={key} style={styles.propRow}>
                  <Text style={styles.propKey}>{key.replace(/_/g, ' ')}:</Text>
                  <Text style={styles.propValDesired}>{String(val)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Reported State Box */}
        <View style={styles.columnBox}>
          <View style={styles.columnHeader}>
            <View style={[styles.columnDot, { backgroundColor: colors.reportedBadge }]} />
            <Text style={styles.columnTitle}>REPORTED STATE (Device Hardware)</Text>
          </View>
          <View style={styles.stateBody}>
            {Object.keys(reported).length === 0 ? (
              <Text style={styles.emptyText}>No telemetry reported yet</Text>
            ) : (
              Object.entries(reported).map(([key, val]) => (
                <View key={key} style={styles.propRow}>
                  <Text style={styles.propKey}>{key.replace(/_/g, ' ')}:</Text>
                  <Text style={styles.propValReported}>
                    {typeof val === 'number' ? val.toFixed(1) : String(val)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
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
    marginVertical: 12,
  },
  header: {
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
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  syncBadgeOk: {
    backgroundColor: colors.onlineLight,
  },
  syncBadgeMismatch: {
    backgroundColor: colors.warningLight,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  syncBadgeTextOk: {
    color: colors.online,
  },
  syncBadgeTextMismatch: {
    color: colors.warning,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  columnBox: {
    flex: 1,
    minWidth: 220,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    paddingBottom: 6,
  },
  columnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  columnTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  stateBody: {
    gap: 4,
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  propKey: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  propValDesired: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  propValReported: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.reportedBadge,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
