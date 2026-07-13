import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  User, Plus, X, LogOut, Calendar, Heart, Edit3,
  ChevronDown, ChevronUp, Mail, Camera, Moon, Sun, Bell, BellOff, ChevronRight,
  AlertTriangle, Cloud, CloudOff, Globe,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useStorage } from '@/context/storage';
import { useLanguage } from '@/context/language';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';
import { AuthScreen } from '@/components/AuthScreen';

const GENDER_KEYS = ['male', 'female', 'other'] as const;
const GENDER_DISPLAY_TO_KEY: Record<string, string> = {
  Male: 'male', Female: 'female', Other: 'other',
  male: 'male', female: 'female', other: 'other',
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isDark, mode, setMode, colors } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { profile, illnesses, loading, isLocal, refresh, updateProfile, addIllness, deleteIllness, syncToCloud } = useStorage();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [newIllness, setNewIllness] = useState('');

  const fileInputRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    await refresh();
    if (profile) {
      setEditName(profile.full_name ?? '');
      setEditAge(profile.age?.toString() ?? '');
      setEditGender(profile.gender ?? '');
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      if (!loading && profile) {
        setEditName(profile.full_name ?? '');
        setEditAge(profile.age?.toString() ?? '');
        setEditGender(profile.gender ?? '');
      }
    }, [loading, profile])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const uploadAvatar = async (base64: string, mimeType: string) => {
    if (!user) {
      Alert.alert(t.profile.signInRequired, t.profile.signInRequiredDesc);
      return;
    }
    setUploadingAvatar(true);

    try {
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, bytes, { contentType: mimeType, upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

      await updateProfile({ avatar_url: publicUrl });
    } catch (e) {
      Alert.alert(t.common.error, t.profile.uploadError);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (base64) uploadAvatar(base64, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    }
  };

  const saveProfileData = async () => {
    setSaving(true);
    setSaved(false);

    const ageVal = editAge.trim() ? parseInt(editAge.trim(), 10) : null;

    const success = await updateProfile({
      full_name: editName.trim() || null,
      age: ageVal && !isNaN(ageVal) ? ageVal : null,
      gender: editGender.trim() || null,
    });

    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } else {
      Alert.alert(t.common.error, t.profile.saveError);
    }
    setSaving(false);
  };

  const toggleNotifyExpired = async (value: boolean) => {
    await updateProfile({ notify_expired: value });
  };

  const toggleNotifyExpiring = async (value: boolean) => {
    await updateProfile({ notify_expiring_soon: value });
  };

  const toggleNotifyScheduled = async (value: boolean) => {
    await updateProfile({ notify_scheduled: value });
  };

  const handleAddIllness = async () => {
    if (!newIllness.trim()) return;
    await addIllness(newIllness.trim());
    setNewIllness('');
  };

  const handleDeleteIllness = async (id: string) => {
    const ok = Platform.OS === 'web'
      ? window.confirm(t.profile.removeIllness + '?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(t.profile.removeIllness, t.profile.removeIllnessConfirm, [
            { text: t.common.cancel, style: 'cancel', onPress: () => resolve(false) },
            { text: t.common.delete, style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (!ok) return;
    await deleteIllness(id);
  };

  const handleSync = () => {
    if (user) return; // Already signed in
    setShowAuth(true);
  };

  if (showAuth && !user) {
    return <AuthScreen onBack={() => setShowAuth(false)} />;
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasProfile = profile?.full_name || profile?.age || profile?.gender;
  const initials = (profile?.full_name || editName)
    .trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const displayName = profile?.full_name || t.profile.yourName;
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t.profile.title}</Text>
        {isLocal && (
          <View style={[styles.localBadge, { backgroundColor: colors.warningLight, borderColor: colors.warningBorder }]}>
            <CloudOff size={12} color={colors.warning} strokeWidth={2} />
            <Text style={[styles.localBadgeText, { color: colors.warning }]}>{t.profile.localBadge}</Text>
          </View>
        )}
      </View>

      {/* Sync prompt for local users */}
      {isLocal && (
        <TouchableOpacity
          style={[styles.syncPrompt, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}
          onPress={handleSync}
          activeOpacity={0.8}>
          <View style={styles.syncPromptLeft}>
            <Cloud size={24} color={colors.primary} strokeWidth={1.5} />
            <View style={styles.syncPromptInfo}>
              <Text style={[styles.syncPromptTitle, { color: colors.primaryDark }]}>{t.profile.syncPromptTitle}</Text>
              <Text style={[styles.syncPromptSub, { color: colors.primary }]}>{t.profile.syncPromptSub}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Avatar + Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <View style={styles.avatarRow}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={user ? handleAvatarPress : undefined}
            activeOpacity={0.8}
            disabled={uploadingAvatar || !user}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
              </View>
            )}
            {user && (
              <View style={[styles.cameraOverlay, { backgroundColor: colors.primary }]}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Camera size={13} color={colors.textInverse} strokeWidth={2.5} />
                )}
              </View>
            )}
            {Platform.OS === 'web' && user && (
              // @ts-ignore
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            )}
          </TouchableOpacity>

          <View style={styles.avatarInfo}>
            <Text style={[styles.userName, { color: colors.text, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{displayName}</Text>
            {user && (
              <View style={styles.emailRow}>
                <Mail size={13} color={colors.textTertiary} strokeWidth={2} />
                <Text style={[styles.userEmail, { color: colors.textTertiary }]}>{user.email}</Text>
              </View>
            )}
            {user && (
              <TouchableOpacity style={styles.changePhotoBtn} onPress={handleAvatarPress} disabled={uploadingAvatar}>
                <Text style={[styles.changePhotoBtnText, { color: colors.primary }]}>
                  {uploadingAvatar ? t.profile.uploading : avatarUrl ? t.profile.changePhoto : t.profile.addPhoto}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {hasProfile && <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />}

        {hasProfile && (
          <View style={styles.summaryDetails}>
            {profile?.age && (
              <View style={[styles.detailItem, { backgroundColor: colors.inputBg }]}>
                <View style={[styles.detailIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Calendar size={14} color={colors.primary} strokeWidth={2} />
                </View>
                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>{t.profile.ageLabel}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{profile.age}</Text>
              </View>
            )}
            {profile?.gender && (
              <View style={[styles.detailItem, { backgroundColor: colors.inputBg }]}>
                <View style={[styles.detailIconCircle, { backgroundColor: colors.secondaryLight }]}>
                  <User size={14} color={colors.secondary} strokeWidth={2} />
                </View>
                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>{t.profile.genderLabel}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{t.profile.genderOptions[GENDER_DISPLAY_TO_KEY[profile.gender] as 'male' | 'female' | 'other'] ?? profile.gender}</Text>
              </View>
            )}
            {illnesses.length > 0 && (
              <View style={[styles.detailItem, { backgroundColor: colors.inputBg }]}>
                <View style={[styles.detailIconCircle, { backgroundColor: colors.dangerLight }]}>
                  <Heart size={14} color={colors.danger} strokeWidth={2} />
                </View>
                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>{t.profile.illnessesLabel}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{illnesses.length}</Text>
              </View>
            )}
          </View>
        )}

        {illnesses.length > 0 && (
          <View style={styles.illnessTags}>
            {illnesses.map((illness) => (
              <View key={illness.id} style={[styles.illnessTag, { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder }]}>
                <Text style={[styles.illnessTagText, { color: colors.text }]}>{illness.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteIllness(illness.id)} style={styles.illnessTagDelete}>
                  <X size={12} color={colors.danger} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Dark Mode Toggle */}
      <TouchableOpacity
        style={[styles.editToggle, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}
        onPress={() => setMode(isDark ? 'light' : 'dark')}
        activeOpacity={0.7}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.inputBg }]}>
            {isDark ? <Moon size={18} color={colors.primary} strokeWidth={2} /> : <Sun size={18} color={colors.primary} strokeWidth={2} />}
          </View>
          <View>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{t.profile.darkMode}</Text>
            <Text style={[styles.settingSubtext, { color: colors.textTertiary }]}>{isDark ? t.profile.on : t.profile.off}</Text>
          </View>
        </View>
        <View style={{ direction: 'ltr' }}>
          <Switch
            value={isDark}
            onValueChange={() => setMode(isDark ? 'light' : 'dark')}
            trackColor={{ false: colors.inputBorder, true: colors.primary + '80' }}
            thumbColor={isDark ? colors.primary : '#f4f3f4'}
          />
        </View>
      </TouchableOpacity>

      {/* Notifications Section */}
      <TouchableOpacity
        style={[styles.editToggle, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}
        onPress={() => setShowNotifications(!showNotifications)}
        activeOpacity={0.7}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.inputBg }]}>
            <Bell size={18} color={colors.primary} strokeWidth={2} />
          </View>
          <View>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{t.profile.notifications}</Text>
            <Text style={[styles.settingSubtext, { color: colors.textTertiary }]}>{t.profile.notificationsDesc}</Text>
          </View>
        </View>
        {showNotifications
          ? <ChevronUp size={18} color={colors.textTertiary} strokeWidth={2} />
          : <ChevronDown size={18} color={colors.textTertiary} strokeWidth={2} />}
      </TouchableOpacity>

      {showNotifications && (
        <View style={[styles.editCard, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.inputBg }]}>
                <AlertTriangle size={16} color={colors.danger} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t.profile.notifyExpired}</Text>
                <Text style={[styles.settingSubtext, { color: colors.textTertiary }]}>{t.profile.notifyExpiredDesc}</Text>
              </View>
            </View>
            <View style={{ direction: 'ltr' }}>
              <Switch
                value={profile?.notify_expired ?? true}
                onValueChange={toggleNotifyExpired}
                trackColor={{ false: colors.inputBorder, true: colors.primary + '80' }}
                thumbColor={profile?.notify_expired ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.inputBg }]}>
                <BellOff size={16} color={colors.warning} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t.profile.notifyExpiringSoon}</Text>
                <Text style={[styles.settingSubtext, { color: colors.textTertiary }]}>{t.profile.notifyExpiringSoonDesc}</Text>
              </View>
            </View>
            <View style={{ direction: 'ltr' }}>
              <Switch
                value={profile?.notify_expiring_soon ?? true}
                onValueChange={toggleNotifyExpiring}
                trackColor={{ false: colors.inputBorder, true: colors.primary + '80' }}
                thumbColor={profile?.notify_expiring_soon ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.divider, borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.inputBg }]}>
                <BellOff size={16} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t.profile.notifyScheduled}</Text>
                <Text style={[styles.settingSubtext, { color: colors.textTertiary }]}>{t.profile.notifyScheduledDesc}</Text>
              </View>
            </View>
            <View style={{ direction: 'ltr' }}>
              <Switch
                value={profile?.notify_scheduled ?? true}
                onValueChange={toggleNotifyScheduled}
                trackColor={{ false: colors.inputBorder, true: colors.primary + '80' }}
                thumbColor={profile?.notify_scheduled ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
      )}

      {/* Language Section */}
      <View style={[styles.editToggle, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.inputBg }]}>
            <Globe size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{t.profile.language}</Text>
            <Text style={[styles.settingSubtext, { color: colors.textTertiary }]}>{t.profile.languageDesc}</Text>
          </View>
        </View>
        <View style={styles.languageRow}>
          <TouchableOpacity
            style={[styles.langBtn, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }, language === 'en' && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
            onPress={() => setLanguage('en')}>
            <Text style={[styles.langBtnText, { color: colors.textSecondary }, language === 'en' && { color: colors.primaryDark, fontFamily: 'Inter-SemiBold' }]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }, language === 'ar' && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
            onPress={() => setLanguage('ar')}>
            <Text style={[styles.langBtnText, { color: colors.textSecondary }, language === 'ar' && { color: colors.primaryDark, fontFamily: 'Inter-SemiBold' }]}>AR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Section - Collapsible */}
      <TouchableOpacity
        style={[styles.editToggle, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}
        onPress={() => setShowEdit(!showEdit)}
        activeOpacity={0.7}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.inputBg }]}>
            <Edit3 size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <View>
            <Text style={[styles.editToggleText, { color: colors.primary }]}>{t.profile.editInfo}</Text>
          </View>
        </View>
        {showEdit
          ? <ChevronUp size={18} color={colors.textTertiary} strokeWidth={2} />
          : <ChevronDown size={18} color={colors.textTertiary} strokeWidth={2} />}
      </TouchableOpacity>

      {showEdit && (
        <View style={[styles.editCard, { backgroundColor: colors.card }]}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.profile.fullName}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
              value={editName}
              onChangeText={setEditName}
              placeholder={t.profile.fullNamePlaceholder}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.profile.age}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
              value={editAge}
              onChangeText={setEditAge}
              placeholder={t.profile.agePlaceholder}
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.profile.gender}</Text>
            <View style={styles.genderRow}>
              {GENDER_KEYS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }, GENDER_DISPLAY_TO_KEY[editGender] === g && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
                  onPress={() => setEditGender(g)}>
                  <Text style={[styles.genderChipText, { color: colors.textSecondary }, GENDER_DISPLAY_TO_KEY[editGender] === g && { color: colors.primaryDark, fontFamily: 'Inter-SemiBold' }]}>
                    {t.profile.genderOptions[g]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }, { backgroundColor: colors.primary }]}
            onPress={saveProfileData}
            disabled={saving}>
            <Text style={[styles.saveBtnText, { color: colors.textInverse }]}>
              {saving ? t.profile.saving : saved ? t.profile.saved : t.profile.saveProfile}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Illnesses Section */}
      <View style={[styles.illnessCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.profile.currentIllnesses}</Text>

        {illnesses.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t.profile.noIllnesses}</Text>
        )}

        <View style={styles.addIllnessRow}>
          <TextInput
            style={[styles.illnessInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
            value={newIllness}
            onChangeText={setNewIllness}
            placeholder={t.profile.addIllnessPlaceholder}
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={handleAddIllness}
          />
          <TouchableOpacity style={[styles.addIllnessBtn, { backgroundColor: colors.primary }]} onPress={handleAddIllness}>
            <Plus size={18} color={colors.textInverse} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out (only for signed in users) */}
      {user && (
        <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder }]} onPress={signOut}>
          <LogOut size={18} color={colors.danger} strokeWidth={2} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>{t.auth.signOut}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const AVATAR_SIZE = 72;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: 56, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: Spacing.xl, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...Typography.h1 },
  localBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  localBadgeText: { ...Typography.small, fontFamily: 'Inter-SemiBold' },
  syncPrompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1.5 },
  syncPromptLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  syncPromptInfo: { flex: 1 },
  syncPromptTitle: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold' },
  syncPromptSub: { ...Typography.caption, marginTop: 2 },
  summaryCard: { borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.card },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatarWrapper: { position: 'relative', width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarImage: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 2.5, borderColor: '#CCFBF1' },
  avatarCircle: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: 'Inter-Bold', fontSize: 26 },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarInfo: { flex: 1 },
  userName: { ...Typography.h2 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  userEmail: { ...Typography.caption },
  changePhotoBtn: { marginTop: 6, alignSelf: 'flex-start' },
  changePhotoBtnText: { ...Typography.caption, fontFamily: 'Inter-SemiBold' },
  summaryDivider: { height: 1, marginVertical: Spacing.lg },
  summaryDetails: { flexDirection: 'row', gap: Spacing.md },
  detailItem: { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 4 },
  detailIconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  detailLabel: { ...Typography.small },
  detailValue: { ...Typography.bodyMedium, fontSize: 14 },
  illnessTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  illnessTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.xl, borderWidth: 1 },
  illnessTagText: { ...Typography.small, fontFamily: 'Inter-Medium' },
  illnessTagDelete: { padding: 2 },
  editToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1.5 },
  editToggleText: { ...Typography.bodyMedium },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  settingTitle: { ...Typography.bodyMedium },
  settingSubtext: { ...Typography.small, marginTop: 2 },
  editCard: { borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.card },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg, borderBottomWidth: 1 },
  languageRow: { flexDirection: 'row', gap: Spacing.sm },
  langBtn: { paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.xl, borderWidth: 1.5 },
  langBtnText: { ...Typography.caption, fontFamily: 'Inter-Medium' },
  field: { marginBottom: Spacing.lg },
  label: { ...Typography.caption, marginBottom: Spacing.sm },
  input: { ...Typography.body, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: 14, borderWidth: 1.5 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  genderChip: { paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radius.xl, borderWidth: 1.5 },
  genderChipText: { ...Typography.caption },
  saveBtn: { borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', ...Shadows.button },
  saveBtnText: { ...Typography.button },
  illnessCard: { borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.card },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.lg },
  emptyText: { ...Typography.body, marginBottom: Spacing.lg },
  addIllnessRow: { flexDirection: 'row', gap: Spacing.sm },
  illnessInput: { flex: 1, ...Typography.body, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: 12, borderWidth: 1.5 },
  addIllnessBtn: { borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', justifyContent: 'center', ...Shadows.button },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.lg, paddingVertical: Spacing.lg, borderWidth: 1, marginBottom: Spacing.xxxl },
  signOutText: { ...Typography.bodyMedium },
});
