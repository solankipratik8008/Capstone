import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, Card } from '../../components/common';
import { useAuth, useParkingSpots } from '../../context';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';
import { useAppTheme } from '../../theme';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  badge?: string;
}

const MenuRow: React.FC<MenuRowProps> = ({ icon, title, subtitle, onPress, badge }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
};

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut } = useAuth();
  const { userSpots } = useParkingSpots();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const availableCount = userSpots.filter((spot) => spot.isAvailable).length;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {}
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Profile</Text>

        <Card style={styles.profileCard}>
          <Avatar source={user?.photoURL} name={user?.name} size="xlarge" showEditIcon onPress={() => navigation.navigate('EditProfile')} />
          <Text style={styles.name}>{user?.name || 'ParkSpot User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{userSpots.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{availableCount}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>24h</Text>
            <Text style={styles.statLabel}>Support</Text>
          </Card>
        </View>

        <Text style={styles.sectionLabel}>Manage</Text>
        <Card style={styles.menuCard}>
          <MenuRow
            icon="car-outline"
            title="My Parking Spots"
            subtitle="Manage current listings"
            badge={String(userSpots.length)}
            onPress={() => navigation.navigate('MySpots')}
          />
          <View style={styles.rowDivider} />
          <MenuRow
            icon="add-circle-outline"
            title="List a New Spot"
            subtitle="Create a new parking listing"
            onPress={() => navigation.navigate('AddSpot')}
          />
          <View style={styles.rowDivider} />
          <MenuRow
            icon="calendar-outline"
            title="My Bookings"
            subtitle="See your active reservations"
            onPress={() => navigation.navigate('MyBookings')}
          />
          <View style={styles.rowDivider} />
          <MenuRow
            icon="people-outline"
            title="Spot Bookings"
            subtitle="Review bookings for your spots"
            onPress={() => navigation.navigate('OwnerBookings')}
          />
        </Card>

        <Text style={styles.sectionLabel}>Support</Text>
        <Card style={styles.menuCard}>
          <MenuRow icon="card-outline" title="Payment Methods" onPress={() => navigation.navigate('PaymentMethods')} />
          <View style={styles.rowDivider} />
          <MenuRow icon="help-circle-outline" title="Help Center" onPress={() => navigation.navigate('HelpCenter')} />
          <View style={styles.rowDivider} />
          <MenuRow icon="document-text-outline" title="Terms of Service" onPress={() => navigation.navigate('TermsOfService')} />
          <View style={styles.rowDivider} />
          <MenuRow icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
        </Card>

        <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={theme.colors.textPrimary} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = ({ colors, spacing, radii, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    screenTitle: {
      color: colors.textPrimary,
      fontSize: typography.sizes.xxxl,
      fontWeight: typography.weights.heavy,
      marginBottom: spacing.lg,
    },
    profileCard: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      marginBottom: spacing.lg,
    },
    name: {
      marginTop: spacing.md,
      color: colors.textPrimary,
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.heavy,
    },
    email: {
      marginTop: spacing.xs,
      color: colors.textSecondary,
      fontSize: typography.sizes.md,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radii.full,
      backgroundColor: colors.primaryFaint,
    },
    editButtonText: {
      color: colors.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.heavy,
    },
    statLabel: {
      marginTop: spacing.xs,
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    sectionLabel: {
      marginBottom: spacing.sm,
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    menuCard: {
      paddingVertical: spacing.xs,
      marginBottom: spacing.lg,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      backgroundColor: colors.primaryFaint,
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      color: colors.textPrimary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
    },
    menuSubtitle: {
      marginTop: 2,
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
    },
    menuBadge: {
      marginRight: spacing.sm,
      borderRadius: radii.full,
      backgroundColor: colors.primaryFaint,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
    },
    menuBadgeText: {
      color: colors.primary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
    },
    rowDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.md,
    },
    signOutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: 52,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    signOutText: {
      color: colors.textPrimary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
    },
  });

export default ProfileScreen;
