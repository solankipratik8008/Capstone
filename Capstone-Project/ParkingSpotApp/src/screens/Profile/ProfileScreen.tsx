/**
 * Profile Screen
 * Displays user information and settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, Badge, Card } from '../../components/common';
import { useAuth, useParkingSpots } from '../../context';
import {
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
  SHADOWS,
  UserRole,
} from '../../constants';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBadge?: boolean;
  badgeCount?: number;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showBadge,
  badgeCount,
  danger,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? COLORS.error : COLORS.primary}
      />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {showBadge && badgeCount !== undefined && badgeCount > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badgeCount}</Text>
      </View>
    )}
    <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
  </TouchableOpacity>
);

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut } = useAuth();
  const { userSpots } = useParkingSpots();

  const isHomeowner = user?.role === UserRole.HOMEOWNER;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <Avatar
              source={user?.photoURL}
              name={user?.name}
              size="xlarge"
              onPress={() => navigation.navigate('EditProfile')}
              showEditIcon
            />
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Badge
              text={isHomeowner ? 'Homeowner' : 'User'}
              variant={isHomeowner ? 'info' : 'default'}
            />
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </Card>

        {/* Stats Card (for homeowners) */}
        {isHomeowner && (
          <Card style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userSpots.length}</Text>
              <Text style={styles.statLabel}>Listed Spots</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {userSpots.filter((s) => s.isAvailable).length}
              </Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
          </Card>
        )}

        {/* Menu Section - Parking */}
        {isHomeowner && (
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>My Parking</Text>
            <Card padding="none">
              <MenuItem
                icon="car-outline"
                title="My Parking Spots"
                subtitle={`${userSpots.length} spots listed`}
                onPress={() => navigation.navigate('MySpots')}
                showBadge
                badgeCount={userSpots.length}
              />
              <MenuItem
                icon="add-circle-outline"
                title="Add New Spot"
                subtitle="List a new parking space"
                onPress={() => navigation.navigate('AddSpot')}
              />
            </Card>
          </View>
        )}

        {/* Menu Section - Account */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <Card padding="none">
            <MenuItem
              icon="person-outline"
              title="Personal Information"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => Alert.alert('Coming Soon', 'Notification settings coming soon.')}
            />
            <MenuItem
              icon="card-outline"
              title="Payment Methods"
              onPress={() => Alert.alert('Coming Soon', 'Payment settings coming soon.')}
            />
          </Card>
        </View>

        {/* Menu Section - Support */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support</Text>
          <Card padding="none">
            <MenuItem
              icon="help-circle-outline"
              title="Help Center"
              onPress={() => Alert.alert('Help', 'Visit our help center for assistance.')}
            />
            <MenuItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => Alert.alert('Terms', 'Terms of Service')}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={() => Alert.alert('Privacy', 'Privacy Policy')}
            />
          </Card>
        </View>

        {/* Sign Out */}
        <View style={styles.menuSection}>
          <Card padding="none">
            <MenuItem
              icon="log-out-outline"
              title="Sign Out"
              onPress={handleSignOut}
              danger
            />
          </Card>
        </View>

        {/* App Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  userCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  userName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  userEmail: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  editButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: SPACING.sm,
  },
  menuSection: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  menuSectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuIconDanger: {
    backgroundColor: COLORS.error + '15',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textPrimary,
  },
  menuTitleDanger: {
    color: COLORS.error,
  },
  menuSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginVertical: SPACING.xl,
  },
});

export default ProfileScreen;
