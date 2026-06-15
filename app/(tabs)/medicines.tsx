import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  Search,
  Pill,
  ArrowDownAZ,
  ArrowUpAZ,
  ClockArrowDown,
  ClockArrowUp,
  Settings2,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { MedicineCard } from '@/components/MedicineCard';
import { EditMedicineModal } from '@/components/EditMedicineModal';
import { ManageInventoriesModal } from '@/components/ManageInventoriesModal';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';

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

type SortMode = 'expiring-soon' | 'expiring-late' | 'az' | 'za';

interface Medicine {
  id: string;
  name: string;
  expiration_date: string;
  quantity: number;
  notes: string | null;
  inventory_id: string | null;
  created_at: string;
}

interface Inventory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function MedicinesScreen() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null);
  const [showManageInventories, setShowManageInventories] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('expiring-soon');

  const fetchData = useCallback(async () => {
    const [medRes, invRes] = await Promise.all([
      supabase.from('medicines').select('*').order('expiration_date', { ascending: true }),
      supabase.from('inventories').select('*').order('sort_order', { ascending: true }),
    ]);
    if (medRes.data) setMedicines(medRes.data);
    if (invRes.data) setInventories(invRes.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) fetchData();
    }, [user, fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const confirmDelete = (id: string): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return Promise.resolve(window.confirm('Are you sure you want to delete this medicine?'));
    }
    return new Promise((resolve) => {
      Alert.alert('Delete Medicine', 'Are you sure you want to delete this medicine?', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
  };

  const deleteMedicine = async (id: string) => {
    const ok = await confirmDelete(id);
    if (!ok) return;
    const { error } = await supabase.from('medicines').delete().eq('id', id);
    if (error) {
      Alert.alert('Error', 'Failed to delete medicine. Please try again.');
    } else {
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const cycleSort = () => {
    const modes: SortMode[] = ['expiring-soon', 'expiring-late', 'az', 'za'];
    const idx = modes.indexOf(sortMode);
    setSortMode(modes[(idx + 1) % modes.length]);
  };

  const sortIcon = () => {
    switch (sortMode) {
      case 'expiring-soon':
        return <ClockArrowDown size={16} color={Colors.primary} strokeWidth={2} />;
      case 'expiring-late':
        return <ClockArrowUp size={16} color={Colors.primary} strokeWidth={2} />;
      case 'az':
        return <ArrowDownAZ size={16} color={Colors.primary} strokeWidth={2} />;
      case 'za':
        return <ArrowUpAZ size={16} color={Colors.primary} strokeWidth={2} />;
    }
  };

  const sortLabel = () => {
    switch (sortMode) {
      case 'expiring-soon':
        return 'Expiring soon';
      case 'expiring-late':
        return 'Latest exp.';
      case 'az':
        return 'A - Z';
      case 'za':
        return 'Z - A';
    }
  };

  let filtered = medicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedInventory) {
    filtered = filtered.filter((m) => m.inventory_id === selectedInventory);
  }

  filtered = [...filtered].sort((a, b) => {
    switch (sortMode) {
      case 'expiring-soon':
        return daysUntil(a.expiration_date) - daysUntil(b.expiration_date);
      case 'expiring-late':
        return daysUntil(b.expiration_date) - daysUntil(a.expiration_date);
      case 'az':
        return a.name.localeCompare(b.name);
      case 'za':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  if (!user) return null;

  const inventoryName = (id: string | null) => {
    if (!id) return null;
    const inv = inventories.find((i) => i.id === id);
    return inv ? `${ICON_MAP[inv.icon] ?? ''} ${inv.name}` : null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Medicines</Text>
          <Text style={styles.subtitle}>
            {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} tracked
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowManageInventories(true)} style={styles.iconBtn}>
          <Settings2 size={18} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Search size={18} color={Colors.textTertiary} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search medicines..."
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {inventories.length > 0 && (
        <View style={styles.filterRow}>
          <FlatList
            data={[{ id: '__all__', name: 'All', icon: 'box' }, ...inventories]}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected =
                item.id === '__all__' ? selectedInventory === null : selectedInventory === item.id;
              return (
                <TouchableOpacity
                  style={[styles.invChip, isSelected && styles.invChipSelected]}
                  onPress={() => setSelectedInventory(item.id === '__all__' ? null : item.id)}>
                  <Text style={styles.invChipIcon}>
                    {item.id === '__all__' ? '\u{1F4CA}' : ICON_MAP[item.icon] ?? '\u{1F4E6}'}
                  </Text>
                  <Text style={[styles.invChipText, isSelected && styles.invChipTextSelected]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.chipGap} />}
          />
        </View>
      )}

      <View style={styles.sortRow}>
        <TouchableOpacity onPress={cycleSort} style={styles.sortBtn}>
          {sortIcon()}
          <Text style={styles.sortLabel}>{sortLabel()}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <Pill size={40} color={Colors.textTertiary} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>
            {search ? 'No results found' : 'No medicines yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {search
              ? 'Try a different search term'
              : 'Tap the + button to add your first medicine'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicineCard
              medicine={item}
              onDelete={deleteMedicine}
              onEdit={setEditMedicine}
              inventoryName={inventoryName(item.inventory_id)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <EditMedicineModal
        visible={editMedicine !== null}
        medicine={editMedicine}
        onClose={() => setEditMedicine(null)}
        onSaved={fetchData}
      />

      <ManageInventoriesModal
        visible={showManageInventories}
        onClose={() => setShowManageInventories(false)}
        onInventoriesChanged={fetchData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.h1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  iconBtn: {
    padding: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    ...Shadows.card,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  filterRow: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  invChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.xl,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  invChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  invChipIcon: {
    fontSize: 14,
  },
  invChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  invChipTextSelected: {
    color: Colors.primaryDark,
    fontFamily: 'Inter-SemiBold',
  },
  chipGap: {
    width: Spacing.sm,
  },
  sortRow: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignSelf: 'flex-start',
  },
  sortLabel: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontFamily: 'Inter-SemiBold',
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  separator: {
    height: Spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 48,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
