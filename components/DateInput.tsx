import { useRef, useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { CalendarPicker } from '@/components/CalendarPicker';
import { useTheme } from '@/context/theme';
import { useLanguage } from '@/context/language';
import { Radius, Typography, Spacing } from '@/lib/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
}

function padPart(part: string): string {
  if (part.length === 1 && part !== '0') {
    return '0' + part;
  }
  return part;
}

// Convert YYYY/MM to YYYY-MM-DD (use 01 as day for storage)
export function toStorageDate(displayDate: string): string {
  if (!displayDate) return '';
  const parts = displayDate.split('/');
  if (parts.length === 2) {
    return `${parts[0]}-${parts[1]}-01`;
  }
  return displayDate;
}

// Convert YYYY-MM-DD to YYYY/MM
export function toDisplayDate(storageDate: string): string {
  if (!storageDate) return '';
  const parts = storageDate.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return storageDate;
}

export function DateInput({ value, onChangeText, onSubmitEditing }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);
  const { colors } = useTheme();
  const { isRTL } = useLanguage();

  // Convert display format (YYYY/MM) to storage and back
  const displayValue = toDisplayDate(value);

  const handleChange = useCallback(
    (raw: string) => {
      // Remove non-digits, limit to 6 digits (YYYYMM)
      const digits = raw.replace(/\D/g, '').slice(0, 6);

      let year = digits.slice(0, 4);
      let month = digits.slice(4, 6);

      if (digits.length >= 5) {
        const m = parseInt(month, 10);
        if (m > 12) month = '12';
        if (m === 0 && month.length === 2) month = '01';
      }

      let formatted = year;
      if (digits.length > 4) formatted += '/' + month;

      // Convert to storage format (YYYY-MM-01)
      const storageDate = toStorageDate(formatted);
      onChangeText(storageDate);
    },
    [onChangeText]
  );

  const handleBlur = useCallback(() => {
    const parts = value.split('-');
    if (parts.length >= 2) {
      const [y, m] = parts;
      if (m.length === 1) {
        onChangeText(`${y}-${padPart(m)}-01`);
      }
    }
  }, [value, onChangeText]);

  const handleCalendarSelect = (date: string) => {
    // Calendar returns YYYY-MM-DD, convert to YYYY-MM-01
    const parts = date.split('-');
    if (parts.length >= 2) {
      onChangeText(`${parts[0]}-${parts[1]}-01`);
    } else {
      onChangeText(date);
    }
    setShowCalendar(false);
  };

  const dynamicStyles = StyleSheet.create({
    input: {
      ...Typography.body,
      color: colors.text,
      backgroundColor: colors.inputBg,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      paddingRight: 48,
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    calendarBtn: {
      position: 'absolute',
      right: 8,
      top: 10,
      padding: Spacing.sm,
      borderRadius: Radius.sm,
      backgroundColor: colors.card,
    },
  });

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={dynamicStyles.input}
        value={displayValue}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder="YYYY/MM"
        placeholderTextColor={colors.textTertiary}
        keyboardType="number-pad"
        maxLength={7}
        onSubmitEditing={onSubmitEditing}
      />
      <TouchableOpacity
        style={dynamicStyles.calendarBtn}
        onPress={() => setShowCalendar(true)}>
        <Calendar size={18} color={colors.primary} strokeWidth={2} />
      </TouchableOpacity>
      <CalendarPicker
        visible={showCalendar}
        selectedDate={value}
        onSelect={handleCalendarSelect}
        onClose={() => setShowCalendar(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
});
