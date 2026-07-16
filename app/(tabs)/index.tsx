import { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Pill, AlertTriangle, CheckCircle2, Clock, Archive, ChevronRight, AlarmClock, Activity, Bell,
} from 'lucide-react-native';
import { useStorage, Medicine, ActiveMedication } from '@/context/storage';
import { useTheme } from '@/context/theme';
import { useLanguage } from '@/context/language';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';
import { AddToScheduleModal } from '@/components/AddToScheduleModal';
import {
  requestNotificationPermission,
  scheduleDailyReminders,
  checkExpiryNotifications,
  getNextReminderTime,
} from '@/lib/notifications';
import Svg, { Circle } from 'react-native-svg';
import { useState } from 'react';

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

const CATEGORY_EMOJI: Record<string, string> = {
  antibiotic: '🦠', painkiller: '💊', antihistamine: '🤧', antiviral: '🔬',
  vitamin: '🌿', supplement: '🫙', antifungal: '🍄', antacid: '🫀', steroid: '⚗️', other: '📋',
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

interface DonutChartProps {
  good: number; expiring: number; expired: number; size?: number; colors: typeof Colors; medicinesWord: string;
}

function DonutChart({ good, expiring, expired, size = 180, colors, medicinesWord }: DonutChartProps) {
  const total = good + expiring + expired;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (total === 0) {
    return (
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <Circle cx={center} cy={center} r={radius} stroke={colors.inputBorder} strokeWidth={strokeWidth} fill="none" />
        </Svg>
        <View style={styles.chartCenter}>
          <Text style={[styles.chartTotal, { color: colors.text }]}>0</Text>
          <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{medicinesWord}</Text>
        </View>
      </View>
    );
  }

  const goodStroke = circumference * (good / total);
  const expiringStroke = circumference * (expiring / total);
  const expiredStroke = circumference * (expired / total);

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={center} cy={center} r={radius} stroke={colors.inputBg} strokeWidth={strokeWidth} fill="none" />
        {good > 0 && (
          <Circle cx={center} cy={center} r={radius} stroke={colors.success} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${goodStroke} ${circumference - goodStroke}`}
            strokeDashoffset={-(expiredStroke + expiringStroke)} strokeLinecap="round" />
        )}
        {expiring > 0 && (
          <Circle cx={center} cy={center} r={radius} stroke={colors.warning} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${expiringStroke} ${circumference - expiringStroke}`}
            strokeDashoffset={-expiredStroke} strokeLinecap="round" />
        )}
        {expired > 0 && (
          <Circle cx={center} cy={center} r={radius} stroke={colors.danger} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${expiredStroke} ${circumference - expiredStroke}`}
            strokeDashoffset={0} strokeLinecap="round" />
        )}
      </Svg>
      <View style={styles.chartCenter}>
        <Text style={[styles.chartTotal, { color: colors.text }]}>{total}</Text>
        <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{medicinesWord}</Text>
      </View>
    </View>
  );
}

interface StatCardProps {
  accentColor: string;
  icon: React.ReactNode;
  number: number;
  caption: string;
  onPress: () => void;
  colors: typeof Colors;
}

function StatCard({ accentColor, icon, number, caption, onPress, colors }: StatCardProps) {
  return (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: accentColor, backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.statCardTop}>
        <View style={[styles.statIconWrap, { backgroundColor: colors.inputBg }]}>{icon}</View>
        <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
      </View>
      <Text style={[styles.statNumber, { color: colors.text }]}>{number}</Text>
      <Text style={[styles.statCaption, { color: colors.textSecondary }]}>{caption}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const { medicines, inventories, activeMedications, profile, loading, refresh, removeActiveMedication, isLocal } = useStorage();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<{ id: string; name: string; category: string | null } | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Setup notifications on mount
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      const granted = await requestNotificationPermission();
      if (!granted || cancelled) return;
      await scheduleDailyReminders(
        activeMedications,
        (id: string) => medicines.find(m => m.id === id)?.name ?? t.home.medicinesWord
      );
      if (cancelled) return;
      if (profile?.notify_expired || profile?.notify_expiring_soon) {
        await checkExpiryNotifications(
          medicines,
          profile?.notify_expired ?? true,
          profile?.notify_expiring_soon ?? true
        );
      }
    })();
    return () => { cancelled = true; };
  }, [loading, activeMedications, medicines, profile]);

  const nextReminder = getNextReminderTime(activeMedications);

  const expired = medicines.filter((m) => daysUntil(m.expiration_date) < 0);
  const expiring = medicines.filter((m) => { const d = daysUntil(m.expiration_date); return d >= 0 && d <= 30; });
  const good = medicines.filter((m) => daysUntil(m.expiration_date) > 30);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.home.greeting.morning;
    if (hour < 18) return t.home.greeting.afternoon;
    return t.home.greeting.evening;
  };

  const goToMedicines = (filter?: 'expired' | 'expiring' | 'good' | 'all') => {
    router.navigate({ pathname: '/(tabs)/medicines', params: filter ? { filter } : {} });
  };

  const inventoryMedCount = (invId: string) => medicines.filter((m) => m.inventory_id === invId).length;
  const unassignedCount = medicines.filter((m) => !m.inventory_id).length;

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    greeting: { ...Typography.body, color: colors.textSecondary },
    userName: { ...Typography.h1, color: colors.text, marginTop: 2 },
    chartCard: {
      backgroundColor: colors.card, borderRadius: Radius.xl,
      padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.card,
    },
    cardTitle: { ...Typography.h3, color: colors.text, marginBottom: Spacing.lg, alignSelf: 'flex-start' },
    legendText: { ...Typography.caption, color: colors.textSecondary },
    emptyActiveCard: {
      backgroundColor: colors.card, borderRadius: Radius.xl,
      padding: Spacing.xxl, alignItems: 'center', gap: Spacing.sm, ...Shadows.card,
    },
    emptyActiveTitle: { ...Typography.h3, color: colors.text },
    emptyActiveSub: { ...Typography.caption, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: 16 },
    activeMedCard: {
      backgroundColor: colors.card, borderRadius: Radius.xl,
      padding: Spacing.lg, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'space-between', ...Shadows.card,
    },
    activeMedName: { ...Typography.h3, color: colors.text, fontSize: 15 },
    activeMedDosage: { ...Typography.caption, color: colors.primary, fontFamily: 'Inter-SemiBold', marginTop: 1 },
    sectionTitle: { ...Typography.h3, color: colors.text },
    sectionCount: { ...Typography.caption, color: colors.textTertiary },
    inventoryTitle: { ...Typography.h3, color: colors.text },
    inventoryCount: { ...Typography.caption, color: colors.textTertiary },
    inventoryCard: {
      width: '47%', backgroundColor: colors.card,
      borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center', ...Shadows.card,
    },
    inventoryCardName: { ...Typography.bodyMedium, color: colors.text, fontSize: 14, marginBottom: Spacing.xs },
    emptyInventoryCard: {
      backgroundColor: colors.card, borderRadius: Radius.xl,
      padding: Spacing.xxl, alignItems: 'center', ...Shadows.card,
    },
    emptyInventoryTitle: { ...Typography.h3, color: colors.text },
    emptyInventorySubtext: {
      ...Typography.caption, color: colors.textTertiary,
      textAlign: 'center', marginTop: 4, paddingHorizontal: 16,
    },
  });

  return (
    <ScrollView
      style={dynamicStyles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>

      <View style={styles.header}>
        <Text style={dynamicStyles.greeting}>{greeting()}</Text>
        <Text style={dynamicStyles.userName}>{profile?.full_name || (isRTL ? 'ضيف' : 'there')}</Text>
        {isLocal && (
          <View style={[styles.localBadge, { backgroundColor: colors.warningLight, borderColor: colors.warningBorder }]}>
            <Text style={[styles.localBadgeText, { color: colors.warning }]}>{t.home.localMode}</Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={dynamicStyles.chartCard}>
        <Text style={dynamicStyles.cardTitle}>{t.home.medicineOverview}</Text>
        <DonutChart good={good.length} expiring={expiring.length} expired={expired.length} colors={colors} medicinesWord={t.home.medicinesWord} />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={dynamicStyles.legendText}>{t.home.goodLabel} ({good.length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={dynamicStyles.legendText}>{t.home.expiringSoonLabel} ({expiring.length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Text style={dynamicStyles.legendText}>{t.home.expiredLabel} ({expired.length})</Text>
          </View>
        </View>
      </View>

      {/* Sync prompt for local users */}
      {isLocal && medicines.length > 0 && (
        <TouchableOpacity
          style={[styles.syncPrompt, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}
          onPress={() => router.navigate('/(tabs)/profile')}
          activeOpacity={0.8}>
          <View style={styles.syncPromptLeft}>
            <Cloud size={24} color={colors.primary} strokeWidth={1.5} />
            <View style={styles.syncPromptInfo}>
              <Text style={[styles.syncPromptTitle, { color: colors.primaryDark }]}>{t.home.saveYourMeds}</Text>
              <Text style={[styles.syncPromptSub, { color: colors.primary }]}>{t.home.signInToSyncCloud}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Stat cards */}
      <View style={styles.statsGrid}>
        <StatCard accentColor={colors.primary} icon={<Pill size={18} color={colors.primary} strokeWidth={2} />}
          number={medicines.length} caption={t.home.totalMedicines} onPress={() => goToMedicines('all')} colors={colors} />
        <StatCard accentColor={colors.danger} icon={<AlertTriangle size={18} color={colors.danger} strokeWidth={2} />}
          number={expired.length} caption={t.home.expired} onPress={() => goToMedicines('expired')} colors={colors} />
        <StatCard accentColor={colors.warning} icon={<Clock size={18} color={colors.warning} strokeWidth={2} />}
          number={expiring.length} caption={t.home.expiringSoon} onPress={() => goToMedicines('expiring')} colors={colors} />
        <StatCard accentColor={colors.success} icon={<CheckCircle2 size={18} color={colors.success} strokeWidth={2} />}
          number={good.length} caption={t.home.good} onPress={() => goToMedicines('good')} colors={colors} />
      </View>

      {/* Active Medications */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Activity size={18} color={colors.secondary} strokeWidth={2} />
            <Text style={dynamicStyles.sectionTitle}>{t.home.activeMedications}</Text>
          </View>
          <Text style={dynamicStyles.sectionCount}>{activeMedications.length} {t.home.activeCount}</Text>
        </View>

        {activeMedications.length === 0 ? (
          <View style={dynamicStyles.emptyActiveCard}>
            <AlarmClock size={28} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={dynamicStyles.emptyActiveTitle}>{t.home.noActiveMedications}</Text>
            <Text style={dynamicStyles.emptyActiveSub}>
              {t.home.noActiveMedsDesc}
            </Text>
          </View>
        ) : (
          <View style={styles.activeMedsList}>
            {activeMedications.map((am) => {
              const med = medicines.find(m => m.id === am.medicine_id);
              const medName = med?.name ?? t.home.medicinesWord;
              const cat = med?.category ?? null;
              const emoji = cat ? (CATEGORY_EMOJI[cat.toLowerCase()] ?? '💊') : '💊';
              return (
                <View key={am.id} style={dynamicStyles.activeMedCard}>
                  <View style={styles.activeMedLeft}>
                    <View style={[styles.activeMedEmoji, { backgroundColor: colors.primaryLight }]}>
                      <Text style={{ fontSize: 18 }}>{emoji}</Text>
                    </View>
                    <View style={styles.activeMedInfo}>
                      <Text style={dynamicStyles.activeMedName} numberOfLines={1}>{medName}</Text>
                      <Text style={dynamicStyles.activeMedDosage}>{am.dosage}</Text>
                      <View style={styles.activeMedTimes}>
                        {am.times_of_day.map((t, i) => (
                          <View key={i} style={[styles.timePill, { backgroundColor: colors.primaryLight }]}>
                            <AlarmClock size={10} color={colors.primary} strokeWidth={2.5} />
                            <Text style={[styles.timePillText, { color: colors.primaryDark }]}>{formatTime(t)}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.activeMedRemove, { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder }]}
                    onPress={() => removeActiveMedication(am.id)}
                    activeOpacity={0.7}>
                    <Text style={[styles.activeMedRemoveText, { color: colors.danger }]}>{t.home.stop}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Inventories */}
      <View style={styles.inventorySection}>
        <View style={styles.inventoryHeader}>
          <View style={styles.inventoryHeaderLeft}>
            <Archive size={18} color={colors.primary} strokeWidth={2} />
            <Text style={dynamicStyles.inventoryTitle}>{t.home.myInventories}</Text>
          </View>
          <Text style={dynamicStyles.inventoryCount}>{inventories.length} {t.home.locationCount.replace('{s}', inventories.length !== 1 ? (isRTL ? '' : 's') : '')}</Text>
        </View>

        <TouchableOpacity style={[styles.allMedicinesCard, { backgroundColor: colors.primary }]} onPress={() => goToMedicines('all')} activeOpacity={0.7}>
          <View style={styles.allMedicinesLeft}>
            <View style={styles.allMedicinesIconCircle}>
              <Pill size={22} color={colors.textInverse} strokeWidth={2} />
            </View>
            <View style={styles.allMedicinesInfo}>
              <Text style={styles.allMedicinesTitle}>{t.home.allMedicines}</Text>
              <Text style={styles.allMedicinesSubtext}>
                {t.home.medsAcrossInvs
                  .replace('{count}', String(medicines.length))
                  .replace('{s}', medicines.length !== 1 ? (isRTL ? '' : 's') : '')
                  .replace('{invCount}', String(inventories.length))
                  .replace('{ies}', inventories.length !== 1 ? (isRTL ? '' : 'ies') : 'y')}
              </Text>
            </View>
          </View>
          <View style={styles.allMedicinesRight}>
            <View style={styles.allMedicinesCount}>
              <Text style={styles.allMedicinesCountText}>{medicines.length}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {inventories.length === 0 ? (
          <TouchableOpacity style={dynamicStyles.emptyInventoryCard} onPress={() => router.navigate('/(tabs)/medicines')} activeOpacity={0.7}>
            <View style={[styles.emptyInventoryIcon, { backgroundColor: colors.inputBg }]}>
              <Archive size={28} color={colors.textTertiary} strokeWidth={1.5} />
            </View>
            <Text style={dynamicStyles.emptyInventoryTitle}>{t.home.noInventoriesYet}</Text>
            <Text style={dynamicStyles.emptyInventorySubtext}>
              {t.home.noInventoriesDesc}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inventoryGrid}>
            {inventories.map((inv) => (
              <TouchableOpacity key={inv.id} style={dynamicStyles.inventoryCard} onPress={() => router.navigate('/(tabs)/medicines')} activeOpacity={0.7}>
                <View style={[styles.inventoryCardIcon, { backgroundColor: colors.primaryLight }]}>
                  <Text style={styles.inventoryEmoji}>{ICON_MAP[inv.icon] ?? '\u{1F4E6}'}</Text>
                </View>
                <Text style={dynamicStyles.inventoryCardName} numberOfLines={1}>{inv.name}</Text>
                <View style={[styles.inventoryBadge, { backgroundColor: colors.primaryLight }]}>
                  <Pill size={10} color={colors.primary} strokeWidth={2.5} />
                  <Text style={[styles.inventoryBadgeText, { color: colors.primary }]}>{inventoryMedCount(inv.id)}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {unassignedCount > 0 && (
              <TouchableOpacity style={dynamicStyles.inventoryCard} onPress={() => router.navigate('/(tabs)/medicines')} activeOpacity={0.7}>
                <View style={[styles.inventoryCardIcon, { backgroundColor: colors.warningLight }]}>
                  <Text style={styles.inventoryEmoji}>{'\u{2753}'}</Text>
                </View>
                <Text style={dynamicStyles.inventoryCardName} numberOfLines={1}>{t.home.unassigned}</Text>
                <View style={[styles.inventoryBadge, { backgroundColor: colors.warningLight }]}>
                  <Pill size={10} color={colors.warning} strokeWidth={2.5} />
                  <Text style={[styles.inventoryBadgeText, { color: colors.warning }]}>{unassignedCount}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {expired.length > 0 && (
        <View style={[styles.alertCard, { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder }]}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={18} color={colors.danger} strokeWidth={2} />
            <Text style={[styles.alertTitle, { color: colors.danger }]}>{t.home.attentionNeeded}</Text>
          </View>
          <Text style={[styles.alertText, { color: colors.textSecondary }]}>
            {expired.length === 1
              ? t.home.expiredAlertSingle.replace('{count}', String(expired.length))
              : t.home.expiredAlertPlural.replace('{count}', String(expired.length))}
          </Text>
        </View>
      )}

      <AddToScheduleModal
        medicine={scheduleTarget}
        visible={scheduleTarget !== null}
        onClose={() => setScheduleTarget(null)}
        onSaved={() => { setScheduleTarget(null); refresh(); }}
      />
    </ScrollView>
  );
}

// Missing import
import { Cloud } from 'lucide-react-native';

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: 56, paddingBottom: 100 },
  header: { marginBottom: Spacing.xl },
  localBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1, marginTop: 4 },
  localBadgeText: { ...Typography.small, fontFamily: 'Inter-SemiBold' },
  chartContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  chartCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  chartTotal: { fontFamily: 'Inter-Bold', fontSize: 36, lineHeight: 40 },
  chartLabel: { ...Typography.caption },
  legend: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  syncPrompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1.5 },
  syncPromptLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  syncPromptInfo: { flex: 1 },
  syncPromptTitle: { ...Typography.bodyMedium, fontFamily: 'Inter-SemiBold' },
  syncPromptSub: { ...Typography.caption, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: { flex: 1, minWidth: '45%', borderRadius: Radius.lg, padding: Spacing.lg, borderLeftWidth: 3, ...Shadows.card },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statNumber: { ...Typography.h1, fontSize: 28 },
  statCaption: { ...Typography.small, marginTop: 2 },
  sectionContainer: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  activeMedsList: { gap: Spacing.md },
  activeMedLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  activeMedEmoji: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  activeMedInfo: { flex: 1 },
  activeMedTimes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.xl, paddingHorizontal: 8, paddingVertical: 3 },
  timePillText: { ...Typography.small, fontFamily: 'Inter-Medium' },
  activeMedRemove: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.lg, borderWidth: 1 },
  activeMedRemoveText: { ...Typography.small, fontFamily: 'Inter-SemiBold' },
  inventorySection: { marginBottom: Spacing.lg },
  inventoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  inventoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inventoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  allMedicinesCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.button, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  allMedicinesLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  allMedicinesIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  allMedicinesInfo: { flex: 1 },
  allMedicinesTitle: { fontFamily: 'Inter-Bold', fontSize: 17, color: Colors.textInverse, lineHeight: 22 },
  allMedicinesSubtext: { ...Typography.small, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  allMedicinesRight: { alignItems: 'center' },
  allMedicinesCount: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  allMedicinesCountText: { fontFamily: 'Inter-Bold', fontSize: 20, color: Colors.textInverse },
  inventoryCardIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  inventoryEmoji: { fontSize: 22 },
  inventoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.xl },
  inventoryBadgeText: { ...Typography.small, fontFamily: 'Inter-SemiBold' },
  emptyInventoryIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  alertCard: { borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  alertTitle: { ...Typography.h3 },
  alertText: { ...Typography.body, fontSize: 14 },
});
