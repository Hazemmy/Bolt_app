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
import { X, Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
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

interface Inventory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onInventoriesChanged: () => void;
}

export function ManageInventoriesModal({ visible, onClose, onInventoriesChanged }: Props) {
  const { user } = useAuth();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('box');

  useEffect(() => {
    if (visible) fetchInventories();
  }, [visible]);

  const fetchInventories = async () => {
    const { data } = await supabase
      .from('inventories')
      .select('*')
      .eq('user_id', user!.id)
      .order('sort_order', { ascending: true });
    setInventories(data ?? []);
  };

  const addInventory = async () => {
    if (!newName.trim()) return;
    const maxOrder = inventories.reduce((max, i) => Math.max(max, i.sort_order), -1);
    await supabase.from('inventories').insert({
      user_id: user!.id,
      name: newName.trim(),
      icon: newIcon,
      sort_order: maxOrder + 1,
    });
    setNewName('');
    setNewIcon('box');
    await fetchInventories();
    onInventoriesChanged();
  };

  const deleteInventory = async (id: string) => {
    const ok =
      Platform.OS === 'web'
        ? window.confirm('Delete this inventory? Medicines in it will become unassigned.')
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Delete Inventory', 'Medicines in it will become unassigned.', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]);
          });
    if (!ok) return;
    await supabase.from('inventories').delete().eq('id', id);
    await fetchInventories();
    onInventoriesChanged();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Manage Inventories</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={inventories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.inventoryRow}>
                <Text style={styles.inventoryIcon}>{iconEmoji(item.icon)}</Text>
                <Text style={styles.inventoryName}>{item.name}</Text>
                <TouchableOpacity onPress={() => deleteInventory(item.id)} style={styles.deleteBtn}>
                  <Trash2 size={16} color={Colors.textTertiary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No inventories yet. Add one below!</Text>
            }
            style={styles.list}
          />

          <View style={styles.addRow}>
            <Text style={styles.sectionLabel}>Add New</Text>
            <View style={styles.iconPicker}>
              {ICON_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.iconOption, newIcon === opt.key && styles.iconOptionSelected]}
                  onPress={() => setNewIcon(opt.key)}>
                  <Text style={styles.iconOptionText}>{iconEmoji(opt.key)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Inventory name"
                placeholderTextColor={Colors.textTertiary}
                onSubmitEditing={addInventory}
              />
              <TouchableOpacity onPress={addInventory} style={styles.addBtn}>
                <Plus size={18} color={Colors.textInverse} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
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
    paddingBottom: Spacing.xxxl,
    maxHeight: '85%',
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
  list: {
    maxHeight: 280,
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  inventoryIcon: {
    fontSize: 22,
  },
  inventoryName: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  deleteBtn: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  addRow: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconOption: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  iconOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  iconOptionText: {
    fontSize: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
});
