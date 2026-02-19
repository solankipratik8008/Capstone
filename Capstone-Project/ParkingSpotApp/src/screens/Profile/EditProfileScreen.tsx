/**
 * Edit Profile Screen
 * Allows users to edit their profile information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { Button, Input, Avatar, Loading } from '../../components/common';
import { useAuth } from '../../context';
import { uploadProfileImage } from '../../services/firebase';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '../../constants';

// Validation schema
const ProfileSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  phone: Yup.string()
    .matches(/^[0-9+\-\s()]*$/, 'Invalid phone number format')
    .nullable(),
});

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUserProfile } = useAuth();

  const [profileImage, setProfileImage] = useState<string | null>(user?.photoURL || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploadingImage(true);
      try {
        if (user) {
          const downloadURL = await uploadProfileImage(result.assets[0].uri, user.uid);
          setProfileImage(downloadURL);
          await updateUserProfile({ photoURL: downloadURL });
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to upload profile picture.');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (values: { name: string; phone: string }) => {
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        name: values.name,
        phone: values.phone || undefined,
      });
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={handlePickImage} disabled={isUploadingImage}>
              {isUploadingImage ? (
                <View style={styles.imagePlaceholder}>
                  <Loading size="small" />
                </View>
              ) : (
                <Avatar
                  source={profileImage}
                  name={user?.name}
                  size="xlarge"
                  showEditIcon
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handlePickImage}
              disabled={isUploadingImage}
            >
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Formik
            initialValues={{
              name: user?.name || '',
              phone: user?.phone || '',
            }}
            validationSchema={ProfileSchema}
            onSubmit={handleSubmit}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View style={styles.form}>
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  error={errors.name}
                  touched={touched.name}
                  leftIcon="person-outline"
                />

                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Email</Text>
                  <Text style={styles.readOnlyValue}>{user?.email}</Text>
                  <Text style={styles.readOnlyHint}>Email cannot be changed</Text>
                </View>

                <Input
                  label="Phone Number"
                  placeholder="(555) 123-4567"
                  value={values.phone}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  error={errors.phone}
                  touched={touched.phone}
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                />

                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Account Type</Text>
                  <Text style={styles.readOnlyValue}>
                    {user?.role === 'homeowner' ? 'Homeowner' : 'User'}
                  </Text>
                  <Text style={styles.readOnlyHint}>
                    Contact support to change account type
                  </Text>
                </View>

                <Button
                  title="Save Changes"
                  onPress={() => handleSubmit()}
                  loading={isSubmitting}
                  fullWidth
                  size="large"
                  style={styles.saveButton}
                />
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  imagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    marginTop: SPACING.md,
  },
  changePhotoText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  form: {
    flex: 1,
  },
  readOnlyField: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.md,
  },
  readOnlyLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  readOnlyValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  readOnlyHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  saveButton: {
    marginTop: SPACING.xl,
  },
});

export default EditProfileScreen;
