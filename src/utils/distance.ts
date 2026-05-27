export type LatLng = {
  lat: number;
  lng: number;
};

export function getDistanceKm(from: LatLng, to: LatLng): number {
  const earthRadiusKm = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function getRouteDistanceKm(points: LatLng[]): number {
  if (points.length < 2) {
    return 0;
  }

  let distance = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    distance += getDistanceKm(points[index], points[index + 1]);
  }

  return distance;
}
