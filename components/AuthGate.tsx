import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/context/auth';
import { ReactNode } from 'react';
import { useTheme } from '@/context/theme';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Always show children - auth is optional
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
