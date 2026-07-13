import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { X, Plus, Trash2, Archive, Sparkles } from 'lucide-react-native';
import { useStorage } from '@/context/storage';
import { useTheme } from '@/context/theme';
import { useLanguage } from '@/context/language';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';

const ICON_OPTIONS = [
  { key: 'drawer', label: 'Drawer' },
  { key: 'cabinet', label: 'Cabinet' },
  { key: 'shelf', label: 'Shelf' },
  { key: 'fridge', label: 'Fridge' },
  { key: 'bag', label: 'Bag' },
  { key: 'box', label: 'Box' },
  { key: 'basket', label: 'Basket' },
  { key: 'closet', label: 'Closet' },
];

function iconEmoji(key: string): string {
  const map: Record<string, string> = {
    drawer: '\u{1F5C4}',
    cabinet: '\u{1F5C5}',
    shelf: '\u{1F4DA}',
    fridge: '\u{1F9CA}',
    bag: '\u{1F45C}',
    box: '\u{1F4E6}',
    basket: '\u{1F9F9}',
    closet: '\u{1F3E0}',
  };
  return map[key] ?? '\u{1F4E6}';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onInventoriesChanged: () => void;
}

export function ManageInventoriesModal({ visible, onClose, onInventoriesChanged }: Props) {
  const { inventories, addInventory, deleteInventory } = useStorage();
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('box');

  const handleAddInventory = async () => {
    if (!newName.trim()) return;
    await addInventory(newName.trim(), newIcon);
    setNewName('');
    setNewIcon('box');
    onInventoriesChanged();
  };

  const handleDeleteInventory = async (id: string) => {
    const ok =
      Platform.OS === 'web'
        ? window.confirm(t.medicines.deleteInventoryConfirm)
        : await new Promise<boolean>((resolve) => {
            Alert.alert(t.medicines.deleteInventoryTitle, t.medicines.deleteInventoryConfirm, [
              { text: t.common.cancel, style: 'cancel', onPress: () => resolve(false) },
              { text: t.common.delete, style: 'destructive', onPress: () => resolve(true) },
            ]);
          });
    if (!ok) return;
    await deleteInventory(id);
    onInventoriesChanged();
  };

  const dynamicStyles = StyleSheet.create({
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.xxl,
      borderTopRightRadius: Radius.xxl,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xxxl,
      maxHeight: '85%',
      ...Shadows.modal,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.inputBorder,
      alignSelf: 'center',
      marginBottom: Spacing.lg,
    },
    sheetTitle: {
      ...Typography.h2,
      color: colors.text,
    },
    closeBtn: {
      padding: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: colors.inputBg,
    },
    inventoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
    },
    inventoryName: {
      flex: 1,
      ...Typography.bodyMedium,
      color: colors.text,
    },
    deleteBtn: {
      padding: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: colors.inputBg,
    },
    separator: {
      height: 1,
      backgroundColor: colors.divider,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingVertical: Spacing.xl,
    },
    sectionLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontFamily: 'Inter-SemiBold',
      textTransform: 'uppercase',
    },
    iconOption: {
      padding: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
    },
    iconOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    input: {
      flex: 1,
      ...Typography.body,
      color: colors.text,
      backgroundColor: colors.inputBg,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      padding: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.button,
    },
    addInventoryBanner: {
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    addInventoryTitle: {
      ...Typography.bodyMedium,
      color: colors.primaryDark,
      fontFamily: 'Inter-SemiBold',
      marginTop: Spacing.sm,
    },
    addInventorySub: {
      ...Typography.caption,
      color: colors.primary,
      marginTop: 2,
    },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={dynamicStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={dynamicStyles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={dynamicStyles.sheetTitle}>{t.medicines.manageInventories}</Text>
            <TouchableOpacity onPress={onClose} style={dynamicStyles.closeBtn}>
              <X size={20} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Add new inventory section - more prominent */}
          <View style={dynamicStyles.addInventoryBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                <Archive size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.addInventoryTitle}>{t.medicines.createNewInventory}</Text>
                <Text style={dynamicStyles.addInventorySub}>{t.medicines.organizeByLocation}</Text>
              </View>
            </View>

            <View style={{ marginTop: Spacing.md }}>
              <Text style={[dynamicStyles.sectionLabel, { marginBottom: Spacing.sm }]}>{t.medicines.chooseIcon}</Text>
              <View style={styles.iconPicker}>
                {ICON_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[dynamicStyles.iconOption, newIcon === opt.key && dynamicStyles.iconOptionSelected]}
                    onPress={() => setNewIcon(opt.key)}>
                    <Text style={styles.iconOptionText}>{iconEmoji(opt.key)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.inputRow, { marginTop: Spacing.md }]}>
              <TextInput
                style={dynamicStyles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder={t.medicines.inventoryNamePlaceholder}
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={handleAddInventory}
              />
              <TouchableOpacity onPress={handleAddInventory} style={dynamicStyles.addBtn}>
                <Plus size={18} color={colors.textInverse} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Existing inventories list */}
          <Text style={[dynamicStyles.sectionLabel, { marginBottom: Spacing.sm }]}>{t.medicines.yourInventories} ({inventories.length})</Text>

          <FlatList
            data={inventories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={dynamicStyles.inventoryRow}>
                <Text style={styles.inventoryIcon}>{iconEmoji(item.icon)}</Text>
                <Text style={dynamicStyles.inventoryName}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteInventory(item.id)} style={dynamicStyles.deleteBtn}>
                  <Trash2 size={16} color={colors.textTertiary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={dynamicStyles.separator} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                <Archive size={32} color={colors.textTertiary} strokeWidth={1.5} />
                <Text style={[dynamicStyles.emptyText, { marginTop: Spacing.sm }]}>{t.home.noInventoriesYet}</Text>
              </View>
            }
            style={styles.list}
          />
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
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  list: {
    maxHeight: 250,
  },
  inventoryIcon: {
    fontSize: 22,
  },
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconOptionText: {
    fontSize: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
