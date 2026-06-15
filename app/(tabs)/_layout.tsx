import { Tabs } from 'expo-router';
import { Pill, Home, User } from 'lucide-react-native';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { Colors, Shadows, Radius, Typography, Spacing } from '@/lib/theme';
import { useState } from 'react';
import { AddMedicineModal } from '@/components/AddMedicineModal';
import { useAuth } from '@/context/auth';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();

  const onAdded = async () => {
    // Just close - the individual screens will refetch on focus
  };

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const iconMap: Record<string, any> = {
            index: Home,
            medicines: Pill,
            profile: User,
          };

          const IconComponent = iconMap[route.name] || Home;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Middle position gets the floating add button (no label)
          if (index === 1) {
            return (
              <View key={route.key} style={styles.tabItemContainer}>
                <TouchableOpacity onPress={onPress} style={styles.addBtnTabItem}>
                  <TouchableOpacity
                    style={styles.floatingAddBtn}
                    onPress={() => setShowAddModal(true)}
                    activeOpacity={0.85}>
                    <Plus size={28} color={Colors.textInverse} strokeWidth={2.5} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}>
              <IconComponent
                size={22}
                color={isFocused ? Colors.tabBarActive : Colors.tabBarInactive}
                strokeWidth={2}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {options.title || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <AddMedicineModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={onAdded}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="medicines"
        options={{
          title: 'Medicines',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.divider,
    borderTopWidth: 1,
    ...Shadows.card,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.xs,
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
  },
  addBtnTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xs,
  },
  tabLabel: {
    ...Typography.tabLabel,
    color: Colors.tabBarInactive,
  },
  tabLabelActive: {
    color: Colors.tabBarActive,
  },
  floatingAddBtn: {
    position: 'absolute',
    top: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
