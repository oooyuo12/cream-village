export type PetCharacterType = 'mango' | 'janggun' | 'nabi' | 'bori' | 'mungchi';

export interface PetCharacter {
  id: PetCharacterType;
  name: string;
  species: string;
  personality: string;
  role: string;
  specialty: string;
  avatar: string;
  avatarEmoji: string;
  avatarImage?: string;
  color: string;
  description: string;
}

export type WalkPurpose = 'morning' | 'afternoon' | 'sunset' | 'night';

export interface LocationPin {
  id: string;
  name: string;
  category: 'PARK' | 'TOILET' | 'CAFE' | 'PET_STORE' | 'HOSPITAL' | 'GROOMING';
  lat: number;
  lng: number;
  address: string;
  description: string;
  dogFriendlyScore?: number;
  dogSizeAllowed?: string;
  indoorAllowed?: string | boolean;
  parkingAvailable?: string | boolean;
  reservationRequired?: string | boolean;
  leashRequired?: string | boolean;
  notes?: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  type: 'sniff' | 'chest' | 'photo' | 'rest' | 'landmark';
  discovered: boolean;
  characterComment?: string;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  category: 'sensory' | 'nature' | 'quiet' | 'adventure';
  characterGuide: PetCharacterType;
  purpose: WalkPurpose;
  distance: number; // in km
  duration: number; // in mins
  difficulty: 'easy' | 'normal' | 'challenge';
  region: string;
  coordinates: { x: number; y: number; lat?: number; lng?: number }[]; // coordinates on a 0-100 grid or GPS
  checkpoints: Checkpoint[];
  tags: string[];
}

export interface FilterState {
  searchQuery: string;
  category: 'all' | 'sensory' | 'nature' | 'quiet' | 'adventure';
  dogCondition: {
    stamina: 'low' | 'mid' | 'high';
    joints: 'needed_care' | 'normal';
    social: 'shy' | 'friendly';
  };
  radius: number; // in meters (e.g. 500, 1000, 2000, 5000)
  region: string; // "all" or specific neighborhood
  purpose: 'all' | WalkPurpose;
}

export interface ActiveWalk {
  isWalking: boolean;
  routeId: string;
  progress: number; // 0 to 100
  checkpointIndex: number;
  totalSteps: number;
  coinsCount: number;
  eventsLog: string[];
  durationSeconds: number;
  completed: boolean;
}
