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
import { X, Calendar, Hash, FileText, ScanLine, Pill, Tag } from 'lucide-react-native';
import { useStorage } from '@/context/storage';
import { useTheme } from '@/context/theme';
import { useLanguage } from '@/context/language';
import { DateInput } from '@/components/DateInput';
import { InventorySelector } from '@/components/InventorySelector';
import { ScanMedicineModal } from '@/components/ScanMedicineModal';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const CATEGORY_KEYS = [
  'antibiotic', 'painkiller', 'antihistamine', 'antiviral',
  'vitamin', 'supplement', 'antifungal', 'antacid', 'steroid', 'other',
] as const;

export function AddMedicineModal({ visible, onClose, onAdded }: Props) {
  const { addMedicine } = useStorage();
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const [name, setName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [inventoryId, setInventoryId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScan, setShowScan] = useState(false);

  const reset = () => {
    setName('');
    setExpirationDate('');
    setQuantity('');
    setCategory('');
    setNotes('');
    setInventoryId(null);
    setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleScanResult = (result: { name: string | null; expirationDate: string | null }) => {
    if (result.name) setName(result.name);
    if (result.expirationDate) setExpirationDate(result.expirationDate);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError(t.medicines.errors.nameRequired); return; }
    if (!expirationDate.trim()) { setError(t.medicines.errors.dateRequired); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDate.trim())) { setError(t.medicines.errors.dateInvalid); return; }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) { setError(t.medicines.errors.quantityMin); return; }

    setError(null);
    setSubmitting(true);

    const result = await addMedicine({
      name: name.trim(),
      expiration_date: expirationDate.trim(),
      quantity: qty,
      category: category || null,
      description: null,
      notes: notes.trim() || null,
      inventory_id: inventoryId,
    });

    if (result) {
      reset();
      onAdded();
      onClose();
    } else {
      setError(t.medicines.errors.addFailed);
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
      paddingBottom: Spacing.xxxl,
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
    scanBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.primaryLight, borderRadius: Radius.xl,
      padding: Spacing.lg, borderWidth: 1.5,
      borderColor: colors.primary + '40', marginBottom: Spacing.lg,
    },
    scanIconCircle: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...Shadows.card,
    },
    scanBannerTitle: { ...Typography.bodyMedium, color: colors.primaryDark, fontSize: 15 },
    scanBannerSub: { ...Typography.small, color: colors.primary, marginTop: 1 },
    scanBannerArrow: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
    dividerText: { ...Typography.small, color: colors.textTertiary },
    label: { ...Typography.caption, color: colors.textSecondary },
    input: {
      ...Typography.body, color: colors.text,
      backgroundColor: colors.inputBg, borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg, paddingVertical: 14,
      borderWidth: 1.5, borderColor: colors.inputBorder,
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
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
      paddingVertical: 16, alignItems: 'center',
      marginTop: Spacing.sm, ...Shadows.button,
    },
    buttonText: { ...Typography.button, color: colors.textInverse },
    errorBox: {
      backgroundColor: colors.dangerLight, borderRadius: Radius.md,
      padding: Spacing.md, marginBottom: Spacing.md,
      borderWidth: 1, borderColor: colors.dangerBorder,
    },
    errorText: { ...Typography.body, color: colors.danger, textAlign: 'center' },
  });

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={dynamicStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={dynamicStyles.handle} />

            <View style={styles.sheetHeader}>
              <Text style={dynamicStyles.sheetTitle}>{t.medicines.addMedicine}</Text>
              <TouchableOpacity onPress={handleClose} style={dynamicStyles.closeBtn}>
                <X size={20} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={dynamicStyles.scanBanner} onPress={() => setShowScan(true)} activeOpacity={0.8}>
              <View style={styles.scanBannerLeft}>
                <View style={dynamicStyles.scanIconCircle}>
                  <ScanLine size={20} color={colors.primary} strokeWidth={2} />
                </View>
                <View>
                  <Text style={dynamicStyles.scanBannerTitle}>{t.medicines.scanLabel}</Text>
                  <Text style={dynamicStyles.scanBannerSub}>{t.medicines.scanLabelSub}</Text>
                </View>
              </View>
              <View style={dynamicStyles.scanBannerArrow}>
                <Text style={styles.scanBannerArrowText}>›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={dynamicStyles.dividerLine} />
              <Text style={dynamicStyles.dividerText}>{t.medicines.orEnterManually}</Text>
              <View style={dynamicStyles.dividerLine} />
            </View>

            {error && (
              <View style={dynamicStyles.errorBox}>
                <Text style={dynamicStyles.errorText}>{error}</Text>
              </View>
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : 'padding'} style={styles.form}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.field}>
                  <View style={styles.labelRow}>
                    <Pill size={16} color={colors.primary} strokeWidth={2} />
                    <Text style={dynamicStyles.label}>{t.medicines.medicineName}</Text>
                  </View>
                  <TextInput
                    style={dynamicStyles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={t.medicines.medicineNamePlaceholder}
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                <View style={styles.field}>
                  <View style={styles.labelRow}>
                    <Calendar size={16} color={colors.primary} strokeWidth={2} />
                    <Text style={dynamicStyles.label}>{t.medicines.expirationDateLabel}</Text>
                  </View>
                  <DateInput value={expirationDate} onChangeText={setExpirationDate} />
                </View>

                <View style={styles.field}>
                  <View style={styles.labelRow}>
                    <Hash size={16} color={colors.primary} strokeWidth={2} />
                    <Text style={dynamicStyles.label}>{t.medicines.quantityLabel}</Text>
                  </View>
                  <TextInput
                    style={dynamicStyles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder={t.medicines.quantityPlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.field}>
                  <View style={styles.labelRow}>
                    <Tag size={16} color={colors.primary} strokeWidth={2} />
                    <Text style={dynamicStyles.label}>{t.medicines.categoryLabel}</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categoryRow}>
                      {CATEGORY_KEYS.map((catKey) => (
                        <TouchableOpacity
                          key={catKey}
                          style={[dynamicStyles.catChip, category === catKey && dynamicStyles.catChipActive]}
                          onPress={() => setCategory(category === catKey ? '' : catKey)}>
                          <Text style={[dynamicStyles.catChipText, category === catKey && dynamicStyles.catChipTextActive]}>
                            {t.medicines.categories[catKey]}
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
                    <Text style={dynamicStyles.label}>{t.medicines.notesLabel}</Text>
                  </View>
                  <TextInput
                    style={[dynamicStyles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t.medicines.notesPlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[dynamicStyles.button, submitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}>
                <Text style={dynamicStyles.buttonText}>{submitting ? t.medicines.saving : t.medicines.addMedicine}</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>

      <ScanMedicineModal visible={showScan} onClose={() => setShowScan(false)} onResult={handleScanResult} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  scanBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  scanBannerArrowText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Inter-Bold', lineHeight: 22 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  form: { gap: Spacing.sm },
  field: { gap: Spacing.sm, marginBottom: Spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  textArea: { minHeight: 68, paddingTop: 14 },
  categoryRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 2 },
  buttonDisabled: { opacity: 0.6 },
});
