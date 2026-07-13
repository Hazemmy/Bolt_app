import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, Pencil, Trash2, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';
import { Medicine } from '@/context/storage';

export type { Medicine };

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const CATEGORY_EMOJI: Record<string, string> = {
  antibiotic: '🦠',
  painkiller: '💊',
  antihistamine: '🤧',
  antiviral: '🔬',
  vitamin: '🌿',
  supplement: '🫙',
  antifungal: '🍄',
  antacid: '🫀',
  steroid: '⚗️',
  other: '📋',
};

interface Props {
  medicine: Medicine;
  onDelete: (id: string) => void;
  onEdit: (medicine: Medicine) => void;
  onPress: (medicine: Medicine) => void;
  inventoryName?: string | null;
}

export function MedicineCard({ medicine, onDelete, onEdit, onPress, inventoryName }: Props) {
  const { colors } = useTheme();
  const days = daysUntil(medicine.expiration_date);
  const isExpired = days < 0;
  const isExpiringSoon = days >= 0 && days <= 30;

  const statusColor = isExpired ? colors.danger : isExpiringSoon ? colors.warning : colors.success;
  const statusBg = isExpired ? colors.dangerLight : isExpiringSoon ? colors.warningLight : colors.successLight;
  const statusBorder = isExpired ? colors.dangerBorder : isExpiringSoon ? colors.warningBorder : colors.successBorder;
  const statusText = isExpired ? 'Expired' : days === 0 ? 'Today' : `${days}d`;

  const categoryEmoji = medicine.category ? (CATEGORY_EMOJI[medicine.category.toLowerCase()] ?? '💊') : '💊';

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: isExpired ? colors.danger : isExpiringSoon ? colors.warning : colors.success,
      ...Shadows.card,
    },
    emojiWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    name: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: 3,
      fontSize: 16,
    },
    metaText: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    metaSep: {
      ...Typography.small,
      color: colors.textTertiary,
    },
    categoryChip: {
      ...Typography.small,
      color: colors.primary,
      fontFamily: 'Inter-Medium',
      marginTop: 4,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.xl,
      borderWidth: 1,
    },
    statusText: {
      ...Typography.small,
      fontFamily: 'Inter-SemiBold',
    },
    actionBtn: {
      width: 30,
      height: 30,
      borderRadius: Radius.md,
      backgroundColor: colors.inputBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={dynamicStyles.card}
      onPress={() => onPress(medicine)}
      activeOpacity={0.75}>
      <View style={styles.topRow}>
        <View style={dynamicStyles.emojiWrap}>
          <Text style={styles.emoji}>{categoryEmoji}</Text>
        </View>
        <View style={styles.info}>
          <Text style={dynamicStyles.name} numberOfLines={1}>{medicine.name}</Text>
          <View style={styles.meta}>
            <Text style={dynamicStyles.metaText}>Exp: {formatDate(medicine.expiration_date)}</Text>
            <Text style={dynamicStyles.metaSep}>·</Text>
            <Text style={dynamicStyles.metaText}>Qty {medicine.quantity}</Text>
            {inventoryName && (
              <>
                <Text style={dynamicStyles.metaSep}>·</Text>
                <Text style={dynamicStyles.metaText} numberOfLines={1}>{inventoryName}</Text>
              </>
            )}
          </View>
          {medicine.category && (
            <Text style={dynamicStyles.categoryChip}>{medicine.category.charAt(0).toUpperCase() + medicine.category.slice(1)}</Text>
          )}
        </View>
        <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} style={{ marginTop: 2 }} />
      </View>

      <View style={styles.bottomRow}>
        <View style={[dynamicStyles.statusBadge, { backgroundColor: statusBg, borderColor: statusBorder }]}>
          {isExpired && <AlertTriangle size={10} color={colors.danger} strokeWidth={2} />}
          <Text style={[dynamicStyles.statusText, { color: statusColor }]}>
            {isExpired ? 'Expired' : `${statusText} left`}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onEdit(medicine); }}
            style={dynamicStyles.actionBtn}>
            <Pencil size={14} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onDelete(medicine.id); }}
            style={dynamicStyles.actionBtn}>
            <Trash2 size={14} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  emoji: { fontSize: 18 },
  info: { flex: 1 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
