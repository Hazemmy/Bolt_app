import { useState, useCallback } from 'react';
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
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { User, Plus, X, LogOut, Calendar, Heart, Edit3, ChevronDown, ChevronUp, Mail } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';

interface Profile {
  id: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
}

interface Illness {
  id: string;
  name: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [illnesses, setIllnesses] = useState<Illness[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [newIllness, setNewIllness] = useState('');

  const fetchData = useCallback(async () => {
    const [profRes, illRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle(),
      supabase.from('illnesses').select('*').eq('user_id', user!.id).order('created_at', { ascending: true }),
    ]);

    if (profRes.data) {
      setProfile(profRes.data);
      setEditName(profRes.data.full_name ?? '');
      setEditAge(profRes.data.age?.toString() ?? '');
      setEditGender(profRes.data.gender ?? '');
    } else if (!profRes.data) {
      await supabase.from('profiles').insert({ id: user!.id });
      setProfile({ id: user!.id, full_name: null, age: null, gender: null });
      setEditName('');
      setEditAge('');
      setEditGender('');
    }

    if (illRes.data) setIllnesses(illRes.data);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) fetchData();
    }, [user, fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);

    const ageVal = editAge.trim() ? parseInt(editAge.trim(), 10) : null;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editName.trim() || null,
        age: ageVal && !isNaN(ageVal) ? ageVal : null,
        gender: editGender.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user!.id);

    if (!error) {
      setSaved(true);
      await fetchData();
      setTimeout(() => setSaved(false), 1500);
    } else {
      Alert.alert('Error', 'Failed to save profile.');
    }
    setSaving(false);
  };

  const addIllness = async () => {
    if (!newIllness.trim()) return;
    const { error } = await supabase.from('illnesses').insert({
      user_id: user!.id,
      name: newIllness.trim(),
    });
    if (!error) {
      setNewIllness('');
      const { data } = await supabase
        .from('illnesses')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });
      if (data) setIllnesses(data);
    }
  };

  const deleteIllness = async (id: string) => {
    const ok =
      Platform.OS === 'web'
        ? window.confirm('Remove this illness?')
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Remove Illness', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
            ]);
          });
    if (!ok) return;

    await supabase.from('illnesses').delete().eq('id', id);
    setIllnesses((prev) => prev.filter((i) => i.id !== id));
  };

  const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

  if (!user) return null;

  const hasProfile = profile?.full_name || profile?.age || profile?.gender;
  const initials = (profile?.full_name || editName)
    .trim()
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const displayName = profile?.full_name || 'Your Name';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Avatar + Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.emailRow}>
              <Mail size={13} color={Colors.textTertiary} strokeWidth={2} />
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        </View>

        {hasProfile && (
          <View style={styles.summaryDivider} />
        )}

        {hasProfile && (
          <View style={styles.summaryDetails}>
            {profile?.age && (
              <View style={styles.detailItem}>
                <View style={[styles.detailIconCircle, { backgroundColor: Colors.primaryLight }]}>
                  <Calendar size={14} color={Colors.primary} strokeWidth={2} />
                </View>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{profile.age}</Text>
              </View>
            )}
            {profile?.gender && (
              <View style={styles.detailItem}>
                <View style={[styles.detailIconCircle, { backgroundColor: Colors.secondaryLight }]}>
                  <User size={14} color={Colors.secondary} strokeWidth={2} />
                </View>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{profile.gender}</Text>
              </View>
            )}
            {illnesses.length > 0 && (
              <View style={styles.detailItem}>
                <View style={[styles.detailIconCircle, { backgroundColor: Colors.dangerLight }]}>
                  <Heart size={14} color={Colors.danger} strokeWidth={2} />
                </View>
                <Text style={styles.detailLabel}>Illnesses</Text>
                <Text style={styles.detailValue}>{illnesses.length}</Text>
              </View>
            )}
          </View>
        )}

        {illnesses.length > 0 && (
          <View style={styles.illnessTags}>
            {illnesses.map((illness) => (
              <View key={illness.id} style={styles.illnessTag}>
                <Text style={styles.illnessTagText}>{illness.name}</Text>
                <TouchableOpacity onPress={() => deleteIllness(illness.id)} style={styles.illnessTagDelete}>
                  <X size={12} color={Colors.danger} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Edit Section - Collapsible */}
      <TouchableOpacity
        style={styles.editToggle}
        onPress={() => setShowEdit(!showEdit)}
        activeOpacity={0.7}>
        <View style={styles.editToggleLeft}>
          <Edit3 size={16} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.editToggleText}>Edit Personal Info</Text>
        </View>
        {showEdit ? (
          <ChevronUp size={18} color={Colors.textTertiary} strokeWidth={2} />
        ) : (
          <ChevronDown size={18} color={Colors.textTertiary} strokeWidth={2} />
        )}
      </TouchableOpacity>

      {showEdit && (
        <View style={styles.editCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={editAge}
              onChangeText={setEditAge}
              placeholder="Enter your age"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, editGender === g && styles.genderChipSelected]}
                  onPress={() => setEditGender(g)}>
                  <Text style={[styles.genderChipText, editGender === g && styles.genderChipTextSelected]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={saveProfile}
            disabled={saving}>
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Illnesses Section */}
      <View style={styles.illnessCard}>
        <Text style={styles.sectionTitle}>Current Illnesses</Text>

        {illnesses.length === 0 && (
          <Text style={styles.emptyText}>No illnesses added yet</Text>
        )}

        <View style={styles.addIllnessRow}>
          <TextInput
            style={styles.illnessInput}
            value={newIllness}
            onChangeText={setNewIllness}
            placeholder="Add illness..."
            placeholderTextColor={Colors.textTertiary}
            onSubmitEditing={addIllness}
          />
          <TouchableOpacity style={styles.addIllnessBtn} onPress={addIllness}>
            <Plus size={18} color={Colors.textInverse} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <LogOut size={18} color={Colors.danger} strokeWidth={2} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: Colors.primary,
  },
  avatarInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.h2,
    color: Colors.text,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.lg,
  },
  summaryDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  detailItem: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  detailIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailLabel: {
    ...Typography.small,
    color: Colors.textTertiary,
  },
  detailValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 14,
  },
  illnessTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  illnessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.xl,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  illnessTagText: {
    ...Typography.small,
    color: Colors.text,
    fontFamily: 'Inter-Medium',
  },
  illnessTagDelete: {
    padding: 2,
  },
  editToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  editToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editToggleText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
  editCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genderChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.xl,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  genderChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  genderChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  genderChipTextSelected: {
    color: Colors.primaryDark,
    fontFamily: 'Inter-SemiBold',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    ...Shadows.button,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  illnessCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  addIllnessRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  illnessInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  addIllnessBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    marginBottom: Spacing.xxxl,
  },
  signOutText: {
    ...Typography.bodyMedium,
    color: Colors.danger,
  },
});
