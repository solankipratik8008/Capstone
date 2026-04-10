import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        variant === 'outline' && isDisabled && styles.disabledOutline,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.textOnPrimary : theme.colors.primary}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.textBase,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              isDisabled && styles.textDisabled,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const createStyles = ({ colors, radii, spacing, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      borderRadius: radii.lg,
    },
    fullWidth: {
      width: '100%',
    },
    variant_primary: {
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.primary,
      ...shadows.glow,
    },
    variant_secondary: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.xs,
    },
    variant_outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    variant_text: {
      backgroundColor: 'transparent',
    },
    size_small: {
      minHeight: 40,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    size_medium: {
      minHeight: 48,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    size_large: {
      minHeight: 56,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },
    disabled: {
      opacity: 0.55,
    },
    disabledOutline: {
      borderColor: colors.borderStrong,
    },
    textBase: {
      fontWeight: typography.weights.bold,
      letterSpacing: 0.2,
    },
    text_primary: {
      color: colors.textOnPrimary,
    },
    text_secondary: {
      color: colors.textPrimary,
    },
    text_outline: {
      color: colors.primary,
    },
    text_text: {
      color: colors.primary,
    },
    textSize_small: {
      fontSize: typography.sizes.sm,
    },
    textSize_medium: {
      fontSize: typography.sizes.md,
    },
    textSize_large: {
      fontSize: typography.sizes.lg,
    },
    textDisabled: {
      color: colors.textMuted,
    },
  });

export default Button;
