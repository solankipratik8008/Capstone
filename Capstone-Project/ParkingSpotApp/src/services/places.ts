/**
 * Google Places Nearby Search — fetches parking near a location.
 * Categorizes places as mall / street / plaza / lot.
 * Uses Google Maps API keys already configured in app.json.
 */

import { Platform } from 'react-native';

const API_KEY =
  Platform.OS === 'ios'
    ? 'AIzaSyCiRTCJBWv5Ws09drozNPflqeQpEiL6Bog'
    : 'AIzaSyCKRB5fHipq7inuT1oO16i4xNJDKAafeUg';

export type PublicParkingType = 'mall' | 'street' | 'plaza' | 'lot';
export type VehicleSupport = 'bike' | 'car' | 'both';

export interface NearbyPlace {
  id: string;
  name: string;
  vicinity: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  /** Categorized parking type derived from place name/type keywords */
  placeType: PublicParkingType;
  /** What vehicles this spot supports */
  vehicleSupport: VehicleSupport;
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

/** Classify a parking place by inspecting its name and vicinity */
function classifyParkingType(name: string, vicinity: string): PublicParkingType {
  const combined = `${name} ${vicinity}`.toLowerCase();
  if (
    combined.includes('mall') ||
    combined.includes('shopping') ||
    combined.includes('plaza') && combined.includes('shop')
  ) {
    return 'mall';
  }
  if (
    combined.includes('plaza') ||
    combined.includes('square') ||
    combined.includes('centre') ||
    combined.includes('center')
  ) {
    return 'plaza';
  }
  if (
    combined.includes('street') ||
    combined.includes('metered') ||
    combined.includes('on-street') ||
    combined.includes('roadside')
  ) {
    return 'street';
  }
  return 'lot';
}

/** Determine vehicle support from place name */
function classifyVehicleSupport(name: string): VehicleSupport {
  const lower = name.toLowerCase();
  if (lower.includes('bike') || lower.includes('cycle') || lower.includes('bicycle')) {
    return 'bike';
  }
  if (lower.includes('car') || lower.includes('auto')) {
    return 'car';
  }
  return 'both';
}

export async function searchPlacesByText(query: string): Promise<PlaceSearchResult[]> {
  const url =
    `https://maps.googleapis.com/maps/api/place/textsearch/json` +
    `?query=${encodeURIComponent(query)}` +
    `&key=${API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Places text search failed');
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${data.status}`);
  }

  return (data.results ?? []).slice(0, 5).map((p: any): PlaceSearchResult => ({
    placeId: p.place_id,
    name: p.name,
    formattedAddress: p.formatted_address ?? '',
    latitude: p.geometry.location.lat,
    longitude: p.geometry.location.lng,
  }));
}

export async function fetchNearbyParking(
  latitude: number,
  longitude: number,
  radiusMeters = 1500,
): Promise<NearbyPlace[]> {
  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${latitude},${longitude}` +
    `&radius=${radiusMeters}` +
    `&type=parking` +
    `&key=${API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Places request failed');

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`);
  }

  return (data.results ?? []).map((p: any): NearbyPlace => {
    const name = p.name as string;
    const vicinity = p.vicinity ?? '';
    return {
      id: p.place_id,
      name,
      vicinity,
      latitude: p.geometry.location.lat,
      longitude: p.geometry.location.lng,
      rating: p.rating,
      userRatingsTotal: p.user_ratings_total,
      openNow: p.opening_hours?.open_now,
      placeType: classifyParkingType(name, vicinity),
      vehicleSupport: classifyVehicleSupport(name),
    };
  });
  }
