import { FALLBACK_DELIVERY_AREA } from '../config/restaurantLocation';
import { GeoPoint, Market } from '../types/marketplace';

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

/** A market's delivery area (D4): a center point and a radius. */
export interface DeliveryArea {
  marketId: string;
  name: string;
  center: GeoPoint;
  radiusKm: number;
  /** True when the market API failed and the built-in fallback is used. */
  isFallback: boolean;
}

const isValidPoint = (point: GeoPoint | null | undefined): point is GeoPoint =>
  Boolean(point) && Number.isFinite(point?.lat) && Number.isFinite(point?.lng);

/**
 * The delivery area of a market from the API, or the fallback constants when
 * the market isn't available (call failed, still loading, malformed).
 */
export function resolveDeliveryArea(
  market: Market | null | undefined
): DeliveryArea {
  if (
    market &&
    isValidPoint(market.center) &&
    Number.isFinite(market.radiusKm) &&
    market.radiusKm > 0
  ) {
    return {
      marketId: market.id,
      name: market.name,
      center: { lat: market.center.lat, lng: market.center.lng },
      radiusKm: market.radiusKm,
      isFallback: false,
    };
  }

  return {
    marketId: FALLBACK_DELIVERY_AREA.marketId,
    name: FALLBACK_DELIVERY_AREA.name,
    center: { ...FALLBACK_DELIVERY_AREA.center },
    radiusKm: FALLBACK_DELIVERY_AREA.radiusKm,
    isFallback: true,
  };
}

export function distanceFromAreaCenterKm(
  lat: number,
  lng: number,
  area: DeliveryArea
): number {
  return haversineDistanceKm(area.center.lat, area.center.lng, lat, lng);
}

/**
 * Same rule as the server (`OrderService.checkDeliveryArea`): distance from
 * the market center ≤ radius, earth radius 6371 km.
 */
export function isWithinDeliveryArea(
  lat: number,
  lng: number,
  area: DeliveryArea
): boolean {
  return distanceFromAreaCenterKm(lat, lng, area) <= area.radiusKm;
}

export function getServiceabilityMessage(
  lat: number,
  lng: number,
  area: DeliveryArea
): string {
  const distance = distanceFromAreaCenterKm(lat, lng, area);

  if (distance <= area.radiusKm) {
    return `Within delivery range (${distance.toFixed(1)} km).`;
  }

  return `Outside our ${area.radiusKm} km delivery area (${distance.toFixed(1)} km away).`;
}
