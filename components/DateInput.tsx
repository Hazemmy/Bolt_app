import { useRef, useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { CalendarPicker } from '@/components/CalendarPicker';
import { Colors, Radius, Typography, Spacing } from '@/lib/theme';

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

export function DateInput({ value, onChangeText, onSubmitEditing }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 8);

      let year = digits.slice(0, 4);
      let month = digits.slice(4, 6);
      let day = digits.slice(6, 8);

      if (digits.length >= 6) {
        const m = parseInt(month, 10);
        if (m > 12) month = '12';
        if (m === 0 && month.length === 2) month = '01';
      }

      if (digits.length === 8) {
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const d = parseInt(day, 10);
        const maxDay = new Date(y, m, 0).getDate();
        if (d > maxDay) day = String(maxDay).padStart(2, '0');
        if (d === 0) day = '01';
      }

      let formatted = year;
      if (digits.length > 4) formatted += '-' + month;
      if (digits.length > 6) formatted += '-' + day;

      onChangeText(formatted);
    },
    [onChangeText]
  );

  const handleBlur = useCallback(() => {
    const parts = value.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      if (m.length === 1 || d.length === 1) {
        onChangeText(`${y}-${padPart(m)}-${padPart(d)}`);
      }
    }
  }, [value, onChangeText]);

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={Colors.textTertiary}
        keyboardType="number-pad"
        maxLength={10}
        onSubmitEditing={onSubmitEditing}
      />
      <TouchableOpacity
        style={styles.calendarBtn}
        onPress={() => setShowCalendar(true)}>
        <Calendar size={18} color={Colors.primary} strokeWidth={2} />
      </TouchableOpacity>
      <CalendarPicker
        visible={showCalendar}
        selectedDate={value}
        onSelect={(date) => {
          onChangeText(date);
          setShowCalendar(false);
        }}
        onClose={() => setShowCalendar(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
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
    paddingRight: 48,
  },
  calendarBtn: {
    position: 'absolute',
    right: 8,
    top: 10,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
  },
});
