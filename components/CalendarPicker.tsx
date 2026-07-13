import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';

interface Props {
  visible: boolean;
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function CalendarPicker({ visible, selectedDate, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const parsed = selectedDate ? selectedDate.split('-').map(Number) : null;
  const initYear = parsed?.[0] ?? today.getFullYear();
  const initMonth = parsed?.[1] ? parsed[1] - 1 : today.getMonth();

  const [viewYear, setViewYear] = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelect = (day: number) => {
    onSelect(toDateStr(viewYear, viewMonth, day));
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const dynamicStyles = StyleSheet.create({
    calendar: {
      backgroundColor: colors.card,
      borderRadius: Radius.xxl,
      padding: Spacing.xl,
      width: 340,
      ...Shadows.modal,
    },
    navBtn: {
      padding: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: colors.inputBg,
    },
    headerText: {
      ...Typography.h3,
      color: colors.text,
    },
    weekText: {
      ...Typography.caption,
      color: colors.textTertiary,
    },
    dayText: {
      ...Typography.bodyMedium,
      fontSize: 14,
      color: colors.text,
    },
    daySelected: {
      backgroundColor: colors.primary,
    },
    dayToday: {
      backgroundColor: colors.primaryLight,
    },
    dayTextSelected: {
      color: colors.textInverse,
      fontFamily: 'Inter-SemiBold',
    },
    dayTextToday: {
      color: colors.primary,
      fontFamily: 'Inter-SemiBold',
    },
    todayBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.xl,
      backgroundColor: colors.primaryLight,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    todayBtnText: {
      ...Typography.caption,
      color: colors.primaryDark,
      fontFamily: 'Inter-SemiBold',
    },
  });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={dynamicStyles.calendar} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <TouchableOpacity onPress={prevMonth} style={dynamicStyles.navBtn}>
              <ChevronLeft size={20} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={dynamicStyles.headerText}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={dynamicStyles.navBtn}>
              <ChevronRight size={20} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((d) => (
              <View key={d} style={styles.weekCell}>
                <Text style={dynamicStyles.weekText}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, i) => {
              if (day === null) {
                return <View key={`e${i}`} style={styles.dayCell} />;
              }
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && dynamicStyles.daySelected,
                    isToday && !isSelected && dynamicStyles.dayToday,
                  ]}
                  onPress={() => handleSelect(day)}>
                  <Text
                    style={[
                      dynamicStyles.dayText,
                      isSelected && dynamicStyles.dayTextSelected,
                      isToday && !isSelected && dynamicStyles.dayTextToday,
                    ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={dynamicStyles.todayBtn}
              onPress={() => {
                setViewYear(today.getFullYear());
                setViewMonth(today.getMonth());
                onSelect(todayStr);
              }}>
              <Calendar size={14} color={colors.primary} strokeWidth={2} />
              <Text style={dynamicStyles.todayBtnText}>Today</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  footer: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
});
