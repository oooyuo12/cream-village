import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Location, Pin, PinCategory } from "../types";
import type { WalkingRouteSegment } from "../utils/walkingRoute";

type MapViewProps = {
  pins: Pin[];
  routePins: Pin[];
  center: Location;
  userLocation: Location | null;
  routeStartLocation: Location;
  walkingRoutePath: [number, number][] | null;
  walkingRouteSegments: WalkingRouteSegment[];
  onMapCenterChange: (center: Location) => void;
};

type LeafletCluster = {
  getChildCount: () => number;
};

const CATEGORY_INFO: Record<
  PinCategory,
  {
    label: string;
    color: string;
    emoji: string;
  }
> = {
  CAFE: {
    label: "반려동물 동반 카페",
    color: "#8B5E3C",
    emoji: "☕",
  },
  HOSPITAL: {
    label: "동물병원",
    color: "#E53935",
    emoji: "🏥",
  },
  PARK: {
    label: "산책로·공원",
    color: "#43A047",
    emoji: "🌳",
  },
  PET_STORE: {
    label: "반려동물 용품점",
    color: "#8E24AA",
    emoji: "🛒",
  },
  TOILET: {
    label: "배변시설",
    color: "#1E88E5",
    emoji: "🚮",
  },
  GROOMING: {
    label: "미용·목욕샵",
    color: "#D81B60",
    emoji: "✂️",
  },
};

const SEGMENT_STYLES = [
  {
    color: "#f97316",
    dashArray: undefined,
  },
  {
    color: "#2563eb",
    dashArray: "10 8",
  },
  {
    color: "#e11d48",
    dashArray: "4 8",
  },
  {
    color: "#7c3aed",
    dashArray: "12 6 4 6",
  },
];

const DIRECTION_BADGE_OFFSETS = [
  { x: 16, y: -18 },
  { x: -18, y: -24 },
  { x: 20, y: 12 },
  { x: -22, y: 14 },
];

const MIN_DIRECTION_BADGE_SEGMENT_KM = 0.08;

function createCategoryIcon(category: PinCategory, isRoutePin = false) {
  const info = CATEGORY_INFO[category];

  const size = isRoutePin ? 32 : 34;
  const fontSize = isRoutePin ? 16 : 17;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        background: ${info.color};
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 7px rgba(0,0,0,0.38);
      ">
        <span style="
          transform: rotate(45deg);
          font-size: ${fontSize}px;
          line-height: 1;
        ">
          ${info.emoji}
        </span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function createClusterCustomIcon(cluster: LeafletCluster) {
  const count = cluster.getChildCount();

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 46px;
        height: 46px;
        border-radius: 999px;
        background: #2563eb;
        color: #ffffff;
        border: 4px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 17px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.45);
      ">
        ${count}
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
}

const userLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #2563eb;
      border: 4px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "></div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

function createStartIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        min-width: 52px;
        height: 34px;
        padding: 0 10px;
        border-radius: 999px;
        background: #111827;
        color: #ffffff;
        border: 3px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.45);
        white-space: nowrap;
      ">
        출발
      </div>
    `,
    iconSize: [58, 34],
    iconAnchor: [29, 17],
    popupAnchor: [0, -18],
  });
}

function createRouteOrderBadgeIcon(order: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        transform: translate(13px, -44px);
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: #e11d48;
        color: #ffffff;
        border: 3px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.38);
        pointer-events: auto;
      ">
        ${order}
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
    popupAnchor: [24, -48],
  });
}

function getBearingDegree(from: Location, to: Location): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function createDirectionBadgeIcon({
  degree,
  color,
  order,
  offsetIndex,
}: {
  degree: number;
  color: string;
  order: number;
  offsetIndex: number;
}) {
  const offset =
    DIRECTION_BADGE_OFFSETS[offsetIndex % DIRECTION_BADGE_OFFSETS.length];

  return L.divIcon({
    className: "",
    html: `
      <div style="
        transform: translate(${offset.x}px, ${offset.y}px);
        min-width: 38px;
        height: 26px;
        padding: 0 7px;
        border-radius: 999px;
        background: #ffffff;
        color: ${color};
        border: 2px solid ${color};
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        font-size: 12px;
        font-weight: 900;
        box-shadow: 0 3px 10px rgba(0,0,0,0.30);
        white-space: nowrap;
      ">
        <span>${order}</span>
        <span style="
          display: inline-block;
          transform: rotate(${degree - 90}deg);
          font-size: 13px;
          line-height: 1;
        ">
          ➤
        </span>
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });
}

function toLocation(point: [number, number]): Location {
  return {
    lat: point[0],
    lng: point[1],
  };
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

function getPathDistanceKm(path: [number, number][]) {
  let totalDistanceKm = 0;

  for (let index = 0; index < path.length - 1; index += 1) {
    totalDistanceKm += getDistanceKm(toLocation(path[index]), toLocation(path[index + 1]));
  }

  return totalDistanceKm;
}

function getPointAtRatio(path: [number, number][], ratio: number) {
  if (path.length < 2) {
    return null;
  }

  const targetIndex = Math.max(
    0,
    Math.min(path.length - 2, Math.floor((path.length - 1) * ratio))
  );

  const from = toLocation(path[targetIndex]);
  const to = toLocation(path[targetIndex + 1]);

  return {
    position: {
      lat: (from.lat + to.lat) / 2,
      lng: (from.lng + to.lng) / 2,
    },
    degree: getBearingDegree(from, to),
  };
}

function createDirectionMarkersFromPath(routePath: [number, number][]) {
  if (routePath.length < 2) {
    return [];
  }

  const pathDistanceKm = getPathDistanceKm(routePath);

  if (pathDistanceKm < MIN_DIRECTION_BADGE_SEGMENT_KM) {
    return [];
  }

  const markerPoint = getPointAtRatio(routePath, 0.55);

  if (!markerPoint) {
    return [];
  }

  return [
    {
      id: "direction-main",
      position: markerPoint.position,
      degree: markerPoint.degree,
      color: "#f97316",
      order: 1,
      offsetIndex: 0,
    },
  ];
}

function createSegmentDirectionMarkers(segments: WalkingRouteSegment[]) {
  return segments
    .filter((segment) => {
      if (segment.path.length < 2) {
        return false;
      }

      return getPathDistanceKm(segment.path) >= MIN_DIRECTION_BADGE_SEGMENT_KM;
    })
    .map((segment, index) => {
      const markerPoint = getPointAtRatio(segment.path, 0.58);

      if (!markerPoint) {
        return null;
      }

      const style = SEGMENT_STYLES[index % SEGMENT_STYLES.length];

      return {
        id: `segment-direction-${segment.id}`,
        position: markerPoint.position,
        degree: markerPoint.degree,
        color: style.color,
        order: index + 1,
        offsetIndex: index,
      };
    })
    .filter(
      (
        marker
      ): marker is {
        id: string;
        position: Location;
        degree: number;
        color: string;
        order: number;
        offsetIndex: number;
      } => Boolean(marker)
    );
}

function MapCenterUpdater({ center }: { center: Location }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng, map]);

  return null;
}

function MapCenterTracker({
  onMapCenterChange,
}: {
  onMapCenterChange: (center: Location) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();

      onMapCenterChange({
        lat: center.lat,
        lng: center.lng,
      });
    },
  });

  useEffect(() => {
    const center = map.getCenter();

    onMapCenterChange({
      lat: center.lat,
      lng: center.lng,
    });
  }, [map, onMapCenterChange]);

  return null;
}

function PinPopup({ pin }: { pin: Pin }) {
  const categoryInfo = CATEGORY_INFO[pin.category];

  return (
    <Popup>
      <strong>{pin.name}</strong>
      <br />
      {categoryInfo.label}
      <br />
      {pin.description}
    </Popup>
  );
}

export default function MapView({
  pins,
  routePins,
  center,
  userLocation,
  routeStartLocation,
  walkingRoutePath,
  walkingRouteSegments,
  onMapCenterChange,
}: MapViewProps) {
  const straightRoutePath: [number, number][] = [
    [routeStartLocation.lat, routeStartLocation.lng],
    ...routePins.map((pin) => [pin.lat, pin.lng] as [number, number]),
    [routeStartLocation.lat, routeStartLocation.lng],
  ];

  const routePath: [number, number][] =
    walkingRoutePath && walkingRoutePath.length >= 2
      ? walkingRoutePath
      : straightRoutePath;

  const hasSegmentPaths = walkingRouteSegments.some(
    (segment) => segment.path.length >= 2
  );

  const directionMarkers = hasSegmentPaths
    ? createSegmentDirectionMarkers(walkingRouteSegments)
    : createDirectionMarkersFromPath(routePath);

  const routePinIdSet = new Set(routePins.map((pin) => pin.id));
  const nonRoutePins = pins.filter((pin) => !routePinIdSet.has(pin.id));

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
style={{
  width: "100%",
  height: "clamp(360px, 58vh, 500px)",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",
}}
    >
      <MapCenterUpdater center={center} />
      <MapCenterTracker onMapCenterChange={onMapCenterChange} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userLocationIcon}
          zIndexOffset={1000}
        >
          <Popup>
            <strong>현재 위치</strong>
            <br />
            현재 GPS 위치입니다.
          </Popup>
        </Marker>
      )}

      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={45}
        disableClusteringAtZoom={17}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {nonRoutePins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={createCategoryIcon(pin.category)}
            zIndexOffset={400}
          >
            <PinPopup pin={pin} />
          </Marker>
        ))}
      </MarkerClusterGroup>

      {hasSegmentPaths ? (
        <>
          {walkingRouteSegments.map((segment) => {
            if (segment.path.length < 2) {
              return null;
            }

            return (
              <Polyline
                key={`${segment.id}-shadow`}
                positions={segment.path}
                pathOptions={{
                  weight: 11,
                  opacity: 0.28,
                  color: "#111827",
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            );
          })}

          {walkingRouteSegments.map((segment) => {
            if (segment.path.length < 2) {
              return null;
            }

            return (
              <Polyline
                key={`${segment.id}-outline`}
                positions={segment.path}
                pathOptions={{
                  weight: 8,
                  opacity: 0.95,
                  color: "#ffffff",
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            );
          })}

          {walkingRouteSegments.map((segment, index) => {
            if (segment.path.length < 2) {
              return null;
            }

            const style = SEGMENT_STYLES[index % SEGMENT_STYLES.length];

            return (
              <Polyline
                key={segment.id}
                positions={segment.path}
                pathOptions={{
                  weight: 5,
                  opacity: 0.98,
                  color: style.color,
                  dashArray: style.dashArray,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            );
          })}
        </>
      ) : (
        routePath.length >= 2 && (
          <>
            <Polyline
              positions={routePath}
              pathOptions={{
                weight: 11,
                opacity: 0.35,
                color: "#111827",
                lineCap: "round",
                lineJoin: "round",
              }}
            />

            <Polyline
              positions={routePath}
              pathOptions={{
                weight: 8,
                opacity: 0.95,
                color: "#ffffff",
                lineCap: "round",
                lineJoin: "round",
              }}
            />

            <Polyline
              positions={routePath}
              pathOptions={{
                weight: 5,
                opacity: 0.98,
                color: walkingRoutePath ? "#f97316" : "#2563eb",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )
      )}

      {routePins.map((pin) => (
        <Marker
          key={`route-category-${pin.id}`}
          position={[pin.lat, pin.lng]}
          icon={createCategoryIcon(pin.category, true)}
          zIndexOffset={900}
        >
          <PinPopup pin={pin} />
        </Marker>
      ))}

      <Marker
        position={[routeStartLocation.lat, routeStartLocation.lng]}
        icon={createStartIcon()}
        zIndexOffset={1300}
      >
        <Popup>
          <strong>출발 지점</strong>
          <br />
          추천 루트의 시작과 복귀 기준점입니다.
        </Popup>
      </Marker>

      {routePins.map((pin, index) => (
        <Marker
          key={`route-order-${pin.id}`}
          position={[pin.lat, pin.lng]}
          icon={createRouteOrderBadgeIcon(index + 1)}
          zIndexOffset={1500}
        >
          <Popup>
            <strong>{index + 1}번째 경유지</strong>
            <br />
            {pin.name}
          </Popup>
        </Marker>
      ))}

      {directionMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.position.lat, marker.position.lng]}
          icon={createDirectionBadgeIcon({
            degree: marker.degree,
            color: marker.color,
            order: marker.order,
            offsetIndex: marker.offsetIndex,
          })}
          interactive={false}
          zIndexOffset={1100}
        />
      ))}
    </MapContainer>
  );
}