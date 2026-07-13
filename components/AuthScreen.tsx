import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Shield, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useLanguage } from '@/context/language';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';

interface AuthScreenProps {
  onBack?: () => void;
}

export function AuthScreen({ onBack }: AuthScreenProps) {
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t.auth.fillAllFields);
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = isLogin
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);
    if (result.error) {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.hero,
      color: colors.text,
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      ...Shadows.card,
    },
    cardTitle: {
      ...Typography.h2,
      color: colors.text,
      marginBottom: Spacing.lg,
    },
    label: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    input: {
      ...Typography.body,
      color: colors.text,
      backgroundColor: colors.inputBg,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: Radius.lg,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: Spacing.sm,
      ...Shadows.button,
    },
    buttonText: {
      ...Typography.button,
      color: colors.textInverse,
    },
    guestButton: {
      borderRadius: Radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: Spacing.sm,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
    },
    guestButtonText: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
    },
    switchText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    switchLink: {
      ...Typography.bodyMedium,
      color: colors.primary,
    },
    errorBox: {
      backgroundColor: colors.dangerLight,
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
    },
    errorText: {
      ...Typography.body,
      color: colors.danger,
      textAlign: 'center',
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      style={dynamicStyles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
          <ArrowLeft size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      )}

      <View style={styles.hero}>
        <View style={dynamicStyles.iconCircle}>
          <Shield size={36} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={dynamicStyles.title}>{t.auth.appTitle}</Text>
        <Text style={dynamicStyles.subtitle}>{t.auth.appSubtitle}</Text>
      </View>

      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.cardTitle}>{isLogin ? t.auth.welcomeBack : t.auth.createAccount}</Text>

        {error && (
          <View style={dynamicStyles.errorBox}>
            <Text style={dynamicStyles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={dynamicStyles.label}>{t.auth.email}</Text>
          <TextInput
            style={dynamicStyles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t.auth.emailPlaceholder}
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={dynamicStyles.label}>{t.auth.password}</Text>
          <TextInput
            style={dynamicStyles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t.auth.passwordPlaceholder}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[dynamicStyles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}>
          <Text style={dynamicStyles.buttonText}>
            {submitting ? t.auth.pleaseWait : isLogin ? t.auth.signInButton : t.auth.signUpButton}
          </Text>
        </TouchableOpacity>

        {onBack && (
          <TouchableOpacity style={dynamicStyles.guestButton} onPress={onBack}>
            <Text style={dynamicStyles.guestButtonText}>{t.auth.continueAsGuest}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={() => { setIsLogin(!isLogin); setError(null); }}
        style={styles.switchRow}>
        <Text style={dynamicStyles.switchText}>
          {isLogin ? t.auth.noAccount + ' ' : t.auth.haveAccount + ' '}
        </Text>
        <Text style={dynamicStyles.switchLink}>
          {isLogin ? t.auth.signUp : t.auth.signIn}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: Spacing.xl,
    padding: Spacing.sm,
    zIndex: 10,
  },
});
