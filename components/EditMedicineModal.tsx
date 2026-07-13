import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { X, Pencil, Calendar, Hash, FileText, Check, Tag } from 'lucide-react-native';
import { useStorage, Medicine } from '@/context/storage';
import { useTheme } from '@/context/theme';
import { DateInput } from '@/components/DateInput';
import { InventorySelector } from '@/components/InventorySelector';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';

interface Props {
  visible: boolean;
  medicine: Medicine | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = [
  'Antibiotic', 'Painkiller', 'Antihistamine', 'Antiviral',
  'Vitamin', 'Supplement', 'Antifungal', 'Antacid', 'Steroid', 'Other',
];

export function EditMedicineModal({ visible, medicine, onClose, onSaved }: Props) {
  const { updateMedicine } = useStorage();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [inventoryId, setInventoryId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (medicine && visible) {
      setName(medicine.name);
      setExpirationDate(medicine.expiration_date);
      setQuantity(String(medicine.quantity));
      setCategory(medicine.category ?? '');
      setNotes(medicine.notes ?? '');
      setInventoryId(medicine.inventory_id);
      setError(null);
      setSaved(false);
    }
  }, [medicine, visible]);

  const handleClose = () => { setError(null); setSaved(false); onClose(); };

  const handleSubmit = async () => {
    if (!medicine) return;
    if (!name.trim()) { setError('Medicine name is required'); return; }
    if (!expirationDate.trim()) { setError('Expiration date is required'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDate.trim())) { setError('Please enter a valid expiration date'); return; }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) { setError('Quantity must be at least 1'); return; }

    setError(null);
    setSubmitting(true);

    const success = await updateMedicine(medicine.id, {
      name: name.trim(),
      expiration_date: expirationDate.trim(),
      quantity: qty,
      category: category || null,
      notes: notes.trim() || null,
      inventory_id: inventoryId,
    });

    if (!success) {
      setError('Failed to update medicine');
    } else {
      setSaved(true);
      onSaved();
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    }
    setSubmitting(false);
  };

  const dynamicStyles = StyleSheet.create({
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.xxl,
      borderTopRightRadius: Radius.xxl,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
      maxHeight: '92%',
      ...Shadows.modal,
    },
    handle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: colors.inputBorder,
      alignSelf: 'center', marginBottom: Spacing.lg,
    },
    sheetTitle: { ...Typography.h2, color: colors.text },
    closeBtn: { padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: colors.inputBg },
    label: { ...Typography.caption, color: colors.textSecondary },
    input: {
      ...Typography.body, color: colors.text,
      backgroundColor: colors.inputBg, borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg, paddingVertical: 14,
      borderWidth: 1.5, borderColor: colors.inputBorder,
    },
    catChip: {
      paddingHorizontal: Spacing.lg, paddingVertical: 9,
      borderRadius: Radius.xl, backgroundColor: colors.inputBg,
      borderWidth: 1.5, borderColor: colors.inputBorder,
    },
    catChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    catChipText: { ...Typography.caption, color: colors.textSecondary },
    catChipTextActive: { color: colors.primaryDark, fontFamily: 'Inter-SemiBold' },
    button: {
      backgroundColor: colors.primary, borderRadius: Radius.lg,
      paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', ...Shadows.button,
    },
    buttonText: { ...Typography.button, color: colors.textInverse },
    errorBox: {
      backgroundColor: colors.dangerLight, borderRadius: Radius.md,
      padding: Spacing.md, marginBottom: Spacing.md,
      borderWidth: 1, borderColor: colors.dangerBorder,
    },
    errorText: { ...Typography.body, color: colors.danger, textAlign: 'center' },
    successBox: {
      backgroundColor: colors.successLight, borderRadius: Radius.md,
      padding: Spacing.md, marginBottom: Spacing.md,
      borderWidth: 1, borderColor: colors.successBorder,
    },
    successText: { ...Typography.bodyMedium, color: colors.success },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={dynamicStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={dynamicStyles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={dynamicStyles.sheetTitle}>Edit Medicine</Text>
            <TouchableOpacity onPress={handleClose} style={dynamicStyles.closeBtn}>
              <X size={20} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={dynamicStyles.errorBox}>
              <Text style={dynamicStyles.errorText}>{error}</Text>
            </View>
          )}
          {saved && (
            <View style={dynamicStyles.successBox}>
              <Check size={16} color={colors.success} strokeWidth={2} />
              <Text style={dynamicStyles.successText}>Changes saved!</Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollArea}>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Pencil size={16} color={colors.primary} strokeWidth={2} />
                <Text style={dynamicStyles.label}>Medicine Name</Text>
              </View>
              <TextInput style={dynamicStyles.input} value={name} onChangeText={setName}
                placeholder="e.g. Amoxicillin" placeholderTextColor={colors.textTertiary} />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Calendar size={16} color={colors.primary} strokeWidth={2} />
                <Text style={dynamicStyles.label}>Expiration Date</Text>
              </View>
              <DateInput value={expirationDate} onChangeText={setExpirationDate} />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Hash size={16} color={colors.primary} strokeWidth={2} />
                <Text style={dynamicStyles.label}>Quantity</Text>
              </View>
              <TextInput style={dynamicStyles.input} value={quantity} onChangeText={setQuantity}
                placeholder="e.g. 30" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Tag size={16} color={colors.primary} strokeWidth={2} />
                <Text style={dynamicStyles.label}>Category</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[dynamicStyles.catChip, category === cat.toLowerCase() && dynamicStyles.catChipActive]}
                      onPress={() => setCategory(category === cat.toLowerCase() ? '' : cat.toLowerCase())}>
                      <Text style={[dynamicStyles.catChipText, category === cat.toLowerCase() && dynamicStyles.catChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.field}>
              <InventorySelector value={inventoryId} onChange={setInventoryId} />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <FileText size={16} color={colors.primary} strokeWidth={2} />
                <Text style={dynamicStyles.label}>Notes (optional)</Text>
              </View>
              <TextInput
                style={[dynamicStyles.input, styles.textArea]}
                value={notes} onChangeText={setNotes}
                placeholder="e.g. Take with food"
                placeholderTextColor={colors.textTertiary}
                multiline numberOfLines={2} textAlignVertical="top" />
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[dynamicStyles.button, (submitting || saved) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting || saved}>
              {saved ? (
                <Check size={20} color={colors.textInverse} strokeWidth={2.5} />
              ) : (
                <Text style={dynamicStyles.buttonText}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  scrollArea: { maxHeight: 500 },
  bottomSpacer: { height: Spacing.lg },
  buttonContainer: { paddingBottom: Spacing.xxxl, paddingTop: Spacing.md },
  field: { gap: Spacing.sm, marginBottom: Spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  categoryRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 2 },
  textArea: { minHeight: 68, paddingTop: 14 },
  buttonDisabled: { opacity: 0.7 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
});
