import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2, AlertTriangle, Pencil } from 'lucide-react-native';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';

interface Medicine {
  id: string;
  name: string;
  expiration_date: string;
  quantity: number;
  notes: string | null;
  inventory_id: string | null;
  created_at: string;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  medicine: Medicine;
  onDelete: (id: string) => void;
  onEdit: (medicine: Medicine) => void;
  inventoryName?: string | null;
}

export function MedicineCard({ medicine, onDelete, onEdit, inventoryName }: Props) {
  const days = daysUntil(medicine.expiration_date);
  const isExpired = days < 0;
  const isExpiringSoon = days >= 0 && days <= 30;

  const statusColor = isExpired ? Colors.danger : isExpiringSoon ? Colors.warning : Colors.success;
  const statusBg = isExpired ? Colors.dangerLight : isExpiringSoon ? Colors.warningLight : Colors.successLight;
  const statusBorder = isExpired ? Colors.dangerBorder : isExpiringSoon ? Colors.warningBorder : Colors.successBorder;
  const statusText = isExpired ? 'Expired' : isExpiringSoon ? `${days}d left` : `${days}d left`;

  return (
    <View style={[styles.card, isExpired && styles.cardExpired, isExpiringSoon && styles.cardExpiring]}>
      <View style={styles.row}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.info}>
          <Text style={styles.name}>{medicine.name}</Text>
          <View style={styles.details}>
            <Text style={styles.detailText}>Exp: {formatDate(medicine.expiration_date)}</Text>
            <Text style={styles.detailSep}>|</Text>
            <Text style={styles.detailText}>Qty: {medicine.quantity}</Text>
            {inventoryName && (
              <>
                <Text style={styles.detailSep}>|</Text>
                <Text style={styles.detailText}>{inventoryName}</Text>
              </>
            )}
          </View>
          {medicine.notes && <Text style={styles.notes}>{medicine.notes}</Text>}
        </View>
      </View>
      <View style={styles.bottomRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusBorder }]}>
          {isExpired && <AlertTriangle size={10} color={Colors.danger} strokeWidth={2} />}
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(medicine)} style={styles.actionBtn}>
            <Pencil size={15} color={Colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(medicine.id)} style={styles.actionBtn}>
            <Trash2 size={15} color={Colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    ...Shadows.card,
  },
  cardExpired: {
    borderLeftColor: Colors.danger,
  },
  cardExpiring: {
    borderLeftColor: Colors.warning,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 2,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  detailText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  detailSep: {
    ...Typography.small,
    color: Colors.textTertiary,
  },
  notes: {
    ...Typography.small,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
