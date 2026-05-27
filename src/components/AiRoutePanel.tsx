import React, { useState, useEffect } from 'react';
import { Route, PetCharacterType } from '../types';
import { CHARACTERS } from '../data';
import { LOCATION_PINS } from '../pinsData';
import {
  Sparkles,
  Brain,
  Loader2,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

interface AiRoutePanelProps {
  onRouteGenerated: (newRoute: Route) => void;
  selectedRadius: number;
  selectedPurpose: string;
  selectedRegion: string;
  preSelectedGuide?: PetCharacterType;
}

type LatLng = {
  lat: number;
  lng: number;
};

type LocationPinLike = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  description?: string;
  notes?: string;
  dogFriendlyScore?: number;
  routePriorityScore?: number;
  accessibilityScore?: number;
  safetyScore?: number;
};

const DEFAULT_GUIDE: PetCharacterType = 'mango';

const GUIDE_ROUTE_META: Record<
  PetCharacterType,
  {
    category: string;
    purpose: string;
    difficulty: string;
    defaultTitle: string;
  }
> = {
  mango: {
    category: 'adventure',
    purpose: 'afternoon',
    difficulty: 'easy',
    defaultTitle: '망고의 햇살 비밀 아지트 코스'
  },
  janggun: {
    category: 'quiet',
    purpose: 'morning',
    difficulty: 'easy',
    defaultTitle: '장군의 안심 평지 산책 코스'
  },
  nabi: {
    category: 'sensory',
    purpose: 'morning',
    difficulty: 'normal',
    defaultTitle: '나비의 바스락 보물 탐험 코스'
  },
  bori: {
    category: 'nature',
    purpose: 'sunset',
    difficulty: 'easy',
    defaultTitle: '보리의 솔바람 힐링 산책 코스'
  },
  mungchi: {
    category: 'adventure',
    purpose: 'night',
    difficulty: 'challenge',
    defaultTitle: '뭉치의 번개 에너지 충전 코스'
  }
};

const PURPOSE_CATEGORY_POLICY: Record<string, string[]> = {
  all: ['PARK', 'TOILET', 'CAFE'],
  morning: ['PARK', 'TOILET', 'CAFE'],
  afternoon: ['PARK', 'TOILET', 'CAFE'],
  sunset: ['PARK', 'TOILET', 'CAFE'],
  night: ['PARK', 'TOILET', 'CAFE'],
  walk: ['PARK', 'TOILET', 'CAFE'],
  stress: ['PARK', 'TOILET', 'CAFE'],
  hospital: ['HOSPITAL', 'PARK', 'TOILET', 'CAFE'],
  grooming: ['GROOMING', 'PARK', 'TOILET', 'CAFE'],
  shopping: ['PET_STORE', 'PARK', 'TOILET', 'CAFE']
};

const REGION_FALLBACK_CENTER: Record<string, LatLng> = {
  크림빌리지: {
    lat: 37.4509,
    lng: 127.1287
  },
  전체동네: {
    lat: 37.4509,
    lng: 127.1287
  },
  성남: {
    lat: 37.4509,
    lng: 127.1287
  },
  가천대: {
    lat: 37.4509,
    lng: 127.1287
  },
  덕이동: {
    lat: 37.69345,
    lng: 126.76015
  },
  일산: {
    lat: 37.69345,
    lng: 126.76015
  },
  부천: {
    lat: 37.46236,
    lng: 126.8125
  },
  서울숲: {
    lat: 37.5443,
    lng: 127.0374
  }
};

function getSafeGuideId(guideId?: string | null): PetCharacterType {
  if (
    guideId &&
    Object.prototype.hasOwnProperty.call(CHARACTERS, guideId)
  ) {
    return guideId as PetCharacterType;
  }

  return DEFAULT_GUIDE;
}

function normalizeText(value: unknown): string {
  return String(value ?? '').toLowerCase().trim();
}

function isValidLatLng(value: unknown): value is LatLng {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const target = value as Partial<LatLng>;

  return (
    typeof target.lat === 'number' &&
    Number.isFinite(target.lat) &&
    typeof target.lng === 'number' &&
    Number.isFinite(target.lng)
  );
}

function getPinText(pin: LocationPinLike): string {
  return [
    pin.id,
    pin.name,
    pin.category,
    pin.address,
    pin.description,
    pin.notes
  ]
    .join(' ')
    .toLowerCase();
}

function getNormalizedPurpose(purpose: string): string {
  const target = normalizeText(purpose);

  if (target.includes('병원') || target.includes('hospital')) {
    return 'hospital';
  }

  if (target.includes('미용') || target.includes('목욕') || target.includes('groom')) {
    return 'grooming';
  }

  if (target.includes('용품') || target.includes('쇼핑') || target.includes('shop')) {
    return 'shopping';
  }

  if (target.includes('스트레스') || target.includes('stress')) {
    return 'stress';
  }

  if (target.includes('morning')) {
    return 'morning';
  }

  if (target.includes('sunset')) {
    return 'sunset';
  }

  if (target.includes('night')) {
    return 'night';
  }

  if (target.includes('afternoon')) {
    return 'afternoon';
  }

  return target || 'all';
}

function getAllowedCategories(purpose: string, prompt: string): string[] {
  const normalizedPurpose = getNormalizedPurpose(purpose);
  const promptText = normalizeText(prompt);

  if (promptText.includes('병원')) {
    return PURPOSE_CATEGORY_POLICY.hospital;
  }

  if (promptText.includes('미용') || promptText.includes('목욕')) {
    return PURPOSE_CATEGORY_POLICY.grooming;
  }

  if (promptText.includes('용품') || promptText.includes('간식') || promptText.includes('사료')) {
    return PURPOSE_CATEGORY_POLICY.shopping;
  }

  return PURPOSE_CATEGORY_POLICY[normalizedPurpose] ?? PURPOSE_CATEGORY_POLICY.all;
}

function matchesRegion(pin: LocationPinLike, selectedRegion: string): boolean {
  const region = normalizeText(selectedRegion);
  const text = getPinText(pin);

  if (!region || region === '전체동네' || region === '크림빌리지' || region === 'all') {
    return true;
  }

  if (region.includes('덕이') || region.includes('일산')) {
    return (
      text.includes('dukyi') ||
      text.includes('덕이') ||
      text.includes('일산') ||
      text.includes('고양') ||
      text.includes('탄현')
    );
  }

  if (region.includes('부천') || region.includes('범안')) {
    return (
      text.includes('bucheon') ||
      text.includes('부천') ||
      text.includes('범안')
    );
  }

  if (region.includes('서울숲') || region.includes('서울')) {
    return text.includes('seoul') || text.includes('서울숲');
  }

  if (
    region.includes('성남') ||
    region.includes('가천') ||
    region.includes('복정') ||
    region.includes('태평') ||
    region.includes('수진')
  ) {
    return (
      text.includes('성남') ||
      text.includes('가천') ||
      text.includes('복정') ||
      text.includes('태평') ||
      text.includes('수진') ||
      text.includes('탄천') ||
      text.includes('gachon') ||
      text.includes('seongnam')
    );
  }

  return text.includes(region);
}

function getFallbackCenter(region: string): LatLng {
  const regionText = normalizeText(region);

  if (regionText.includes('덕이') || regionText.includes('일산')) {
    return REGION_FALLBACK_CENTER.덕이동;
  }

  if (regionText.includes('부천') || regionText.includes('범안')) {
    return REGION_FALLBACK_CENTER.부천;
  }

  if (regionText.includes('서울숲') || regionText.includes('서울')) {
    return REGION_FALLBACK_CENTER.서울숲;
  }

  if (
    regionText.includes('가천') ||
    regionText.includes('성남') ||
    regionText.includes('복정') ||
    regionText.includes('태평')
  ) {
    return REGION_FALLBACK_CENTER.가천대;
  }

  return REGION_FALLBACK_CENTER.크림빌리지;
}

function getDistanceKm(from: LatLng, to: LatLng): number {
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

function getRouteDistanceKm(points: LatLng[]): number {
  if (points.length < 2) {
    return 0;
  }

  let total = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    total += getDistanceKm(points[index], points[index + 1]);
  }

  return total;
}

function estimateDurationMinutes(distanceKm: number, checkpointCount: number): number {
  const walkingSpeedKmh = 3.5;
  const movingMinutes = (distanceKm / walkingSpeedKmh) * 60;
  const stopMinutes = checkpointCount * 3;

  return Math.max(8, Math.round(movingMinutes + stopMinutes));
}

function scorePin({
  pin,
  prompt,
  allowedCategories,
  center,
  selectedRadius
}: {
  pin: LocationPinLike;
  prompt: string;
  allowedCategories: string[];
  center: LatLng;
  selectedRadius: number;
}): number {
  const text = getPinText(pin);
  const promptText = normalizeText(prompt);
  const distanceKm = getDistanceKm(center, {
    lat: pin.lat,
    lng: pin.lng
  });

  const radiusKm = selectedRadius > 0 ? selectedRadius / 1000 : 3;
  const isInsideRadius = distanceKm <= Math.max(radiusKm, 0.8);

  let score = 0;

  if (allowedCategories.includes(pin.category)) {
    score += 40;
  } else {
    score -= 80;
  }

  if (pin.category === 'PARK') {
    score += 22;
  }

  if (pin.category === 'TOILET') {
    score += 10;
  }

  if (pin.category === 'CAFE') {
    score += 8;
  }

  if (promptText.includes('카페') && pin.category === 'CAFE') {
    score += 30;
  }

  if (promptText.includes('공원') && pin.category === 'PARK') {
    score += 25;
  }

  if (promptText.includes('배변') && pin.category === 'TOILET') {
    score += 25;
  }

  if (promptText.includes('병원') && pin.category === 'HOSPITAL') {
    score += 35;
  }

  if (promptText.includes('용품') && pin.category === 'PET_STORE') {
    score += 35;
  }

  if (promptText.includes('미용') && pin.category === 'GROOMING') {
    score += 35;
  }

  promptText
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .forEach((word) => {
      if (text.includes(word)) {
        score += 6;
      }
    });

  score += (pin.dogFriendlyScore ?? 3) * 4;
  score += (pin.routePriorityScore ?? 3) * 4;
  score += (pin.accessibilityScore ?? 3) * 2;
  score += (pin.safetyScore ?? 3) * 2;

  if (isInsideRadius) {
    score += 15;
  } else {
    score -= distanceKm * 10;
  }

  score -= distanceKm * 5;

  return score;
}

function isMeaningfullyDifferentPin(
  pin: LocationPinLike,
  selectedPins: LocationPinLike[],
  minDistanceKm = 0.08
): boolean {
  return selectedPins.every((selectedPin) => {
    return (
      selectedPin.id !== pin.id &&
      getDistanceKm(
        {
          lat: selectedPin.lat,
          lng: selectedPin.lng
        },
        {
          lat: pin.lat,
          lng: pin.lng
        }
      ) >= minDistanceKm
    );
  });
}

function getBestPinByCategory({
  rankedPins,
  category,
  selectedPins,
  minDistanceKm = 0.08
}: {
  rankedPins: LocationPinLike[];
  category: string;
  selectedPins: LocationPinLike[];
  minDistanceKm?: number;
}): LocationPinLike | undefined {
  return rankedPins.find((pin) => {
    return (
      pin.category === category &&
      isMeaningfullyDifferentPin(pin, selectedPins, minDistanceKm)
    );
  });
}

function getBestPinByCategories({
  rankedPins,
  categories,
  selectedPins,
  minDistanceKm = 0.08
}: {
  rankedPins: LocationPinLike[];
  categories: string[];
  selectedPins: LocationPinLike[];
  minDistanceKm?: number;
}): LocationPinLike | undefined {
  return rankedPins.find((pin) => {
    return (
      categories.includes(pin.category) &&
      isMeaningfullyDifferentPin(pin, selectedPins, minDistanceKm)
    );
  });
}

function getSpecialPurposeCategory(allowedCategories: string[]): string | null {
  if (allowedCategories.includes('HOSPITAL')) {
    return 'HOSPITAL';
  }

  if (allowedCategories.includes('GROOMING')) {
    return 'GROOMING';
  }

  if (allowedCategories.includes('PET_STORE')) {
    return 'PET_STORE';
  }

  return null;
}

function pickRoutePins({
  selectedRegion,
  selectedPurpose,
  selectedRadius,
  prompt
}: {
  selectedRegion: string;
  selectedPurpose: string;
  selectedRadius: number;
  prompt: string;
}): LocationPinLike[] {
  const allPins = LOCATION_PINS as LocationPinLike[];
  const center = getFallbackCenter(selectedRegion);
  const allowedCategories = getAllowedCategories(selectedPurpose, prompt);
  const specialCategory = getSpecialPurposeCategory(allowedCategories);

  const regionPins = allPins.filter((pin) => matchesRegion(pin, selectedRegion));
  const basePins = regionPins.length > 0 ? regionPins : allPins;

  const rankedPins = basePins
    .filter((pin) => {
      return (
        typeof pin.lat === 'number' &&
        Number.isFinite(pin.lat) &&
        typeof pin.lng === 'number' &&
        Number.isFinite(pin.lng)
      );
    })
    .map((pin) => ({
      pin,
      score: scorePin({
        pin,
        prompt,
        allowedCategories,
        center,
        selectedRadius
      })
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.pin);

  const outboundPins: LocationPinLike[] = [];
  const returnPins: LocationPinLike[] = [];
  const usedIds = new Set<string>();

  const addOutboundPin = (pin: LocationPinLike | undefined) => {
    if (!pin || usedIds.has(pin.id)) {
      return;
    }

    outboundPins.push(pin);
    usedIds.add(pin.id);
  };

  const addReturnPin = (pin: LocationPinLike | undefined) => {
    if (!pin || usedIds.has(pin.id)) {
      return;
    }

    returnPins.push(pin);
    usedIds.add(pin.id);
  };

  const selectedSoFar = () => [...outboundPins, ...returnPins];

  // 1) 갈 때는 실제 목적성이 있는 핵심 지점을 먼저 둔다.
  const primaryPin =
    specialCategory
      ? getBestPinByCategory({
          rankedPins,
          category: specialCategory,
          selectedPins: selectedSoFar()
        })
      : getBestPinByCategories({
          rankedPins,
          categories: ['PARK', 'CAFE'],
          selectedPins: selectedSoFar()
        });

  addOutboundPin(primaryPin);

  // 2) 갈 때 두 번째 지점은 공원/카페 중심으로 골라 단순 왕복을 피한다.
  const secondaryPin = getBestPinByCategories({
    rankedPins,
    categories:
      specialCategory === 'HOSPITAL' || specialCategory === 'GROOMING'
        ? ['PARK', 'CAFE']
        : ['PARK', 'CAFE'],
    selectedPins: selectedSoFar()
  });

  addOutboundPin(secondaryPin);

  // 3) 돌아오는 길에는 같은 길 왕복을 줄이기 위해 보조 경유지를 하나 더 둔다.
  const alternateReturnPin = getBestPinByCategories({
    rankedPins,
    categories: ['PARK', 'CAFE'],
    selectedPins: selectedSoFar(),
    minDistanceKm: 0.1
  });

  addReturnPin(alternateReturnPin);

  // 4) 배변처리는 복귀 구간 후반부에 배치한다.
  const returnToiletPin = getBestPinByCategory({
    rankedPins,
    category: 'TOILET',
    selectedPins: selectedSoFar(),
    minDistanceKm: 0.04
  });

  addReturnPin(returnToiletPin);

  // 5) 그래도 부족하면 허용 카테고리 안에서 보충한다.
  rankedPins.forEach((pin) => {
    if (outboundPins.length + returnPins.length >= 4) {
      return;
    }

    if (allowedCategories.includes(pin.category)) {
      if (pin.category === 'TOILET') {
        addReturnPin(pin);
      } else if (outboundPins.length < 2) {
        addOutboundPin(pin);
      } else {
        addReturnPin(pin);
      }
    }
  });

  // 6) 마지막 보정: 너무 적으면 전체 후보에서 보충한다.
  rankedPins.forEach((pin) => {
    if (outboundPins.length + returnPins.length >= 3) {
      return;
    }

    if (outboundPins.length < 2) {
      addOutboundPin(pin);
    } else {
      addReturnPin(pin);
    }
  });

  const routePins = [...outboundPins, ...returnPins];

  if (routePins.length === 1) {
    const nearestDifferent = rankedPins.find((pin) => pin.id !== routePins[0].id);
    if (nearestDifferent) {
      routePins.push(nearestDifferent);
    }
  }

  return routePins.slice(0, 4);
}

function makeRouteCoordinate(point: LatLng, index: number) {
  return {
    x: 0,
    y: 0,
    lat: point.lat,
    lng: point.lng,
    order: index
  };
}

function makeCoordinatesFromPins(pins: LocationPinLike[], selectedRegion: string): LatLng[] {
  const start = getFallbackCenter(selectedRegion);

  if (pins.length === 0) {
    return [
      start,
      {
        lat: start.lat + 0.003,
        lng: start.lng + 0.002
      },
      {
        lat: start.lat - 0.0015,
        lng: start.lng + 0.0035
      },
      start
    ];
  }

  const routePoints = [
    start,
    ...pins.map((pin) => ({
      lat: pin.lat,
      lng: pin.lng
    })),
    start
  ];

  return routePoints;
}

function getRegionLabel(selectedRegion: string): string {
  if (!selectedRegion || selectedRegion === '전체동네') {
    return '크림빌리지';
  }

  return selectedRegion;
}

function makeRouteFromAiResponse({
  rawRoute,
  activeGuide,
  selectedRadius,
  selectedPurpose,
  selectedRegion,
  userPrompt
}: {
  rawRoute: Partial<Route>;
  activeGuide: PetCharacterType;
  selectedRadius: number;
  selectedPurpose: string;
  selectedRegion: string;
  userPrompt: string;
}): Route {
  const safeGuideId = getSafeGuideId(
    (rawRoute as { characterGuide?: string }).characterGuide || activeGuide
  );
  const guide = CHARACTERS[safeGuideId];
  const meta = GUIDE_ROUTE_META[safeGuideId];

  const selectedPins = pickRoutePins({
    selectedRegion,
    selectedPurpose,
    selectedRadius,
    prompt: userPrompt
  });

  const coordinates = makeCoordinatesFromPins(selectedPins, selectedRegion);

  const distance = getRouteDistanceKm(coordinates);
  const duration = estimateDurationMinutes(
    distance,
    Math.max(selectedPins.length, rawRoute.checkpoints?.length ?? 0)
  );

  const checkpoints =
    Array.isArray(rawRoute.checkpoints) && rawRoute.checkpoints.length > 0
      ? rawRoute.checkpoints.map((checkpoint: any, index) => {
          const fallbackPin = selectedPins[index];

          return {
            id:
              checkpoint.id ||
              fallbackPin?.id ||
              `ai-checkpoint-${Date.now()}-${index}`,
            name:
              checkpoint.name ||
              fallbackPin?.name ||
              `${index + 1}번째 AI 경유지`,
            description:
              checkpoint.description ||
              fallbackPin?.description ||
              'AI가 선택한 맞춤 산책 경유지입니다.',
            characterComment:
              checkpoint.characterComment ||
              `${guide.name} 선배가 이 지점을 추천했습니다.`,
            discovered: Boolean(checkpoint.discovered),
            type: checkpoint.type || (fallbackPin?.category === 'TOILET' ? 'rest' : 'landmark'),
            x: typeof checkpoint.x === 'number' ? checkpoint.x : 0,
            y: typeof checkpoint.y === 'number' ? checkpoint.y : 0,
            lat:
              typeof checkpoint.lat === 'number'
                ? checkpoint.lat
                : fallbackPin?.lat ?? coordinates[Math.min(index + 1, coordinates.length - 1)]?.lat,
            lng:
              typeof checkpoint.lng === 'number'
                ? checkpoint.lng
                : fallbackPin?.lng ?? coordinates[Math.min(index + 1, coordinates.length - 1)]?.lng
          };
        })
      : selectedPins.map((pin, index) => ({
          id: `ai-checkpoint-${pin.id}`,
          name: pin.name,
          description:
            pin.description ||
            `${getRegionLabel(selectedRegion)}에서 ${guide.name} 선배가 고른 산책 경유지입니다.`,
          characterComment:
            pin.category === 'TOILET'
              ? `${guide.name} 선배: “복귀길 후반에 ${pin.name}에서 배변 정리하고 깔끔하게 돌아가자냥멍!”`
              : `${guide.name} 선배: “${pin.name} 쪽으로 가면 이번 요청에 잘 맞는 산책 흐름이 나온다냥멍!”`,
          discovered: false,
          type: pin.category === 'TOILET' ? 'rest' : 'landmark',
          x: 0,
          y: 0,
          lat: pin.lat,
          lng: pin.lng
        }));

  return {
    ...(rawRoute as Route),
    id:
      rawRoute.id ||
      `ai-route-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name:
      rawRoute.name ||
      (rawRoute as { title?: string }).title ||
      meta.defaultTitle,
    description:
      rawRoute.description ||
      `${guide.name} 선배가 "${userPrompt || '동네의 보석 같은 감성 지점'}" 요청을 바탕으로 실제 지도 핀을 연결해 만든 맞춤 산책 루트입니다.`,
    region: rawRoute.region || getRegionLabel(selectedRegion),
    category: rawRoute.category || meta.category,
    purpose:
      rawRoute.purpose ||
      (selectedPurpose === 'all' ? meta.purpose : selectedPurpose),
    difficulty: rawRoute.difficulty || meta.difficulty,
    distance: Number(distance.toFixed(2)),
    duration,
    tags:
      Array.isArray(rawRoute.tags) && rawRoute.tags.length > 0
        ? rawRoute.tags
        : [
            'AI추천',
            guide.name,
            getRegionLabel(selectedRegion),
            selectedPurpose === 'all' ? meta.purpose : selectedPurpose
          ],
    coordinates: coordinates.map((coordinate, index) =>
      makeRouteCoordinate(coordinate, index)
    ),
    checkpoints,
    characterGuide: safeGuideId
  } as Route;
}

export const AiRoutePanel: React.FC<AiRoutePanelProps> = ({
  onRouteGenerated,
  selectedRadius,
  selectedPurpose,
  selectedRegion,
  preSelectedGuide
}) => {
  const [activeGuide, setActiveGuide] = useState<PetCharacterType>('mango');
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (preSelectedGuide) {
      setActiveGuide(preSelectedGuide);
    }
  }, [preSelectedGuide]);

  const guide = CHARACTERS[activeGuide];

  const presetSuggestions = {
    mango: [
      '꽃 향기가 참 좋고 길고양이가 아지트로 삼는 아기자기한 담벼락 지름길',
      '사람 무리가 거의 없고 따뜻한 햇살 가볍게 내리쬐는 비밀 탐정 코스'
    ],
    janggun: [
      '휠체어나 유모차도 가기 편하고 자동차 경적이 일절 없는 안심 평지길',
      '다리에 가해진 피로를 치료해주는 푹신하고 매끄러운 수변 흙길 가로수'
    ],
    nabi: [
      '낙엽이 수북하게 쌓여 바스락바스락 걷기 최고인 낙엽 음악대 트랙',
      '길거리에서 동네 비둘기나 참새 친구들을 여유롭게 감상하는 탐구 보물길'
    ],
    bori: [
      '포근하고 푸릇푸릇한 잔디 정원에서 엎드려 솔바람 쐬우는 슬로우 공원길',
      '시골의 냇가 정취가 그대로 남아있는 조용하게 새 소리 듣는 힐링 코스'
    ],
    mungchi: [
      '헉헉 소리나게 계단과 가파른 흙 언덕 고개를 오르내리는 번개 전정길',
      '체력을 단숨에 폭발시켜 꿀잠 자도록 유도하는 서바이벌 장애물 달리기'
    ]
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: activeGuide,
          requirement: userPrompt || '동네의 보석 같은 감성 지점을 발견하고 싶어!',
          radius: selectedRadius,
          purpose: selectedPurpose === 'all' ? 'afternoon' : selectedPurpose,
          region: selectedRegion === '전체동네' ? '크림빌리지' : selectedRegion
        })
      });

      if (!response.ok) {
        let message = '어드벤처 지도를 그릴 수 없어졌습니다.';

        try {
          const errData = await response.json();
          message = errData.error || message;
        } catch {
          const errorText = await response.text();
          message = errorText || message;
        }

        throw new Error(message);
      }

      const rawGeneratedRoute = (await response.json()) as Partial<Route>;

      const generatedRoute = makeRouteFromAiResponse({
        rawRoute: rawGeneratedRoute,
        activeGuide,
        selectedRadius,
        selectedPurpose,
        selectedRegion,
        userPrompt
      });

      onRouteGenerated(generatedRoute);
      setUserPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message ||
          '서버 혹은 API 연동에 이슈가 생겨 보리가 지도를 그릴 수 없습니다.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const getGuideBg = (id: string, isSelected: boolean) => {
    if (isSelected) {
      switch (id) {
        case 'mango':
          return 'bg-amber-400 border-amber-500 text-white';
        case 'janggun':
          return 'bg-warm-gray-dark border-neutral-800 text-white';
        case 'nabi':
          return 'bg-pastel-blue border-emerald-500 text-white';
        case 'bori':
          return 'bg-pastel-mint border-emerald-600 text-white';
        default:
          return 'bg-rose-400 border-rose-500 text-white';
      }
    }

    return 'bg-white border-cream-border text-warm-gray hover:bg-cream-accent';
  };

  if (isGenerating) {
    return (
      <div
        className="p-6 bg-[#FFFDF9] rounded-[32px] border-2 border-dashed border-[#F3E6D5] shadow-soft flex flex-col gap-5 text-center items-center justify-center animate-pulse"
        id="ai-loading-screen"
      >
        <div className="relative">
          <span className="text-4xl animate-bounce block">🗺️✨</span>
          <span className="absolute -top-1 -right-1 text-xs animate-spin font-bold">📡</span>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-black text-warm-gray-dark">
            {guide.name} 대장선배와 5총사가 지도를 구성 중이다냥!
          </h3>
          <p className="text-[10px] text-warm-gray/70">
            크림마을 동네 구석구석을 실시간 탐사하여 수첩을 채우고 있다냥.
          </p>
        </div>

        <div className="w-full bg-cream-accent/70 p-3.5 rounded-2xl border border-[#FAEFDF]/70 text-left flex flex-col gap-2.5 text-[10.5px]">
          <div className="flex items-center gap-2.5">
            {CHARACTERS.mango.avatarImage ? (
              <img
                src={CHARACTERS.mango.avatarImage}
                alt="망고"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover border border-amber-200 shadow-xs"
              />
            ) : (
              <span className="text-lg bg-orange-100 p-1.5 rounded-xl">🐱</span>
            )}
            <div>
              <span className="font-extrabold text-[#D55F1B]">망고 선배의 햇살검증:</span>
              <span className="text-warm-gray ml-1">오후 담장 햇볕 아늑지대 검증완료냥! ☀️</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 border-t border-[#F5EFE0] pt-2">
            {CHARACTERS.janggun.avatarImage ? (
              <img
                src={CHARACTERS.janggun.avatarImage}
                alt="장군"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover border border-slate-300 shadow-xs"
              />
            ) : (
              <span className="text-lg bg-slate-100 p-1.5 rounded-xl font-sans">🐶</span>
            )}
            <div>
              <span className="font-extrabold text-slate-700 font-sans">장군 선배의 통학안심:</span>
              <span className="text-warm-gray ml-1">평탄 유모차 보행로 안전도 체크완료댕! 🛡️</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 border-t border-[#F5EFE0] pt-2">
            {CHARACTERS.nabi.avatarImage ? (
              <img
                src={CHARACTERS.nabi.avatarImage}
                alt="나비"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover border border-sky-200 shadow-xs"
              />
            ) : (
              <span className="text-lg bg-sky-100 p-1.5 rounded-xl">🐈‍⬛</span>
            )}
            <div>
              <span className="font-extrabold text-sky-800">나비 선배의 보물배치:</span>
              <span className="text-warm-gray ml-1">바스락 주머니 도토리 3개 은닉성공냥! 🎁</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 border-t border-[#F5EFE0] pt-2">
            {CHARACTERS.bori.avatarImage ? (
              <img
                src={CHARACTERS.bori.avatarImage}
                alt="보리"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover border border-emerald-200 shadow-xs"
              />
            ) : (
              <span className="text-lg bg-emerald-100 p-1.5 rounded-xl">🐕‍🦺</span>
            )}
            <div>
              <span className="font-extrabold text-emerald-800">보리 선배의 사색구도:</span>
              <span className="text-warm-gray ml-1">솔바람 사색 시편 음악 구상하는 중댕... 🌾</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 border-t border-[#F5EFE0] pt-2">
            {CHARACTERS.mungchi.avatarImage ? (
              <img
                src={CHARACTERS.mungchi.avatarImage}
                alt="뭉치"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover border border-rose-200 shadow-xs"
              />
            ) : (
              <span className="text-lg bg-purple-100 p-1.5 rounded-xl">🐩</span>
            )}
            <div>
              <span className="font-extrabold text-purple-800 font-sans">뭉치 선배의 고구마파워:</span>
              <span className="text-warm-gray ml-1 font-sans">에너지 극복 명예 훈장 뱃지 세팅 완료댕! ⚡</span>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center gap-1.5 justify-center text-[10px] text-pastel-orange font-black">
          <Loader2 size={13} className="animate-spin stroke-[2.5]" />
          <span>번개같이 완성해 가는 중이니 몇 초간 기둘려 달라냥...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-5 bg-white rounded-[32px] border-2 border-cream-border shadow-soft flex flex-col gap-4.5"
      id="ai-route-panel"
    >
      <div className="flex items-center justify-between pb-1 border-b border-cream-border/65">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-pastel-orange-soft rounded-2xl text-pastel-orange shadow-inner flex items-center justify-center">
            <Sparkles size={18} className="animate-pulse stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-warm-gray-dark leading-tight">
              Mungchi AI 가이드 제작소
            </h3>
            <p className="text-[10px] text-warm-gray/80 mt-0.5">
              대장 캐릭터를 지정하고 맞춤 모험 테마 보물 지도를 즉석 발급해 보세요.
            </p>
          </div>
        </div>

        <span className="text-[9px] font-black text-pastel-orange bg-pastel-orange-soft border border-[#FFE8DA] px-2 py-0.5 rounded-full font-mono">
          AI AGENT v1.0
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-warm-gray/90 uppercase tracking-wider pl-0.5">
          나와 걸을 전담 가이드 선택
        </label>

        <div className="grid grid-cols-5 gap-1.5">
          {(Object.keys(CHARACTERS) as PetCharacterType[]).map((key) => {
            const char = CHARACTERS[key];
            const isActive = activeGuide === key;

            return (
              <button
                key={key}
                id={`ai-guide-tab-${key}`}
                type="button"
                onClick={() => {
                  setActiveGuide(key);
                  setErrorMessage(null);
                }}
                className={`p-1.5 rounded-2xl text-center border-2 flex flex-col items-center gap-1 transition-all btn-squishy cursor-pointer ${getGuideBg(
                  key,
                  isActive
                )} ${isActive ? 'shadow-soft scale-102 font-bold' : ''}`}
              >
                {char.avatarImage ? (
                  <img
                    src={char.avatarImage}
                    alt={char.name}
                    referrerPolicy="no-referrer"
                    className={`w-10 h-10 rounded-full object-cover shadow-xs border ${
                      isActive ? 'border-white' : 'border-slate-200'
                    }`}
                  />
                ) : (
                  <span className="text-xl">{char.avatarEmoji}</span>
                )}

                <span className="text-[10px] font-extrabold">{char.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 bg-cream-accent/65 rounded-2xl border border-[#FAEFDF]/70 flex items-start gap-3 text-[11px] text-warm-gray leading-relaxed shadow-inner">
        {guide.avatarImage && (
          <img
            src={guide.avatarImage}
            alt={guide.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover border border-[#F3E6D5] flex-shrink-0 shadow-sm"
          />
        )}

        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-[#9F5614]">
              🐾 {guide.name} ({guide.species})
            </span>
            <span className="text-[9px] bg-[#FFF2DE] text-[#B8711E] font-black px-1.5 py-0.2 rounded-full leading-none">
              {guide.role}
            </span>
          </div>

          <p className="italic text-warm-gray mt-1 text-[10.5px] border-l-3 border-[#FFDDA4] pl-2.5">
            “{guide.description}”
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10.5px] font-black text-warm-gray flex items-center gap-1.5 pl-0.5">
          <MessageSquare size={13} className="text-pastel-orange stroke-[2.5]" />
          이런 어드벤처 요청도 좋아요:
        </span>

        <div className="flex flex-col gap-2">
          {presetSuggestions[activeGuide].map((suggestion, idx) => (
            <button
              key={idx}
              id={`preset-btn-${activeGuide}-${idx}`}
              type="button"
              onClick={() => setUserPrompt(suggestion)}
              className="w-full text-left bg-white border border-cream-border hover:border-pastel-orange p-3 rounded-2xl text-[11px] text-warm-gray-dark font-semibold btn-squishy cursor-pointer truncate shadow-xs"
            >
              🐕 "{suggestion}"
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-warm-gray/90 uppercase tracking-wider pl-0.5">
          상세 맞춤 조건 직접 작성
        </label>

        <div className="relative">
          <textarea
            id="ai-prompt-area"
            value={userPrompt}
            onChange={(event) => setUserPrompt(event.target.value)}
            className="w-full p-3.5 bg-white text-xs font-bold text-warm-gray-dark border-2 border-cream-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-pastel-orange/10 focus:border-pastel-orange placeholder-warm-gray/35 resize-none h-20 leading-relaxed shadow-inner"
            placeholder="예시: 디스크 끼가 있어서 높은 계단은 빼고, 조용한 가로수 그늘길 아래에서 쉴 수 있는 가로수길 붉은 벽돌 코스를 설계해줘 보리 선배!"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-150 rounded-2xl text-[10.5px] text-red-900 flex items-start gap-1.5 animate-pulse">
          <AlertTriangle
            size={15}
            className="text-red-500 flex-shrink-0 mt-0.5"
          />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        id="btn-trigger-ai-route"
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full py-4 rounded-2xl font-black text-xs text-white shadow-soft transition-all duration-300 btn-squishy flex items-center justify-center gap-2 cursor-pointer ${
          isGenerating
            ? 'bg-amber-400 cursor-not-allowed text-stone-200'
            : 'bg-gradient-to-r from-pastel-orange to-orange-555 hover:from-orange-600 hover:to-orange-500 shadow-premium'
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 size={15} className="animate-spin stroke-[2.5]" />
            <span>{guide.name} 선배가 코 밑에 땀 흘리며 수첩 그리는 중... (약 5초)</span>
          </>
        ) : (
          <>
            <Brain size={15} className="animation-pulse text-amber-100" />
            <span>{guide.name} 선배와 비밀 아지트 지도 그리기 ✉️</span>
          </>
        )}
      </button>
    </div>
  );
};