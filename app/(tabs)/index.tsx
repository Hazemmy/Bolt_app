import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, FlatList } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pill, AlertTriangle, CheckCircle2, Clock, Archive } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';
import Svg, { Circle } from 'react-native-svg';

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

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface DonutChartProps {
  good: number;
  expiring: number;
  expired: number;
  size?: number;
}

function DonutChart({ good, expiring, expired, size = 180 }: DonutChartProps) {
  const total = good + expiring + expired;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (total === 0) {
    return (
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.inputBorder}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
        <View style={styles.chartCenter}>
          <Text style={styles.chartTotal}>0</Text>
          <Text style={styles.chartLabel}>medicines</Text>
        </View>
      </View>
    );
  }

  const goodPct = good / total;
  const expiringPct = expiring / total;
  const expiredPct = expired / total;

  const goodStroke = circumference * goodPct;
  const expiringStroke = circumference * expiringPct;
  const expiredStroke = circumference * expiredPct;

  const expiredOffset = 0;
  const expiringOffset = expiredStroke;
  const goodOffset = expiredStroke + expiringStroke;

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.inputBg}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {good > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.success}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${goodStroke} ${circumference - goodStroke}`}
            strokeDashoffset={-goodOffset}
            strokeLinecap="round"
          />
        )}
        {expiring > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.warning}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${expiringStroke} ${circumference - expiringStroke}`}
            strokeDashoffset={-expiringOffset}
            strokeLinecap="round"
          />
        )}
        {expired > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.danger}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${expiredStroke} ${circumference - expiredStroke}`}
            strokeDashoffset={-expiredOffset}
            strokeLinecap="round"
          />
        )}
      </Svg>
      <View style={styles.chartCenter}>
        <Text style={styles.chartTotal}>{total}</Text>
        <Text style={styles.chartLabel}>medicines</Text>
      </View>
    </View>
  );
}

interface Inventory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const fetchData = useCallback(async () => {
    const [medRes, profRes, invRes] = await Promise.all([
      supabase.from('medicines').select('*').order('expiration_date', { ascending: true }),
      supabase.from('profiles').select('*').eq('id', user!.id).single(),
      supabase.from('inventories').select('*').order('sort_order', { ascending: true }),
    ]);
    if (medRes.data) setMedicines(medRes.data);
    if (profRes.data) setProfile(profRes.data);
    if (invRes.data) setInventories(invRes.data);
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

  const expired = medicines.filter((m) => daysUntil(m.expiration_date) < 0);
  const expiring = medicines.filter((m) => {
    const d = daysUntil(m.expiration_date);
    return d >= 0 && d <= 30;
  });
  const good = medicines.filter((m) => daysUntil(m.expiration_date) > 30);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const inventoryMedCount = (invId: string) =>
    medicines.filter((m) => m.inventory_id === invId).length;

  const unassignedCount = medicines.filter((m) => !m.inventory_id).length;

  if (!user) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.userName}>{profile?.full_name || 'there'}</Text>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Medicine Overview</Text>
        <DonutChart good={good.length} expiring={expiring.length} expired={expired.length} />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Good ({good.length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
            <Text style={styles.legendText}>Expiring soon ({expiring.length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
            <Text style={styles.legendText}>Expired ({expired.length})</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
          <View style={styles.statIconWrap}>
            <Pill size={18} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.statNumber}>{medicines.length}</Text>
          <Text style={styles.statCaption}>Total Medicines</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: Colors.danger }]}>
          <View style={styles.statIconWrap}>
            <AlertTriangle size={18} color={Colors.danger} strokeWidth={2} />
          </View>
          <Text style={styles.statNumber}>{expired.length}</Text>
          <Text style={styles.statCaption}>Expired</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
          <View style={styles.statIconWrap}>
            <Clock size={18} color={Colors.warning} strokeWidth={2} />
          </View>
          <Text style={styles.statNumber}>{expiring.length}</Text>
          <Text style={styles.statCaption}>Expiring Soon</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
          <View style={styles.statIconWrap}>
            <CheckCircle2 size={18} color={Colors.success} strokeWidth={2} />
          </View>
          <Text style={styles.statNumber}>{good.length}</Text>
          <Text style={styles.statCaption}>Good</Text>
        </View>
      </View>

      {/* Inventories Section */}
      <View style={styles.inventorySection}>
        <View style={styles.inventoryHeader}>
          <View style={styles.inventoryHeaderLeft}>
            <Archive size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.inventoryTitle}>My Inventories</Text>
          </View>
          <Text style={styles.inventoryCount}>{inventories.length} location{inventories.length !== 1 ? 's' : ''}</Text>
        </View>

        {inventories.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyInventoryCard}
            onPress={() => router.navigate('/(tabs)/medicines')}
            activeOpacity={0.7}>
            <View style={styles.emptyInventoryIcon}>
              <Archive size={28} color={Colors.textTertiary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyInventoryTitle}>No inventories yet</Text>
            <Text style={styles.emptyInventorySubtext}>
              Go to Medicines to create your first inventory
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inventoryGrid}>
            {inventories.map((inv) => {
              const count = inventoryMedCount(inv.id);
              return (
                <TouchableOpacity
                  key={inv.id}
                  style={styles.inventoryCard}
                  onPress={() => router.navigate('/(tabs)/medicines')}
                  activeOpacity={0.7}>
                  <View style={styles.inventoryCardIcon}>
                    <Text style={styles.inventoryEmoji}>{ICON_MAP[inv.icon] ?? '\u{1F4E6}'}</Text>
                  </View>
                  <Text style={styles.inventoryCardName} numberOfLines={1}>{inv.name}</Text>
                  <View style={styles.inventoryBadge}>
                    <Pill size={10} color={Colors.primary} strokeWidth={2.5} />
                    <Text style={styles.inventoryBadgeText}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {unassignedCount > 0 && (
              <TouchableOpacity
                style={styles.inventoryCard}
                onPress={() => router.navigate('/(tabs)/medicines')}
                activeOpacity={0.7}>
                <View style={[styles.inventoryCardIcon, { backgroundColor: Colors.warningLight }]}>
                  <Text style={styles.inventoryEmoji}>{'\u{2753}'}</Text>
                </View>
                <Text style={styles.inventoryCardName} numberOfLines={1}>Unassigned</Text>
                <View style={[styles.inventoryBadge, { backgroundColor: Colors.warningLight }]}>
                  <Pill size={10} color={Colors.warning} strokeWidth={2.5} />
                  <Text style={[styles.inventoryBadgeText, { color: Colors.warning }]}>{unassignedCount}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {expired.length > 0 && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={18} color={Colors.danger} strokeWidth={2} />
            <Text style={styles.alertTitle}>Attention Needed</Text>
          </View>
          <Text style={styles.alertText}>
            You have {expired.length} expired medicine{expired.length !== 1 ? 's' : ''} that {expired.length !== 1 ? 'need' : 'needs'} to be replaced or removed.
          </Text>
        </View>
      )}
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
  greeting: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  userName: {
    ...Typography.h1,
    color: Colors.text,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTotal: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    color: Colors.text,
    lineHeight: 40,
  },
  chartLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    ...Shadows.card,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statNumber: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.text,
  },
  statCaption: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inventorySection: {
    marginBottom: Spacing.lg,
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  inventoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inventoryTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  inventoryCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  inventoryCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  inventoryCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  inventoryEmoji: {
    fontSize: 22,
  },
  inventoryCardName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  inventoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryLight,
  },
  inventoryBadgeText: {
    ...Typography.small,
    color: Colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  emptyInventoryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.card,
  },
  emptyInventoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyInventoryTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  emptyInventorySubtext: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  alertCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  alertTitle: {
    ...Typography.h3,
    color: Colors.danger,
  },
  alertText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
