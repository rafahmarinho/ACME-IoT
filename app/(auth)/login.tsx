import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { colors } from '../../src/utils/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('owner@acme-iot.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      if (res.success) {
        router.replace('/(app)');
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleSelect = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Brand Header */}
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>⚡</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>ACME IoT</Text>
            <Text style={styles.brandSubtitle}>Connected Intelligence Cloud</Text>
          </View>
        </View>

        <Text style={styles.welcomeText}>Sign in to your console</Text>
        <Text style={styles.welcomeSub}>
          Industrial device telemetry, shadow states, and automated building management.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Input
          label="Corporate Email"
          placeholder="name@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError(null);
          }}
        />

        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.forgotRow}>
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotLink}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Sign In to ACME IoT"
          onPress={handleLogin}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        {/* Quick Demo Logins for each Role */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>DEMO QUICK-LOGIN (SELECT ROLE):</Text>
          <View style={styles.demoRolesGrid}>
            <TouchableOpacity
              style={[styles.demoRoleBtn, email.includes('owner') && styles.demoRoleBtnActive]}
              onPress={() => handleQuickRoleSelect('owner@acme-iot.com')}
            >
              <Text style={styles.demoRoleTitle}>👑 Owner</Text>
              <Text style={styles.demoRoleEmail}>Sarah Jenkins</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoRoleBtn, email.includes('admin') && styles.demoRoleBtnActive]}
              onPress={() => handleQuickRoleSelect('admin@acme-iot.com')}
            >
              <Text style={styles.demoRoleTitle}>🛠️ Admin</Text>
              <Text style={styles.demoRoleEmail}>Marcus Vance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoRoleBtn, email.includes('operator') && styles.demoRoleBtnActive]}
              onPress={() => handleQuickRoleSelect('operator@acme-iot.com')}
            >
              <Text style={styles.demoRoleTitle}>⚡ Operator</Text>
              <Text style={styles.demoRoleEmail}>Elena Rostova</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoRoleBtn, email.includes('viewer') && styles.demoRoleBtnActive]}
              onPress={() => handleQuickRoleSelect('viewer@acme-iot.com')}
            >
              <Text style={styles.demoRoleTitle}>👁️ Viewer</Text>
              <Text style={styles.demoRoleEmail}>David Kim</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Need a new organization workspace? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandIconText: {
    fontSize: 22,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  brandSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: 12,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  demoRolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoRoleBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    padding: 8,
  },
  demoRoleBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  demoRoleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  demoRoleEmail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
