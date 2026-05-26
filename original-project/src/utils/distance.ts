type Location = {
  lat: number;
  lng: number;
};

export function getDistanceKm(a: Location, b: Location): number {
  const R = 6371;

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(value));
}

export function getRouteDistanceKm(route: Location[]): number {
  let total = 0;

  for (let i = 0; i < route.length - 1; i++) {
    total += getDistanceKm(route[i], route[i + 1]);
  }

  return Number(total.toFixed(2));
}