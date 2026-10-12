import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Header } from '../../src/components/common/Header';
import { Sidebar } from '../../src/components/common/Sidebar';
import { TabBar } from '../../src/components/common/TabBar';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { colors } from '../../src/utils/colors';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;

  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.mainWrapper}>
        {/* Sidebar on Desktop / Tablet */}
        {isDesktop && <Sidebar />}

        {/* Content Column */}
        <View style={styles.contentColumn}>
          <Header />
          <View style={styles.slotContainer}>
            <Slot />
          </View>
          {/* Mobile Bottom Tab Bar */}
          {!isDesktop && <TabBar />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  contentColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.background,
  },
  slotContainer: {
    flex: 1,
  },
});
