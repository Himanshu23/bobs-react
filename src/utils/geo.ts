import {
  RESTAURANT_LOCATION,
  SERVICE_RADIUS_KM,
} from '../config/restaurantLocation';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two points in kilometers. */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function distanceFromRestaurantKm(lat: number, lng: number): number {
  return haversineDistanceKm(
    RESTAURANT_LOCATION.lat,
    RESTAURANT_LOCATION.lng,
    lat,
    lng
  );
}

export function isWithinServiceRadius(lat: number, lng: number): boolean {
  return distanceFromRestaurantKm(lat, lng) <= SERVICE_RADIUS_KM;
}

export function getServiceabilityMessage(lat: number, lng: number): string {
  const distance = distanceFromRestaurantKm(lat, lng);

  if (distance <= SERVICE_RADIUS_KM) {
    return `Within delivery range (${distance.toFixed(1)} km).`;
  }

  return `Outside our ${SERVICE_RADIUS_KM} km delivery area (${distance.toFixed(1)} km away).`;
}
