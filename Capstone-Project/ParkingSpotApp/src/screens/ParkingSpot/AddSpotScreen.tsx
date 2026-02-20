/**
 * Add/Edit Parking Spot Screen
 * Form for homeowners to create or edit parking spots
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as ExpoLocation from 'expo-location';


import { Button, Input, ChipGroup, Loading } from '../../components/common';
import { useParkingSpots, useAuth, useLocation } from '../../context';
import { uploadParkingSpotImages } from '../../services/firebase';
import {
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
  SHADOWS,
  SpotType,
  Amenity,
  SPOT_TYPE_LABELS,
  AMENITY_LABELS,
  VALIDATION,
  ParkingSpotFormValues,
} from '../../constants';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type RouteProps = RouteProp<ProfileStackParamList, 'AddSpot'>;

// Validation schema
const SpotSchema = Yup.object().shape({
  title: Yup.string()
    .min(5, 'Title must be at least 5 characters')
    .max(VALIDATION.MAX_TITLE_LENGTH, `Title must be less than ${VALIDATION.MAX_TITLE_LENGTH} characters`)
    .required('Title is required'),
  description: Yup.string()
    .min(20, 'Description must be at least 20 characters')
    .max(VALIDATION.MAX_DESCRIPTION_LENGTH, `Description must be less than ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`)
    .required('Description is required'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zipCode: Yup.string().required('Zip code is required'),
  pricePerHour: Yup.number()
    .min(VALIDATION.MIN_PRICE, `Price must be at least $${VALIDATION.MIN_PRICE}`)
    .max(VALIDATION.MAX_PRICE, `Price must be less than $${VALIDATION.MAX_PRICE}`)
    .required('Hourly price is required'),
  pricePerDay: Yup.number()
    .min(0, 'Daily price must be positive')
    .nullable(),
});

// Spot type options for selection
const spotTypeOptions = Object.entries(SPOT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// Amenity options for selection
const amenityOptions = Object.entries(AMENITY_LABELS).map(([value, label]) => ({
  value,
  label,
  icon: getAmenityIcon(value as Amenity),
}));

function getAmenityIcon(amenity: Amenity): keyof typeof Ionicons.glyphMap {
  const icons: Record<Amenity, keyof typeof Ionicons.glyphMap> = {
    [Amenity.COVERED]: 'umbrella-outline',
    [Amenity.GATED]: 'lock-closed-outline',
    [Amenity.WELL_LIT]: 'bulb-outline',
    [Amenity.SECURITY_CAMERA]: 'videocam-outline',
    [Amenity.EV_CHARGING]: 'flash-outline',
    [Amenity.HANDICAP_ACCESSIBLE]: 'accessibility-outline',
    [Amenity.WIDE_SPACE]: 'resize-outline',
    [Amenity.NEARBY_RESTROOM]: 'water-outline',
  };
  return icons[amenity] || 'checkmark-outline';
}

export const AddSpotScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const spotId = route.params?.spotId;
  const isEditing = !!spotId;

  const { user } = useAuth();
  const { addSpot, updateSpot, getSpotById } = useParkingSpots();
  const { userLocation, getCurrentLocation } = useLocation();

  const [images, setImages] = useState<string[]>([]);
  const [selectedSpotType, setSelectedSpotType] = useState<SpotType>(SpotType.DRIVEWAY);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Initial form values
  const [initialValues, setInitialValues] = useState<ParkingSpotFormValues>({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    pricePerHour: '',
    pricePerDay: '',
    spotType: SpotType.DRIVEWAY,
    amenities: [],
    isAvailable: true,
  });

  // Load existing spot data if editing
  useEffect(() => {
    if (isEditing && spotId) {
      const spot = getSpotById(spotId);
      if (spot) {
        setInitialValues({
          title: spot.title,
          description: spot.description,
          address: spot.location.address || '',
          city: spot.location.city || '',
          state: spot.location.state || '',
          zipCode: spot.location.zipCode || '',
          pricePerHour: spot.pricePerHour.toString(),
          pricePerDay: spot.pricePerDay?.toString() || '',
          spotType: spot.spotType,
          amenities: spot.amenities,
          isAvailable: spot.isAvailable,
        });
        setImages(spot.imageURLs);
        setSelectedSpotType(spot.spotType);
        setSelectedAmenities(spot.amenities);
        setIsAvailable(spot.isAvailable);
        setSelectedCoordinates({
          latitude: spot.location.latitude,
          longitude: spot.location.longitude
        });
      }
    }
  }, [isEditing, spotId, getSpotById]);

  // Pick images from library
  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: VALIDATION.MAX_IMAGES - images.length,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...newImages].slice(0, VALIDATION.MAX_IMAGES));
    }
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, VALIDATION.MAX_IMAGES));
    }
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Use current location
  const handleUseCurrentLocation = async (setFieldValue: any) => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        // Update form fields
        if (location.address) setFieldValue('address', location.address);
        if (location.city) setFieldValue('city', location.city);
        if (location.state) setFieldValue('state', location.state);
        if (location.zipCode) setFieldValue('zipCode', location.zipCode);

        // Set coordinates
        setSelectedCoordinates({
          latitude: location.latitude,
          longitude: location.longitude
        });

        if (!location.address && !location.city) {
          Alert.alert(
            'Location Found',
            'Your coordinates were detected but we could not resolve a street address. Please enter your address manually.'
          );
        }
      } else {
        Alert.alert(
          'Location Unavailable',
          'Could not get your current location. Please make sure location services are enabled and try again, or enter your address manually.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'Failed to get location.');
    }
    setIsLoadingLocation(false);
  };

  // Submit form
  const handleSubmit = async (values: ParkingSpotFormValues) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a parking spot.');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Images Required', 'Please add at least one image of your parking spot.');
      return;
    }

    setIsSubmitting(true);

    try {
      // ... (Image upload logic remains the same)
      const isLocalUri = (uri: string) =>
        uri.startsWith('file://') || uri.startsWith('content://');

      let imageURLs = images;
      const localImages = images.filter(isLocalUri);

      if (localImages.length > 0) {
        const tempId = isEditing && spotId ? spotId : `temp_${Date.now()}`;
        const uploadedURLs = await uploadParkingSpotImages(localImages, tempId);

        // Replace local URIs with uploaded Firebase Storage URLs
        imageURLs = images.map((uri) => {
          if (isLocalUri(uri)) {
            const index = localImages.indexOf(uri);
            return uploadedURLs[index] || uri;
          }
          return uri;
        });
      }

      // DETERMINING LOCATION PRIORITIES:
      // 1. Selected via Autocomplete or "Use Current" (selectedCoordinates)
      // 2. Current User Location (userLocation)
      // 3. Default San Francisco

      let latitude = 37.7749;
      let longitude = -122.4194;

      if (selectedCoordinates) {
        latitude = selectedCoordinates.latitude;
        longitude = selectedCoordinates.longitude;
      } else if (values.address && values.city) {
        // Fallback: Geocode the address if selectedCoordinates is missing
        try {
          const fullAddress = `${values.address}, ${values.city}, ${values.state} ${values.zipCode}`;
          const geocoded = await ExpoLocation.geocodeAsync(fullAddress);
          if (geocoded.length > 0) {
            latitude = geocoded[0].latitude;
            longitude = geocoded[0].longitude;
          } else if (userLocation) {
            console.log('Geocoding failed, falling back to user location');
            latitude = userLocation.latitude;
            longitude = userLocation.longitude;
          }
        } catch (e) {
          console.log('Geocoding error:', e);
          if (userLocation) {
            latitude = userLocation.latitude;
            longitude = userLocation.longitude;
          }
        }
      } else if (userLocation) {
        latitude = userLocation.latitude;
        longitude = userLocation.longitude;
      } else {
        // Fallback or alert if strictness is required
      }


      const spotData = {
        ownerId: user.uid,
        ownerName: user.name,
        title: values.title,
        description: values.description,
        location: {
          latitude,
          longitude,
          address: values.address,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
        },
        pricePerHour: parseFloat(values.pricePerHour),
        pricePerDay: values.pricePerDay ? parseFloat(values.pricePerDay) : undefined,
        imageURLs,
        isAvailable,
        spotType: selectedSpotType,
        amenities: selectedAmenities as Amenity[],
      };

      if (isEditing && spotId) {
        await updateSpot(spotId, spotData);
        Alert.alert('Success', 'Your parking spot has been updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addSpot(spotData);
        Alert.alert('Success', 'Your parking spot has been listed!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save parking spot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Parking Spot' : 'List Your Spot'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Formik
            initialValues={initialValues}
            validationSchema={SpotSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              values,
              errors,
              touched,
            }) => (
              <>
                {/* Images Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Photos</Text>
                  <Text style={styles.sectionSubtitle}>
                    Add up to {VALIDATION.MAX_IMAGES} photos of your parking spot
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imagesScroll}
                  >
                    {images.map((uri, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image source={{ uri }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => handleRemoveImage(index)}
                        >
                          <Ionicons name="close-circle" size={24} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {images.length < VALIDATION.MAX_IMAGES && (
                      <View style={styles.addImageButtons}>
                        <TouchableOpacity
                          style={styles.addImageButton}
                          onPress={handlePickImages}
                        >
                          <Ionicons name="images-outline" size={24} color={COLORS.primary} />
                          <Text style={styles.addImageText}>Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.addImageButton}
                          onPress={handleTakePhoto}
                        >
                          <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                          <Text style={styles.addImageText}>Camera</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </ScrollView>
                </View>

                {/* Basic Info Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>

                  <Input
                    label="Title"
                    placeholder="e.g., Spacious Driveway Near Downtown"
                    value={values.title}
                    onChangeText={handleChange('title')}
                    onBlur={handleBlur('title')}
                    error={errors.title}
                    touched={touched.title}
                  />

                  <Input
                    label="Description"
                    placeholder="Describe your parking spot..."
                    value={values.description}
                    onChangeText={handleChange('description')}
                    onBlur={handleBlur('description')}
                    error={errors.description}
                    touched={touched.description}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Spot Type Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Spot Type</Text>
                  <ChipGroup
                    items={spotTypeOptions}
                    selectedValues={[selectedSpotType]}
                    onSelectionChange={(values) => setSelectedSpotType(values[0] as SpotType)}
                    multiSelect={false}
                  />
                </View>

                {/* Amenities Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amenities</Text>
                  <ChipGroup
                    items={amenityOptions}
                    selectedValues={selectedAmenities}
                    onSelectionChange={setSelectedAmenities}
                    multiSelect
                  />
                </View>

                {/* Location Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <TouchableOpacity
                      style={styles.locationButton}
                      onPress={() => handleUseCurrentLocation(setFieldValue)}
                      disabled={isLoadingLocation}
                    >
                      {isLoadingLocation ? (
                        <Loading size="small" />
                      ) : (
                        <>
                          <Ionicons name="locate" size={16} color={COLORS.primary} />
                          <Text style={styles.locationButtonText}>Use current</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={{ zIndex: 1000, marginBottom: SPACING.md }}>
                    <Text style={{
                      fontSize: FONTS.sizes.sm,
                      fontWeight: FONTS.weights.medium,
                      color: COLORS.textPrimary,
                      marginBottom: SPACING.xs,
                      marginLeft: SPACING.xs,
                    }}>
                      Street Address
                    </Text>
                    <GooglePlacesAutocomplete
                      placeholder="Search for an address..."
                      onPress={(data, details = null) => {
                        // 'details' is provided when fetchDetails = true
                        if (details) {
                          const addressComponents = details.address_components;
                          let streetNumber = '';
                          let route = '';
                          let city = '';
                          let state = '';
                          let zipCode = '';

                          addressComponents.forEach((component) => {
                            if (component.types.includes('street_number')) {
                              streetNumber = component.long_name;
                            }
                            if (component.types.includes('route')) {
                              route = component.long_name;
                            }
                            if (component.types.includes('locality')) {
                              city = component.long_name;
                            }
                            if (component.types.includes('administrative_area_level_1')) {
                              state = component.short_name;
                            }
                            if (component.types.includes('postal_code')) {
                              zipCode = component.long_name;
                            }
                          });

                          setFieldValue('address', `${streetNumber} ${route}`.trim());
                          setFieldValue('city', city);
                          setFieldValue('state', state);
                          setFieldValue('zipCode', zipCode);

                          // Update selected coordinates from Autocomplete details
                          if (details.geometry && details.geometry.location) {
                            console.log('Autocomplete Details:', details.geometry.location);
                            setSelectedCoordinates({
                              latitude: details.geometry.location.lat,
                              longitude: details.geometry.location.lng,
                            });
                          } else {
                            // If no geometry, clear any previous selection so we fallback to geocoding
                            console.log('No geometry in details, clearing selected coordinates');
                            setSelectedCoordinates(null);
                          }
                        }
                      }}
                      query={{
                        key: 'AIzaSyCiRTCJBWv5Ws09drozNPflqeQpEiL6Bog', // Using iOS key as default, but works for JS API too if unrestricted
                        language: 'en',
                        components: 'country:ca|country:us', // Limit to Canada and US
                      }}
                      fetchDetails={true}
                      textInputProps={{
                        value: values.address,
                        onChangeText: handleChange('address'),
                        onBlur: handleBlur('address'),
                      }}
                      styles={{
                        textInput: {
                          height: 50,
                          backgroundColor: COLORS.white,
                          borderRadius: BORDER_RADIUS.md,
                          paddingHorizontal: SPACING.md,
                          fontSize: FONTS.sizes.md,
                          color: COLORS.textPrimary,
                          borderWidth: 1,
                          borderColor: errors.address && touched.address ? COLORS.error : COLORS.gray[300],
                        },
                        listView: {
                          position: 'absolute',
                          top: 50, // Height of text input
                          zIndex: 1000,
                          backgroundColor: COLORS.white,
                          borderRadius: BORDER_RADIUS.md,
                          borderWidth: 1,
                          borderColor: COLORS.gray[200],
                        },
                      }}
                      enablePoweredByContainer={false}
                    />
                    {errors.address && touched.address && (
                      <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 4, marginLeft: SPACING.xs }}>
                        {errors.address}
                      </Text>
                    )}
                  </View>

                  <View style={styles.row}>
                    <View style={styles.flex1}>
                      <Input
                        label="City"
                        placeholder="City"
                        value={values.city}
                        onChangeText={handleChange('city')}
                        onBlur={handleBlur('city')}
                        error={errors.city}
                        touched={touched.city}
                      />
                    </View>
                    <View style={styles.flex1}>
                      <Input
                        label="State"
                        placeholder="State"
                        value={values.state}
                        onChangeText={handleChange('state')}
                        onBlur={handleBlur('state')}
                        error={errors.state}
                        touched={touched.state}
                      />
                    </View>
                  </View>

                  <Input
                    label="Zip Code"
                    placeholder="A1A 1A1"
                    value={values.zipCode}
                    onChangeText={handleChange('zipCode')}
                    onBlur={handleBlur('zipCode')}
                    error={errors.zipCode}
                    touched={touched.zipCode}
                    keyboardType="default"
                    autoCapitalize="characters"
                  />
                </View>

                {/* Pricing Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pricing</Text>

                  <View style={styles.row}>
                    <View style={styles.flex1}>
                      <Input
                        label="Price per Hour ($)"
                        placeholder="5.00"
                        value={values.pricePerHour}
                        onChangeText={handleChange('pricePerHour')}
                        onBlur={handleBlur('pricePerHour')}
                        error={errors.pricePerHour}
                        touched={touched.pricePerHour}
                        keyboardType="decimal-pad"
                        leftIcon="cash-outline"
                      />
                    </View>
                    <View style={styles.flex1}>
                      <Input
                        label="Price per Day ($)"
                        placeholder="30.00 (optional)"
                        value={values.pricePerDay}
                        onChangeText={handleChange('pricePerDay')}
                        onBlur={handleBlur('pricePerDay')}
                        error={errors.pricePerDay}
                        touched={touched.pricePerDay}
                        keyboardType="decimal-pad"
                        leftIcon="calendar-outline"
                      />
                    </View>
                  </View>
                </View>

                {/* Availability Toggle */}
                <View style={styles.section}>
                  <TouchableOpacity
                    style={styles.availabilityToggle}
                    onPress={() => setIsAvailable(!isAvailable)}
                  >
                    <View>
                      <Text style={styles.availabilityLabel}>Available for booking</Text>
                      <Text style={styles.availabilitySubtext}>
                        {isAvailable ? 'Your spot is visible to users' : 'Your spot is hidden'}
                      </Text>
                    </View>
                    <Ionicons
                      name={isAvailable ? 'toggle' : 'toggle-outline'}
                      size={48}
                      color={isAvailable ? COLORS.success : COLORS.gray[400]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <Button
                  title={isEditing ? 'Update Spot' : 'List Parking Spot'}
                  onPress={() => handleSubmit()}
                  loading={isSubmitting}
                  fullWidth
                  size="large"
                  style={styles.submitButton}
                />
              </>
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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  imagesScroll: {
    marginTop: SPACING.sm,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  addImageButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  locationButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  flex1: {
    flex: 1,
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  availabilityLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textPrimary,
  },
  availabilitySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  submitButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
});

export default AddSpotScreen;
