import { useState } from 'react';
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
import { X, Plus, Calendar, Hash, FileText } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { DateInput } from '@/components/DateInput';
import { InventorySelector } from '@/components/InventorySelector';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddMedicineModal({ visible, onClose, onAdded }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [inventoryId, setInventoryId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setExpirationDate('');
    setQuantity('');
    setNotes('');
    setInventoryId(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
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

    const { error: insertError } = await supabase.from('medicines').insert({
      user_id: user!.id,
      name: name.trim(),
      expiration_date: expirationDate.trim(),
      quantity: qty,
      notes: notes.trim() || null,
      inventory_id: inventoryId,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      reset();
      onAdded();
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Add Medicine</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'web' ? undefined : 'padding'}
            style={styles.form}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Plus size={16} color={Colors.primary} strokeWidth={2} />
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
            </ScrollView>

            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}>
              <Text style={styles.buttonText}>
                {submitting ? 'Saving...' : 'Add Medicine'}
              </Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
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
    paddingBottom: Spacing.xxxl,
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
  form: {
    gap: Spacing.sm,
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
    marginTop: Spacing.sm,
    ...Shadows.button,
  },
  buttonDisabled: {
    opacity: 0.6,
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
});
