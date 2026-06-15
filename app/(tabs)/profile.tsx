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
  FlatList,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { User, Plus, X, Trash2, LogOut } from 'lucide-react-native';
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

  // Edit fields
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
      // Create empty profile
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

  const initials = editName
    .trim()
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

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

      <View style={styles.avatarCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{editName || 'Your Name'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Personal Info</Text>

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

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Current Illnesses</Text>

        {illnesses.length > 0 && (
          <View style={styles.illnessList}>
            {illnesses.map((illness) => (
              <View key={illness.id} style={styles.illnessChip}>
                <Text style={styles.illnessChipText}>{illness.name}</Text>
                <TouchableOpacity onPress={() => deleteIllness(illness.id)} style={styles.illnessDeleteBtn}>
                  <X size={14} color={Colors.textTertiary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

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
  avatarCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.primary,
  },
  userName: {
    ...Typography.h3,
    color: Colors.text,
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  sectionCard: {
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
  illnessList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  illnessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.xl,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  illnessChipText: {
    ...Typography.caption,
    color: Colors.text,
  },
  illnessDeleteBtn: {
    padding: 2,
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
