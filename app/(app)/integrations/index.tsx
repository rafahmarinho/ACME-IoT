import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useOrg } from '../../../src/context/OrgContext';
import { useAuth } from '../../../src/context/AuthContext';
import { dataStore } from '../../../src/services/supabase';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { Button } from '../../../src/components/common/Button';
import { Integration } from '../../../src/types/iot';
import { colors } from '../../../src/utils/colors';
import { formatTimeAgo } from '../../../src/utils/formatters';

export default function IntegrationsScreen() {
  const { activeOrg } = useOrg();
  const { canManageAutomations } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, [activeOrg.id]);

  const loadIntegrations = async () => {
    const data = await dataStore.getIntegrations(activeOrg.id);
    setIntegrations(data);
  };

  const handleToggle = async (id: string) => {
    await dataStore.toggleIntegration(id);
    await loadIntegrations();
  };

  const handleSimulateSync = async (item: Integration) => {
    setSyncingId(item.id);
    await new Promise((r) => setTimeout(r, 800));

    await dataStore.addEvent({
      id: `ev-int-${Date.now()}`,
      organizationId: activeOrg.id,
      category: 'system',
      message: `Integration "${item.name}" handshake validated. Sent telemetry payload.`,
      payload: { type: item.type, responseStatus: 200 },
      createdAt: new Date().toISOString(),
    });

    await loadIntegrations();
    setSyncingId(null);
    setToast(`Sync handshake completed with ${item.name}! (Status: 200 OK)`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>External System Integrations</Text>
        <Text style={styles.subtitle}>
          Bridge ACME IoT device telemetry to third-party BMS, cloud shadows, and chat webhooks
        </Text>
      </View>

      {toast && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>✓ {toast}</Text>
        </View>
      )}

      <View style={styles.list}>
        {integrations.map((item) => (
          <Card key={item.id} style={styles.integrationCard}>
            <View style={styles.cardTop}>
              <View style={styles.iconTitleRow}>
                <View style={styles.iconBox}>
                  <Text style={styles.iconText}>
                    {item.type === 'slack'
                      ? '💬'
                      : item.type === 'bacnet'
                      ? '🏢'
                      : item.type === 'aws_iot'
                      ? '☁️'
                      : '🔗'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.intName}>{item.name}</Text>
                  <Text style={styles.intType}>
                    Protocol / Driver: {item.type.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.switchCol}>
                <Switch
                  value={item.isEnabled}
                  onValueChange={() => handleToggle(item.id)}
                  disabled={!canManageAutomations}
                  trackColor={{ false: colors.surfaceBorder, true: colors.primaryLight }}
                  thumbColor={item.isEnabled ? colors.primary : colors.surfaceBorderDark}
                />
              </View>
            </View>

            {/* Config & status metadata */}
            <View style={styles.configBox}>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Status:</Text>
                <Badge
                  label={item.isEnabled ? item.status : 'Disabled'}
                  variant={item.isEnabled ? 'online' : 'offline'}
                  size="sm"
                />
              </View>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Last Handshake:</Text>
                <Text style={styles.configVal}>
                  {item.lastSyncAt ? formatTimeAgo(item.lastSyncAt) : 'Never'}
                </Text>
              </View>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Config Parameters:</Text>
                <Text style={styles.configJson} numberOfLines={2}>
                  {JSON.stringify(item.config)}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Button
                title="Test Ping / Dispatch"
                size="sm"
                variant="outline"
                loading={syncingId === item.id}
                disabled={!item.isEnabled}
                onPress={() => handleSimulateSync(item)}
              />
            </View>
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
    marginBottom: 20,
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
  toastBanner: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  list: {
    gap: 16,
  },
  integrationCard: {
    padding: 18,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  intName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  intType: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  switchCol: {
    alignItems: 'flex-end',
  },
  configBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
    gap: 6,
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 100,
  },
  configVal: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  configJson: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
