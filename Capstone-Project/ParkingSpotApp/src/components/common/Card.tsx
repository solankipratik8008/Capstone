import React, { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '../../theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'elevated',
  padding = 'medium',
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const cardStyle = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`padding_${padding}`],
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
};

const createStyles = ({ colors, radii, spacing, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    base: {
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    variant_elevated: {
      ...shadows.sm,
    },
    variant_outlined: {
      backgroundColor: colors.surface,
    },
    variant_filled: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.surfaceMuted,
    },
    padding_none: {
      padding: 0,
    },
    padding_small: {
      padding: spacing.sm,
    },
    padding_medium: {
      padding: spacing.md,
    },
    padding_large: {
      padding: spacing.lg,
    },
    pressed: {
      opacity: 0.95,
    },
  });

export default Card;
