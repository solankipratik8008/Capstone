/**
 * Badge and Chip Components
 * For displaying status, tags, and selectable options
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants';

// Badge Component
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
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], styles[`badge_${size}`], style]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`], styles[`badgeText_${size}`]]}>
        {text}
      </Text>
    </View>
  );
};

// Chip Component (selectable)
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
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? COLORS.white : COLORS.textSecondary}
          style={styles.chipIcon}
        />
      )}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Chip Group Component
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
  const handlePress = (value: string) => {
    if (multiSelect) {
      if (selectedValues.includes(value)) {
        onSelectionChange(selectedValues.filter((v) => v !== value));
      } else {
        onSelectionChange([...selectedValues, value]);
      }
    } else {
      onSelectionChange([value]);
    }
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

const styles = StyleSheet.create({
  // Badge styles
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  badge_default: {
    backgroundColor: COLORS.gray[200],
  },
  badge_success: {
    backgroundColor: '#D1FAE5',
  },
  badge_warning: {
    backgroundColor: '#FEF3C7',
  },
  badge_error: {
    backgroundColor: '#FEE2E2',
  },
  badge_info: {
    backgroundColor: '#DBEAFE',
  },
  badge_small: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  badge_medium: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  badgeText: {
    fontWeight: FONTS.weights.medium,
  },
  badgeText_default: {
    color: COLORS.gray[700],
  },
  badgeText_success: {
    color: '#065F46',
  },
  badgeText_warning: {
    color: '#92400E',
  },
  badgeText_error: {
    color: '#991B1B',
  },
  badgeText_info: {
    color: '#1E40AF',
  },
  badgeText_small: {
    fontSize: FONTS.sizes.xs,
  },
  badgeText_medium: {
    fontSize: FONTS.sizes.sm,
  },

  // Chip styles
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipIcon: {
    marginRight: SPACING.xs,
  },
  chipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.white,
  },

  // Chip Group styles
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default Badge;
