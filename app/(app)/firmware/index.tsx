import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useDevices } from '../../../src/hooks/useDevices';
import { useAuth } from '../../../src/context/AuthContext';
import { dataStore } from '../../../src/services/supabase';
import { simulationService } from '../../../src/services/simulationService';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { Button } from '../../../src/components/common/Button';
import { FirmwareRelease } from '../../../src/types/iot';
import { colors } from '../../../src/utils/colors';

export default function FirmwareScreen() {
  const { devices, refreshDevices } = useDevices();
  const { canDeployFirmware } = useAuth();
  const [releases, setReleases] = useState<FirmwareRelease[]>([]);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    loadReleases();
  }, []);

  const loadReleases = async () => {
    const data = await dataStore.getFirmwareReleases();
    setReleases(data);
  };

  const handleFleetDeploy = async (version: string) => {
    setBusy(true);
    let count = 0;
    for (const d of devices) {
      if (d.status !== 'offline') {
        await simulationService.startFirmwareUpdate(d.id, version);
        count++;
      }
    }
    await refreshDevices();
    setBusy(false);
    setStatusMsg(`OTA deployment broadcast to ${count} online devices. Advance tick to simulate download & flashing.`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleFleetRollback = async () => {
    setBusy(true);
    let count = 0;
    for (const d of devices) {
      await simulationService.rollbackFirmware(d.id);
      count++;
    }
    await refreshDevices();
    setBusy(false);
    setStatusMsg(`Emergency rollback dispatched across ${count} devices. Restored to v2.3.8.`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const updatingDevices = devices.filter((d) => d.status === 'updating' || d.firmwareStatus === 'installing');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Firmware Lifecycle & OTA Distribution</Text>
          <Text style={styles.subtitle}>
            Staged over-the-air binary deployments with rollback and checksum validation
          </Text>
        </View>

        {canDeployFirmware && (
          <View style={styles.headerBtnRow}>
            <Button
              title="Deploy v2.4.1 to All Online"
              loading={busy}
              onPress={() => handleFleetDeploy('v2.4.1')}
            />
            <Button
              title="Fleet Rollback (v2.3.8)"
              variant="outline"
              loading={busy}
              onPress={handleFleetRollback}
            />
          </View>
        )}
      </View>

      {statusMsg && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>✓ {statusMsg}</Text>
        </View>
      )}

      {/* Active OTA Deployments in Flight */}
      {updatingDevices.length > 0 && (
        <Card style={styles.activeOtaCard}>
          <Text style={styles.sectionTitle}>Active OTA Flashing Queue ({updatingDevices.length})</Text>
          <Text style={styles.sectionSubtitle}>
            Devices currently receiving or verifying binary packages:
          </Text>

          <View style={styles.updatingList}>
            {updatingDevices.map((d) => (
              <View key={d.id} style={styles.updatingItem}>
                <View style={styles.updatingHeader}>
                  <Text style={styles.updatingName}>{d.name}</Text>
                  <Text style={styles.updatingPercent}>{d.firmwareProgress}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${d.firmwareProgress}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Catalog of Releases */}
      <Text style={[styles.sectionTitle, { marginTop: 16, marginBottom: 12 }]}>
        Approved Firmware Releases Catalog
      </Text>

      <View style={styles.catalogList}>
        {releases.map((rel) => (
          <Card key={rel.id} style={styles.releaseCard}>
            <View style={styles.relTop}>
              <View style={styles.relTitleGroup}>
                <Text style={styles.relVersion}>{rel.version}</Text>
                <Badge
                  label={rel.isStable ? 'Production Stable' : 'Release Candidate'}
                  variant={rel.isStable ? 'online' : 'warning'}
                />
              </View>
              <Text style={styles.relType}>Device Target: {rel.deviceType.replace(/_/g, ' ')}</Text>
            </View>

            <Text style={styles.releaseNotes}>{rel.releaseNotes}</Text>
            <Text style={styles.downloadUrl}>Binary Artifact: {rel.downloadUrl}</Text>

            {canDeployFirmware && (
              <View style={styles.relActions}>
                <Button
                  title={`Stage Deployment ${rel.version}`}
                  size="sm"
                  variant="outline"
                  onPress={() => handleFleetDeploy(rel.version)}
                />
              </View>
            )}
          </Card>
        ))}
      </View>
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
    marginBottom: 20,
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
  headerBtnRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBanner: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  activeOtaCard: {
    padding: 18,
    marginBottom: 20,
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
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
    marginBottom: 12,
  },
  updatingList: {
    gap: 12,
  },
  updatingItem: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  updatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  updatingName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  updatingPercent: {
    fontSize: 13,
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
  catalogList: {
    gap: 12,
  },
  releaseCard: {
    padding: 16,
  },
  relTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  relTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  relVersion: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  relType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  releaseNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  downloadUrl: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  relActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: 10,
  },
});
