import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '../../theme';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPress?: () => void;
  showEditIcon?: boolean;
}

const SIZES = {
  small: 34,
  medium: 48,
  large: 68,
  xlarge: 108,
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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dimension = SIZES[size];
  const fontSize = FONT_SIZES[size];

  const initials = useMemo(() => {
    if (!name?.trim()) {
      return 'P';
    }

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [name]);

  const content = source ? (
    <Image
      source={{ uri: source }}
      style={[
        styles.image,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
      ]}
    />
  ) : (
    <View
      style={[
        styles.placeholder,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );

  const avatar = (
    <View style={styles.container}>
      {content}
      {showEditIcon ? (
        <View style={styles.editIcon}>
          <Ionicons name="camera" size={14} color={theme.colors.textOnPrimary} />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return avatar;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {avatar}
    </TouchableOpacity>
  );
};

const createStyles = ({ colors, radii, spacing, typography }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      position: 'relative',
    },
    image: {
      resizeMode: 'cover',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    initials: {
      color: colors.textOnPrimary,
      fontWeight: typography.weights.bold,
      letterSpacing: 0.4,
    },
    editIcon: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: radii.full,
      backgroundColor: colors.textPrimary,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 1,
      paddingTop: 1,
    },
  });

export default Avatar;
