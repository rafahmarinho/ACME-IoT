import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNetwork } from '../../context/NetworkContext';
import { colors } from '../../utils/colors';

export const OfflineBanner: React.FC = () => {
  const { isEffectiveOnline, simulateOffline, setSimulateOffline } = useNetwork();

  if (isEffectiveOnline) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Offline Mode Active</Text>
        <Text style={styles.description}>
          Showing latest cached data in read-only view. Realtime updates paused; control actions require an active connection.
        </Text>
      </View>
      {simulateOffline && (
        <TouchableOpacity
          style={styles.reconnectBtn}
          onPress={() => setSimulateOffline(false)}
        >
          <Text style={styles.reconnectText}>Go Online</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFFBEB', // Amber 50
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A', // Amber 200
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E', // Amber 800
  },
  description: {
    fontSize: 12,
    color: '#B45309', // Amber 700
    marginTop: 1,
  },
  reconnectBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reconnectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
