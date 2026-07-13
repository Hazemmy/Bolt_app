import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  X,
  Pencil,
  Trash2,
  Calendar,
  Package,
  Tag,
  Hash,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pill,
  BookOpen,
  PlusCircle,
} from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';
import { Medicine } from '@/context/storage';

export type { Medicine };

interface Props {
  medicine: Medicine | null;
  visible: boolean;
  inventoryName?: string | null;
  onClose: () => void;
  onEdit: (medicine: Medicine) => void;
  onDelete: (id: string) => void;
  onAddToSchedule: (medicine: Medicine) => void;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  antibiotic:    { icon: '🦠', color: '#DC2626', bg: '#FEF2F2' },
  painkiller:    { icon: '💊', color: '#D97706', bg: '#FFFBEB' },
  antihistamine: { icon: '🤧', color: '#7C3AED', bg: '#F5F3FF' },
  antiviral:     { icon: '🔬', color: '#0891B2', bg: '#ECFEFF' },
  vitamin:       { icon: '🌿', color: '#059669', bg: '#ECFDF5' },
  supplement:    { icon: '🫙', color: '#0D9488', bg: '#CCFBF1' },
  antifungal:    { icon: '🍄', color: '#92400E', bg: '#FEF3C7' },
  antacid:       { icon: '🫀', color: '#BE185D', bg: '#FDF2F8' },
  steroid:       { icon: '⚗️', color: '#4338CA', bg: '#EEF2FF' },
  other:         { icon: '📋', color: '#475569', bg: '#F1F5F9' },
};

function getCategoryConfig(cat: string | null) {
  if (!cat) return CATEGORY_CONFIG.other;
  return CATEGORY_CONFIG[cat.toLowerCase()] ?? CATEGORY_CONFIG.other;
}

export function MedicineDetailModal({ medicine, visible, inventoryName, onClose, onEdit, onDelete, onAddToSchedule }: Props) {
  const { colors } = useTheme();

  if (!medicine) return null;

  const days = daysUntil(medicine.expiration_date);
  const isExpired = days < 0;
  const isExpiringSoon = days >= 0 && days <= 30;

  const statusColor = isExpired ? colors.danger : isExpiringSoon ? colors.warning : colors.success;
  const statusBg = isExpired ? colors.dangerLight : isExpiringSoon ? colors.warningLight : colors.successLight;
  const statusBorder = isExpired ? colors.dangerBorder : isExpiringSoon ? colors.warningBorder : colors.successBorder;
  const StatusIcon = isExpired ? AlertTriangle : isExpiringSoon ? Clock : CheckCircle2;
  const statusText = isExpired
    ? `Expired ${Math.abs(days)} month${Math.abs(days) !== 1 ? 's' : ''} ago`
    : days === 0
    ? 'Expires this month'
    : `Expires in ${days} month${days !== 1 ? 's' : ''}`;

  const catConfig = getCategoryConfig(medicine.category);

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this medicine?')) {
        onDelete(medicine.id);
        onClose();
      }
      return;
    }
    Alert.alert('Delete Medicine', 'Are you sure you want to delete this medicine?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { onDelete(medicine.id); onClose(); } },
    ]);
  };

  const dynamicStyles = StyleSheet.create({
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.xxl,
      borderTopRightRadius: Radius.xxl,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
      maxHeight: '90%',
      ...Shadows.modal,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.inputBorder,
      alignSelf: 'center',
      marginBottom: Spacing.lg,
    },
    medicineName: {
      ...Typography.h2,
      color: colors.text,
      lineHeight: 26,
    },
    closeBtn: {
      padding: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: colors.inputBg,
      flexShrink: 0,
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      borderRadius: Radius.lg,
      borderWidth: 1,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    scheduleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.lg,
      paddingVertical: 12,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1.5,
      borderColor: colors.primary + '40',
    },
    detailsGrid: {
      backgroundColor: colors.inputBg,
      borderRadius: Radius.xl,
      overflow: 'hidden',
      marginBottom: Spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: 13,
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.inputBorder,
    },
    detailLabel: {
      ...Typography.small,
      color: colors.textTertiary,
      marginBottom: 1,
    },
    detailValue: {
      ...Typography.caption,
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    descriptionCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    descriptionText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    notesCard: {
      backgroundColor: colors.inputBg,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    notesTitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontFamily: 'Inter-SemiBold',
    },
    notesText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    editBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      borderRadius: Radius.lg,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    deleteBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      borderRadius: Radius.lg,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerLight,
    },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={dynamicStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={dynamicStyles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.categoryBadgeIcon, { backgroundColor: catConfig.bg }]}>
                <Text style={styles.categoryEmoji}>{catConfig.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.medicineName} numberOfLines={2}>{medicine.name}</Text>
                {medicine.category && (
                  <Text style={[styles.categoryLabel, { color: catConfig.color }]}>
                    {medicine.category.charAt(0).toUpperCase() + medicine.category.slice(1)}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={dynamicStyles.closeBtn}>
              <X size={20} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={styles.scroll}>
            {/* Status banner */}
            <View style={[dynamicStyles.statusBanner, { backgroundColor: statusBg, borderColor: statusBorder }]}>
              <StatusIcon size={16} color={statusColor} strokeWidth={2} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>

            {/* Add to schedule CTA */}
            <TouchableOpacity
              style={dynamicStyles.scheduleBtn}
              onPress={() => { onAddToSchedule(medicine); onClose(); }}
              activeOpacity={0.8}>
              <PlusCircle size={18} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.scheduleBtnText, { color: colors.primaryDark }]}>Add to Daily Schedule</Text>
            </TouchableOpacity>

            {/* Details grid */}
            <View style={dynamicStyles.detailsGrid}>
              <DetailRow
                icon={<Calendar size={16} color={colors.primary} strokeWidth={2} />}
                label="Expiration Date"
                value={formatDate(medicine.expiration_date)}
                colors={colors}
              />
              <DetailRow
                icon={<Hash size={16} color={colors.primary} strokeWidth={2} />}
                label="Quantity"
                value={`${medicine.quantity} unit${medicine.quantity !== 1 ? 's' : ''}`}
                colors={colors}
              />
              {medicine.category && (
                <DetailRow
                  icon={<Tag size={16} color={colors.primary} strokeWidth={2} />}
                  label="Category"
                  value={medicine.category.charAt(0).toUpperCase() + medicine.category.slice(1)}
                  colors={colors}
                />
              )}
              {inventoryName && (
                <DetailRow
                  icon={<Package size={16} color={colors.primary} strokeWidth={2} />}
                  label="Storage Location"
                  value={inventoryName}
                  colors={colors}
                />
              )}
            </View>

            {/* Description */}
            {medicine.description && (
              <View style={dynamicStyles.descriptionCard}>
                <View style={styles.descriptionHeader}>
                  <BookOpen size={15} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.descriptionTitle, { color: colors.primaryDark }]}>Description</Text>
                </View>
                <Text style={dynamicStyles.descriptionText}>{medicine.description}</Text>
              </View>
            )}

            {/* Notes */}
            {medicine.notes && (
              <View style={dynamicStyles.notesCard}>
                <View style={styles.descriptionHeader}>
                  <FileText size={15} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={dynamicStyles.notesTitle}>Notes</Text>
                </View>
                <Text style={dynamicStyles.notesText}>{medicine.notes}</Text>
              </View>
            )}

            <View style={{ height: Spacing.lg }} />
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={dynamicStyles.editBtn} onPress={() => { onEdit(medicine); onClose(); }} activeOpacity={0.8}>
              <Pencil size={17} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <Trash2 size={17} color={colors.danger} strokeWidth={2} />
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailRow({ icon, label, value, colors }: { icon: React.ReactNode; label: string; value: string; colors: typeof Colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 13, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.inputBorder }}>
      <View style={{ width: 30, alignItems: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...Typography.small, color: colors.textTertiary, marginBottom: 1 }}>{label}</Text>
        <Text style={{ ...Typography.caption, color: colors.text, fontFamily: 'Inter-SemiBold' }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  categoryBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  scroll: {
    maxHeight: 480,
  },
  statusText: {
    ...Typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  scheduleBtnText: {
    ...Typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  descriptionTitle: {
    ...Typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  editBtnText: {
    ...Typography.button,
    fontSize: 15,
  },
  deleteBtnText: {
    ...Typography.button,
    fontSize: 15,
  },
});
