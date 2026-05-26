import type { Location, Pin } from "../types";

export type MapPath = [number, number][];

export type WalkingRouteStep = {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
};

export type WalkingRouteSegment = {
  id: string;
  title: string;
  from: string;
  to: string;
  distanceMeters: number;
  durationSeconds: number;
  path: MapPath;
  steps: WalkingRouteStep[];
};

export type WalkingRouteResult = {
  path: MapPath;
  distanceMeters: number;
  durationSeconds: number;
  segments: WalkingRouteSegment[];
};

type OrsCoordinate = [number, number];

type OpenRouteServiceGeoJsonResponse = {
  features?: Array<{
    geometry?: {
      coordinates?: OrsCoordinate[];
    };
    properties?: {
      summary?: {
        distance: number;
        duration: number;
      };
      segments?: Array<{
        distance: number;
        duration: number;
        steps?: Array<{
          instruction: string;
          distance: number;
          duration: number;
          way_points?: [number, number];
        }>;
      }>;
    };
  }>;
};

class OpenRouteServiceError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`OpenRouteService request failed: ${status} ${body}`);
    this.status = status;
    this.body = body;
  }
}

function convertCoordinatesToPath(coordinates: OrsCoordinate[]): MapPath {
  return coordinates.map(([lng, lat]) => [lat, lng]);
}

function getDistanceMeters(from: Location, to: Location): number {
  const earthRadiusMeters = 6371000;

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

  return earthRadiusMeters * c;
}

function estimateWalkingDurationSeconds(distanceMeters: number): number {
  const walkingSpeedMetersPerSecond = 1.1;
  return Math.max(60, distanceMeters / walkingSpeedMetersPerSecond);
}

function getSegmentPath(
  routeCoordinates: OrsCoordinate[],
  segment: {
    steps?: Array<{
      way_points?: [number, number];
    }>;
  }
): MapPath {
  if (!segment.steps || segment.steps.length === 0) {
    return [];
  }

  const firstWayPoint = segment.steps[0]?.way_points?.[0];
  const lastWayPoint = segment.steps[segment.steps.length - 1]?.way_points?.[1];

  if (
    firstWayPoint === undefined ||
    lastWayPoint === undefined ||
    firstWayPoint < 0 ||
    lastWayPoint < firstWayPoint
  ) {
    return [];
  }

  const segmentCoordinates = routeCoordinates.slice(
    firstWayPoint,
    lastWayPoint + 1
  );

  return convertCoordinatesToPath(segmentCoordinates);
}

async function requestWalkingRoute(
  coordinates: OrsCoordinate[]
): Promise<OpenRouteServiceGeoJsonResponse> {
  const apiKey = import.meta.env.VITE_ORS_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouteService API key is missing.");
  }

  const response = await fetch(
    "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
    {
      method: "POST",
      headers: {
        Authorization: apiKey,
        Accept: "application/json, application/geo+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates,
        instructions: true,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error("OpenRouteService error:", response.status, errorText);

    throw new OpenRouteServiceError(response.status, errorText);
  }

  return (await response.json()) as OpenRouteServiceGeoJsonResponse;
}

function shouldFallbackToSegmentRouting(error: unknown): boolean {
  if (!(error instanceof OpenRouteServiceError)) {
    return false;
  }

  if (error.status === 401 || error.status === 403 || error.status === 429) {
    return false;
  }

  return true;
}

function createFallbackSegment(
  index: number,
  fromName: string,
  toName: string,
  fromLocation: Location,
  toLocation: Location
): WalkingRouteSegment {
  const distanceMeters = getDistanceMeters(fromLocation, toLocation);
  const durationSeconds = estimateWalkingDurationSeconds(distanceMeters);

  return {
    id: `segment-${index + 1}`,
    title: `${index + 1}구간`,
    from: fromName,
    to: toName,
    distanceMeters,
    durationSeconds,
    path: [
      [fromLocation.lat, fromLocation.lng],
      [toLocation.lat, toLocation.lng],
    ],
    steps: [
      {
        instruction:
          "이 구간은 보행 경로 계산에 실패해 임시 직선 경로로 표시합니다.",
        distanceMeters,
        durationSeconds,
      },
    ],
  };
}

function getSegmentFromName(index: number, routePins: Pin[]): string {
  if (index === 0) {
    return "출발 지점";
  }

  return routePins[index - 1]?.name ?? `${index}번 지점`;
}

function getSegmentToName(index: number, routePins: Pin[]): string {
  if (index < routePins.length) {
    return routePins[index]?.name ?? `${index + 1}번 지점`;
  }

  return "출발 지점 복귀";
}

function buildResultFromSingleRoute(
  data: OpenRouteServiceGeoJsonResponse,
  routePins: Pin[]
): WalkingRouteResult {
  const feature = data.features?.[0];

  const routeCoordinates = feature?.geometry?.coordinates ?? [];
  const path = convertCoordinatesToPath(routeCoordinates);

  const summary = feature?.properties?.summary;
  const rawSegments = feature?.properties?.segments ?? [];

  const segments: WalkingRouteSegment[] = rawSegments.map((segment, index) => {
    const from = getSegmentFromName(index, routePins);
    const to = getSegmentToName(index, routePins);

    const segmentPath = getSegmentPath(routeCoordinates, segment);

    return {
      id: `segment-${index + 1}`,
      title: `${index + 1}구간`,
      from,
      to,
      distanceMeters: segment.distance,
      durationSeconds: segment.duration,
      path: segmentPath.length >= 2 ? segmentPath : path,
      steps:
        segment.steps?.map((step) => ({
          instruction: step.instruction,
          distanceMeters: step.distance,
          durationSeconds: step.duration,
        })) ?? [],
    };
  });

  return {
    path,
    distanceMeters: summary?.distance ?? 0,
    durationSeconds: summary?.duration ?? 0,
    segments,
  };
}

async function fetchSegmentedWalkingRoute(
  startLocation: Location,
  routePins: Pin[]
): Promise<WalkingRouteResult> {
  const points: Array<{
    name: string;
    location: Location;
  }> = [
    {
      name: "출발 지점",
      location: startLocation,
    },
    ...routePins.map((pin) => ({
      name: pin.name,
      location: {
        lat: pin.lat,
        lng: pin.lng,
      },
    })),
    {
      name: "출발 지점 복귀",
      location: startLocation,
    },
  ];

  const segments: WalkingRouteSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];

    try {
      const data = await requestWalkingRoute([
        [from.location.lng, from.location.lat],
        [to.location.lng, to.location.lat],
      ]);

      const feature = data.features?.[0];
      const routeCoordinates = feature?.geometry?.coordinates ?? [];
      const path = convertCoordinatesToPath(routeCoordinates);
      const summary = feature?.properties?.summary;
      const rawSegment = feature?.properties?.segments?.[0];

      const fallbackDistanceMeters = getDistanceMeters(
        from.location,
        to.location
      );

      segments.push({
        id: `segment-${index + 1}`,
        title: `${index + 1}구간`,
        from: from.name,
        to: to.name,
        distanceMeters:
          rawSegment?.distance ?? summary?.distance ?? fallbackDistanceMeters,
        durationSeconds:
          rawSegment?.duration ??
          summary?.duration ??
          estimateWalkingDurationSeconds(fallbackDistanceMeters),
        path:
          path.length >= 2
            ? path
            : [
                [from.location.lat, from.location.lng],
                [to.location.lat, to.location.lng],
              ],
        steps:
          rawSegment?.steps?.map((step) => ({
            instruction: step.instruction,
            distanceMeters: step.distance,
            durationSeconds: step.duration,
          })) ?? [],
      });
    } catch (error) {
      if (
        error instanceof OpenRouteServiceError &&
        (error.status === 401 || error.status === 403 || error.status === 429)
      ) {
        throw error;
      }

      console.warn(
        `${index + 1}구간 보행 경로 계산 실패. 임시 직선 경로로 대체합니다.`,
        error
      );

      segments.push(
        createFallbackSegment(
          index,
          from.name,
          to.name,
          from.location,
          to.location
        )
      );
    }
  }

  const path = segments.flatMap((segment, index) => {
    if (index === 0) {
      return segment.path;
    }

    return segment.path.slice(1);
  });

  const distanceMeters = segments.reduce(
    (sum, segment) => sum + segment.distanceMeters,
    0
  );

  const durationSeconds = segments.reduce(
    (sum, segment) => sum + segment.durationSeconds,
    0
  );

  return {
    path,
    distanceMeters,
    durationSeconds,
    segments,
  };
}

export async function fetchWalkingRoute(
  startLocation: Location,
  routePins: Pin[]
): Promise<WalkingRouteResult> {
  if (routePins.length === 0) {
    return {
      path: [],
      distanceMeters: 0,
      durationSeconds: 0,
      segments: [],
    };
  }

  const coordinates: OrsCoordinate[] = [
    [startLocation.lng, startLocation.lat],
    ...routePins.map((pin) => [pin.lng, pin.lat] as OrsCoordinate),
    [startLocation.lng, startLocation.lat],
  ];

  try {
    const data = await requestWalkingRoute(coordinates);
    return buildResultFromSingleRoute(data, routePins);
  } catch (error) {
    if (!shouldFallbackToSegmentRouting(error)) {
      throw error;
    }

    console.warn(
      "전체 왕복 경로 계산 실패. 구간별 경로 계산으로 전환합니다.",
      error
    );

    return fetchSegmentedWalkingRoute(startLocation, routePins);
  }
}