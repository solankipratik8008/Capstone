import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '../../theme';

interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'medium',
  style,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.badge, styles[`badge_${variant}`], styles[`size_${size}`], style]}>
      <Text style={[styles.badgeText, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {text}
      </Text>
    </View>
  );
};

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
  style,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const iconColor = selected ? theme.colors.textOnPrimary : theme.colors.textSecondary;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.8}
    >
      {icon ? <Ionicons name={icon} size={16} color={iconColor} style={styles.chipIcon} /> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

interface ChipGroupProps {
  items: { label: string; value: string; icon?: keyof typeof Ionicons.glyphMap }[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  multiSelect?: boolean;
  style?: ViewStyle;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({
  items,
  selectedValues,
  onSelectionChange,
  multiSelect = true,
  style,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = (value: string) => {
    if (multiSelect) {
      if (selectedValues.includes(value)) {
        onSelectionChange(selectedValues.filter((current) => current !== value));
      } else {
        onSelectionChange([...selectedValues, value]);
      }
      return;
    }

    onSelectionChange([value]);
  };

  return (
    <View style={[styles.chipGroup, style]}>
      {items.map((item) => (
        <Chip
          key={item.value}
          label={item.label}
          icon={item.icon}
          selected={selectedValues.includes(item.value)}
          onPress={() => handlePress(item.value)}
        />
      ))}
    </View>
  );
};

const createStyles = ({ colors, radii, spacing, typography }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radii.full,
      paddingHorizontal: spacing.sm,
      borderWidth: 1,
    },
    badge_default: {
      backgroundColor: colors.badgeNeutral,
      borderColor: colors.border,
    },
    badge_success: {
      backgroundColor: colors.primaryFaint,
      borderColor: colors.primary,
    },
    badge_warning: {
      backgroundColor: colors.badgeNeutral,
      borderColor: colors.borderStrong,
    },
    badge_error: {
      backgroundColor: colors.badgeNeutral,
      borderColor: colors.borderStrong,
    },
    badge_info: {
      backgroundColor: colors.primaryFaint,
      borderColor: colors.primary,
    },
    size_small: {
      paddingVertical: 3,
    },
    size_medium: {
      paddingVertical: 5,
    },
    badgeText: {
      fontWeight: typography.weights.semibold,
      letterSpacing: 0.2,
    },
    text_default: {
      color: colors.textSecondary,
    },
    text_success: {
      color: colors.primary,
    },
    text_warning: {
      color: colors.textSecondary,
    },
    text_error: {
      color: colors.textSecondary,
    },
    text_info: {
      color: colors.primary,
    },
    textSize_small: {
      fontSize: typography.sizes.xs,
    },
    textSize_medium: {
      fontSize: typography.sizes.sm,
    },
    chipGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipDisabled: {
      opacity: 0.45,
    },
    chipIcon: {
      marginRight: spacing.xs,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    chipTextSelected: {
      color: colors.textOnPrimary,
    },
  });

export default Badge;
