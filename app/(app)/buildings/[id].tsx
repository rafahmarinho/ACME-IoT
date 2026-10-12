import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrg } from '../../../src/context/OrgContext';
import { useDevices } from '../../../src/hooks/useDevices';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';
import { Button } from '../../../src/components/common/Button';
import { colors } from '../../../src/utils/colors';

export default function BuildingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { buildings, rooms } = useOrg();
  const { devices } = useDevices();

  const building = buildings.find((b) => b.id === id) || buildings[0];
  const buildingRooms = rooms.filter((r) => r.buildingId === building?.id);

  if (!building) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.title}>Building Not Found</Text>
        <Button title="Back to Buildings" onPress={() => router.push('/buildings')} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Breadcrumbs */}
      <View style={styles.breadcrumbRow}>
        <TouchableOpacity onPress={() => router.push('/buildings')}>
          <Text style={styles.breadcrumbLink}>Buildings</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSeparator}>/</Text>
        <Text style={styles.breadcrumbCurrent}>{building.name}</Text>
      </View>

      {/* Building Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.iconTitleRow}>
            <View style={styles.buildingIcon}>
              <Text style={styles.iconText}>🏢</Text>
            </View>
            <View>
              <Text style={styles.buildingTitle}>{building.name}</Text>
              <Text style={styles.buildingAddress}>{building.address}</Text>
            </View>
          </View>
          <Badge
            label={building.status}
            variant={building.status === 'operational' ? 'online' : 'warning'}
          />
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoVal}>{building.floorsCount} Floors</Text>
            <Text style={styles.infoLbl}>Vertical Levels</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoVal}>{building.totalAreaSqm.toLocaleString()} m²</Text>
            <Text style={styles.infoLbl}>Gross Internal Area</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoVal}>{buildingRooms.length} Zones</Text>
            <Text style={styles.infoLbl}>Monitored Spaces</Text>
          </View>
        </View>
      </Card>

      {/* Rooms List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Spaces & Rooms in this Building</Text>
        <Text style={styles.sectionSub}>Select a room to launch its 3D digital twin and telemetry controls</Text>
      </View>

      <View style={styles.roomsList}>
        {buildingRooms.map((room) => {
          const roomDevs = devices.filter((d) => d.roomId === room.id);
          const onlineCount = roomDevs.filter((d) => d.status === 'online').length;

          return (
            <TouchableOpacity
              key={room.id}
              activeOpacity={0.8}
              style={styles.roomCardWrapper}
              onPress={() => router.push(`/rooms/${room.id}` as any)}
            >
              <Card style={styles.roomCard}>
                <View style={styles.roomHeader}>
                  <View style={styles.roomNameGroup}>
                    <Text style={styles.roomIcon}>
                      {room.roomType === 'conference' ? '👥' : room.roomType === 'server_room' ? '🖥️' : '🛋️'}
                    </Text>
                    <View>
                      <Text style={styles.roomName}>{room.name}</Text>
                      <Text style={styles.roomFloor}>Floor {room.floor} • Type: {room.roomType.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <Badge label={`${onlineCount}/${roomDevs.length} Online`} variant="primary" size="sm" />
                </View>

                <View style={styles.roomParamsRow}>
                  <View style={styles.paramBox}>
                    <Text style={styles.paramVal}>{room.targetTemp}°C</Text>
                    <Text style={styles.paramLbl}>Target Temp</Text>
                  </View>
                  <View style={styles.paramBox}>
                    <Text style={styles.paramVal}>{room.targetHumidity}%</Text>
                    <Text style={styles.paramLbl}>Target Humidity</Text>
                  </View>
                  <View style={styles.paramBox}>
                    <Text style={styles.paramVal}>
                      {room.dimensions.width}m × {room.dimensions.length}m
                    </Text>
                    <Text style={styles.paramLbl}>Dimensions</Text>
                  </View>
                </View>

                <View style={styles.openTwinRow}>
                  <Text style={styles.openTwinText}>Open 3D Room Viewer & Controls →</Text>
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
  notFoundContainer: {
    padding: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
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
  headerCard: {
    padding: 20,
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buildingIcon: {
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
  buildingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  buildingAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
  },
  infoCol: {
    flex: 1,
    alignItems: 'center',
  },
  infoVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoLbl: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roomsList: {
    gap: 12,
  },
  roomCardWrapper: {
    width: '100%',
  },
  roomCard: {
    padding: 16,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roomIcon: {
    fontSize: 20,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  roomFloor: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  roomParamsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  paramBox: {
    flex: 1,
    alignItems: 'center',
  },
  paramVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paramLbl: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  openTwinRow: {
    alignItems: 'flex-end',
  },
  openTwinText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
