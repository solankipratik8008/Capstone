import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { MapStackNavigator } from './MapStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { ChatStackNavigator } from './ChatStackNavigator';
import SearchScreen from '../screens/Search/SearchScreen';
import AddSpotScreen from '../screens/ParkingSpot/AddSpotScreen';
import { useAppTheme } from '../theme';

export type MainTabParamList = {
  MapTab: undefined;
  SearchTab: undefined;
  AddSpotTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: route.name !== 'AddSpotTab',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'AddSpotTab') {
            return (
              <View style={styles.addButton}>
                <Ionicons name="add" size={26} color={theme.colors.textOnPrimary} />
              </View>
            );
          }

          const iconName: keyof typeof Ionicons.glyphMap =
            route.name === 'MapTab'
              ? focused ? 'map' : 'map-outline'
              : route.name === 'SearchTab'
                ? focused ? 'search' : 'search-outline'
                : route.name === 'MessagesTab'
                  ? focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'
                  : focused ? 'person' : 'person-outline';

          const label =
            route.name === 'MapTab'
              ? 'Map'
              : route.name === 'SearchTab'
                ? 'Search'
                : route.name === 'MessagesTab'
                  ? 'Chat'
                  : 'Profile';

          return (
            <View style={styles.iconStack}>
              <View style={[styles.iconPill, focused && styles.iconPillActive]}>
                <Ionicons name={iconName} size={21} color={color} />
              </View>
              <Text style={[styles.iconLabel, focused && styles.iconLabelActive]}>{label}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="MapTab" component={MapStackNavigator} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="AddSpotTab" component={AddSpotScreen} options={{ tabBarLabel: () => null }} />
      <Tab.Screen name="MessagesTab" component={ChatStackNavigator} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ tabBarLabel: '' }} />
    </Tab.Navigator>
  );
};

const createStyles = ({ colors, radii, spacing, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    tabBar: {
      height: Platform.OS === 'ios' ? 92 : 74,
      paddingTop: spacing.sm,
      paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
      backgroundColor: colors.tabBar,
      borderTopWidth: 1,
      borderTopColor: colors.tabBarBorder,
      ...shadows.sm,
    },
    tabBarLabel: {
      display: 'none',
    },
    iconStack: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minWidth: 60,
    },
    iconPill: {
      width: 42,
      height: 34,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconPillActive: {
      backgroundColor: colors.primaryFaint,
    },
    iconLabel: {
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      fontWeight: typography.weights.semibold,
    },
    iconLabelActive: {
      color: colors.primary,
    },
    addButton: {
      width: 56,
      height: 56,
      borderRadius: radii.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Platform.OS === 'ios' ? 18 : 10,
      ...shadows.glow,
    },
  });

export default MainTabNavigator;
