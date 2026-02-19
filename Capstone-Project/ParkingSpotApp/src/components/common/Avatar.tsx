/**
 * Avatar Component
 * Displays user profile picture or initials
 */

import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../constants';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPress?: () => void;
  showEditIcon?: boolean;
}

const SIZES = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
};

const FONT_SIZES = {
  small: 12,
  medium: 18,
  large: 24,
  xlarge: 36,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  onPress,
  showEditIcon = false,
}) => {
  const dimension = SIZES[size];
  const fontSize = FONT_SIZES[size];

  // Get initials from name
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const containerStyles = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
    },
  ];

  const content = source ? (
    <Image
      source={{ uri: source }}
      style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
    />
  ) : (
    <View style={[styles.placeholder, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}>
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={containerStyles}>
          {content}
          {showEditIcon && (
            <View style={styles.editIcon}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyles}>
      {content}
      {showEditIcon && (
        <View style={styles.editIcon}>
          <Ionicons name="camera" size={14} color={COLORS.white} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.gray[700],
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});

export default Avatar;
