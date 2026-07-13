import { Tabs } from 'expo-router';
import { Pill, Home, User } from 'lucide-react-native';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { Typography, Spacing, Shadows } from '@/lib/theme';
import { useState } from 'react';
import { AddMedicineModal } from '@/components/AddMedicineModal';
import { useTheme } from '@/context/theme';
import { useLanguage } from '@/context/language';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useLanguage();

  const titleMap: Record<string, string> = {
    index: t.nav.home,
    medicines: t.nav.medicines,
    profile: t.nav.profile,
  };

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder, paddingBottom: insets.bottom }]}>
      <View style={[styles.tabBarInner, isRTL && { flexDirection: 'row-reverse' }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const iconMap: Record<string, any> = { index: Home, medicines: Pill, profile: User };
          const IconComponent = iconMap[route.name] || Home;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (index === 1) {
            return (
              <View key={route.key} style={styles.fabSlot}>
                <TouchableOpacity
                  style={[styles.fab, { backgroundColor: colors.primary, borderColor: isDark ? colors.cardBorder : '#EEF9F8' }]}
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.82}>
                  <Plus size={26} color={colors.textInverse} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem}>
              <IconComponent
                size={22}
                color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
                strokeWidth={2}
              />
              <Text style={[styles.tabLabel, { color: isFocused ? colors.tabBarActive : colors.tabBarInactive }]}>
                {titleMap[route.name] || options.title || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <AddMedicineModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdded={() => {}} />
    </View>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t.nav.home }} />
      <Tabs.Screen name="medicines" options={{ title: t.nav.medicines }} />
      <Tabs.Screen name="profile" options={{ title: t.nav.profile }} />
    </Tabs>
  );
}

const FAB_SIZE = 54;

const styles = StyleSheet.create({
  tabBarContainer: {
    borderTopWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 10,
  },
  tabBarInner: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  tabLabel: {
    ...Typography.tabLabel,
  },
});
