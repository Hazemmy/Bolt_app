import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/context/auth';
import { AuthScreen } from '@/components/AuthScreen';
import { ReactNode } from 'react';
import { Colors } from '@/lib/theme';

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
});
