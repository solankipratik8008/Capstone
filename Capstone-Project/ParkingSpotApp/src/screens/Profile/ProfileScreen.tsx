/**
 * Profile Screen — premium redesign
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

import { Avatar } from '../../components/common';
import { useAuth, useParkingSpots } from '../../context';
import { COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '../../constants';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  badgeCount?: number;
  danger?: boolean;
  last?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon, iconColor, iconBg, title, subtitle, onPress, badgeCount, danger, last,
}) => (
  <TouchableOpacity
    style={[styles.menuItem, last && styles.menuItemLast]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.menuIcon, { backgroundColor: danger ? COLORS.error + '15' : (iconBg ?? COLORS.primary + '15') }]}>
      <Ionicons name={icon} size={20} color={danger ? COLORS.error : (iconColor ?? COLORS.primary)} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {badgeCount !== undefined && badgeCount > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badgeCount}</Text>
      </View>
    )}
    {!danger && <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />}
  </TouchableOpacity>
);

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut } = useAuth();
  const { userSpots } = useParkingSpots();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { try { await signOut(); } catch {} },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header banner */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="settings-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* User card */}
        <View style={styles.userCardWrapper}>
          <View style={styles.userCard}>
            <Avatar
              source={user?.photoURL}
              name={user?.name}
              size="xlarge"
              onPress={() => navigation.navigate('EditProfile')}
              showEditIcon
            />
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            <View style={styles.memberBadge}>
              <Ionicons name="star" size={12} color={COLORS.accent} />
              <Text style={styles.memberBadgeText}>ParkSpot Member</Text>
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{userSpots.length}</Text>
            <Text style={styles.statLabel}>Listed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{userSpots.filter((s) => s.isAvailable).length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>★ –</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* My Parking */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY PARKING</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="car-outline"
              iconColor="#3B82F6"
              iconBg="#3B82F615"
              title="My Parking Spots"
              subtitle={`${userSpots.length} spot${userSpots.length !== 1 ? 's' : ''} listed`}
              onPress={() => navigation.navigate('MySpots')}
              badgeCount={userSpots.length}
            />
            <MenuItem
              icon="people-outline"
              iconColor="#8B5CF6"
              iconBg="#8B5CF615"
              title="Spot Bookings"
              subtitle="See who booked your spots"
              onPress={() => navigation.navigate('OwnerBookings')}
            />
            <MenuItem
              icon="add-circle-outline"
              iconColor="#10B981"
              iconBg="#10B98115"
              title="Add New Spot"
              subtitle="List a new parking space"
              onPress={() => navigation.navigate('AddSpot')}
              last
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              title="Personal Information"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <MenuItem
              icon="calendar-outline"
              iconColor="#F97316"
              iconBg="#F9731615"
              title="My Bookings"
              subtitle="View your parking reservations"
              onPress={() => navigation.navigate('MyBookings')}
            />
            <MenuItem
              icon="card-outline"
              iconColor="#635BFF"
              iconBg="#635BFF15"
              title="Payment Methods"
              subtitle="Powered by Stripe"
              onPress={() => navigation.navigate('PaymentMethods')}
              last
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              iconColor="#06B6D4"
              iconBg="#06B6D415"
              title="Help Center"
              subtitle="FAQs and contact support"
              onPress={() => navigation.navigate('HelpCenter')}
            />
            <MenuItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => navigation.navigate('TermsOfService')}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              iconColor="#10B981"
              iconBg="#10B98115"
              title="Privacy Policy"
              onPress={() => navigation.navigate('PrivacyPolicy')}
              last
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { marginBottom: SPACING.xl }]}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              title="Sign Out"
              onPress={handleSignOut}
              danger
              last
            />
          </View>
        </View>

        <Text style={styles.version}>ParkSpot v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  headerBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xxxl,
  },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.bold, color: COLORS.white },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },

  userCardWrapper: { paddingHorizontal: SPACING.lg, marginTop: -SPACING.xxl, marginBottom: SPACING.md },
  userCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, alignItems: 'center', ...SHADOWS.lg,
  },
  userName: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginTop: SPACING.md },
  userEmail: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2, marginBottom: SPACING.sm },
  memberBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.accent + '15', borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 5, marginBottom: SPACING.md,
  },
  memberBadgeText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.accent },
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg,
  },
  editProfileBtnText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.primary },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    marginBottom: SPACING.lg, ...SHADOWS.sm,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.bold, color: COLORS.primary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.gray[200] },

  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  sectionLabel: {
    fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.textMuted,
    letterSpacing: 1, marginBottom: SPACING.sm, marginLeft: SPACING.xs,
  },
  menuCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', ...SHADOWS.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray[100],
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.medium, color: COLORS.textPrimary },
  menuTitleDanger: { color: COLORS.error },
  menuSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 1 },
  badge: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full, marginRight: SPACING.sm,
    minWidth: 22, alignItems: 'center',
  },
  badgeText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.white },
  version: { textAlign: 'center', fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl },
});

export default ProfileScreen;
