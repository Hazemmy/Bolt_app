import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useStorage } from '@/context/storage';
import { useTheme } from '@/context/theme';
import { useLanguage } from '@/context/language';
import { Radius, Typography, Spacing } from '@/lib/theme';

const ICON_MAP: Record<string, string> = {
  drawer: '\u{1F5C4}',
  cabinet: '\u{1F5C5}',
  shelf: '\u{1F4DA}',
  fridge: '\u{1F9CA}',
  bag: '\u{1F45C}',
  box: '\u{1F4E6}',
  basket: '\u{1F9F9}',
  closet: '\u{1F3E0}',
};

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

export function InventorySelector({ value, onChange }: Props) {
  const { inventories } = useStorage();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const dynamicStyles = StyleSheet.create({
    label: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 8,
      borderRadius: Radius.xl,
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    chipText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    chipTextSelected: {
      color: colors.primaryDark,
      fontFamily: 'Inter-SemiBold',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={dynamicStyles.label}>{t.medicines.inventoryLabel}</Text>
      <FlatList
        data={[{ id: '__none__', name: t.home.unassigned, icon: 'box' }, ...inventories]}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = item.id === '__none__' ? value === null : value === item.id;
          return (
            <TouchableOpacity
              style={[dynamicStyles.chip, isSelected && dynamicStyles.chipSelected]}
              onPress={() => onChange(item.id === '__none__' ? null : item.id)}>
              <Text style={styles.chipIcon}>
                {item.id === '__none__' ? '\u{2753}' : ICON_MAP[item.icon] ?? '\u{1F4E6}'}
              </Text>
              <Text style={[dynamicStyles.chipText, isSelected && dynamicStyles.chipTextSelected]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.chipGap} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  chipIcon: { fontSize: 14 },
  chipGap: { width: Spacing.sm },
});
