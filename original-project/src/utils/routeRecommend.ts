import type { Pin, PinCategory, Purpose, RouteResult } from "../types";
import { getDistanceKm, getRouteDistanceKm } from "./distance";

type Location = {
  lat: number;
  lng: number;
};

type RouteStrategy = "BALANCED" | "SHORT_DISTANCE" | "DOG_FRIENDLY";
type RouteLengthType = "SHORT" | "MEDIUM" | "LONG";

type StrategyConfig = {
  id: RouteStrategy;
  title: string;
  descriptionPrefix: string;
  dogFriendlyWeight: number;
  routePriorityWeight: number;
  accessibilityWeight: number;
  safetyWeight: number;
  distanceWeight: number;
};

type RouteTemplate = {
  id: string;
  description: string;
  categories: PinCategory[];
  targetLength: RouteLengthType;
};

type CandidateRoute = RouteResult & {
  signature: string;
  templateId: string;
  strategyId: RouteStrategy;
  targetLength: RouteLengthType;
};

const DEFAULT_START_LOCATION: Location = {
  lat: 37.4509,
  lng: 127.1287,
};

const LENGTH_ORDER: RouteLengthType[] = ["SHORT", "MEDIUM", "LONG"];

const LENGTH_CONFIG: Record<
  RouteLengthType,
  {
    label: string;
    preferredMinutes: number;
    minMinutes: number;
    maxMinutes: number;
  }
> = {
  SHORT: {
    label: "짧은 산책 코스",
    preferredMinutes: 18,
    minMinutes: 0,
    maxMinutes: 25,
  },
  MEDIUM: {
    label: "보통 산책 코스",
    preferredMinutes: 35,
    minMinutes: 25,
    maxMinutes: 45,
  },
  LONG: {
    label: "긴 산책 코스",
    preferredMinutes: 60,
    minMinutes: 45,
    maxMinutes: 90,
  },
};

const MIN_MEANINGFUL_STOP_DISTANCE_KM = 0.12;
const REMOTE_CLUSTER_MIN_START_DISTANCE_KM = 0.65;
const REMOTE_CLUSTER_MAX_SPREAD_KM = 0.2;
const MAX_PIN_POOL_SIZE = 18;

const PURPOSE_ALLOWED_CATEGORIES: Record<Purpose, PinCategory[]> = {
  WALK: ["PARK", "TOILET", "CAFE"],
  HOSPITAL_VISIT: ["HOSPITAL", "TOILET", "PARK", "CAFE"],
  GROOMING: ["GROOMING", "TOILET", "PARK", "CAFE"],
  SHOPPING: ["PET_STORE", "PARK", "TOILET", "CAFE"],
  STRESS_RELIEF: ["PARK", "TOILET", "CAFE"],
};

const CONNECTOR_KEYWORDS = [
  "연결",
  "후보",
  "경유",
  "진입",
  "회귀",
  "방향",
  "보행",
  "출구",
  "입구",
  "시작",
  "남측",
  "북측",
  "서측",
  "동측",
  "주거지",
  "도로변",
  "로데오거리",
  "공중화장실",
  "배변처리 후보",
  "지도좌표기반",
];

const REAL_DESTINATION_KEYWORDS = [
  "공원",
  "근린공원",
  "어린이공원",
  "생태원",
  "반려견놀이터",
  "카페",
  "동물병원",
  "용품점",
  "미용",
  "목욕",
];

const PURPOSE_ROUTE_TEMPLATES: Record<Purpose, RouteTemplate[]> = {
  WALK: [
    {
      id: "walk-short-toilet-park",
      description: "가까운 배변시설과 공원을 연결한 뒤 출발지로 돌아옵니다.",
      categories: ["TOILET", "PARK"],
      targetLength: "SHORT",
    },
    {
      id: "walk-short-park-toilet",
      description: "가까운 공원과 배변시설을 연결한 뒤 출발지로 돌아옵니다.",
      categories: ["PARK", "TOILET"],
      targetLength: "SHORT",
    },
    {
      id: "walk-medium-basic",
      description:
        "배변시설, 공원, 휴식 장소를 균형 있게 연결한 뒤 출발지로 돌아옵니다.",
      categories: ["TOILET", "PARK", "CAFE"],
      targetLength: "MEDIUM",
    },
    {
      id: "walk-medium-park-first",
      description: "공원을 먼저 들러 산책 만족도를 높인 뒤 출발지로 돌아옵니다.",
      categories: ["PARK", "TOILET", "CAFE"],
      targetLength: "MEDIUM",
    },
    {
      id: "walk-medium-double-park",
      description: "공원과 산책 지점을 여유 있게 연결한 뒤 출발지로 돌아옵니다.",
      categories: ["PARK", "PARK", "TOILET"],
      targetLength: "MEDIUM",
    },
    {
      id: "walk-long-double-park",
      description:
        "공원과 산책 지점을 여러 번 연결해 긴 산책을 구성하고 출발지로 돌아옵니다.",
      categories: ["PARK", "PARK", "CAFE"],
      targetLength: "LONG",
    },
    {
      id: "walk-long-full",
      description:
        "배변시설, 공원, 산책 지점, 휴식 장소를 길게 연결하고 출발지로 돌아옵니다.",
      categories: ["TOILET", "PARK", "PARK", "CAFE"],
      targetLength: "LONG",
    },
  ],

  HOSPITAL_VISIT: [
    {
      id: "hospital-short",
      description: "병원 방문 후 무리하지 않는 짧은 산책을 연결하고 출발지로 돌아옵니다.",
      categories: ["HOSPITAL", "PARK"],
      targetLength: "SHORT",
    },
    {
      id: "hospital-medium",
      description: "병원 방문 전후의 배변과 짧은 산책을 고려하고 출발지로 돌아옵니다.",
      categories: ["HOSPITAL", "TOILET", "PARK"],
      targetLength: "MEDIUM",
    },
    {
      id: "hospital-long",
      description: "병원, 산책 지점, 휴식 장소를 함께 경유하고 출발지로 돌아옵니다.",
      categories: ["HOSPITAL", "PARK", "CAFE"],
      targetLength: "LONG",
    },
  ],

  GROOMING: [
    {
      id: "grooming-short",
      description: "가벼운 산책 후 미용 장소로 이동하고 출발지로 돌아옵니다.",
      categories: ["PARK", "GROOMING"],
      targetLength: "SHORT",
    },
    {
      id: "grooming-medium",
      description: "미용 전 배변과 미용 후 휴식을 함께 고려하고 출발지로 돌아옵니다.",
      categories: ["TOILET", "GROOMING", "CAFE"],
      targetLength: "MEDIUM",
    },
    {
      id: "grooming-long",
      description: "미용 장소, 산책 지점, 휴식 장소를 함께 연결하고 출발지로 돌아옵니다.",
      categories: ["GROOMING", "PARK", "CAFE", "PARK"],
      targetLength: "LONG",
    },
  ],

  SHOPPING: [
    {
      id: "shopping-short",
      description: "가까운 용품점과 짧은 산책 지점을 연결하고 출발지로 돌아옵니다.",
      categories: ["PET_STORE", "PARK"],
      targetLength: "SHORT",
    },
    {
      id: "shopping-medium",
      description: "산책 전 필요한 용품을 보충하고 공원으로 이동한 뒤 출발지로 돌아옵니다.",
      categories: ["PET_STORE", "TOILET", "PARK"],
      targetLength: "MEDIUM",
    },
    {
      id: "shopping-long",
      description: "용품점 방문 후 산책과 휴식을 길게 연결하고 출발지로 돌아옵니다.",
      categories: ["PET_STORE", "PARK", "CAFE", "PARK"],
      targetLength: "LONG",
    },
  ],

  STRESS_RELIEF: [
    {
      id: "stress-short",
      description:
        "가까운 공원과 배변시설을 중심으로 가볍게 움직이고 출발지로 돌아옵니다.",
      categories: ["PARK", "TOILET"],
      targetLength: "SHORT",
    },
    {
      id: "stress-medium",
      description:
        "공원과 배변시설을 중심으로 반려견 활동량을 확보하고 출발지로 돌아옵니다.",
      categories: ["PARK", "TOILET", "CAFE"],
      targetLength: "MEDIUM",
    },
    {
      id: "stress-long",
      description:
        "공원 또는 산책 지점을 여러 번 연결해 활동량을 늘리고 출발지로 돌아옵니다.",
      categories: ["PARK", "PARK", "TOILET", "CAFE"],
      targetLength: "LONG",
    },
  ],
};

const PURPOSE_DESCRIPTION: Record<Purpose, string> = {
  WALK: "일상 산책 목적에 맞춘 왕복 추천입니다.",
  HOSPITAL_VISIT: "병원 방문 전후 동선을 고려한 왕복 추천입니다.",
  GROOMING: "미용·목욕 전후 동선을 고려한 왕복 추천입니다.",
  SHOPPING: "반려동물 용품 구매와 산책을 함께 고려한 왕복 추천입니다.",
  STRESS_RELIEF: "반려견의 활동량과 스트레스 해소를 우선한 왕복 추천입니다.",
};

const STRATEGIES: StrategyConfig[] = [
  {
    id: "BALANCED",
    title: "균형형",
    descriptionPrefix: "거리, 접근성, 반려견 친화도를 균형 있게 고려했습니다.",
    dogFriendlyWeight: 10,
    routePriorityWeight: 10,
    accessibilityWeight: 6,
    safetyWeight: 6,
    distanceWeight: 10,
  },
  {
    id: "SHORT_DISTANCE",
    title: "짧은 거리형",
    descriptionPrefix: "왕복 이동 거리를 줄이는 것을 우선했습니다.",
    dogFriendlyWeight: 6,
    routePriorityWeight: 6,
    accessibilityWeight: 8,
    safetyWeight: 5,
    distanceWeight: 24,
  },
  {
    id: "DOG_FRIENDLY",
    title: "반려견 친화형",
    descriptionPrefix: "반려견 친화도와 안전성을 우선했습니다.",
    dogFriendlyWeight: 16,
    routePriorityWeight: 8,
    accessibilityWeight: 5,
    safetyWeight: 10,
    distanceWeight: 8,
  },
];

const RANK_OFFSETS = [0, 1, 2, 3, 4, 5, 6];

function filterPinsByPurpose(pins: Pin[], purpose: Purpose): Pin[] {
  const allowedCategories = PURPOSE_ALLOWED_CATEGORIES[purpose];

  return pins.filter((pin) => allowedCategories.includes(pin.category));
}

function getPinText(pin: Pin): string {
  return [pin.id, pin.name, pin.address ?? "", pin.description ?? "", pin.notes ?? ""]
    .join(" ")
    .toLowerCase();
}

function isConnectorWaypoint(pin: Pin): boolean {
  const text = getPinText(pin);

  return CONNECTOR_KEYWORDS.some((keyword) =>
    text.includes(keyword.toLowerCase())
  );
}

function isRealDestination(pin: Pin): boolean {
  const text = getPinText(pin);

  if (
    pin.category === "CAFE" ||
    pin.category === "HOSPITAL" ||
    pin.category === "PET_STORE" ||
    pin.category === "GROOMING"
  ) {
    return true;
  }

  if (pin.category === "PARK") {
    const hasRealDestinationKeyword = REAL_DESTINATION_KEYWORDS.some((keyword) =>
      text.includes(keyword.toLowerCase())
    );

    return hasRealDestinationKeyword && !isConnectorWaypoint(pin);
  }

  return false;
}

function hasMeaningfulDestination(pins: Pin[], purpose: Purpose): boolean {
  if (pins.length === 0) {
    return false;
  }

  if (purpose === "WALK" || purpose === "STRESS_RELIEF") {
    return pins.some((pin) => {
      if (pin.category === "PARK" && isRealDestination(pin)) {
        return true;
      }

      if (pin.category === "CAFE" && isRealDestination(pin)) {
        return true;
      }

      return false;
    });
  }

  if (purpose === "HOSPITAL_VISIT") {
    return pins.some((pin) => pin.category === "HOSPITAL");
  }

  if (purpose === "GROOMING") {
    return pins.some((pin) => pin.category === "GROOMING");
  }

  if (purpose === "SHOPPING") {
    return pins.some((pin) => pin.category === "PET_STORE");
  }

  return pins.some(isRealDestination);
}

function getWaypointPenalty(selectedPins: Pin[], purpose: Purpose): number {
  let penalty = 0;

  selectedPins.forEach((pin) => {
    if (isConnectorWaypoint(pin)) {
      penalty += 18;
    }

    if ((purpose === "WALK" || purpose === "STRESS_RELIEF") && pin.category === "TOILET") {
      penalty += 4;
    }
  });

  if (!hasMeaningfulDestination(selectedPins, purpose)) {
    penalty += 120;
  }

  if (selectedPins.length === 1 && isConnectorWaypoint(selectedPins[0])) {
    penalty += 160;
  }

  return penalty;
}

function getEstimatedMinutes(totalDistanceKm: number, pinCount: number): number {
  const averageDogWalkingSpeedKmh = 3.5;
  const movingMinutes = (totalDistanceKm / averageDogWalkingSpeedKmh) * 60;
  const shortStopMinutes = pinCount * 3;

  return Math.max(5, Math.round(movingMinutes + shortStopMinutes));
}

function getActualLengthType(estimatedMinutes: number): RouteLengthType {
  if (estimatedMinutes <= LENGTH_CONFIG.SHORT.maxMinutes) {
    return "SHORT";
  }

  if (estimatedMinutes <= LENGTH_CONFIG.MEDIUM.maxMinutes) {
    return "MEDIUM";
  }

  return "LONG";
}

function getWalkingIntensity(estimatedMinutes: number) {
  const actualLengthType = getActualLengthType(estimatedMinutes);

  if (actualLengthType === "SHORT") {
    return "가벼움";
  }

  if (actualLengthType === "MEDIUM") {
    return "보통";
  }

  return "긴 코스";
}

function getPinScore(
  pin: Pin,
  from: Location,
  strategy: StrategyConfig
): number {
  const distanceKm = getDistanceKm(from, {
    lat: pin.lat,
    lng: pin.lng,
  });

  const dogFriendlyScore = pin.dogFriendlyScore ?? 3;
  const routePriorityScore = pin.routePriorityScore ?? 3;
  const accessibilityScore = pin.accessibilityScore ?? 3;
  const safetyScore = pin.safetyScore ?? 3;

  const connectorPenalty = isConnectorWaypoint(pin) ? 14 : 0;
  const realDestinationBonus = isRealDestination(pin) ? 16 : 0;

  return (
    dogFriendlyScore * strategy.dogFriendlyWeight +
    routePriorityScore * strategy.routePriorityWeight +
    accessibilityScore * strategy.accessibilityWeight +
    safetyScore * strategy.safetyWeight +
    realDestinationBonus -
    connectorPenalty -
    distanceKm * strategy.distanceWeight
  );
}

function selectPinByCategoryWithRank(
  pins: Pin[],
  category: PinCategory,
  from: Location,
  selectedPinIds: string[],
  strategy: StrategyConfig,
  rankOffset: number
): Pin | undefined {
  const candidates = pins
    .filter(
      (pin) => pin.category === category && !selectedPinIds.includes(pin.id)
    )
    .map((pin) => ({
      pin,
      score: getPinScore(pin, from, strategy),
    }))
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return undefined;
  }

  const selectedIndex = Math.min(rankOffset, candidates.length - 1);

  return candidates[selectedIndex].pin;
}

function getRouteSignature(pins: Pin[]): string {
  return pins.map((pin) => pin.id).join(">");
}

function getRoutePinIdSet(route: Pick<RouteResult, "pins">): Set<string> {
  return new Set(route.pins.map((pin) => pin.id));
}

function getOverlapCount(
  routeA: Pick<RouteResult, "pins">,
  routeB: Pick<RouteResult, "pins">
): number {
  const routeAIds = getRoutePinIdSet(routeA);

  return routeB.pins.filter((pin) => routeAIds.has(pin.id)).length;
}

function getMaxOverlapWithSelected(
  route: Pick<RouteResult, "pins">,
  selectedRoutes: Array<Pick<RouteResult, "pins">>
): number {
  if (selectedRoutes.length === 0) {
    return 0;
  }

  return Math.max(
    ...selectedRoutes.map((selectedRoute) =>
      getOverlapCount(route, selectedRoute)
    )
  );
}

function hasSameFirstStop(
  routeA: Pick<RouteResult, "pins">,
  routeB: Pick<RouteResult, "pins">
): boolean {
  return Boolean(
    routeA.pins[0] && routeB.pins[0] && routeA.pins[0].id === routeB.pins[0].id
  );
}

function getAveragePinScore(
  pins: Pin[],
  strategy: StrategyConfig,
  startLocation: Location
): number {
  if (pins.length === 0) {
    return 0;
  }

  return (
    pins.reduce((sum, pin) => {
      return sum + getPinScore(pin, startLocation, strategy);
    }, 0) / pins.length
  );
}

function getCircularRouteDistanceKm(
  startLocation: Location,
  selectedPins: Pin[]
): number {
  const routeLocations = [
    startLocation,
    ...selectedPins.map((pin) => ({
      lat: pin.lat,
      lng: pin.lng,
    })),
    startLocation,
  ];

  return getRouteDistanceKm(routeLocations);
}

function getInterStopDistancesKm(selectedPins: Pin[]): number[] {
  const distances: number[] = [];

  for (let index = 0; index < selectedPins.length - 1; index += 1) {
    const currentPin = selectedPins[index];
    const nextPin = selectedPins[index + 1];

    distances.push(
      getDistanceKm(
        {
          lat: currentPin.lat,
          lng: currentPin.lng,
        },
        {
          lat: nextPin.lat,
          lng: nextPin.lng,
        }
      )
    );
  }

  return distances;
}

function hasOnlyTinyStopMovement(selectedPins: Pin[]): boolean {
  if (selectedPins.length < 2) {
    return false;
  }

  const interStopDistances = getInterStopDistancesKm(selectedPins);
  const maxInterStopDistance = Math.max(...interStopDistances);

  return maxInterStopDistance < MIN_MEANINGFUL_STOP_DISTANCE_KM;
}

function hasVeryCloseConsecutiveStops(selectedPins: Pin[]): boolean {
  if (selectedPins.length < 2) {
    return false;
  }

  return getInterStopDistancesKm(selectedPins).some(
    (distanceKm) => distanceKm < 0.06
  );
}

function getCloseStopPenalty(selectedPins: Pin[]): number {
  if (selectedPins.length < 2) {
    return 0;
  }

  return getInterStopDistancesKm(selectedPins).reduce((penalty, distanceKm) => {
    if (distanceKm >= MIN_MEANINGFUL_STOP_DISTANCE_KM) {
      return penalty;
    }

    return penalty + (MIN_MEANINGFUL_STOP_DISTANCE_KM - distanceKm) * 400;
  }, 0);
}

function getRemoteClusterPenalty(
  startLocation: Location,
  selectedPins: Pin[]
): number {
  if (selectedPins.length < 2) {
    return 0;
  }

  const startToFirstKm = getDistanceKm(startLocation, {
    lat: selectedPins[0].lat,
    lng: selectedPins[0].lng,
  });

  const interStopDistances = getInterStopDistancesKm(selectedPins);
  const maxInterStopDistance = Math.max(...interStopDistances);

  if (
    startToFirstKm >= REMOTE_CLUSTER_MIN_START_DISTANCE_KM &&
    maxInterStopDistance < REMOTE_CLUSTER_MAX_SPREAD_KM
  ) {
    return 120;
  }

  return 0;
}

function isBadStopCluster(
  startLocation: Location,
  selectedPins: Pin[],
  purpose: Purpose
): boolean {
  if (selectedPins.length === 0) {
    return true;
  }

  if (!hasMeaningfulDestination(selectedPins, purpose)) {
    return true;
  }

  if (selectedPins.length === 1 && isConnectorWaypoint(selectedPins[0])) {
    return true;
  }

  if (selectedPins.length < 2) {
    return false;
  }

  const startToFirstKm = getDistanceKm(startLocation, {
    lat: selectedPins[0].lat,
    lng: selectedPins[0].lng,
  });

  const interStopDistances = getInterStopDistancesKm(selectedPins);
  const maxInterStopDistance = Math.max(...interStopDistances);

  if (hasVeryCloseConsecutiveStops(selectedPins)) {
    return true;
  }

  if (hasOnlyTinyStopMovement(selectedPins)) {
    return true;
  }

  if (
    startToFirstKm >= REMOTE_CLUSTER_MIN_START_DISTANCE_KM &&
    maxInterStopDistance < REMOTE_CLUSTER_MAX_SPREAD_KM
  ) {
    return true;
  }

  return false;
}

function getLengthSuitabilityPenalty(
  estimatedMinutes: number,
  targetLength: RouteLengthType
): number {
  const config = LENGTH_CONFIG[targetLength];

  const preferredGap = Math.abs(estimatedMinutes - config.preferredMinutes);
  const preferredPenalty = preferredGap * 1.6;

  const tooShortPenalty =
    estimatedMinutes < config.minMinutes
      ? (config.minMinutes - estimatedMinutes) * 2.5
      : 0;

  const tooLongPenalty =
    estimatedMinutes > config.maxMinutes
      ? (estimatedMinutes - config.maxMinutes) * 3.2
      : 0;

  return preferredPenalty + tooShortPenalty + tooLongPenalty;
}

function buildCandidateRouteFromPins({
  selectedPins,
  purpose,
  strategy,
  targetLength,
  templateId,
  description,
  startLocation,
}: {
  selectedPins: Pin[];
  purpose: Purpose;
  strategy: StrategyConfig;
  targetLength: RouteLengthType;
  templateId: string;
  description: string;
  startLocation: Location;
}): CandidateRoute | null {
  if (selectedPins.length === 0) {
    return null;
  }

  if (isBadStopCluster(startLocation, selectedPins, purpose)) {
    return null;
  }

  const totalDistanceKm = getCircularRouteDistanceKm(
    startLocation,
    selectedPins
  );

  const estimatedMinutes = getEstimatedMinutes(
    totalDistanceKm,
    selectedPins.length
  );

  const walkingIntensity = getWalkingIntensity(estimatedMinutes);
  const averagePinScore = getAveragePinScore(selectedPins, strategy, startLocation);

  const lengthSuitabilityPenalty = getLengthSuitabilityPenalty(
    estimatedMinutes,
    targetLength
  );

  const closeStopPenalty = getCloseStopPenalty(selectedPins);
  const remoteClusterPenalty = getRemoteClusterPenalty(
    startLocation,
    selectedPins
  );
  const waypointPenalty = getWaypointPenalty(selectedPins, purpose);

  const score = Math.max(
    0,
    Math.round(
      averagePinScore -
        totalDistanceKm * strategy.distanceWeight -
        lengthSuitabilityPenalty -
        closeStopPenalty -
        remoteClusterPenalty -
        waypointPenalty
    )
  );

  return {
    id: `${purpose}-${templateId}-${strategy.id}-${getRouteSignature(
      selectedPins
    )}`,
    title: LENGTH_CONFIG[targetLength].label,
    purpose,
    pins: selectedPins,
    totalDistanceKm,
    estimatedMinutes,
    walkingIntensity,
    score,
    description: `${strategy.descriptionPrefix} ${description} ${PURPOSE_DESCRIPTION[purpose]} 추천 성향: ${strategy.title}.`,
    signature: getRouteSignature(selectedPins),
    templateId,
    strategyId: strategy.id,
    targetLength,
  };
}

function buildTemplateCandidateRoute(
  pins: Pin[],
  purpose: Purpose,
  strategy: StrategyConfig,
  template: RouteTemplate,
  startLocation: Location,
  rankOffset: number
): CandidateRoute | null {
  const selectedPins: Pin[] = [];
  let currentLocation = startLocation;

  template.categories.forEach((category, categoryIndex) => {
    const selectedPin = selectPinByCategoryWithRank(
      pins,
      category,
      currentLocation,
      selectedPins.map((pin) => pin.id),
      strategy,
      rankOffset + Math.floor(categoryIndex / 2)
    );

    if (selectedPin) {
      selectedPins.push(selectedPin);
      currentLocation = {
        lat: selectedPin.lat,
        lng: selectedPin.lng,
      };
    }
  });

  if (selectedPins.length === 0) {
    return null;
  }

  const completionRatio = selectedPins.length / template.categories.length;

  if (completionRatio < 0.6) {
    return null;
  }

  return buildCandidateRouteFromPins({
    selectedPins,
    purpose,
    strategy,
    targetLength: template.targetLength,
    templateId: template.id,
    description: template.description,
    startLocation,
  });
}

function getRankedPinPool(
  pins: Pin[],
  startLocation: Location,
  strategy: StrategyConfig
): Pin[] {
  return [...pins]
    .map((pin) => ({
      pin,
      score: getPinScore(pin, startLocation, strategy),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PIN_POOL_SIZE)
    .map((item) => item.pin);
}

function buildManualCandidates(
  pins: Pin[],
  purpose: Purpose,
  strategy: StrategyConfig,
  startLocation: Location
): CandidateRoute[] {
  const pool = getRankedPinPool(pins, startLocation, strategy);
  const candidates: CandidateRoute[] = [];

  pool.forEach((pin) => {
    if (!isRealDestination(pin)) {
      return;
    }

    const actualDistanceKm = getCircularRouteDistanceKm(startLocation, [pin]);
    const actualMinutes = getEstimatedMinutes(actualDistanceKm, 1);
    const actualLength = getActualLengthType(actualMinutes);

    const candidate = buildCandidateRouteFromPins({
      selectedPins: [pin],
      purpose,
      strategy,
      targetLength: actualLength,
      templateId: `manual-single-${pin.id}`,
      description: "가장 가까운 의미 있는 목적지 하나를 찍고 출발지로 돌아오는 코스입니다.",
      startLocation,
    });

    if (candidate) {
      candidates.push(candidate);
    }
  });

  for (let firstIndex = 0; firstIndex < pool.length; firstIndex += 1) {
    for (let secondIndex = 0; secondIndex < pool.length; secondIndex += 1) {
      if (firstIndex === secondIndex) {
        continue;
      }

      const selectedPins = [pool[firstIndex], pool[secondIndex]];

      if (!hasMeaningfulDestination(selectedPins, purpose)) {
        continue;
      }

      const totalDistanceKm = getCircularRouteDistanceKm(
        startLocation,
        selectedPins
      );

      const estimatedMinutes = getEstimatedMinutes(totalDistanceKm, 2);
      const actualLength = getActualLengthType(estimatedMinutes);

      const candidate = buildCandidateRouteFromPins({
        selectedPins,
        purpose,
        strategy,
        targetLength: actualLength,
        templateId: `manual-pair-${pool[firstIndex].id}-${pool[secondIndex].id}`,
        description:
          "의미 있는 목적지와 보조 경유지를 연결한 뒤 출발지로 돌아오는 코스입니다.",
        startLocation,
      });

      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  const parkPins = pool.filter((pin) => pin.category === "PARK").slice(0, 8);
  const supportPins = pool
    .filter((pin) => pin.category !== "PARK")
    .slice(0, 8);

  parkPins.forEach((firstPark) => {
    supportPins.forEach((supportPin) => {
      parkPins.forEach((secondPark) => {
        if (
          firstPark.id === supportPin.id ||
          firstPark.id === secondPark.id ||
          supportPin.id === secondPark.id
        ) {
          return;
        }

        const selectedPins = [firstPark, supportPin, secondPark];

        if (!hasMeaningfulDestination(selectedPins, purpose)) {
          return;
        }

        const totalDistanceKm = getCircularRouteDistanceKm(
          startLocation,
          selectedPins
        );

        const estimatedMinutes = getEstimatedMinutes(totalDistanceKm, 3);
        const actualLength = getActualLengthType(estimatedMinutes);

        const candidate = buildCandidateRouteFromPins({
          selectedPins,
          purpose,
          strategy,
          targetLength: actualLength,
          templateId: `manual-triple-${firstPark.id}-${supportPin.id}-${secondPark.id}`,
          description:
            "의미 있는 산책 목적지와 보조 지점을 함께 연결한 뒤 출발지로 돌아오는 코스입니다.",
          startLocation,
        });

        if (candidate) {
          candidates.push(candidate);
        }
      });
    });
  });

  return candidates;
}

function removeDuplicateCandidates(
  candidates: CandidateRoute[]
): CandidateRoute[] {
  const bestCandidateBySignature = new Map<string, CandidateRoute>();

  candidates.forEach((candidate) => {
    if (candidate.pins.length === 0) {
      return;
    }

    const existingCandidate = bestCandidateBySignature.get(candidate.signature);

    if (!existingCandidate || candidate.score > existingCandidate.score) {
      bestCandidateBySignature.set(candidate.signature, candidate);
    }
  });

  return Array.from(bestCandidateBySignature.values()).sort(
    (a, b) => b.score - a.score
  );
}

function isInLengthRange(
  candidate: CandidateRoute,
  targetLength: RouteLengthType
): boolean {
  const config = LENGTH_CONFIG[targetLength];

  if (targetLength === "SHORT") {
    return candidate.estimatedMinutes <= config.maxMinutes;
  }

  if (targetLength === "MEDIUM") {
    return (
      candidate.estimatedMinutes > config.minMinutes &&
      candidate.estimatedMinutes <= config.maxMinutes
    );
  }

  return candidate.estimatedMinutes > config.minMinutes;
}

function getLengthClosenessPenalty(
  candidate: CandidateRoute,
  targetLength: RouteLengthType
): number {
  const config = LENGTH_CONFIG[targetLength];

  return Math.abs(candidate.estimatedMinutes - config.preferredMinutes) * 2.2;
}

function getDiversityPenalty(
  candidate: CandidateRoute,
  selectedRoutes: CandidateRoute[]
): number {
  const maxOverlap = getMaxOverlapWithSelected(candidate, selectedRoutes);

  const sameFirstStopPenalty = selectedRoutes.some((selectedRoute) =>
    hasSameFirstStop(candidate, selectedRoute)
  )
    ? 18
    : 0;

  const heavyOverlapPenalty = maxOverlap >= 2 ? 50 : 0;

  return maxOverlap * 35 + sameFirstStopPenalty + heavyOverlapPenalty;
}

function selectBestRouteForLength(
  candidates: CandidateRoute[],
  selectedRoutes: CandidateRoute[],
  targetLength: RouteLengthType
): CandidateRoute | null {
  const usedSignatures = new Set(
    selectedRoutes.map((route) => route.signature)
  );

  const availableCandidates = candidates.filter(
    (candidate) => !usedSignatures.has(candidate.signature)
  );

  if (availableCandidates.length === 0) {
    return null;
  }

  const exactLengthCandidates = availableCandidates.filter((candidate) =>
    isInLengthRange(candidate, targetLength)
  );

  const candidatePool =
    exactLengthCandidates.length > 0
      ? exactLengthCandidates
      : availableCandidates;

  const isFallback = exactLengthCandidates.length === 0;

  const rankedCandidates = candidatePool
    .map((candidate) => {
      const diversityPenalty = getDiversityPenalty(candidate, selectedRoutes);
      const closenessPenalty = getLengthClosenessPenalty(candidate, targetLength);
      const fallbackPenalty = isFallback ? 100 : 0;

      const adjustedScore =
        candidate.score - diversityPenalty - closenessPenalty - fallbackPenalty;

      return {
        candidate,
        adjustedScore,
      };
    })
    .sort((a, b) => {
      if (targetLength === "SHORT") {
        return (
          a.candidate.estimatedMinutes - b.candidate.estimatedMinutes ||
          b.adjustedScore - a.adjustedScore
        );
      }

      return b.adjustedScore - a.adjustedScore;
    });

  const bestCandidate = rankedCandidates[0]?.candidate;

  if (!bestCandidate) {
    return null;
  }

  return {
    ...bestCandidate,
    id: `${bestCandidate.id}-${targetLength}`,
    title: LENGTH_CONFIG[targetLength].label,
    walkingIntensity:
      targetLength === "SHORT"
        ? "가벼움"
        : targetLength === "MEDIUM"
        ? "보통"
        : "긴 코스",
  };
}

function selectOneShortOneMediumOneLong(
  candidates: CandidateRoute[]
): CandidateRoute[] {
  const uniqueCandidates = removeDuplicateCandidates(candidates);
  const selectedRoutes: CandidateRoute[] = [];

  LENGTH_ORDER.forEach((lengthType) => {
    const selectedRoute = selectBestRouteForLength(
      uniqueCandidates,
      selectedRoutes,
      lengthType
    );

    if (selectedRoute) {
      selectedRoutes.push(selectedRoute);
    }
  });

  return selectedRoutes;
}

function createFallbackRoute(purpose: Purpose): RouteResult {
  return {
    id: `${purpose}-empty-route`,
    title: "추천 가능한 루트 없음",
    purpose,
    pins: [],
    totalDistanceKm: 0,
    estimatedMinutes: 0,
    walkingIntensity: "가벼움",
    score: 0,
    description:
      "현재 조건을 만족하는 의미 있는 산책 목적지가 부족합니다. 반경을 넓히거나 실제 공원·카페·시설 데이터를 추가해 주세요.",
  };
}

function toRouteResult(candidate: CandidateRoute): RouteResult {
  const { signature, templateId, strategyId, targetLength, ...route } =
    candidate;

  void signature;
  void templateId;
  void strategyId;
  void targetLength;

  return route;
}

export function recommendRoutes(
  pins: Pin[],
  purpose: Purpose,
  startLocation: Location = DEFAULT_START_LOCATION
): RouteResult[] {
  const purposePins = filterPinsByPurpose(pins, purpose);
  const templates = PURPOSE_ROUTE_TEMPLATES[purpose];
  const candidates: CandidateRoute[] = [];

  if (purposePins.length === 0) {
    return [createFallbackRoute(purpose)];
  }

  STRATEGIES.forEach((strategy) => {
    templates.forEach((template) => {
      RANK_OFFSETS.forEach((rankOffset) => {
        const candidate = buildTemplateCandidateRoute(
          purposePins,
          purpose,
          strategy,
          template,
          startLocation,
          rankOffset
        );

        if (candidate) {
          candidates.push(candidate);
        }
      });
    });

    candidates.push(
      ...buildManualCandidates(purposePins, purpose, strategy, startLocation)
    );
  });

  const selectedRoutes = selectOneShortOneMediumOneLong(candidates);

  if (selectedRoutes.length === 0) {
    return [createFallbackRoute(purpose)];
  }

  return selectedRoutes.map(toRouteResult);
}