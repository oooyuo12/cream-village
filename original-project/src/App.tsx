import { useCallback, useEffect, useMemo, useState } from "react";
import AiRoutePanel from "./components/AiRoutePanel";
import CategoryFilter from "./components/CategoryFilter";
import CurrentLocationControl from "./components/CurrentLocationControl";
import DogConditionFilter from "./components/DogConditionFilter";
import MapLegend from "./components/MapLegend";
import MapView from "./components/MapView";
import PurposeSelector from "./components/PurposeSelector";
import RadiusFilter, {
  type RadiusFilterValue,
} from "./components/RadiusFilter";
import RegionFilter, {
  type RegionFilterValue,
} from "./components/RegionFilter";
import RouteCard from "./components/RouteCard";
import RouteDirectionsPanel from "./components/RouteDirectionsPanel";
import SearchBox from "./components/SearchBox";
import StartPointSelector, {
  type StartPointMode,
} from "./components/StartPointSelector";
import { pins } from "./data/pins";
import type {
  DogConditionFilters,
  DogSize,
  Location,
  Pin,
  PinCategory,
  Purpose,
  RouteResult,
} from "./types";
import {
  convertPinToAiCandidate,
  requestAiRouteRecommendation,
  type AiRouteRecommendation,
} from "./utils/aiRouteClient";
import { getRouteDistanceKm } from "./utils/distance";
import { recommendRoutes } from "./utils/routeRecommend";
import {
  fetchWalkingRoute,
  type WalkingRouteResult,
} from "./utils/walkingRoute";

type LocationStatus = "idle" | "loading" | "success" | "error";
type WalkingRouteStatus = "idle" | "loading" | "success" | "error";
type AiRouteStatus = "idle" | "loading" | "success" | "error";

const DEFAULT_LOCATION: Location = {
  lat: 37.4509,
  lng: 127.1287,
};

const REGION_DEFAULT_LOCATION: Record<
  Exclude<RegionFilterValue, "ALL">,
  Location
> = {
  DUKYI: {
    lat: 37.6965,
    lng: 126.7585,
  },
  SEONGNAM: {
    lat: 37.4509,
    lng: 127.1287,
  },
  BUCHEON: {
    lat: 37.4625,
    lng: 126.813,
  },
};

const REGION_LABEL: Record<RegionFilterValue, string> = {
  ALL: "전체",
  DUKYI: "덕이동",
  SEONGNAM: "성남·가천대 주변",
  BUCHEON: "부천 범안로 주변",
};

const ALL_CATEGORIES: PinCategory[] = [
  "CAFE",
  "HOSPITAL",
  "PARK",
  "PET_STORE",
  "TOILET",
  "GROOMING",
];

const INITIAL_DOG_FILTERS: DogConditionFilters = {
  selectedDogSizes: [],
  indoorOnly: false,
  parkingOnly: false,
  noReservationOnly: false,
};

const CATEGORY_SEARCH_TEXT: Record<PinCategory, string> = {
  CAFE: "카페 반려동물 동반 카페 애견카페 커피",
  HOSPITAL: "동물병원 병원 진료 응급",
  PARK: "공원 산책로 산책 운동",
  PET_STORE: "용품점 반려동물 용품 사료 간식 장난감",
  TOILET: "배변시설 배변 봉투 쓰레기통",
  GROOMING: "미용 목욕 미용샵 목욕샵 그루밍",
};
const PURPOSE_ALLOWED_CATEGORIES: Record<Purpose, PinCategory[]> = {
  WALK: ["PARK", "TOILET", "CAFE"],
  HOSPITAL_VISIT: ["HOSPITAL", "TOILET", "PARK", "CAFE"],
  GROOMING: ["GROOMING", "TOILET", "PARK", "CAFE"],
  SHOPPING: ["PET_STORE", "PARK", "TOILET", "CAFE"],
  STRESS_RELIEF: ["PARK", "TOILET", "CAFE"],
};

function getDefaultLocationForRegion(region: RegionFilterValue): Location {
  if (region === "ALL") {
    return DEFAULT_LOCATION;
  }

  return REGION_DEFAULT_LOCATION[region];
}

function getPinRegion(pin: Pin): Exclude<RegionFilterValue, "ALL"> | "UNKNOWN" {
  const text = [pin.id, pin.name, pin.address ?? "", pin.description ?? ""]
    .join(" ")
    .toLowerCase();

  if (
    text.includes("dukyi") ||
    text.includes("덕이") ||
    text.includes("고양") ||
    text.includes("일산")
  ) {
    return "DUKYI";
  }

  if (
    text.includes("bucheon") ||
    text.includes("부천") ||
    text.includes("범안로") ||
    text.includes("양지남로")
  ) {
    return "BUCHEON";
  }

  if (
    text.includes("seongnam") ||
    text.includes("성남") ||
    text.includes("가천") ||
    text.includes("수정구") ||
    text.includes("중원구") ||
    text.includes("복정") ||
    text.includes("태평") ||
    text.includes("신흥") ||
    text.includes("단대") ||
    text.includes("영장") ||
    text.includes("산성")
  ) {
    return "SEONGNAM";
  }

  return "UNKNOWN";
}

function matchesRegion(pin: Pin, region: RegionFilterValue): boolean {
  if (region === "ALL") {
    return true;
  }

  return getPinRegion(pin) === region;
}

function getDistanceKm(from: Location, to: Location): number {
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

function isInsideRadius(
  pin: Pin,
  startLocation: Location,
  radius: RadiusFilterValue
): boolean {
  if (radius === "ALL") {
    return true;
  }

  const distanceKm = getDistanceKm(startLocation, {
    lat: pin.lat,
    lng: pin.lng,
  });

  return distanceKm <= radius;
}

function matchesDogFilters(pin: Pin, filters: DogConditionFilters): boolean {
  if (filters.selectedDogSizes.length > 0) {
    const allowedSizes = pin.dogSizeAllowed ?? [];

    const hasMatchingSize = filters.selectedDogSizes.some((size) =>
      allowedSizes.includes(size)
    );

    if (!hasMatchingSize) {
      return false;
    }
  }

  if (filters.indoorOnly && !pin.indoorAllowed) {
    return false;
  }

  if (filters.parkingOnly && !pin.parkingAvailable) {
    return false;
  }

  if (filters.noReservationOnly && pin.reservationRequired) {
    return false;
  }

  return true;
}

function matchesSearchQuery(pin: Pin, searchQuery: string): boolean {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    pin.name,
    pin.description ?? "",
    pin.address ?? "",
    pin.category,
    CATEGORY_SEARCH_TEXT[pin.category],
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function getWalkingRouteStatusText(status: WalkingRouteStatus) {
  if (status === "loading") {
    return "보행 경로를 계산하는 중입니다...";
  }

  if (status === "success") {
    return "보행 가능한 도로·산책로 기준으로 경로를 표시하고 있습니다.";
  }

  if (status === "error") {
    return "보행 경로 계산에 실패해 임시 직선 경로로 표시합니다.";
  }

  return "추천 루트를 선택하면 경로가 표시됩니다.";
}

function getWalkingRouteStatusStyle(status: WalkingRouteStatus) {
  if (status === "success") {
    return {
      background: "#ecfdf5",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }

  if (status === "error") {
    return {
      background: "#fef2f2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    };
  }

  if (status === "loading") {
    return {
      background: "#eff6ff",
      color: "#1e40af",
      border: "1px solid #bfdbfe",
    };
  }

  return {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #e2e8f0",
  };
}

function getRadiusLabel(radius: RadiusFilterValue) {
  if (radius === "ALL") {
    return "전체";
  }

  if (radius < 1) {
    return `${radius * 1000}m`;
  }

  return `${radius}km`;
}

function getEstimatedMinutes(totalDistanceKm: number, pinCount: number) {
  const averageDogWalkingSpeedKmh = 3.5;
  const movingMinutes = (totalDistanceKm / averageDogWalkingSpeedKmh) * 60;
  const stopMinutes = pinCount * 3;

  return Math.max(5, Math.round(movingMinutes + stopMinutes));
}

function getWalkingIntensity(totalDistanceKm: number) {
  if (totalDistanceKm <= 1.2) {
    return "가벼움";
  }

  if (totalDistanceKm <= 2.8) {
    return "보통";
  }

  return "긴 코스";
}

function createAiRouteResult(
  aiResult: AiRouteRecommendation,
  selectedPins: Pin[],
  purpose: Purpose,
  startLocation: Location
): RouteResult {
  const totalDistanceKm = getRouteDistanceKm([
  startLocation,
  ...selectedPins.map((pin) => ({
    lat: pin.lat,
    lng: pin.lng,
  })),
  startLocation,
]);

  return {
    id: `ai-route-${Date.now()}`,
    title: aiResult.title || "AI 맞춤 루트",
    purpose,
    pins: selectedPins,
    totalDistanceKm,
    estimatedMinutes: getEstimatedMinutes(totalDistanceKm, selectedPins.length),
    walkingIntensity: getWalkingIntensity(totalDistanceKm),
    score: aiResult.confidenceScore,
    description: aiResult.summary,
  };
}

export default function App() {
  const [selectedRegion, setSelectedRegion] =
    useState<RegionFilterValue>("SEONGNAM");

  const [selectedCategories, setSelectedCategories] =
    useState<PinCategory[]>(ALL_CATEGORIES);

  const [selectedPurpose, setSelectedPurpose] = useState<Purpose>("WALK");
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dogFilters, setDogFilters] =
    useState<DogConditionFilters>(INITIAL_DOG_FILTERS);

  const [selectedRadius, setSelectedRadius] =
    useState<RadiusFilterValue>(2);

  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<Location>(
    getDefaultLocationForRegion("SEONGNAM")
  );
  const [mapViewCenter, setMapViewCenter] = useState<Location>(
    getDefaultLocationForRegion("SEONGNAM")
  );
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>("idle");

  const [startPointMode, setStartPointMode] =
    useState<StartPointMode>("DEFAULT");
  const [selectedStartPinId, setSelectedStartPinId] = useState("");
  const [customStartLocation, setCustomStartLocation] =
    useState<Location | null>(null);

  const [walkingRouteResult, setWalkingRouteResult] =
    useState<WalkingRouteResult | null>(null);

  const [walkingRouteStatus, setWalkingRouteStatus] =
    useState<WalkingRouteStatus>("idle");

  const [aiUserRequest, setAiUserRequest] = useState("");
  const [aiRouteStatus, setAiRouteStatus] =
    useState<AiRouteStatus>("idle");
  const [aiRouteError, setAiRouteError] = useState("");
  const [aiRouteResponse, setAiRouteResponse] =
    useState<AiRouteRecommendation | null>(null);
  const [aiRouteResult, setAiRouteResult] =
    useState<RouteResult | null>(null);

  const selectedStartPin = useMemo(() => {
    return pins.find((pin) => pin.id === selectedStartPinId) ?? null;
  }, [selectedStartPinId]);

  const regionDefaultLocation = useMemo(() => {
    return getDefaultLocationForRegion(selectedRegion);
  }, [selectedRegion]);

  const routeStartLocation = useMemo<Location>(() => {
    if (startPointMode === "CUSTOM" && customStartLocation) {
      return customStartLocation;
    }

    if (startPointMode === "PIN" && selectedStartPin) {
      return {
        lat: selectedStartPin.lat,
        lng: selectedStartPin.lng,
      };
    }

    if (startPointMode === "CURRENT" && userLocation) {
      return userLocation;
    }

    return regionDefaultLocation;
  }, [
    startPointMode,
    customStartLocation,
    selectedStartPin,
    userLocation,
    regionDefaultLocation,
  ]);

  const regionFilteredPins = useMemo(() => {
    return pins.filter((pin) => matchesRegion(pin, selectedRegion));
  }, [selectedRegion]);

  const startPins = useMemo(() => {
    return [...regionFilteredPins].sort((a, b) =>
      a.name.localeCompare(b.name, "ko")
    );
  }, [regionFilteredPins]);

  const radiusFilteredPins = useMemo(() => {
    return regionFilteredPins.filter((pin) =>
      isInsideRadius(pin, routeStartLocation, selectedRadius)
    );
  }, [regionFilteredPins, routeStartLocation, selectedRadius]);

  const routeCandidatePins = useMemo(() => {
    return radiusFilteredPins.filter((pin) => {
      if (!matchesDogFilters(pin, dogFilters)) {
        return false;
      }

      if (startPointMode === "PIN" && pin.id === selectedStartPinId) {
        return false;
      }

      return true;
    });
  }, [radiusFilteredPins, dogFilters, startPointMode, selectedStartPinId]);

const aiCandidatePins = useMemo(() => {
  const allowedCategories = PURPOSE_ALLOWED_CATEGORIES[selectedPurpose];

  return routeCandidatePins.filter((pin) => {
    if (!selectedCategories.includes(pin.category)) {
      return false;
    }

    return allowedCategories.includes(pin.category);
  });
}, [routeCandidatePins, selectedCategories, selectedPurpose]);

  const visiblePins = useMemo(() => {
    return routeCandidatePins.filter((pin) => {
      const isCategorySelected = selectedCategories.includes(pin.category);

      if (!isCategorySelected) {
        return false;
      }

      return matchesSearchQuery(pin, searchQuery);
    });
  }, [routeCandidatePins, selectedCategories, searchQuery]);

  const routeOptions = useMemo(() => {
    return recommendRoutes(
      routeCandidatePins,
      selectedPurpose,
      routeStartLocation
    );
  }, [routeCandidatePins, selectedPurpose, routeStartLocation]);

  const algorithmSelectedRoute = routeOptions[selectedRouteIndex] ?? routeOptions[0];
  const selectedRoute = aiRouteResult ?? algorithmSelectedRoute;

  const walkingRoutePath = walkingRouteResult?.path ?? null;
  const walkingRouteSegments = walkingRouteResult?.segments ?? [];

  const isRouteIncomplete = selectedRoute.pins.length === 0;

  const handleMapCenterChange = useCallback((nextCenter: Location) => {
    setMapViewCenter(nextCenter);
  }, []);

  const clearAiRoute = useCallback(() => {
    setAiRouteResult(null);
    setAiRouteResponse(null);
    setAiRouteError("");
    setAiRouteStatus("idle");
  }, []);

  useEffect(() => {
    setSelectedRouteIndex(0);
    clearAiRoute();
  }, [
    selectedPurpose,
    dogFilters,
    userLocation,
    startPointMode,
    selectedStartPinId,
    customStartLocation,
    selectedRadius,
    selectedRegion,
    clearAiRoute,
  ]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserLocation(nextLocation);
        setMapCenter(nextLocation);
        setMapViewCenter(nextLocation);
        setLocationStatus("success");
      },
      () => {
        setLocationStatus("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  useEffect(() => {
    handleUseCurrentLocation();
  }, [handleUseCurrentLocation]);

  const handleChangeRegion = (region: RegionFilterValue) => {
    const nextLocation = getDefaultLocationForRegion(region);

    setSelectedRegion(region);
    setSelectedRouteIndex(0);
    setSelectedStartPinId("");
    setCustomStartLocation(null);
    setStartPointMode("DEFAULT");
    setMapCenter(nextLocation);
    setMapViewCenter(nextLocation);
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadWalkingRoute() {
      if (!selectedRoute || selectedRoute.pins.length === 0) {
        setWalkingRouteResult(null);
        setWalkingRouteStatus("idle");
        return;
      }

      try {
        setWalkingRouteStatus("loading");

        const result = await fetchWalkingRoute(
          routeStartLocation,
          selectedRoute.pins
        );

        if (!isCancelled) {
          setWalkingRouteResult(result);
          setWalkingRouteStatus("success");
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setWalkingRouteResult(null);
          setWalkingRouteStatus("error");
        }
      }
    }

    loadWalkingRoute();

    return () => {
      isCancelled = true;
    };
  }, [selectedRoute, routeStartLocation]);

  const handleGenerateAiRoute = async () => {
    if (aiCandidatePins.length < 2) {
      setAiRouteStatus("error");
      setAiRouteError("AI 루트를 만들 후보 핀이 부족합니다. 반경을 넓히거나 필터를 완화하세요.");
      return;
    }

    try {
      setAiRouteStatus("loading");
      setAiRouteError("");

      const response = await requestAiRouteRecommendation({
        userRequest: aiUserRequest,
        purpose: selectedPurpose,
        region: selectedRegion,
        radius: selectedRadius,
        startLocation: routeStartLocation,
        dogFilters,
        candidatePins: aiCandidatePins.map(convertPinToAiCandidate),
      });

      const pinMap = new Map(aiCandidatePins.map((pin) => [pin.id, pin]));

      const selectedPins = response.selectedPinIds
        .map((pinId) => pinMap.get(pinId))
        .filter((pin): pin is Pin => Boolean(pin));

      if (selectedPins.length === 0) {
        throw new Error("AI가 선택한 핀이 현재 후보 목록에 없습니다.");
      }

      const nextAiRoute = createAiRouteResult(
        response,
        selectedPins,
        selectedPurpose,
        routeStartLocation
      );

      setAiRouteResponse(response);
      setAiRouteResult(nextAiRoute);
      setAiRouteStatus("success");
    } catch (error) {
      console.error(error);

      setAiRouteStatus("error");
      setAiRouteError(
        error instanceof Error
          ? error.message
          : "AI 루트 추천 중 알 수 없는 오류가 발생했습니다."
      );
    }
  };

  const handleChangeStartPointMode = (mode: StartPointMode) => {
    setStartPointMode(mode);

    if (mode === "CURRENT") {
      if (userLocation) {
        setMapCenter(userLocation);
        setMapViewCenter(userLocation);
      } else {
        handleUseCurrentLocation();
      }
    }

    if (mode === "DEFAULT") {
      setCustomStartLocation(null);
      setSelectedStartPinId("");
      setMapCenter(regionDefaultLocation);
      setMapViewCenter(regionDefaultLocation);
    }

    if (mode === "PIN" && selectedStartPin) {
      const nextLocation = {
        lat: selectedStartPin.lat,
        lng: selectedStartPin.lng,
      };

      setMapCenter(nextLocation);
      setMapViewCenter(nextLocation);
    }
  };

  const handleChangeStartPin = (pinId: string) => {
    setSelectedStartPinId(pinId);

    const nextPin = pins.find((pin) => pin.id === pinId);

    if (nextPin) {
      const nextLocation = {
        lat: nextPin.lat,
        lng: nextPin.lng,
      };

      setStartPointMode("PIN");
      setCustomStartLocation(null);
      setMapCenter(nextLocation);
      setMapViewCenter(nextLocation);
    }
  };

  const handleSetStartToMapCenter = () => {
    setCustomStartLocation(mapViewCenter);
    setStartPointMode("CUSTOM");
    setSelectedStartPinId("");
    setMapCenter(mapViewCenter);
  };

  const handleSetStartToCurrentLocation = () => {
    if (userLocation) {
      setCustomStartLocation(userLocation);
      setStartPointMode("CUSTOM");
      setSelectedStartPinId("");
      setMapCenter(userLocation);
      setMapViewCenter(userLocation);
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserLocation(nextLocation);
        setCustomStartLocation(nextLocation);
        setStartPointMode("CUSTOM");
        setSelectedStartPinId("");
        setMapCenter(nextLocation);
        setMapViewCenter(nextLocation);
        setLocationStatus("success");
      },
      () => {
        setLocationStatus("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleToggleCategory = (category: PinCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((item) => item !== category);
      }

      return [...prev, category];
    });
  };

  const handleSelectAll = () => {
    setSelectedCategories(ALL_CATEGORIES);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
  };

  const handleToggleDogSize = (size: DogSize) => {
    setDogFilters((prev) => {
      if (prev.selectedDogSizes.includes(size)) {
        return {
          ...prev,
          selectedDogSizes: prev.selectedDogSizes.filter(
            (item) => item !== size
          ),
        };
      }

      return {
        ...prev,
        selectedDogSizes: [...prev.selectedDogSizes, size],
      };
    });
  };

  const handleToggleIndoorOnly = () => {
    setDogFilters((prev) => ({
      ...prev,
      indoorOnly: !prev.indoorOnly,
    }));
  };

  const handleToggleParkingOnly = () => {
    setDogFilters((prev) => ({
      ...prev,
      parkingOnly: !prev.parkingOnly,
    }));
  };

  const handleToggleNoReservationOnly = () => {
    setDogFilters((prev) => ({
      ...prev,
      noReservationOnly: !prev.noReservationOnly,
    }));
  };

  const handleClearDogFilters = () => {
    setDogFilters(INITIAL_DOG_FILTERS);
  };

  const walkingRouteStatusStyle =
    getWalkingRouteStatusStyle(walkingRouteStatus);

  return (
<main
  style={{
    padding: "clamp(12px, 3vw, 24px)",
    maxWidth: "1000px",
    margin: "0 auto",
    boxSizing: "border-box",
  }}
>
      <h1>반려견 외출 루트 추천 지도</h1>

      <p>
        외출 목적과 반려견 조건을 선택하면 조건에 맞는 장소를 조합해 추천
        루트를 표시합니다.
      </p>

      <CurrentLocationControl
        status={locationStatus}
        onUseCurrentLocation={handleUseCurrentLocation}
      />

      <RegionFilter
        selectedRegion={selectedRegion}
        onChange={handleChangeRegion}
      />

      <StartPointSelector
        mode={startPointMode}
        pins={startPins}
        selectedPinId={selectedStartPinId}
        customStartLocation={customStartLocation}
        onChangeMode={handleChangeStartPointMode}
        onChangePin={handleChangeStartPin}
        onSetStartToMapCenter={handleSetStartToMapCenter}
        onSetStartToCurrentLocation={handleSetStartToCurrentLocation}
      />

      <RadiusFilter
        selectedRadius={selectedRadius}
        onChange={setSelectedRadius}
      />

      <PurposeSelector
        selectedPurpose={selectedPurpose}
        onChange={setSelectedPurpose}
      />

      <SearchBox searchQuery={searchQuery} onChange={setSearchQuery} />

      <CategoryFilter
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />

      <DogConditionFilter
        filters={dogFilters}
        onToggleDogSize={handleToggleDogSize}
        onToggleIndoorOnly={handleToggleIndoorOnly}
        onToggleParkingOnly={handleToggleParkingOnly}
        onToggleNoReservationOnly={handleToggleNoReservationOnly}
        onClear={handleClearDogFilters}
      />

      <AiRoutePanel
        userRequest={aiUserRequest}
        onChangeUserRequest={setAiUserRequest}
        status={aiRouteStatus}
        errorMessage={aiRouteError}
        result={aiRouteResponse}
        route={aiRouteResult}
        candidateCount={aiCandidatePins.length}
        onGenerate={handleGenerateAiRoute}
        onClear={clearAiRoute}
      />

      <MapLegend />

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          margin: "12px 0",
          color: "#111827",
        }}
      >
        <span
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            background: "#ede9fe",
            color: "#5b21b6",
            fontWeight: 700,
          }}
        >
          선택 지역 {REGION_LABEL[selectedRegion]} ·{" "}
          {regionFilteredPins.length}개
        </span>

        <span
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            background: "#f3f4f6",
            fontWeight: 700,
          }}
        >
          반경 {getRadiusLabel(selectedRadius)} 내 장소{" "}
          {radiusFilteredPins.length}개
        </span>

        <span
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            background: "#f8fafc",
            color: "#111827",
            fontWeight: 700,
          }}
        >
          현재 표시 중인 장소 {visiblePins.length}개
        </span>

        <span
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            background: "#dbeafe",
            color: "#1e40af",
            fontWeight: 700,
          }}
        >
          추천 계산 가능 장소 {routeCandidatePins.length}개
        </span>

        {aiRouteResult && (
          <span
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              background: "#f5f3ff",
              color: "#6d28d9",
              fontWeight: 700,
            }}
          >
            AI 맞춤 루트 적용 중
          </span>
        )}
      </div>

      <section
        style={{
          margin: "12px 0",
          padding: "12px",
          borderRadius: "12px",
          background: walkingRouteStatusStyle.background,
          color: walkingRouteStatusStyle.color,
          border: walkingRouteStatusStyle.border,
          fontWeight: 700,
        }}
      >
        {getWalkingRouteStatusText(walkingRouteStatus)}
      </section>

      <MapView
        pins={visiblePins}
        routePins={selectedRoute.pins}
        center={mapCenter}
        userLocation={userLocation}
        routeStartLocation={routeStartLocation}
        walkingRoutePath={walkingRoutePath}
        walkingRouteSegments={walkingRouteSegments}
        onMapCenterChange={handleMapCenterChange}
      />

      <RouteDirectionsPanel
        status={walkingRouteStatus}
        route={walkingRouteResult}
      />

      {visiblePins.length === 0 && (
        <section
          style={{
            marginTop: "16px",
            padding: "16px",
            borderRadius: "12px",
            background: "#fff7ed",
            color: "#9a3412",
            border: "1px solid #fed7aa",
            fontWeight: 700,
          }}
        >
          조건에 맞는 장소가 없습니다. 지역, 반경, 검색어, 필터 조건을 다시
          확인하세요.
        </section>
      )}

      {isRouteIncomplete && (
        <section
          style={{
            marginTop: "16px",
            padding: "16px",
            borderRadius: "12px",
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            fontWeight: 700,
          }}
        >
          현재 지역, 반경, 반려견 조건을 만족하는 장소가 부족해서 추천 루트를
          구성할 수 없습니다. 지역을 바꾸거나 반경을 넓히고 조건을 완화해
          주세요.
        </section>
      )}

      <section style={{ marginTop: "20px" }}>
        <h2>추천 루트 3개</h2>
        <p>카드를 클릭하면 AI 루트를 해제하고 해당 추천 루트가 지도에 표시됩니다.</p>

        {routeOptions.map((route, index) => (
          <RouteCard
            key={route.id}
            route={route}
            isSelected={!aiRouteResult && selectedRouteIndex === index}
            onSelect={() => {
              clearAiRoute();
              setSelectedRouteIndex(index);
            }}
          />
        ))}
      </section>
    </main>
  );
}