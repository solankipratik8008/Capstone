/**
 * Google Places API (NEW v1) — Nearby Parking + Text Search
 * Fully compatible with Google Cloud "Places API (New)"
 */

export type PublicParkingType = 'mall' | 'street' | 'plaza' | 'lot';
export type VehicleSupport = 'bike' | 'car' | 'both';

export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  placeType: PublicParkingType;
  vehicleSupport: VehicleSupport;
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// 🔥 USE ONLY ONE KEY
const API_KEY = 'AIzaSyBLX1eEFRZiwkNmwqVQCUN6aMI8ps1mhGQ';

// ---------------- HELPERS ----------------

function classifyParkingType(name: string): PublicParkingType {
  const lower = name.toLowerCase();

  if (lower.includes('mall') || lower.includes('shopping')) return 'mall';
  if (lower.includes('plaza') || lower.includes('square')) return 'plaza';
  if (lower.includes('street') || lower.includes('road')) return 'street';

  return 'lot';
}

function classifyVehicleSupport(name: string): VehicleSupport {
  const lower = name.toLowerCase();

  if (lower.includes('bike') || lower.includes('cycle')) return 'bike';
  if (lower.includes('car')) return 'car';

  return 'both';
}

// ---------------- SEARCH BY TEXT ----------------

export async function searchPlacesByText(query: string): Promise<PlaceSearchResult[]> {
  const url = `https://places.googleapis.com/v1/places:searchText`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({
      textQuery: query,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Text search failed');
  }

  return (data.places || []).map((p: any) => ({
    placeId: p.id,
    name: p.displayName?.text,
    address: p.formattedAddress,
    latitude: p.location.latitude,
    longitude: p.location.longitude,
  }));
}

// ---------------- NEARBY PARKING ----------------

export async function fetchNearbyParking(
  latitude: number,
  longitude: number,
  radiusMeters = 1500
): Promise<NearbyPlace[]> {
  const url = `https://places.googleapis.com/v1/places:searchNearby`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating',
    },
    body: JSON.stringify({
      includedTypes: ['parking'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: radiusMeters,
        },
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Nearby search failed');
  }

  return (data.places || []).map((p: any) => {
    const name = p.displayName?.text || 'Parking';

    return {
      id: p.id,
      name,
      address: p.formattedAddress,
      latitude: p.location.latitude,
      longitude: p.location.longitude,
      rating: p.rating,
      placeType: classifyParkingType(name),
      vehicleSupport: classifyVehicleSupport(name),
    };
  });
}