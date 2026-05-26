import type { DogConditionFilters, Location, Pin, Purpose } from "../types";
import type { RadiusFilterValue } from "../components/RadiusFilter";
import type { RegionFilterValue } from "../components/RegionFilter";

export type AiRouteCandidatePin = {
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

export type AiRouteRecommendation = {
  title: string;
  summary: string;
  selectedPinIds: string[];
  reasons: string[];
  warnings: string[];
  confidenceScore: number;
};

type AiRouteRequest = {
  userRequest: string;
  purpose: Purpose;
  region: RegionFilterValue;
  radius: RadiusFilterValue;
  startLocation: Location;
  dogFilters: DogConditionFilters;
  candidatePins: AiRouteCandidatePin[];
};

function getRadiusText(radius: RadiusFilterValue) {
  if (radius === "ALL") {
    return "전체";
  }

  if (radius < 1) {
    return `${radius * 1000}m`;
  }

  return `${radius}km`;
}

export function convertPinToAiCandidate(pin: Pin): AiRouteCandidatePin {
  return {
    id: pin.id,
    name: pin.name,
    category: pin.category,
    lat: pin.lat,
    lng: pin.lng,
    address: pin.address,
    description: pin.description,
    notes: pin.notes,
    dogFriendlyScore: pin.dogFriendlyScore,
    routePriorityScore: pin.routePriorityScore,
    accessibilityScore: pin.accessibilityScore,
    safetyScore: pin.safetyScore,
  };
}

export async function requestAiRouteRecommendation(
  request: AiRouteRequest
): Promise<AiRouteRecommendation> {
  const response = await fetch("/api/ai-route-recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...request,
      radius: getRadiusText(request.radius),
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail || data?.message || "AI 루트 추천 요청에 실패했습니다.";

    throw new Error(message);
  }

  return data as AiRouteRecommendation;
}