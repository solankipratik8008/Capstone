import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '../../theme';

interface LoadingProps {
  message?: string;
  text?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  text,
  fullScreen = false,
  size = 'large',
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const label = message ?? text;

  if (size === 'small') {
    return (
      <View style={styles.smallContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        {label ? <Text style={styles.message}>{label}</Text> : null}
      </View>
    </View>
  );
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.cardSkeleton}>
      <Skeleton height={160} borderRadius={16} />
      <View style={styles.cardSkeletonContent}>
        <Skeleton width="72%" height={16} />
        <Skeleton width="48%" height={14} style={{ marginTop: 10 }} />
        <Skeleton width="34%" height={14} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
};

const createStyles = ({ colors, spacing, typography, radii, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    fullScreen: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      zIndex: 999,
    },
    card: {
      minWidth: 180,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    message: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      fontWeight: typography.weights.semibold,
      textAlign: 'center',
    },
    smallContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.sm,
    },
    skeleton: {
      backgroundColor: colors.skeleton,
      overflow: 'hidden',
    },
    cardSkeleton: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.xl,
      padding: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardSkeletonContent: {
      padding: spacing.sm,
    },
  });

export default Loading;
