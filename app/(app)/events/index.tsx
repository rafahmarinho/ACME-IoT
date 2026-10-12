import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useOrg } from '../../../src/context/OrgContext';
import { dataStore, subscribeToKey } from '../../../src/services/supabase';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { EventLog, EventCategory } from '../../../src/types/iot';
import { colors } from '../../../src/utils/colors';
import { formatTimeAgo } from '../../../src/utils/formatters';

export default function EventsScreen() {
  const { activeOrg } = useOrg();
  const [events, setEvents] = useState<EventLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
    const unsub = subscribeToKey<EventLog[]>('events', (list) => {
      setEvents(list.filter((e) => e.organizationId === activeOrg.id));
    });
    return () => unsub();
  }, [activeOrg.id]);

  const loadEvents = async () => {
    const data = await dataStore.getEvents(activeOrg.id);
    setEvents(data);
  };

  const categories: { id: EventCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'control', label: 'Controls' },
    { id: 'telemetry', label: 'Telemetry' },
    { id: 'alert', label: 'Alerts' },
    { id: 'firmware', label: 'Firmware' },
    { id: 'enrollment', label: 'Enrollment' },
  ];

  const filtered = events.filter(
    (e) => selectedCategory === 'all' || e.category === selectedCategory
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit & Telemetry Event Stream</Text>
        <Text style={styles.subtitle}>
          Live message trace of hardware heartbeats, desired state mutations, and triggers
        </Text>
      </View>

      {/* Filter Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryRow}>
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Event Timeline */}
      <View style={styles.timeline}>
        {filtered.map((ev) => {
          const isExpanded = expandedId === ev.id;
          return (
            <Card key={ev.id} style={styles.eventCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpandedId(isExpanded ? null : ev.id)}
              >
                <View style={styles.eventHeader}>
                  <View style={styles.categoryTagGroup}>
                    <Badge label={ev.category} variant="primary" size="sm" />
                    <Text style={styles.timeAgo}>{formatTimeAgo(ev.createdAt)}</Text>
                  </View>
                  <Text style={styles.expandText}>{isExpanded ? 'Hide Payload ▲' : 'Inspect Payload ▼'}</Text>
                </View>

                <Text style={styles.eventMessage}>{ev.message}</Text>

                {isExpanded && ev.payload && (
                  <View style={styles.payloadBox}>
                    <Text style={styles.payloadTitle}>JSON PAYLOAD:</Text>
                    <Text style={styles.payloadJson}>
                      {JSON.stringify(ev.payload, null, 2)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Card>
          );
        })}
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
    marginBottom: 16,
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
  categoryScroll: {
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.primary,
  },
  timeline: {
    gap: 10,
  },
  eventCard: {
    padding: 14,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAgo: {
    fontSize: 11,
    color: colors.textMuted,
  },
  expandText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  eventMessage: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  payloadBox: {
    marginTop: 10,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
  },
  payloadTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  payloadJson: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#38BDF8',
  },
});
