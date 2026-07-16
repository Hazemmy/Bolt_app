import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { useLanguage } from '@/context/language';
import { Radius, Typography, Spacing } from '@/lib/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

export function toStorageDate(displayDate: string): string {
  if (!displayDate) return '';
  const parts = displayDate.split('/');
  if (parts.length === 2) {
    return `${parts[0]}-${parts[1]}-01`;
  }
  return displayDate;
}

export function toDisplayDate(storageDate: string): string {
  if (!storageDate) return '';
  const parts = storageDate.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return storageDate;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 21 }, (_, i) => CURRENT_YEAR + 10 - i);

export function DateInput({ value, onChangeText }: Props) {
  const [pickerOpen, setPickerOpen] = useState<'year' | 'month' | null>(null);
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();

  const parts = value.split('-');
  const yearStr = parts[0] ?? '';
  const monthStr = parts.length >= 2 ? parts[1] : '';

  const updateDate = useCallback(
    (newYear: string, newMonth: string) => {
      if (!newYear && !newMonth) {
        onChangeText('');
        return;
      }
      const y = newYear.slice(0, 4);
      const m = newMonth.slice(0, 2);
      const partial = [y, m].filter(Boolean).join('-');
      if (partial) onChangeText(`${partial}-01`);
    },
    [onChangeText]
  );

  const handlePickerSelect = (type: 'year' | 'month', val: string) => {
    if (type === 'year') updateDate(val, monthStr);
    else updateDate(yearStr, val);
    setPickerOpen(null);
  };

  const monthLabel = useMemo(() => {
    const idx = parseInt(monthStr, 10) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < 12) return t.medicines.dateInput.months[idx];
    return '';
  }, [monthStr, t]);

  const yearLabel = useMemo(() => {
    if (yearStr.length === 4) return yearStr;
    return '';
  }, [yearStr]);

  const dynamicStyles = StyleSheet.create({
    row: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: Spacing.sm,
      alignItems: 'flex-end',
    },
    yearField: { flex: 1.4, gap: Spacing.xs },
    monthField: { flex: 1, gap: Spacing.xs },
    label: {
      ...Typography.small,
      color: colors.textTertiary,
      fontFamily: 'Inter-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      ...Typography.body,
      color: colors.text,
      backgroundColor: colors.inputBg,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      textAlign: 'center',
    },
    pickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...Typography.body,
      color: colors.text,
      backgroundColor: colors.inputBg,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      height: 50,
    },
    pickerBtnText: {
      ...Typography.body,
      color: monthLabel || yearLabel ? colors.text : colors.textTertiary,
    },
    chevron: { opacity: 0.5 },
  });

  return (
    <View>
      <View style={dynamicStyles.row}>
        <View style={dynamicStyles.yearField}>
          <Text style={dynamicStyles.label}>{t.medicines.dateInput.yearLabel}</Text>
          <TouchableOpacity
            style={dynamicStyles.pickerBtn}
            onPress={() => setPickerOpen('year')}
            activeOpacity={0.7}>
            <Text style={dynamicStyles.pickerBtnText} numberOfLines={1}>
              {yearLabel || t.medicines.dateInput.yearPlaceholder}
            </Text>
            <ChevronDown size={16} color={colors.textTertiary} strokeWidth={2} style={dynamicStyles.chevron} />
          </TouchableOpacity>
        </View>
        <View style={dynamicStyles.monthField}>
          <Text style={dynamicStyles.label}>{t.medicines.dateInput.monthLabel}</Text>
          <TouchableOpacity
            style={dynamicStyles.pickerBtn}
            onPress={() => setPickerOpen('month')}
            activeOpacity={0.7}>
            <Text style={dynamicStyles.pickerBtnText} numberOfLines={1}>
              {monthLabel || t.medicines.dateInput.monthPlaceholder}
            </Text>
            <ChevronDown size={16} color={colors.textTertiary} strokeWidth={2} style={dynamicStyles.chevron} />
          </TouchableOpacity>
        </View>
      </View>

      <PickerModal
        visible={pickerOpen === 'year'}
        title={t.medicines.dateInput.selectYear}
        options={YEAR_OPTIONS.map(String)}
        selected={yearStr}
        onSelect={(v) => handlePickerSelect('year', v)}
        onClose={() => setPickerOpen(null)}
        colors={colors}
      />
      <PickerModal
        visible={pickerOpen === 'month'}
        title={t.medicines.dateInput.selectMonth}
        options={t.medicines.dateInput.months.map((m, i) => ({
          label: m,
          value: String(i + 1).padStart(2, '0'),
        }))}
        selected={monthStr}
        onSelect={(v) => handlePickerSelect('month', v)}
        onClose={() => setPickerOpen(null)}
        colors={colors}
      />
    </View>
  );
}

interface PickerOption {
  label: string;
  value: string;
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  colors,
}: {
  visible: boolean;
  title: string;
  options: (string | PickerOption)[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  colors: typeof import('@/lib/theme')['LightColors'];
}) {
  const normalized: PickerOption[] = options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={pickerStyles.backdrop} onPress={onClose}>
        <Pressable
          style={[pickerStyles.sheet, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={pickerStyles.handle} />
          <Text style={[pickerStyles.title, { color: colors.text }]}>{title}</Text>
          <ScrollView style={pickerStyles.list} showsVerticalScrollIndicator={false}>
            {normalized.map((opt) => {
              const isSelected = opt.value === selected;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    pickerStyles.option,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.inputBg,
                      borderColor: isSelected ? colors.primary : colors.inputBorder,
                    },
                  ]}
                  onPress={() => onSelect(opt.value)}>
                  <Text
                    style={[
                      pickerStyles.optionText,
                      {
                        color: isSelected ? colors.primaryDark : colors.text,
                        fontFamily: isSelected ? 'Inter-SemiBold' : 'Inter-Regular',
                      },
                    ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  list: { maxHeight: 400 },
  option: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  optionText: {
    ...Typography.body,
    fontSize: 16,
  },
});
