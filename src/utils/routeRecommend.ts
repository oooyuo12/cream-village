import type {
  FilterState,
  LocationPin,
  PetCharacterType,
  Route,
  WalkPurpose,
} from '../types';
import { getDistanceKm, getRouteDistanceKm, type LatLng } from './distance';

const WALK_SPEED_KMH = 3.5;
const MAX_POOL_SIZE = 28;
const DEFAULT_REGION_LABEL = '성남시 전체';

const REGION_CENTERS: Record<string, LatLng> = {
  '전체동네': { lat: 37.4509, lng: 127.1287 },
  '크림빌리지': { lat: 37.4509, lng: 127.1287 },
  '성남시 전체': { lat: 37.4509, lng: 127.1287 },
  '가천대': { lat: 37.4509, lng: 127.1287 },
  '가천대 주변': { lat: 37.4509, lng: 127.1287 },
  '일산 덕이동': { lat: 37.69345, lng: 126.76015 },
  '덕이동': { lat: 37.69345, lng: 126.76015 },
  '부천 범안로': { lat: 37.46236, lng: 126.8125 },
  '부천': { lat: 37.46236, lng: 126.8125 },
  '서울숲': { lat: 37.5443, lng: 127.0374 },
};

type RouteLengthType = 'SHORT' | 'MEDIUM' | 'LONG';

type LengthConfig = {
  label: string;
  targetMinutes: number;
  maxPins: number;
  characterGuide: PetCharacterType;
  difficulty: Route['difficulty'];
};

const LENGTH_CONFIG: Record<RouteLengthType, LengthConfig> = {
  SHORT: {
    label: '짧은 산책 코스',
    targetMinutes: 18,
    maxPins: 2,
    characterGuide: 'mango',
    difficulty: 'easy',
  },
  MEDIUM: {
    label: '보통 산책 코스',
    targetMinutes: 35,
    maxPins: 3,
    characterGuide: 'bori',
    difficulty: 'normal',
  },
  LONG: {
    label: '긴 산책 코스',
    targetMinutes: 58,
    maxPins: 4,
    characterGuide: 'mungchi',
    difficulty: 'challenge',
  },
};

const REGION_KEYWORDS = {
  ilsan: ['덕이', '일산', '고양', '탄현', 'dukyi'],
  bucheon: ['부천', '범안', 'bucheon'],
  seoul: ['서울숲', '서울', 'seoul'],
  seongnam: ['성남', '가천', '복정', '태평', '수진', '탄천', 'gachon', 'seongnam'],
};

const CONNECTOR_KEYWORDS = [
  '연결',
  '후보',
  '경유',
  '진입',
  '회귀',
  '방향',
  '보행',
  '출구',
  '입구',
  '시작',
  '남측',
  '북측',
  '서측',
  '동측',
  '주거지',
  '도로변',
  '공중화장실',
  '배변처리 후보',
  '지도좌표기반',
];

function getPinText(pin: LocationPin): string {
  return [pin.id, pin.name, pin.category, pin.address, pin.description, pin.notes]
    .join(' ')
    .toLowerCase();
}

function normalizeRegion(region: string): string {
  if (!region || region === '전체동네') {
    return DEFAULT_REGION_LABEL;
  }

  if (region.includes('장미길') || region.includes('푸른대로') || region.includes('정원') || region.includes('아케이드') || region.includes('번개')) {
    return DEFAULT_REGION_LABEL;
  }

  return region;
}

function getRegionCenter(region: string): LatLng {
  const normalizedRegion = normalizeRegion(region);
  const regionText = normalizedRegion.toLowerCase();

  if (regionText.includes('덕이') || regionText.includes('일산') || regionText.includes('고양')) {
    return REGION_CENTERS['일산 덕이동'];
  }

  if (regionText.includes('부천') || regionText.includes('범안')) {
    return REGION_CENTERS['부천 범안로'];
  }

  if (regionText.includes('서울숲') || regionText.includes('서울')) {
    return REGION_CENTERS['서울숲'];
  }

  return REGION_CENTERS['성남시 전체'];
}

function matchesRegion(pin: LocationPin, region: string): boolean {
  const normalizedRegion = normalizeRegion(region);
  const text = getPinText(pin);

  if (normalizedRegion.includes('덕이') || normalizedRegion.includes('일산') || normalizedRegion.includes('고양')) {
    return REGION_KEYWORDS.ilsan.some((keyword) => text.includes(keyword.toLowerCase()));
  }

  if (normalizedRegion.includes('부천') || normalizedRegion.includes('범안')) {
    return REGION_KEYWORDS.bucheon.some((keyword) => text.includes(keyword.toLowerCase()));
  }

  if (normalizedRegion.includes('서울숲')) {
    return REGION_KEYWORDS.seoul.some((keyword) => text.includes(keyword.toLowerCase()));
  }

  return REGION_KEYWORDS.seongnam.some((keyword) => text.includes(keyword.toLowerCase()));
}

function isConnectorPin(pin: LocationPin): boolean {
  const text = getPinText(pin);

  return CONNECTOR_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
}

function getCategoryFromFilters(filters: FilterState): Route['category'] {
  if (filters.category !== 'all') {
    return filters.category;
  }

  if (filters.dogCondition.social === 'shy') {
    return 'quiet';
  }

  if (filters.dogCondition.stamina === 'high') {
    return 'adventure';
  }

  if (filters.purpose === 'sunset') {
    return 'nature';
  }

  return 'nature';
}

function getCharacterForRoute(filters: FilterState, lengthType: RouteLengthType): PetCharacterType {
  if (filters.category === 'quiet') {
    return 'janggun';
  }

  if (filters.category === 'nature') {
    return 'bori';
  }

  if (filters.category === 'sensory') {
    return 'nabi';
  }

  if (filters.category === 'adventure') {
    return lengthType === 'LONG' ? 'mungchi' : 'mango';
  }

  if (filters.dogCondition.joints === 'needed_care') {
    return 'janggun';
  }

  return LENGTH_CONFIG[lengthType].characterGuide;
}

function getAllowedCategories(filters: FilterState): LocationPin['category'][] {
  if (filters.category === 'quiet' || filters.dogCondition.joints === 'needed_care') {
    return ['PARK', 'TOILET', 'CAFE'];
  }

  if (filters.category === 'nature') {
    return ['PARK', 'TOILET', 'CAFE'];
  }

  if (filters.category === 'sensory') {
    return ['PARK', 'TOILET', 'CAFE', 'PET_STORE'];
  }

  if (filters.category === 'adventure') {
    return ['PARK', 'TOILET', 'CAFE', 'PET_STORE'];
  }

  return ['PARK', 'TOILET', 'CAFE'];
}

function scorePin(pin: LocationPin, start: LatLng, filters: FilterState, allowedCategories: string[]): number {
  const text = getPinText(pin);
  const distanceKm = getDistanceKm(start, { lat: pin.lat, lng: pin.lng });
  const radiusKm = Math.max(filters.radius / 1000, 0.8);

  let score = 0;

  score += allowedCategories.includes(pin.category) ? 35 : -60;
  score += (pin.dogFriendlyScore ?? 3) * 6;

  if (pin.category === 'PARK') score += 22;
  if (pin.category === 'TOILET') score += 12;
  if (pin.category === 'CAFE') score += 8;

  if (filters.category === 'quiet' && pin.category === 'PET_STORE') score -= 35;
  if (filters.category === 'nature' && pin.category !== 'PARK' && pin.category !== 'TOILET') score -= 12;
  if (filters.dogCondition.joints === 'needed_care' && filters.category === 'adventure') score -= 20;

  if (isConnectorPin(pin)) score -= 22;
  if (text.includes('공원') || text.includes('생태원') || text.includes('놀이터')) score += 15;

  if (distanceKm <= radiusKm) score += 18;
  score -= distanceKm * 7;

  if (filters.searchQuery.trim()) {
    const queryWords = filters.searchQuery.toLowerCase().split(/\s+/).filter((word) => word.length >= 2);
    queryWords.forEach((word) => {
      if (text.includes(word)) score += 10;
    });
  }

  return score;
}

function getRankedPins(pins: LocationPin[], start: LatLng, filters: FilterState): LocationPin[] {
  const allowedCategories = getAllowedCategories(filters);
  const regionPins = pins.filter((pin) => matchesRegion(pin, filters.region));
  const basePins = regionPins.length > 0 ? regionPins : pins;
  const radiusKm = Math.max(filters.radius / 1000, 0.8);

  const inRadiusPins = basePins.filter((pin) => getDistanceKm(start, { lat: pin.lat, lng: pin.lng }) <= Math.max(radiusKm, 1.2));
  const pool = inRadiusPins.length >= 4 ? inRadiusPins : basePins;

  return pool
    .filter((pin) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng))
    .map((pin) => ({ pin, score: scorePin(pin, start, filters, allowedCategories) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_POOL_SIZE)
    .map((item) => item.pin);
}

function pickDiversePin(
  candidates: LocationPin[],
  usedIds: Set<string>,
  preferredCategories: LocationPin['category'][] = [],
  reference?: LatLng,
  minDistanceKm = 0.08
): LocationPin | undefined {
  return candidates.find((pin) => {
    if (usedIds.has(pin.id)) return false;
    if (preferredCategories.length > 0 && !preferredCategories.includes(pin.category)) return false;
    if (!reference) return true;

    return getDistanceKm(reference, { lat: pin.lat, lng: pin.lng }) >= minDistanceKm;
  });
}

function buildStopsForLength(pins: LocationPin[], filters: FilterState, lengthType: RouteLengthType): LocationPin[] {
  const start = getRegionCenter(filters.region);
  const rankedPins = getRankedPins(pins, start, filters);
  const usedIds = new Set<string>();
  const stops: LocationPin[] = [];
  const config = LENGTH_CONFIG[lengthType];

  const add = (pin: LocationPin | undefined) => {
    if (!pin || usedIds.has(pin.id)) return;
    stops.push(pin);
    usedIds.add(pin.id);
  };

  const mainPark = pickDiversePin(rankedPins, usedIds, ['PARK'], start, 0.05);
  add(mainPark);

  if (lengthType !== 'SHORT') {
    const secondPark = pickDiversePin(rankedPins, usedIds, ['PARK', 'CAFE'], mainPark ? { lat: mainPark.lat, lng: mainPark.lng } : start, 0.15);
    add(secondPark);
  }

  if (lengthType === 'LONG') {
    const adventureStop = pickDiversePin(rankedPins, usedIds, ['PARK', 'CAFE', 'PET_STORE'], stops.length > 0 ? { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng } : start, 0.2);
    add(adventureStop);
  }

  // Return leg helper: use a different waypoint before the toilet when possible.
  if (lengthType !== 'SHORT') {
    const returnAlt = pickDiversePin(rankedPins, usedIds, ['PARK', 'CAFE'], start, 0.12);
    add(returnAlt);
  }

  const returnToilet = [...rankedPins]
    .filter((pin) => pin.category === 'TOILET' && !usedIds.has(pin.id))
    .sort((a, b) => {
      const aToStart = getDistanceKm(start, { lat: a.lat, lng: a.lng });
      const bToStart = getDistanceKm(start, { lat: b.lat, lng: b.lng });
      return aToStart - bToStart;
    })[0];
  add(returnToilet);

  rankedPins.forEach((pin) => {
    if (stops.length >= config.maxPins) return;
    if (usedIds.has(pin.id)) return;
    if (pin.category === 'HOSPITAL' || pin.category === 'GROOMING') return;
    add(pin);
  });

  return stops.slice(0, Math.max(2, config.maxPins));
}

function toCoordinate(point: LatLng, index: number): Route['coordinates'][number] {
  return {
    x: 12 + ((index * 17) % 76),
    y: 78 - ((index * 13) % 58),
    lat: point.lat,
    lng: point.lng,
  };
}

function toCheckpoint(pin: LocationPin, index: number): Route['checkpoints'][number] {
  const checkpointTypes: Route['checkpoints'][number]['type'][] = ['sniff', 'rest', 'photo', 'landmark', 'chest'];
  const isToilet = pin.category === 'TOILET';

  return {
    id: pin.id,
    name: pin.name,
    description: pin.description || `${pin.name} 경유 지점입니다.`,
    x: 20 + ((index * 19) % 65),
    y: 72 - ((index * 11) % 52),
    lat: pin.lat,
    lng: pin.lng,
    type: isToilet ? 'rest' : checkpointTypes[index % checkpointTypes.length],
    discovered: false,
    characterComment: isToilet
      ? '돌아오는 길에 배변 정리까지 챙기면 산책 마무리가 훨씬 깔끔하다댕!'
      : `${pin.name} 지점을 지나면 산책 흐름이 자연스럽게 이어진다냥멍!`,
  };
}

function estimateDuration(distanceKm: number, stopCount: number): number {
  const movingMinutes = (distanceKm / WALK_SPEED_KMH) * 60;
  const stopMinutes = stopCount * 3;

  return Math.max(8, Math.round(movingMinutes + stopMinutes));
}

function getPurpose(filters: FilterState, lengthType: RouteLengthType): WalkPurpose {
  if (filters.purpose !== 'all') {
    return filters.purpose;
  }

  if (lengthType === 'SHORT') return 'morning';
  if (lengthType === 'MEDIUM') return 'afternoon';
  return filters.category === 'quiet' ? 'sunset' : 'night';
}

function getRouteName(region: string, lengthType: RouteLengthType, guide: PetCharacterType): string {
  const guideLabel: Record<PetCharacterType, string> = {
    mango: '망고',
    janggun: '장군',
    nabi: '나비',
    bori: '보리',
    mungchi: '뭉치',
  };

  const regionLabel = normalizeRegion(region);
  const lengthLabel = LENGTH_CONFIG[lengthType].label.replace(' 코스', '');

  return `${guideLabel[guide]}와 걷는 ${regionLabel} ${lengthLabel}`;
}

function getRouteDescription(stops: LocationPin[], filters: FilterState, lengthType: RouteLengthType): string {
  const hasToilet = stops.some((pin) => pin.category === 'TOILET');
  const hasPark = stops.some((pin) => pin.category === 'PARK');
  const returnToiletText = hasToilet ? ' 돌아오는 길에는 배변처리 지점을 배치해 산책 마무리를 챙겼습니다.' : '';
  const coreText = hasPark
    ? '실제 장소 핀을 기반으로 공원과 산책 지점을 연결했습니다.'
    : '현재 반경에서 가능한 산책 지점을 연결했습니다.';

  if (lengthType === 'SHORT') {
    return `${coreText} 가까운 목적지를 중심으로 가볍게 갔다가 돌아오는 왕복 산책입니다.${returnToiletText}`;
  }

  if (lengthType === 'MEDIUM') {
    return `${coreText} 갈 때와 돌아올 때의 경유지를 최대한 다르게 배치한 보통 왕복 산책입니다.${returnToiletText}`;
  }

  return `${coreText} 활동량을 확보할 수 있도록 여러 지점을 연결하고 복귀 동선을 분리한 긴 왕복 산책입니다.${returnToiletText}`;
}

function createRouteFromStops(stops: LocationPin[], filters: FilterState, lengthType: RouteLengthType): Route {
  const start = getRegionCenter(filters.region);
  const guide = getCharacterForRoute(filters, lengthType);
  const routePoints = [
    start,
    ...stops.map((pin) => ({ lat: pin.lat, lng: pin.lng })),
    start,
  ];
  const distance = getRouteDistanceKm(routePoints);
  const duration = estimateDuration(distance, stops.length);

  return {
    id: `recommended-${lengthType.toLowerCase()}-${normalizeRegion(filters.region).replace(/\s+/g, '-')}`,
    name: getRouteName(filters.region, lengthType, guide),
    description: getRouteDescription(stops, filters, lengthType),
    category: getCategoryFromFilters(filters),
    characterGuide: guide,
    purpose: getPurpose(filters, lengthType),
    distance: Number(distance.toFixed(2)),
    duration,
    difficulty: filters.dogCondition.joints === 'needed_care' ? 'easy' : LENGTH_CONFIG[lengthType].difficulty,
    region: normalizeRegion(filters.region),
    coordinates: routePoints.map(toCoordinate),
    checkpoints: stops.map(toCheckpoint),
    tags: [
      lengthType === 'SHORT' ? '짧은산책' : lengthType === 'MEDIUM' ? '보통산책' : '긴산책',
      '왕복루트',
      stops.some((pin) => pin.category === 'TOILET') ? '복귀길배변' : '산책핀기반',
      normalizeRegion(filters.region),
    ],
  };
}

export function buildRecommendedUiRoutes({
  pins,
  filters,
}: {
  pins: LocationPin[];
  filters: FilterState;
}): Route[] {
  const lengthTypes: RouteLengthType[] = ['SHORT', 'MEDIUM', 'LONG'];

  return lengthTypes
    .map((lengthType) => createRouteFromStops(buildStopsForLength(pins, filters, lengthType), filters, lengthType))
    .filter((route) => route.checkpoints.length > 0);
}
