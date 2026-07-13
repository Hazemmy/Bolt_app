import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { X, Clock, Pill, AlarmClock, Check, Plus, Trash2 } from 'lucide-react-native';
import { useStorage } from '@/context/storage';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';
import { DateInput } from '@/components/DateInput';

interface Medicine {
  id: string;
  name: string;
  category: string | null;
}

interface Props {
  medicine: Medicine | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Every day' },
  { value: 'twice_daily', label: 'Twice a day' },
  { value: 'three_times', label: '3x a day' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as_needed', label: 'As needed' },
];

const PRESET_TIMES: Record<string, string[]> = {
  daily: ['08:00'],
  twice_daily: ['08:00', '20:00'],
  three_times: ['08:00', '14:00', '20:00'],
  weekly: ['08:00'],
  as_needed: [],
};

export function AddToScheduleModal({ medicine, visible, onClose, onSaved }: Props) {
  const { addActiveMedication } = useStorage();
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDosage('');
    setFrequency('daily');
    setTimes(['08:00']);
    setStartDate('');
    setEndDate('');
    setNotes('');
    setError(null);
    setSaved(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFrequency = (freq: string) => {
    setFrequency(freq);
    setTimes(PRESET_TIMES[freq] ?? ['08:00']);
  };

  const updateTime = (idx: number, val: string) => {
    setTimes((prev) => prev.map((t, i) => (i === idx ? val : t)));
  };

  const addTime = () => setTimes((prev) => [...prev, '12:00']);
  const removeTime = (idx: number) => setTimes((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!dosage.trim()) { setError('Dosage is required (e.g. 500mg)'); return; }
    if (!medicine) return;

    const today = new Date().toISOString().slice(0, 10);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const effectiveStart = startDate.trim() || today;
    if (startDate.trim() && !dateRegex.test(startDate.trim())) {
      setError('Start date must be YYYY-MM-DD'); return;
    }
    if (endDate.trim() && !dateRegex.test(endDate.trim())) {
      setError('End date must be YYYY-MM-DD'); return;
    }

    const filteredTimes = times.filter((t) => t.trim().length > 0);

    setError(null);
    setSubmitting(true);

    const result = await addActiveMedication({
      medicine_id: medicine.id,
      dosage: dosage.trim(),
      frequency,
      times_of_day: filteredTimes.length > 0 ? filteredTimes : ['08:00'],
      end_date: endDate.trim() || null,
      notes: notes.trim() || null,
      is_active: true,
    });

    if (!result) {
      setError('Failed to add to schedule');
      setSubmitting(false);
    } else {
      setSaved(true);
      setSubmitting(false);
      onSaved();
      setTimeout(() => { setSaved(false); reset(); onClose(); }, 1200);
    }
  };

  if (!medicine) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.pillIcon}>
                <Pill size={18} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Add to Schedule</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{medicine.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={styles.scroll}>
            {/* Dosage */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Dosage *</Text>
              <TextInput
                style={styles.input}
                value={dosage}
                onChangeText={setDosage}
                placeholder="e.g. 500mg, 1 tablet, 2 capsules"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {/* Frequency */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Frequency</Text>
              <View style={styles.freqGrid}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.freqChip, frequency === opt.value && styles.freqChipActive]}
                    onPress={() => handleFrequency(opt.value)}>
                    <Text style={[styles.freqChipText, frequency === opt.value && styles.freqChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Times of day */}
            {frequency !== 'as_needed' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Time(s) of Day</Text>
                {times.map((t, idx) => (
                  <View key={idx} style={styles.timeRow}>
                    <View style={styles.timeInputWrap}>
                      <AlarmClock size={16} color={Colors.primary} strokeWidth={2} />
                      <TextInput
                        style={styles.timeInput}
                        value={t}
                        onChangeText={(v) => updateTime(idx, v)}
                        placeholder="HH:MM"
                        placeholderTextColor={Colors.textTertiary}
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                      />
                    </View>
                    {times.length > 1 && (
                      <TouchableOpacity style={styles.removeTimeBtn} onPress={() => removeTime(idx)}>
                        <Trash2 size={14} color={Colors.danger} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={styles.addTimeBtn} onPress={addTime}>
                  <Plus size={14} color={Colors.primary} strokeWidth={2.5} />
                  <Text style={styles.addTimeBtnText}>Add another time</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Start date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Start Date (optional)</Text>
              <DateInput value={startDate} onChangeText={setStartDate} />
              <Text style={styles.fieldHint}>Leave blank to start today</Text>
            </View>

            {/* End date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>End Date (optional)</Text>
              <DateInput value={endDate} onChangeText={setEndDate} />
              <Text style={styles.fieldHint}>Leave blank for ongoing use</Text>
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Take with food, avoid dairy"
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View style={{ height: Spacing.lg }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, (submitting || saved) && styles.saveBtnDone]}
              onPress={handleSubmit}
              disabled={submitting || saved}
              activeOpacity={0.85}>
              {saved ? (
                <>
                  <Check size={18} color={Colors.textInverse} strokeWidth={2.5} />
                  <Text style={styles.saveBtnText}>Added!</Text>
                </>
              ) : (
                <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Add to Schedule'}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    maxHeight: '92%',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  pillIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.small,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  closeBtn: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
  },
  scroll: {
    maxHeight: 480,
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
    ...Typography.caption,
    color: Colors.danger,
  },
  field: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  fieldHint: {
    ...Typography.small,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  textArea: {
    minHeight: 68,
    paddingTop: 13,
  },
  freqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  freqChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: Radius.xl,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  freqChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  freqChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  freqChipTextActive: {
    color: Colors.primaryDark,
    fontFamily: 'Inter-SemiBold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  timeInput: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  removeTimeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  addTimeBtnText: {
    ...Typography.caption,
    color: Colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.button,
  },
  saveBtnDone: {
    backgroundColor: Colors.success,
  },
  saveBtnText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
});
