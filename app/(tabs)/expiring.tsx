import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AlertTriangle, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { MedicineCard } from '@/components/MedicineCard';
import { EditMedicineModal } from '@/components/EditMedicineModal';
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
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ExpiringScreen() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null);

  const fetchData = useCallback(async () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const dateStr = thirtyDaysFromNow.toISOString().split('T')[0];

    const [medRes, invRes] = await Promise.all([
      supabase
        .from('medicines')
        .select('*')
        .lte('expiration_date', dateStr)
        .order('expiration_date', { ascending: true }),
      supabase.from('inventories').select('id, name, icon').order('sort_order', { ascending: true }),
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

  const inventoryName = (id: string | null) => {
    if (!id) return null;
    const inv = inventories.find((i) => i.id === id);
    return inv ? `${ICON_MAP[inv.icon] ?? ''} ${inv.name}` : null;
  };

  const expired = medicines.filter((m) => daysUntil(m.expiration_date) < 0);
  const expiring = medicines.filter((m) => daysUntil(m.expiration_date) >= 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expiring Soon</Text>
        <Text style={styles.subtitle}>Medicines expiring within 30 days</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statDanger]}>
          <View style={styles.statIconCircle}>
            <AlertTriangle size={16} color={Colors.danger} strokeWidth={2} />
          </View>
          <Text style={styles.statNumber}>{expired.length}</Text>
          <Text style={styles.statLabel}>Expired</Text>
        </View>
        <View style={[styles.statCard, styles.statWarning]}>
          <View style={styles.statIconCircle}>
            <Clock size={16} color={Colors.warning} strokeWidth={2} />
          </View>
          <Text style={styles.statNumber}>{expiring.length}</Text>
          <Text style={styles.statLabel}>Expiring</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : medicines.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <AlertTriangle size={40} color={Colors.textTertiary} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>All clear!</Text>
          <Text style={styles.emptySubtext}>No medicines expiring soon</Text>
        </View>
      ) : (
        <FlatList
          data={medicines}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    ...Shadows.card,
  },
  statDanger: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  statWarning: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.h1,
    color: Colors.text,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
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
