import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  touched?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  touched,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  multiline,
  ...props
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showError = Boolean(touched && error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          showError && styles.inputError,
          multiline && styles.inputMultiline,
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={isFocused ? theme.colors.primary : theme.colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          {...props}
          multiline={multiline}
          style={[
            styles.input,
            multiline && styles.multilineText,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={theme.colors.inputPlaceholder}
          secureTextEntry={isPassword && !isPasswordVisible}
          selectionColor={theme.colors.primary}
          cursorColor={theme.colors.primary}
          onFocus={(event) => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            props.onBlur?.(event);
          }}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIconButton}
            onPress={() => setIsPasswordVisible((current) => !current)}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}

        {rightIcon && !isPassword ? (
          <TouchableOpacity
            style={styles.rightIconButton}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <Ionicons name={rightIcon} size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showError ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const createStyles = ({ colors, radii, spacing, typography }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    inputContainer: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radii.lg,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceElevated,
    },
    inputError: {
      borderColor: colors.primaryDark,
    },
    inputMultiline: {
      alignItems: 'flex-start',
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    input: {
      flex: 1,
      minHeight: 54,
      color: colors.textPrimary,
      fontSize: typography.sizes.md,
      paddingVertical: spacing.md,
    },
    multilineText: {
      minHeight: 112,
      paddingTop: 0,
      textAlignVertical: 'top',
    },
    inputWithLeftIcon: {
      paddingLeft: spacing.sm,
    },
    inputWithRightIcon: {
      paddingRight: spacing.sm,
    },
    leftIcon: {
      marginTop: 1,
    },
    rightIconButton: {
      paddingLeft: spacing.sm,
      paddingVertical: spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      marginTop: spacing.xs,
      marginLeft: spacing.xs,
      color: colors.primary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
    },
  });

export default Input;
