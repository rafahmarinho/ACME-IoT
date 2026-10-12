import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { colors } from '../../src/utils/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { recoverPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRecover = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await recoverPassword(email);
      setMessage(res.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>⚡</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>ACME IoT</Text>
            <Text style={styles.brandSubtitle}>Password Recovery</Text>
          </View>
        </View>

        <Text style={styles.welcomeText}>Reset your account password</Text>
        <Text style={styles.welcomeSub}>
          Enter your registered email address to receive password reset instructions.
        </Text>

        {message ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>✓ Instructions Dispatched</Text>
            <Text style={styles.successDesc}>{message}</Text>
            <Button
              title="Back to Sign In"
              onPress={() => router.push('/(auth)/login')}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          <>
            <Input
              label="Account Email Address"
              placeholder="name@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Button
              title="Send Reset Link"
              onPress={handleRecover}
              loading={loading}
              style={{ marginTop: 8 }}
            />

            <View style={styles.footerRow}>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>← Return to Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  successBox: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  successDesc: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  footerRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
