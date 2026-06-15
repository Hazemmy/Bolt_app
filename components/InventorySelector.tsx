import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { Colors, Radius, Typography, Spacing } from '@/lib/theme';

const ICON_MAP: Record<string, string> = {
  drawer: '\u{1F5C4}',
  cabinet: '\u{1F5C5}',
  shelf: '\u{1F4DA}',
  fridge: '\u{1F9CA}',
  bag: '\u{1F45C}',
  box: '\u{1F4E6}',
  basket: '\u{1F9F9}',
  closet: '\u{1F3E0}',
};

interface Inventory {
  id: string;
  name: string;
  icon: string;
}

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

export function InventorySelector({ value, onChange }: Props) {
  const { user } = useAuth();
  const [inventories, setInventories] = useState<Inventory[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('inventories')
        .select('id, name, icon')
        .eq('user_id', user!.id)
        .order('sort_order', { ascending: true });
      setInventories(data ?? []);
    };
    fetch();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Inventory</Text>
      <FlatList
        data={[{ id: '__none__', name: 'Unassigned', icon: 'box' }, ...inventories]}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = item.id === '__none__' ? value === null : value === item.id;
          return (
            <TouchableOpacity
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onChange(item.id === '__none__' ? null : item.id)}>
              <Text style={styles.chipIcon}>
                {item.id === '__none__' ? '\u{2753}' : ICON_MAP[item.icon] ?? '\u{1F4E6}'}
              </Text>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.chipGap} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.xl,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primaryDark,
    fontFamily: 'Inter-SemiBold',
  },
  chipGap: {
    width: Spacing.sm,
  },
});
