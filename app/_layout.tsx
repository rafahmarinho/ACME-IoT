import React from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { NetworkProvider } from '../src/context/NetworkContext';
import { OrgProvider } from '../src/context/OrgContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NetworkProvider>
          <OrgProvider>
            <StatusBar style="dark" />
            <Slot />
          </OrgProvider>
        </NetworkProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
