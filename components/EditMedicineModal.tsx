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
import { X, Pencil, Calendar, Hash, FileText, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { DateInput } from '@/components/DateInput';
import { InventorySelector } from '@/components/InventorySelector';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';

interface Medicine {
  id: string;
  name: string;
  expiration_date: string;
  quantity: number;
  notes: string | null;
  inventory_id: string | null;
}

interface Props {
  visible: boolean;
  medicine: Medicine | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditMedicineModal({ visible, medicine, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState('');
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
      setNotes(medicine.notes ?? '');
      setInventoryId(medicine.inventory_id);
      setError(null);
      setSaved(false);
    }
  }, [medicine, visible]);

  const handleClose = () => {
    setError(null);
    setSaved(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Medicine name is required');
      return;
    }
    if (!expirationDate.trim()) {
      setError('Expiration date is required');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expirationDate.trim())) {
      setError('Date format must be YYYY-MM-DD');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    setError(null);
    setSubmitting(true);

    const { error: updateError } = await supabase
      .from('medicines')
      .update({
        name: name.trim(),
        expiration_date: expirationDate.trim(),
        quantity: qty,
        notes: notes.trim() || null,
        inventory_id: inventoryId,
      })
      .eq('id', medicine!.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      onSaved();
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    }
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit Medicine</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {saved && (
            <View style={styles.successBox}>
              <Check size={16} color={Colors.success} strokeWidth={2} />
              <Text style={styles.successText}>Changes saved!</Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollArea}>
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Pencil size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.label}>Medicine Name</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Amoxicillin"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Calendar size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.label}>Expiration Date</Text>
              </View>
              <DateInput value={expirationDate} onChangeText={setExpirationDate} />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Hash size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.label}>Quantity</Text>
              </View>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="e.g. 30"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.field}>
              <InventorySelector value={inventoryId} onChange={setInventoryId} />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <FileText size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.label}>Notes (optional)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Take with food"
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, (submitting || saved) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting || saved}>
              {saved ? (
                <Check size={20} color={Colors.textInverse} strokeWidth={2.5} />
              ) : (
                <Text style={styles.buttonText}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
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
    backgroundColor: Colors.inputBorder,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  closeBtn: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
  },
  scrollArea: {
    maxHeight: 420,
  },
  bottomSpacer: {
    height: Spacing.lg,
  },
  buttonContainer: {
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.md,
  },
  field: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  textArea: {
    minHeight: 72,
    paddingTop: 14,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Shadows.button,
  },
  buttonDisabled: {
    opacity: 0.7,
    backgroundColor: Colors.success,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: Colors.successLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  successText: {
    ...Typography.bodyMedium,
    color: Colors.success,
  },
});
