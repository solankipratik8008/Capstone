/**
 * Google Places Nearby Search — fetches paid parking lots / garages near a location.
 * Uses the existing Google Maps API keys already configured in app.json.
 * Requires "Places API" to be enabled for those keys in Google Cloud Console.
 */

import { Platform } from 'react-native';

const API_KEY =
  Platform.OS === 'ios'
    ? 'AIzaSyCiRTCJBWv5Ws09drozNPflqeQpEiL6Bog'
    : 'AIzaSyCKRB5fHipq7inuT1oO16i4xNJDKAafeUg';

export interface NearbyPlace {
  id: string;
  name: string;
  vicinity: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
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

  return (data.results ?? []).map((p: any): NearbyPlace => ({
    id: p.place_id,
    name: p.name,
    vicinity: p.vicinity ?? '',
    latitude: p.geometry.location.lat,
    longitude: p.geometry.location.lng,
    rating: p.rating,
    userRatingsTotal: p.user_ratings_total,
    openNow: p.opening_hours?.open_now,
  }));
}
