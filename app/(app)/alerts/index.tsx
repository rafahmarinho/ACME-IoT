import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAlerts } from '../../../src/hooks/useAlerts';
import { useAuth } from '../../../src/context/AuthContext';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { Button } from '../../../src/components/common/Button';
import { AlertStatus } from '../../../src/types/iot';
import { colors } from '../../../src/utils/colors';
import { formatTimeAgo } from '../../../src/utils/formatters';

export default function AlertsScreen() {
  const { alerts, acknowledgeAlert, resolveAlert, refreshAlerts } = useAlerts();
  const { user, canControlDevices } = useAuth();
  const [tab, setTab] = useState<AlertStatus>('active');

  const filteredAlerts = alerts.filter((a) => a.status === tab);

  const handleAck = async (id: string) => {
    await acknowledgeAlert(id, user?.fullName || 'Operator');
    await refreshAlerts();
  };

  const handleResolve = async (id: string) => {
    await resolveAlert(id);
    await refreshAlerts();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts & Incidents Console</Text>
        <Text style={styles.subtitle}>
          Real-time threshold breaches, device heartbeats, and low battery notifications
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['active', 'acknowledged', 'resolved'] as const).map((t) => {
          const count = alerts.filter((a) => a.status === t).length;
          const isActive = tab === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                {t.toUpperCase()} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Alerts List */}
      <View style={styles.alertsList}>
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>No {tab} alerts</Text>
            <Text style={styles.emptyDesc}>All monitored systems are within nominal thresholds.</Text>
          </View>
        ) : (
          filteredAlerts.map((alt) => (
            <Card key={alt.id} style={styles.alertCard}>
              <View style={styles.alertTop}>
                <View style={styles.iconAndTitle}>
                  <Text style={styles.severityIcon}>
                    {alt.severity === 'critical' ? '🚨' : alt.severity === 'warning' ? '⚠️' : 'ℹ️'}
                  </Text>
                  <View>
                    <Text style={styles.alertTitle}>{alt.title}</Text>
                    <Text style={styles.alertTime}>Triggered {formatTimeAgo(alt.createdAt)}</Text>
                  </View>
                </View>

                <Badge
                  label={alt.severity}
                  variant={alt.severity === 'critical' ? 'critical' : alt.severity === 'warning' ? 'warning' : 'info'}
                />
              </View>

              <Text style={styles.alertMessage}>{alt.message}</Text>

              {alt.acknowledgedBy && (
                <Text style={styles.ackByText}>
                  ✓ Acknowledged by: <Text style={{ fontWeight: '600' }}>{alt.acknowledgedBy}</Text>
                </Text>
              )}

              {alt.resolvedAt && (
                <Text style={styles.resolvedText}>
                  ✓ Resolved at {formatTimeAgo(alt.resolvedAt)}
                </Text>
              )}

              {canControlDevices && tab !== 'resolved' && (
                <View style={styles.actionsRow}>
                  {tab === 'active' && (
                    <Button
                      title="Acknowledge"
                      size="sm"
                      variant="secondary"
                      onPress={() => handleAck(alt.id)}
                    />
                  )}
                  <Button
                    title="Mark Resolved"
                    size="sm"
                    onPress={() => handleResolve(alt.id)}
                  />
                </View>
              )}
            </Card>
          ))
        )}
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    padding: 16,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  severityIcon: {
    fontSize: 20,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  alertTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  alertMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  ackByText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  resolvedText: {
    fontSize: 11,
    color: colors.online,
    marginBottom: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: 10,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
