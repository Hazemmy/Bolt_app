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
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Search,
  Pill,
  ArrowDownAZ,
  ArrowUpAZ,
  ClockArrowDown,
  ClockArrowUp,
  Settings2,
  X,
  Tag,
} from 'lucide-react-native';
import { useStorage, Medicine } from '@/context/storage';
import { useTheme } from '@/context/theme';
import { useLanguage } from '@/context/language';
import { MedicineCard } from '@/components/MedicineCard';
import { EditMedicineModal } from '@/components/EditMedicineModal';
import { ManageInventoriesModal } from '@/components/ManageInventoriesModal';
import { MedicineDetailModal } from '@/components/MedicineDetailModal';
import { AddToScheduleModal } from '@/components/AddToScheduleModal';
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
type StatusFilter = 'all' | 'expired' | 'expiring' | 'good';

const CATEGORIES = [
  { key: 'all', emoji: '\u{1F4CA}' },
  { key: 'antibiotic', emoji: '\u{1F9A0}' },
  { key: 'painkiller', emoji: '\u{1F48A}' },
  { key: 'antihistamine', emoji: '\u{1F9E7}' },
  { key: 'antiviral', emoji: '\u{1F52C}' },
  { key: 'vitamin', emoji: '\u{1F33F}' },
  { key: 'supplement', emoji: '\u{1FAD9}' },
  { key: 'antifungal', emoji: '\u{1F354}' },
  { key: 'antacid', emoji: '\u{1FAC0}' },
  { key: 'steroid', emoji: '\u{2697}' },
  { key: 'other', emoji: '\u{1F4CB}' },
];

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function MedicinesScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { medicines, inventories, deleteMedicine, refresh, isLocal } = useStorage();
  const params = useLocalSearchParams<{ filter?: string }>();

  const resolvedFilter: StatusFilter =
    params.filter === 'expired' || params.filter === 'expiring' || params.filter === 'good'
      ? params.filter : 'all';

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null);
  const [detailMedicine, setDetailMedicine] = useState<Medicine | null>(null);
  const [scheduleMedicine, setScheduleMedicine] = useState<Medicine | null>(null);
  const [showManageInventories, setShowManageInventories] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('expiring-soon');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(resolvedFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      const incoming: StatusFilter =
        params.filter === 'expired' || params.filter === 'expiring' || params.filter === 'good'
          ? params.filter : 'all';
      setStatusFilter(incoming);
    }, [params.filter])
  );

  const confirmDelete = (id: string): Promise<boolean> => {
    if (Platform.OS === 'web') return Promise.resolve(window.confirm(t.medicines.deleteMedicineConfirm));
    return new Promise((resolve) => {
      Alert.alert(t.medicines.deleteMedicineTitle, t.medicines.deleteMedicineConfirm, [
        { text: t.common.cancel, style: 'cancel', onPress: () => resolve(false) },
        { text: t.common.delete, style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDelete(id);
    if (!ok) return;
    await deleteMedicine(id);
  };

  const cycleSort = () => {
    const modes: SortMode[] = ['expiring-soon', 'expiring-late', 'az', 'za'];
    setSortMode(modes[(modes.indexOf(sortMode) + 1) % modes.length]);
  };

  const cycleCategory = () => {
    const currentIndex = CATEGORIES.findIndex(c => c.key === selectedCategory);
    const nextIndex = (currentIndex + 1) % CATEGORIES.length;
    setSelectedCategory(CATEGORIES[nextIndex].key);
  };

  const sortIcon = () => {
    switch (sortMode) {
      case 'expiring-soon': return <ClockArrowDown size={16} color={colors.primary} strokeWidth={2} />;
      case 'expiring-late': return <ClockArrowUp size={16} color={colors.primary} strokeWidth={2} />;
      case 'az': return <ArrowDownAZ size={16} color={colors.primary} strokeWidth={2} />;
      case 'za': return <ArrowUpAZ size={16} color={colors.primary} strokeWidth={2} />;
    }
  };

  const sortLabel = () => {
    switch (sortMode) {
      case 'expiring-soon': return t.medicines.sortBy.expiringSoon;
      case 'expiring-late': return t.medicines.sortBy.latestExp;
      case 'az': return t.medicines.sortBy.az;
      case 'za': return t.medicines.sortBy.za;
    }
  };

  const getCategoryLabel = (key: string): string => {
    switch (key) {
      case 'all': return t.medicines.categories.all;
      case 'antibiotic': return t.medicines.categories.antibiotic;
      case 'painkiller': return t.medicines.categories.painkiller;
      case 'antihistamine': return t.medicines.categories.antihistamine;
      case 'antiviral': return t.medicines.categories.antiviral;
      case 'vitamin': return t.medicines.categories.vitamin;
      case 'supplement': return t.medicines.categories.supplement;
      case 'antifungal': return t.medicines.categories.antifungal;
      case 'antacid': return t.medicines.categories.antacid;
      case 'steroid': return t.medicines.categories.steroid;
      case 'other': return t.medicines.categories.other;
      default: return key;
    }
  };

  const selectedCategoryData = CATEGORIES.find(c => c.key === selectedCategory) || CATEGORIES[0];

  let filtered = medicines.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  if (selectedInventory) filtered = filtered.filter((m) => m.inventory_id === selectedInventory);

  // Filter by selected category
  if (selectedCategory !== 'all') {
    filtered = filtered.filter((m) => m.category?.toLowerCase() === selectedCategory);
  }

  if (statusFilter === 'expired') filtered = filtered.filter((m) => daysUntil(m.expiration_date) < 0);
  else if (statusFilter === 'expiring') filtered = filtered.filter((m) => { const d = daysUntil(m.expiration_date); return d >= 0 && d <= 30; });
  else if (statusFilter === 'good') filtered = filtered.filter((m) => daysUntil(m.expiration_date) > 30);

  filtered = [...filtered].sort((a, b) => {
    switch (sortMode) {
      case 'expiring-soon': return daysUntil(a.expiration_date) - daysUntil(b.expiration_date);
      case 'expiring-late': return daysUntil(b.expiration_date) - daysUntil(a.expiration_date);
      case 'az': return a.name.localeCompare(b.name);
      case 'za': return b.name.localeCompare(a.name);
      default: return 0;
    }
  });

  const inventoryName = (id: string | null) => {
    if (!id) return null;
    const inv = inventories.find((i) => i.id === id);
    return inv ? `${ICON_MAP[inv.icon] ?? ''} ${inv.name}` : null;
  };

  const STATUS_FILTER_COLOR: Record<StatusFilter, string> = {
    all: colors.primary, expired: colors.danger, expiring: colors.warning, good: colors.success,
  };

  const accentColor = STATUS_FILTER_COLOR[statusFilter];

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    greeting: { ...Typography.h1, color: colors.text },
    subtitle: { ...Typography.body, color: colors.textSecondary, marginTop: 2 },
    iconBtn: { padding: 10, borderRadius: Radius.md, backgroundColor: colors.card, ...Shadows.card },
    searchRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: Radius.lg,
      marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
      paddingHorizontal: Spacing.lg, paddingVertical: 2,
      borderWidth: 1.5, borderColor: colors.inputBorder, ...Shadows.card,
    },
    searchInput: {
      flex: 1, ...Typography.body, color: colors.text,
      paddingVertical: 12, paddingHorizontal: Spacing.md,
    },
    invChip: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingHorizontal: Spacing.lg, paddingVertical: 8,
      borderRadius: Radius.xl, backgroundColor: colors.card,
      borderWidth: 1.5, borderColor: colors.inputBorder,
    },
    invChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    invChipText: { ...Typography.caption, color: colors.textSecondary },
    invChipTextSelected: { color: colors.primaryDark, fontFamily: 'Inter-SemiBold' },
    sortRow: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    sortBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingHorizontal: Spacing.lg, paddingVertical: 8,
      borderRadius: Radius.xl, backgroundColor: colors.primaryLight,
      borderWidth: 1.5, borderColor: colors.primary,
    },
    categoryBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingHorizontal: Spacing.lg, paddingVertical: 8,
      borderRadius: Radius.xl, backgroundColor: colors.secondaryLight,
      borderWidth: 1.5, borderColor: colors.secondary,
    },
    sortBtnLabel: { ...Typography.caption, color: colors.primaryDark, fontFamily: 'Inter-SemiBold' },
    categoryBtnLabel: { ...Typography.caption, color: colors.secondaryDark, fontFamily: 'Inter-SemiBold' },
    sortLabel: { ...Typography.small, color: colors.textTertiary },
    manageBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      padding: 10, borderRadius: Radius.md, backgroundColor: colors.card, ...Shadows.card
    },
    manageBtnText: { ...Typography.small, color: colors.textSecondary },
    emptyIconCircle: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: colors.inputBg, justifyContent: 'center',
      alignItems: 'center', marginBottom: Spacing.sm,
    },
    emptyTitle: { ...Typography.h3, color: colors.text },
    emptySubtext: { ...Typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 48 },
    emptyText: { ...Typography.body, color: colors.textSecondary },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={styles.header}>
        <View>
          <Text style={dynamicStyles.greeting}>{t.medicines.title}</Text>
          <Text style={dynamicStyles.subtitle}>{medicines.length} {t.medicines.medicinesTracked}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowManageInventories(true)} style={dynamicStyles.manageBtn}>
          <Settings2 size={16} color={colors.textSecondary} strokeWidth={2} />
          <Text style={dynamicStyles.manageBtnText}>{t.medicines.inventories}</Text>
        </TouchableOpacity>
      </View>

      {statusFilter !== 'all' && (
        <View style={styles.activeFilterRow}>
          <View style={[styles.activeFilterPill, { borderColor: accentColor, backgroundColor: accentColor + '18' }]}>
            <View style={[styles.activeFilterDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.activeFilterText, { color: accentColor }]}>{statusFilter === 'expired' ? t.medicines.status.expired : statusFilter === 'expiring' ? t.medicines.status.expiring : t.medicines.status.good}</Text>
            <TouchableOpacity onPress={() => setStatusFilter('all')} style={styles.activeFilterClear}>
              <X size={13} color={accentColor} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={dynamicStyles.searchRow}>
        <Search size={18} color={colors.textTertiary} strokeWidth={2} />
        <TextInput
          style={dynamicStyles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t.medicines.searchPlaceholder}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {inventories.length > 0 && (
        <View style={styles.filterRow}>
          <FlatList
            data={[{ id: '__all__', name: t.medicines.allInventories, icon: 'box' }, ...inventories]}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.id === '__all__' ? selectedInventory === null : selectedInventory === item.id;
              return (
                <TouchableOpacity
                  style={[dynamicStyles.invChip, isSelected && dynamicStyles.invChipSelected]}
                  onPress={() => setSelectedInventory(item.id === '__all__' ? null : item.id)}>
                  <Text style={styles.invChipIcon}>
                    {item.id === '__all__' ? '\u{1F4CA}' : ICON_MAP[item.icon] ?? '\u{1F4E6}'}
                  </Text>
                  <Text style={[dynamicStyles.invChipText, isSelected && dynamicStyles.invChipTextSelected]}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.chipGap} />}
          />
        </View>
      )}

      <View style={dynamicStyles.sortRow}>
        <Text style={dynamicStyles.sortLabel}>{t.medicines.sort}:</Text>
        <TouchableOpacity onPress={cycleSort} style={dynamicStyles.sortBtn}>
          {sortIcon()}
          <Text style={dynamicStyles.sortBtnLabel}>{sortLabel()}</Text>
        </TouchableOpacity>
        <Text style={[dynamicStyles.sortLabel, { marginLeft: Spacing.md }]}>{t.medicines.filter}:</Text>
        <TouchableOpacity onPress={cycleCategory} style={dynamicStyles.categoryBtn}>
          <Text style={styles.categoryEmoji}>{selectedCategoryData.emoji}</Text>
          <Text style={dynamicStyles.categoryBtnLabel}>{getCategoryLabel(selectedCategoryData.key)}</Text>
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.center}>
          <View style={dynamicStyles.emptyIconCircle}>
            <Pill size={40} color={colors.textTertiary} strokeWidth={1.5} />
          </View>
          <Text style={dynamicStyles.emptyTitle}>
            {search ? t.medicines.noResults : statusFilter !== 'all' ? t.medicines.status[statusFilter] : t.medicines.noMedicines}
          </Text>
          <Text style={dynamicStyles.emptySubtext}>
            {search ? t.medicines.noResults : statusFilter !== 'all' ? t.common.all : t.medicines.noMedicinesDesc}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicineCard
              medicine={item}
              onDelete={handleDelete}
              onEdit={setEditMedicine}
              onPress={setDetailMedicine}
              inventoryName={inventoryName(item.inventory_id)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <MedicineDetailModal
        medicine={detailMedicine}
        visible={detailMedicine !== null}
        inventoryName={detailMedicine ? inventoryName(detailMedicine.inventory_id) : null}
        onClose={() => setDetailMedicine(null)}
        onEdit={(m) => { setDetailMedicine(null); setEditMedicine(m); }}
        onDelete={handleDelete}
        onAddToSchedule={(m) => { setDetailMedicine(null); setScheduleMedicine(m); }}
      />

      <AddToScheduleModal
        medicine={scheduleMedicine}
        visible={scheduleMedicine !== null}
        onClose={() => setScheduleMedicine(null)}
        onSaved={() => {}}
      />

      <EditMedicineModal
        visible={editMedicine !== null}
        medicine={editMedicine}
        onClose={() => setEditMedicine(null)}
        onSaved={refresh}
      />

      <ManageInventoriesModal
        visible={showManageInventories}
        onClose={() => setShowManageInventories(false)}
        onInventoriesChanged={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: 56, paddingBottom: Spacing.sm,
  },
  activeFilterRow: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  activeFilterPill: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    alignSelf: 'flex-start', paddingHorizontal: Spacing.md,
    paddingVertical: 7, borderRadius: Radius.xl, borderWidth: 1.5,
  },
  activeFilterDot: { width: 8, height: 8, borderRadius: 4 },
  activeFilterText: { ...Typography.caption, fontFamily: 'Inter-SemiBold' },
  activeFilterClear: { padding: 2, marginLeft: 2 },
  filterRow: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  invChipIcon: { fontSize: 14 },
  chipGap: { width: Spacing.sm },
  categoryEmoji: { fontSize: 14 },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  separator: { height: Spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, paddingBottom: 60 },
});
