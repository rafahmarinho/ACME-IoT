import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrg } from '../../../src/context/OrgContext';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { colors } from '../../../src/utils/colors';

export default function BuildingsListScreen() {
  const router = useRouter();
  const { buildings, rooms, activeOrg } = useOrg();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Facility & Building Management</Text>
          <Text style={styles.subtitle}>
            Locations configured under {activeOrg.name}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {buildings.map((b) => {
          const buildingRooms = rooms.filter((r) => r.buildingId === b.id);
          return (
            <TouchableOpacity
              key={b.id}
              activeOpacity={0.8}
              style={styles.cardWrapper}
              onPress={() => router.push(`/buildings/${b.id}` as any)}
            >
              <Card style={styles.buildingCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Text style={styles.iconText}>🏢</Text>
                  </View>
                  <Badge
                    label={b.status}
                    variant={b.status === 'operational' ? 'online' : 'warning'}
                  />
                </View>

                <Text style={styles.buildingName}>{b.name}</Text>
                <Text style={styles.addressText}>{b.address}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{b.floorsCount}</Text>
                    <Text style={styles.statLbl}>Floors</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{buildingRooms.length}</Text>
                    <Text style={styles.statLbl}>Zones / Rooms</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>
                      {b.totalAreaSqm.toLocaleString()} m²
                    </Text>
                    <Text style={styles.statLbl}>Floor Area</Text>
                  </View>
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.viewRoomsText}>Inspect Rooms & Sensors →</Text>
                </View>
              </Card>
            </TouchableOpacity>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  cardWrapper: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  buildingCard: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  buildingName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLbl: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  footerRow: {
    alignItems: 'flex-end',
  },
  viewRoomsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
