import React, { useState, useEffect, useMemo } from 'react';
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
  Switch,
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
  SpotType,
  Amenity,
  SPOT_TYPE_LABELS,
  AMENITY_LABELS,
  VALIDATION,
  ParkingSpotFormValues,
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
} from '../../constants';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';
import { useAppTheme } from '../../theme';

type RouteProps = RouteProp<ProfileStackParamList, 'AddSpot'>;

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
  pricePerDay: Yup.number().min(0).nullable(),
});

const spotTypeOptions = Object.entries(SPOT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
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
  const theme = useAppTheme();
  const { colors, spacing, radii, typography, shadows } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [images, setImages] = useState<string[]>([]);
  const [selectedSpotType, setSelectedSpotType] = useState<SpotType>(SpotType.DRIVEWAY);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [initialValues, setInitialValues] = useState<ParkingSpotFormValues>({
    title: '', description: '', address: '', city: '', state: '',
    zipCode: '', pricePerHour: '', pricePerDay: '',
    spotType: SpotType.DRIVEWAY, amenities: [], isAvailable: true,
  });

  useEffect(() => {
    if (isEditing && spotId) {
      const spot = getSpotById(spotId);
      if (spot) {
        setInitialValues({
          title: spot.title, description: spot.description,
          address: spot.location.address || '', city: spot.location.city || '',
          state: spot.location.state || '', zipCode: spot.location.zipCode || '',
          pricePerHour: spot.pricePerHour.toString(),
          pricePerDay: spot.pricePerDay?.toString() || '',
          spotType: spot.spotType, amenities: spot.amenities, isAvailable: spot.isAvailable,
        });
        setImages(spot.imageURLs);
        setSelectedSpotType(spot.spotType);
        setSelectedAmenities(spot.amenities);
        setIsAvailable(spot.isAvailable);
        setSelectedCoordinates({ latitude: spot.location.latitude, longitude: spot.location.longitude });
      }
    }
  }, [isEditing, spotId, getSpotById]);

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: VALIDATION.MAX_IMAGES - images.length,
    });
    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newImages].slice(0, VALIDATION.MAX_IMAGES));
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, VALIDATION.MAX_IMAGES));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUseCurrentLocation = async (setFieldValue: any) => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        if (location.address) setFieldValue('address', location.address);
        if (location.city) setFieldValue('city', location.city);
        if (location.state) setFieldValue('state', location.state);
        if (location.zipCode) setFieldValue('zipCode', location.zipCode);
        setSelectedCoordinates({ latitude: location.latitude, longitude: location.longitude });
        if (!location.address && !location.city) {
          Alert.alert('Location Found', 'Coordinates detected. Please enter your street address manually.');
        }
      } else {
        Alert.alert('Location Unavailable', 'Could not get your location. Please enter your address manually.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'Failed to get location.');
    }
    setIsLoadingLocation(false);
  };

  const handleSubmit = async (values: ParkingSpotFormValues) => {
    if (!user) { Alert.alert('Error', 'You must be logged in.'); return; }
    if (images.length === 0) { Alert.alert('Photos Required', 'Please add at least one photo.'); return; }

    setIsSubmitting(true);
    try {
      const isLocalUri = (uri: string) => uri.startsWith('file://') || uri.startsWith('content://');
      let imageURLs = images;
      const localImages = images.filter(isLocalUri);
      if (localImages.length > 0) {
        const tempId = isEditing && spotId ? spotId : `temp_${Date.now()}`;
        const uploadedURLs = await uploadParkingSpotImages(localImages, tempId);
        imageURLs = images.map((uri) => {
          if (isLocalUri(uri)) { const i = localImages.indexOf(uri); return uploadedURLs[i] || uri; }
          return uri;
        });
      }

      let latitude = 37.7749, longitude = -122.4194;
      if (selectedCoordinates) {
        latitude = selectedCoordinates.latitude;
        longitude = selectedCoordinates.longitude;
      } else if (values.address && values.city) {
        try {
          const geo = await ExpoLocation.geocodeAsync(`${values.address}, ${values.city}, ${values.state} ${values.zipCode}`);
          if (geo.length > 0) { latitude = geo[0].latitude; longitude = geo[0].longitude; }
          else if (userLocation) { latitude = userLocation.latitude; longitude = userLocation.longitude; }
        } catch { if (userLocation) { latitude = userLocation.latitude; longitude = userLocation.longitude; } }
      } else if (userLocation) { latitude = userLocation.latitude; longitude = userLocation.longitude; }

      const spotData = {
        ownerId: user.uid, ownerName: user.name,
        title: values.title, description: values.description,
        location: { latitude, longitude, address: values.address, city: values.city, state: values.state, zipCode: values.zipCode },
        pricePerHour: parseFloat(values.pricePerHour),
        pricePerDay: values.pricePerDay ? parseFloat(values.pricePerDay) : null,
        imageURLs, isAvailable, spotType: selectedSpotType, amenities: selectedAmenities as Amenity[],
      };

      if (isEditing && spotId) {
        await updateSpot(spotId, spotData);
        Alert.alert('Updated!', 'Your parking spot has been updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await addSpot(spotData);
        Alert.alert('Listed!', 'Your parking spot is now live.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save parking spot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isEditing ? 'Edit Spot' : 'List Your Spot'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <Formik
            initialValues={initialValues}
            validationSchema={SpotSchema}
            onSubmit={handleSubmit}
            enableReinitialize
            validateOnBlur={false}
            validateOnChange={false}
          >
            {({ handleChange, handleBlur, handleSubmit: formSubmit, setFieldValue, values, errors, touched }) => (
              <>
                {/* ── Photos ── */}
                <SectionCard title="Photos" subtitle={`Add up to ${VALIDATION.MAX_IMAGES} photos of your parking spot`} colors={colors} radii={radii} shadows={shadows}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      {images.map((uri, index) => (
                        <View key={index} style={styles.imgThumb}>
                          <Image source={{ uri }} style={styles.imgPreview} />
                          <TouchableOpacity
                            style={[styles.imgRemove, { backgroundColor: colors.background }]}
                            onPress={() => handleRemoveImage(index)}
                          >
                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {images.length < VALIDATION.MAX_IMAGES && (
                        <>
                          <TouchableOpacity
                            style={[styles.imgPicker, { backgroundColor: colors.primaryFaint, borderColor: colors.primary }]}
                            onPress={handlePickImages}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.imgPickerIcon, { backgroundColor: colors.primary + '22' }]}>
                              <Ionicons name="images" size={22} color={colors.primary} />
                            </View>
                            <Text style={[styles.imgPickerText, { color: colors.primary }]}>Gallery</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.imgPicker, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                            onPress={handleTakePhoto}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.imgPickerIcon, { backgroundColor: colors.border }]}>
                              <Ionicons name="camera" size={22} color={colors.textSecondary} />
                            </View>
                            <Text style={[styles.imgPickerText, { color: colors.textSecondary }]}>Camera</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </ScrollView>

                  {images.length > 0 && (
                    <Text style={[styles.imgCount, { color: colors.textMuted }]}>
                      {images.length}/{VALIDATION.MAX_IMAGES} photos added
                    </Text>
                  )}
                </SectionCard>

                {/* ── Basic Info ── */}
                <SectionCard title="Basic Information" colors={colors} radii={radii} shadows={shadows}>
                  <Input
                    label="Title"
                    placeholder="e.g., Spacious Driveway Near Downtown"
                    value={values.title}
                    onChangeText={handleChange('title')}
                    onBlur={handleBlur('title')}
                    error={errors.title}
                    touched={touched.title}
                    leftIcon="text-outline"
                  />
                  <Input
                    label="Description"
                    placeholder="Describe your parking spot — access instructions, nearby landmarks, restrictions..."
                    value={values.description}
                    onChangeText={handleChange('description')}
                    onBlur={handleBlur('description')}
                    error={errors.description}
                    touched={touched.description}
                    multiline
                    numberOfLines={4}
                  />
                </SectionCard>

                {/* ── Spot Type ── */}
                <SectionCard title="Spot Type" colors={colors} radii={radii} shadows={shadows}>
                  <ChipGroup
                    items={spotTypeOptions}
                    selectedValues={[selectedSpotType]}
                    onSelectionChange={(vals) => setSelectedSpotType(vals[0] as SpotType)}
                    multiSelect={false}
                  />
                </SectionCard>

                {/* ── Amenities ── */}
                <SectionCard title="Amenities" subtitle="Select all that apply" colors={colors} radii={radii} shadows={shadows}>
                  <ChipGroup
                    items={amenityOptions}
                    selectedValues={selectedAmenities}
                    onSelectionChange={setSelectedAmenities}
                    multiSelect
                  />
                </SectionCard>

                {/* ── Location ── */}
                <SectionCard
                  title="Location"
                  colors={colors}
                  radii={radii}
                  shadows={shadows}
                  action={
                    <TouchableOpacity
                      style={[styles.locBtn, { backgroundColor: colors.primaryFaint, borderColor: colors.primary + '44' }]}
                      onPress={() => handleUseCurrentLocation(setFieldValue)}
                      disabled={isLoadingLocation}
                      activeOpacity={0.8}
                    >
                      {isLoadingLocation ? (
                        <Loading size="small" />
                      ) : (
                        <>
                          <Ionicons name="locate" size={14} color={colors.primary} />
                          <Text style={[styles.locBtnText, { color: colors.primary }]}>Use current</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  }
                >
                  {/* Address autocomplete */}
                  <View style={{ zIndex: 1000, marginBottom: spacing.md }}>
                    <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Street Address</Text>
                    <GooglePlacesAutocomplete
                      placeholder="Search for an address..."
                      onPress={(data, details = null) => {
                        if (details) {
                          const ac = details.address_components;
                          let streetNumber = '', route = '', city = '', state = '', zipCode = '';
                          ac.forEach((c) => {
                            if (c.types.includes('street_number')) streetNumber = c.long_name;
                            if (c.types.includes('route')) route = c.long_name;
                            if (c.types.includes('locality')) city = c.long_name;
                            if (c.types.includes('administrative_area_level_1')) state = c.short_name;
                            if (c.types.includes('postal_code')) zipCode = c.long_name;
                          });
                          setFieldValue('address', `${streetNumber} ${route}`.trim());
                          setFieldValue('city', city);
                          setFieldValue('state', state);
                          setFieldValue('zipCode', zipCode);
                          if (details.geometry?.location) {
                            setSelectedCoordinates({ latitude: details.geometry.location.lat, longitude: details.geometry.location.lng });
                          } else {
                            setSelectedCoordinates(null);
                          }
                        }
                      }}
                      query={{ key: 'AIzaSyCiRTCJBWv5Ws09drozNPflqeQpEiL6Bog', language: 'en', components: 'country:ca|country:us' }}
                      fetchDetails={true}
                      textInputProps={{
                        value: values.address,
                        onChangeText: handleChange('address'),
                        onBlur: handleBlur('address'),
                      }}
                      styles={{
                        textInput: {
                          height: 50,
                          backgroundColor: colors.inputBackground ?? colors.surfaceElevated,
                          borderRadius: radii.lg,
                          paddingHorizontal: spacing.md,
                          fontSize: typography.sizes.md,
                          color: colors.textPrimary,
                          borderWidth: 1,
                          borderColor: errors.address && touched.address ? '#EF4444' : colors.border,
                        },
                        listView: {
                          position: 'absolute',
                          top: 52,
                          zIndex: 9999,
                          backgroundColor: colors.surfaceElevated,
                          borderRadius: radii.lg,
                          borderWidth: 1,
                          borderColor: colors.border,
                          ...shadows.md,
                        },
                        row: { backgroundColor: colors.surfaceElevated },
                        description: { color: colors.textPrimary, fontSize: typography.sizes.sm },
                      }}
                      enablePoweredByContainer={false}
                    />
                    {errors.address && touched.address && (
                      <Text style={styles.fieldError}>{errors.address}</Text>
                    )}
                  </View>

                  <View style={styles.row}>
                    <View style={styles.flex1}>
                      <Input label="City" placeholder="City" value={values.city}
                        onChangeText={handleChange('city')} onBlur={handleBlur('city')}
                        error={errors.city} touched={touched.city} />
                    </View>
                    <View style={styles.flex1}>
                      <Input label="Province / State" placeholder="ON" value={values.state}
                        onChangeText={handleChange('state')} onBlur={handleBlur('state')}
                        error={errors.state} touched={touched.state} />
                    </View>
                  </View>

                  <Input label="Postal / Zip Code" placeholder="A1A 1A1" value={values.zipCode}
                    onChangeText={handleChange('zipCode')} onBlur={handleBlur('zipCode')}
                    error={errors.zipCode} touched={touched.zipCode}
                    autoCapitalize="characters" />
                </SectionCard>

                {/* ── Pricing ── */}
                <SectionCard title="Pricing" colors={colors} radii={radii} shadows={shadows}>
                  <View style={[styles.pricingHint, { backgroundColor: colors.primaryFaint, borderColor: colors.primary + '30' }]}>
                    <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
                    <Text style={[styles.pricingHintText, { color: colors.primary }]}>
                      Set competitive rates to attract more bookings
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.flex1}>
                      <Input label="Per Hour ($)" placeholder="5.00" value={values.pricePerHour}
                        onChangeText={handleChange('pricePerHour')} onBlur={handleBlur('pricePerHour')}
                        error={errors.pricePerHour} touched={touched.pricePerHour}
                        keyboardType="decimal-pad" leftIcon="cash-outline" />
                    </View>
                    <View style={styles.flex1}>
                      <Input label="Per Day ($) optional" placeholder="30.00" value={values.pricePerDay}
                        onChangeText={handleChange('pricePerDay')} onBlur={handleBlur('pricePerDay')}
                        error={errors.pricePerDay} touched={touched.pricePerDay}
                        keyboardType="decimal-pad" leftIcon="calendar-outline" />
                    </View>
                  </View>
                </SectionCard>

                {/* ── Availability ── */}
                <SectionCard title="Availability" colors={colors} radii={radii} shadows={shadows}>
                  <View style={[styles.availRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <View style={styles.availLeft}>
                      <View style={[styles.availIconWrap, { backgroundColor: isAvailable ? colors.primaryFaint : colors.surfaceMuted }]}>
                        <Ionicons
                          name={isAvailable ? 'checkmark-circle' : 'pause-circle'}
                          size={22}
                          color={isAvailable ? colors.primary : colors.textMuted}
                        />
                      </View>
                      <View>
                        <Text style={[styles.availLabel, { color: colors.textPrimary }]}>
                          {isAvailable ? 'Listed & Visible' : 'Hidden from Search'}
                        </Text>
                        <Text style={[styles.availSub, { color: colors.textMuted }]}>
                          {isAvailable ? 'Drivers can find and book your spot' : 'Your spot won\'t appear on the map'}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={isAvailable}
                      onValueChange={setIsAvailable}
                      trackColor={{ false: colors.border, true: colors.primary + '66' }}
                      thumbColor={isAvailable ? colors.primary : colors.textMuted}
                    />
                  </View>
                </SectionCard>

                {/* ── Submit ── */}
                <View style={styles.submitWrap}>
                  <Button
                    title={isEditing ? 'Update Spot' : 'List Parking Spot'}
                    onPress={() => formSubmit()}
                    loading={isSubmitting}
                    fullWidth
                    size="large"
                  />
                  <Text style={[styles.submitNote, { color: colors.textMuted }]}>
                    By listing, you agree to ParkSpot's host guidelines
                  </Text>
                </View>
              </>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Section Card helper ────────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  colors: any;
  radii: any;
  shadows: any;
  children: React.ReactNode;
}> = ({ title, subtitle, action, colors, radii, shadows, children }) => (
  <View style={[{
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  }]}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: subtitle ? 2 : 12 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{title}</Text>
      {action}
    </View>
    {subtitle && (
      <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>{subtitle}</Text>
    )}
    {children}
  </View>
);

const createStyles = ({ colors, spacing, radii, typography }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
      borderBottomWidth: 1,
    },
    headerBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    },
    headerTitle: { fontSize: typography.sizes.lg, fontWeight: '700' },
    scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl },

    // Images
    imgThumb: { position: 'relative' },
    imgPreview: { width: 100, height: 100, borderRadius: radii.lg },
    imgRemove: { position: 'absolute', top: -8, right: -8, borderRadius: 12 },
    imgPicker: {
      width: 100, height: 100, borderRadius: radii.lg,
      borderWidth: 1.5, borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center', gap: 4,
    },
    imgPickerIcon: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
    },
    imgPickerText: { fontSize: typography.sizes.sm, fontWeight: '600' },
    imgCount: { fontSize: typography.sizes.xs, marginTop: spacing.sm, textAlign: 'right' },

    // Location
    locBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: spacing.sm, paddingVertical: 6,
      borderRadius: radii.full, borderWidth: 1,
    },
    locBtnText: { fontSize: typography.sizes.sm, fontWeight: '600' },
    inputLabel: { fontSize: typography.sizes.sm, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
    fieldError: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 4 },

    // Pricing
    pricingHint: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
      padding: spacing.sm, borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.md,
    },
    pricingHintText: { fontSize: typography.sizes.sm, fontWeight: '500', flex: 1 },

    // Availability
    availRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: spacing.md, borderRadius: radii.lg, borderWidth: 1,
    },
    availLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    availIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    availLabel: { fontSize: typography.sizes.md, fontWeight: '600', marginBottom: 2 },
    availSub: { fontSize: typography.sizes.xs, lineHeight: 16 },

    // Submit
    submitWrap: { marginBottom: spacing.xxxl },
    submitNote: { fontSize: typography.sizes.xs, textAlign: 'center', marginTop: spacing.sm },

    // Common
    row: { flexDirection: 'row', gap: spacing.md },
    flex1: { flex: 1 },
  });

export default AddSpotScreen;
