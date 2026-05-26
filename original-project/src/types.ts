export type Location = {
  lat: number;
  lng: number;
};

export type PinCategory =
  | "CAFE"
  | "HOSPITAL"
  | "PARK"
  | "PET_STORE"
  | "TOILET"
  | "GROOMING";

export type DogSize = "SMALL" | "MEDIUM" | "LARGE";

export type WalkingIntensity = "가벼움" | "보통" | "긴 코스";

export type Pin = {
  id: string;
  name: string;
  category: PinCategory;
  lat: number;
  lng: number;
  description?: string;

  address?: string;
  source?: string;
  lastChecked?: string;
  notes?: string;

  dogFriendlyScore?: number;
  routePriorityScore?: number;
  accessibilityScore?: number;
  safetyScore?: number;

  dogSizeAllowed?: DogSize[];
  indoorAllowed?: boolean;
  parkingAvailable?: boolean;
  reservationRequired?: boolean;
  leashRequired?: boolean;
};

export type Purpose =
  | "WALK"
  | "HOSPITAL_VISIT"
  | "GROOMING"
  | "SHOPPING"
  | "STRESS_RELIEF";

export type RouteResult = {
  id: string;
  title: string;
  purpose: Purpose;
  pins: Pin[];
  totalDistanceKm: number;
  estimatedMinutes: number;
  walkingIntensity: WalkingIntensity;
  score: number;
  description: string;
};

export type DogConditionFilters = {
  selectedDogSizes: DogSize[];
  indoorOnly: boolean;
  parkingOnly: boolean;
  noReservationOnly: boolean;
};