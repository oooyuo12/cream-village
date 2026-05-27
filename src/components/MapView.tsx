import React, { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { Route, Checkpoint, LocationPin } from "../types";
import { CHARACTERS } from "../data";
import { LOCATION_PINS } from "../pinsData";
import { MapPin, Navigation } from "lucide-react";

interface MapViewProps {
  selectedRoute: Route | null;
  activeWalk: {
    isWalking: boolean;
    progress: number;
    checkpointIndex: number;
    coinsCount: number;
  };
  onCheckpointTriggered?: (cp: Checkpoint) => void;
}

type RegionKey = "seongnam" | "ilsan" | "bucheon" | "seoul";

type CategoryKey =
  | "ALL"
  | "PARK"
  | "TOILET"
  | "CAFE"
  | "PET_STORE"
  | "HOSPITAL"
  | "GROOMING";

type LatLng = {
  lat: number;
  lng: number;
};

const REGION_CENTERS: Record<RegionKey, LatLng & { name: string }> = {
  seongnam: { lat: 37.4485, lng: 127.138, name: "성남시 전체" },
  ilsan: { lat: 37.69345, lng: 126.76015, name: "고양 일산 덕이동" },
  bucheon: { lat: 37.46236, lng: 126.8125, name: "부천 소사/범안로" },
  seoul: { lat: 37.5443, lng: 127.0374, name: "서울숲 모험코스" },
};

const CATEGORY_LABEL: Record<string, string> = {
  PARK: "공원",
  TOILET: "배변위생",
  CAFE: "동반카페",
  PET_STORE: "용품상점",
  HOSPITAL: "동물병원",
  GROOMING: "미용스파",
};

const CATEGORY_EMOJI: Record<string, string> = {
  PARK: "🌳",
  TOILET: "💩",
  CAFE: "☕",
  PET_STORE: "🛒",
  HOSPITAL: "🏥",
  GROOMING: "✂️",
};

const CATEGORY_COLOR: Record<string, string> = {
  PARK: "#10b981",
  TOILET: "#f59e0b",
  CAFE: "#f43f5e",
  PET_STORE: "#0ea5e9",
  HOSPITAL: "#ef4444",
  GROOMING: "#6366f1",
};

function hasLatLng(value: unknown): value is LatLng {
  if (!value || typeof value !== "object") {
    return false;
  }

  const target = value as Partial<LatLng>;

  return (
    typeof target.lat === "number" &&
    Number.isFinite(target.lat) &&
    typeof target.lng === "number" &&
    Number.isFinite(target.lng)
  );
}

function getRouteColor(route: Route | null) {
  switch (route?.characterGuide) {
    case "mango":
      return "#FF8A3D";
    case "janggun":
      return "#5C554F";
    case "nabi":
      return "#59A8DF";
    case "bori":
      return "#3EBC9B";
    case "mungchi":
      return "#EC4899";
    default:
      return "#FF8A3D";
  }
}

function getPinEmoji(category: string) {
  return CATEGORY_EMOJI[category] ?? "📍";
}

function getPinCategoryLabel(category: string) {
  return CATEGORY_LABEL[category] ?? "장소";
}

function getRouteLatLngs(route: Route | null): LatLng[] {
  if (!route?.coordinates) {
    return [];
  }

  return route.coordinates.filter(hasLatLng);
}

function getFallbackCenterFromPins(pins: LocationPin[]): LatLng | null {
  if (pins.length === 0) {
    return null;
  }

  const latSum = pins.reduce((sum, pin) => sum + pin.lat, 0);
  const lngSum = pins.reduce((sum, pin) => sum + pin.lng, 0);

  return {
    lat: latSum / pins.length,
    lng: lngSum / pins.length,
  };
}

function getCheckpointPosition({
  checkpoint,
  index,
  routePath,
  route,
}: {
  checkpoint: Checkpoint;
  index: number;
  routePath: LatLng[];
  route: Route;
}): LatLng | null {
  if (hasLatLng(checkpoint)) {
    return checkpoint;
  }

  const coordinate = route.coordinates[index + 1];

  if (hasLatLng(coordinate)) {
    return coordinate;
  }

  if (routePath.length === 0) {
    return null;
  }

  const targetIndex = Math.min(index + 1, routePath.length - 1);

  return routePath[targetIndex];
}

function getCharacterPosition(routePath: LatLng[], progress: number): LatLng | null {
  if (routePath.length === 0) {
    return null;
  }

  if (routePath.length === 1) {
    return routePath[0];
  }

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const targetSegmentFloat = (clampedProgress / 100) * (routePath.length - 1);
  const segmentIndex = Math.min(
    Math.floor(targetSegmentFloat),
    routePath.length - 2
  );

  const segmentProgress = targetSegmentFloat - segmentIndex;

  const start = routePath[segmentIndex];
  const end = routePath[segmentIndex + 1];

  return {
    lat: start.lat + (end.lat - start.lat) * segmentProgress,
    lng: start.lng + (end.lng - start.lng) * segmentProgress,
  };
}

function createDivIcon({
  html,
  size,
  anchor,
}: {
  html: string;
  size: [number, number];
  anchor: [number, number];
}) {
  return L.divIcon({
    className: "",
    html,
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -anchor[1]],
  });
}

function createLocationPinIcon(category: string, isSelected = false) {
  const color = CATEGORY_COLOR[category] ?? "#f97316";
  const emoji = getPinEmoji(category);
  const size = isSelected ? 42 : 36;

  return createDivIcon({
    size: [size, size],
    anchor: [size / 2, size],
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:3px solid white;
        box-shadow:0 4px 12px rgba(0,0,0,0.35);
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <span style="
          transform:rotate(45deg);
          font-size:${isSelected ? 20 : 17}px;
          line-height:1;
        ">${emoji}</span>
      </div>
    `,
  });
}

function createStartIcon() {
  return createDivIcon({
    size: [72, 38],
    anchor: [36, 19],
    html: `
      <div style="
        height:34px;
        padding:0 14px;
        border-radius:999px;
        background:#111827;
        color:white;
        border:3px solid white;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:14px;
        font-weight:900;
        box-shadow:0 4px 14px rgba(0,0,0,0.35);
        white-space:nowrap;
      ">
        START
      </div>
    `,
  });
}

function createGoalIcon() {
  return createDivIcon({
    size: [72, 38],
    anchor: [36, 19],
    html: `
      <div style="
        height:34px;
        padding:0 14px;
        border-radius:999px;
        background:#f97316;
        color:white;
        border:3px solid white;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:14px;
        font-weight:900;
        box-shadow:0 4px 14px rgba(0,0,0,0.35);
        white-space:nowrap;
      ">
        GOAL
      </div>
    `,
  });
}

function createCheckpointIcon(index: number, active: boolean, discovered: boolean) {
  const background = active ? "#f97316" : discovered ? "#fef3c7" : "#e5e7eb";
  const color = active ? "#ffffff" : "#374151";
  const border = active ? "#ffffff" : "#f59e0b";

  return createDivIcon({
    size: [38, 38],
    anchor: [19, 19],
    html: `
      <div style="
        width:34px;
        height:34px;
        border-radius:999px;
        background:${background};
        color:${color};
        border:3px solid ${border};
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:13px;
        font-weight:900;
        box-shadow:0 4px 12px rgba(0,0,0,0.28);
      ">
        ${index + 1}
      </div>
    `,
  });
}

function createCharacterIcon(route: Route) {
  const character = CHARACTERS[route.characterGuide];

  const content = character?.avatarImage
    ? `<img src="${character.avatarImage}" alt="${character.name}" style="width:100%;height:100%;object-fit:cover;border-radius:999px;" />`
    : `<span style="font-size:24px;">${character?.avatarEmoji ?? "🐾"}</span>`;

  return createDivIcon({
    size: [52, 52],
    anchor: [26, 26],
    html: `
      <div style="
        width:48px;
        height:48px;
        border-radius:999px;
        background:white;
        border:4px solid #f97316;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 6px 16px rgba(0,0,0,0.35);
        overflow:hidden;
      ">
        ${content}
      </div>
    `,
  });
}

function MapCenterController({
  center,
  zoom,
  routePath,
}: {
  center: LatLng;
  zoom: number;
  routePath: LatLng[];
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();

    if (routePath.length >= 2) {
      const bounds = L.latLngBounds(routePath.map((point) => [point.lat, point.lng]));
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 16,
      });
      return;
    }

    map.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom, routePath, map]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

export const MapView: React.FC<MapViewProps> = ({
  selectedRoute,
  activeWalk,
  onCheckpointTriggered,
}) => {
  const [selectedNode, setSelectedNode] = useState<Checkpoint | null>(null);
  const [selectedPin, setSelectedPin] = useState<LocationPin | null>(null);
  const [activeRegion, setActiveRegion] = useState<RegionKey>("seongnam");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("ALL");
  const [mapCenter, setMapCenter] = useState<LatLng>(REGION_CENTERS.seongnam);
  const [mapZoom, setMapZoom] = useState(14);

  const routePath = useMemo(() => getRouteLatLngs(selectedRoute), [selectedRoute]);
  const routeColor = getRouteColor(selectedRoute);

  useEffect(() => {
    if (!selectedRoute) {
      return;
    }

    const firstRoutePoint = routePath[0];

    if (firstRoutePoint) {
      setMapCenter(firstRoutePoint);
      setMapZoom(15);
    }

    const regionText = `${selectedRoute.region ?? ""}`.toLowerCase();

    if (
      regionText.includes("덕이") ||
      regionText.includes("일산") ||
      firstRoutePoint?.lat > 37.6
    ) {
      setActiveRegion("ilsan");
    } else if (
      regionText.includes("부천") ||
      (firstRoutePoint &&
        firstRoutePoint.lat > 37.45 &&
        firstRoutePoint.lat < 37.48 &&
        firstRoutePoint.lng < 126.9)
    ) {
      setActiveRegion("bucheon");
    } else if (regionText.includes("서울숲")) {
      setActiveRegion("seoul");
    } else {
      setActiveRegion("seongnam");
    }
  }, [selectedRoute, routePath]);

  useEffect(() => {
    if (activeWalk.isWalking && selectedRoute) {
      const activeCp = selectedRoute.checkpoints[activeWalk.checkpointIndex];

      if (activeCp) {
        setSelectedNode(activeCp);
        setSelectedPin(null);
      }
    }
  }, [activeWalk.checkpointIndex, activeWalk.isWalking, selectedRoute]);

  const handleRegionChange = (region: RegionKey) => {
    setActiveRegion(region);
    setMapCenter(REGION_CENTERS[region]);
    setMapZoom(region === "seongnam" ? 14 : 15);
    setSelectedPin(null);
    setSelectedNode(null);
  };

  const filteredPins = useMemo(() => {
    return LOCATION_PINS.filter((pin) => {
      let matchesRegion = false;

      if (activeRegion === "ilsan") {
        matchesRegion =
          pin.id.includes("dukyi") ||
          pin.address.includes("고양") ||
          pin.address.includes("일산") ||
          pin.address.includes("탄현");
      } else if (activeRegion === "bucheon") {
        matchesRegion =
          pin.id.includes("bucheon") ||
          pin.address.includes("부천") ||
          pin.address.includes("범안로");
      } else if (activeRegion === "seongnam") {
        matchesRegion =
          !pin.id.includes("dukyi") &&
          !pin.id.includes("bucheon") &&
          !pin.address.includes("고양") &&
          !pin.address.includes("부천") &&
          !pin.id.includes("seoul");
      } else if (activeRegion === "seoul") {
        matchesRegion = pin.id.includes("seoul");
      }

      if (!matchesRegion) {
        return false;
      }

      if (activeCategory === "ALL") {
        return true;
      }

      return pin.category === activeCategory;
    });
  }, [activeRegion, activeCategory]);

  useEffect(() => {
    if (routePath.length > 0) {
      return;
    }

    const fallbackCenter = getFallbackCenterFromPins(filteredPins);

    if (fallbackCenter) {
      setMapCenter(fallbackCenter);
    }
  }, [filteredPins, routePath.length]);

  const checkpointMarkers = useMemo(() => {
    if (!selectedRoute) {
      return [];
    }

    return selectedRoute.checkpoints
      .map((checkpoint, index) => {
        const position = getCheckpointPosition({
          checkpoint,
          index,
          routePath,
          route: selectedRoute,
        });

        if (!position) {
          return null;
        }

        return {
          checkpoint,
          index,
          position,
        };
      })
      .filter(
        (
          item
        ): item is {
          checkpoint: Checkpoint;
          index: number;
          position: LatLng;
        } => Boolean(item)
      );
  }, [selectedRoute, routePath]);

  const characterPosition =
    selectedRoute && activeWalk.isWalking
      ? getCharacterPosition(routePath, activeWalk.progress)
      : null;

  const startPoint = routePath[0];
  const goalPoint = routePath.length > 1 ? routePath[routePath.length - 1] : null;

  return (
    <div className="w-full flex flex-col gap-4.5" id="map-view-wrapper">
      <div
        className="relative w-full rounded-[36px] bg-[#FDF9F3] border-2 border-cream-border overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.04)]"
        id="map-stage"
        style={{
          height: "clamp(420px, 62vh, 680px)",
        }}
      >
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={mapZoom}
          scrollWheelZoom
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "34px",
            overflow: "hidden",
            background: "#FDF9F3",
          }}
        >
          <MapCenterController
            center={mapCenter}
            zoom={mapZoom}
            routePath={routePath}
          />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routePath.length >= 2 && (
            <>
              <Polyline
                positions={routePath.map((point) => [point.lat, point.lng])}
                pathOptions={{
                  color: "#ffffff",
                  weight: 10,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />

              <Polyline
                positions={routePath.map((point) => [point.lat, point.lng])}
                pathOptions={{
                  color: routeColor,
                  weight: 6,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                  dashArray: "12 10",
                }}
              />
            </>
          )}

          {startPoint && (
            <Marker
              position={[startPoint.lat, startPoint.lng]}
              icon={createStartIcon()}
              zIndexOffset={1200}
            >
              <Popup>
                <strong>출발 지점</strong>
                <br />
                추천 루트의 시작 지점입니다.
              </Popup>
            </Marker>
          )}

          {goalPoint && (
            <Marker
              position={[goalPoint.lat, goalPoint.lng]}
              icon={createGoalIcon()}
              zIndexOffset={1200}
            >
              <Popup>
                <strong>도착 지점</strong>
                <br />
                추천 루트의 마지막 지점입니다.
              </Popup>
            </Marker>
          )}

          {checkpointMarkers.map(({ checkpoint, index, position }) => {
            const isCurrentActive =
              activeWalk.isWalking && activeWalk.checkpointIndex === index;

            const isDiscovered =
              checkpoint.discovered ||
              (activeWalk.isWalking && activeWalk.checkpointIndex >= index);

            return (
              <Marker
                key={checkpoint.id}
                position={[position.lat, position.lng]}
                icon={createCheckpointIcon(index, isCurrentActive, isDiscovered)}
                zIndexOffset={1000 + index}
                eventHandlers={{
                  click: () => {
                    setSelectedNode(checkpoint);
                    setSelectedPin(null);
                    onCheckpointTriggered?.(checkpoint);
                  },
                }}
              >
                <Popup>
                  <strong>
                    {index + 1}구역 · {checkpoint.name}
                  </strong>
                  <br />
                  {checkpoint.description}
                </Popup>
              </Marker>
            );
          })}

          {filteredPins.map((pin) => {
            const isSelected = selectedPin?.id === pin.id;

            return (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={createLocationPinIcon(pin.category, isSelected)}
                zIndexOffset={isSelected ? 900 : 600}
                eventHandlers={{
                  click: () => {
                    setSelectedPin(pin);
                    setSelectedNode(null);
                  },
                }}
              >
                <Popup>
                  <strong>{pin.name}</strong>
                  <br />
                  {getPinCategoryLabel(pin.category)}
                  <br />
                  {pin.address}
                  <br />
                  <span>{pin.description}</span>
                </Popup>
              </Marker>
            );
          })}

          {selectedRoute && characterPosition && (
            <Marker
              position={[characterPosition.lat, characterPosition.lng]}
              icon={createCharacterIcon(selectedRoute)}
              zIndexOffset={1600}
            >
              <Popup>
                <strong>
                  {CHARACTERS[selectedRoute.characterGuide]?.name ?? "가이드"}
                </strong>
                <br />
                현재 모험 진행 위치입니다.
              </Popup>
            </Marker>
          )}
        </MapContainer>

        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-cream-border shadow-xs flex items-center gap-2 pointer-events-none z-[1000]">
          <MapPin size={14} className="text-pastel-orange stroke-[2.5]" />
          <span className="text-[10px] font-black text-warm-gray-dark">
            실제 지도 기반 루트 보기
          </span>
        </div>

        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-cream-border shadow-xs flex items-center gap-2 pointer-events-none z-[1000]">
          <Navigation size={13} className="text-pastel-orange rotate-45 stroke-[2.5]" />
          <span className="text-[10px] font-black text-warm-gray-dark">
            {REGION_CENTERS[activeRegion].name}
          </span>
        </div>

        {!selectedRoute && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#FAF8F5]/50 backdrop-blur-[1px] pointer-events-none z-[900]">
            <Navigation
              size={34}
              className="text-pastel-orange/70 animate-bounce mb-2 stroke-[2.5]"
            />
            <h4 className="text-sm font-black text-warm-gray-dark">
              루트를 선택하면 실제 지도가 표시됩니다
            </h4>
            <p className="text-[11px] text-warm-gray/70 mt-1 max-w-xs leading-relaxed font-semibold">
              아래 추천 루트를 선택하거나 AI에게 새 루트를 생성해 주세요.
            </p>
          </div>
        )}
      </div>

      {selectedRoute && selectedNode && (
        <div
          id="checkpoint-bubble-detail"
          className="p-4 bg-cream-accent/85 rounded-3xl border border-cream-border flex flex-col gap-2.5 shadow-soft transition-all relative animate-[fadeIn_0.3s_ease-out]"
        >
          <button
            type="button"
            className="absolute top-3.5 right-3.5 text-[9.5px] font-extrabold text-warm-gray/50 bg-white border border-cream-border rounded-full w-5.5 h-5.5 flex items-center justify-center hover:bg-cream-accent shadow-xs cursor-pointer select-none"
            onClick={() => setSelectedNode(null)}
          >
            ✕
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <div className="flex flex-col">
              <span className="text-xs font-black text-warm-gray-dark leading-tight">
                {selectedNode.name}
              </span>
              <span className="text-[9px] font-black text-pastel-orange uppercase tracking-wider font-accent">
                exploration zone
              </span>
            </div>
          </div>

          <p className="text-[11.5px] text-warm-gray leading-relaxed font-sans font-medium mt-0.5">
            {selectedNode.description}
          </p>

          <div className="p-3 rounded-2xl border-2 text-[10.5px] text-warm-gray-dark leading-relaxed flex gap-2.5 items-start shadow-inner bg-[#FFF9EE] border-amber-400/75">
            <div className="relative flex-shrink-0">
              {CHARACTERS[selectedRoute.characterGuide]?.avatarImage ? (
                <img
                  src={CHARACTERS[selectedRoute.characterGuide].avatarImage}
                  alt={CHARACTERS[selectedRoute.characterGuide].name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200/50 shadow-xs animate-bounce block"
                />
              ) : (
                <span className="text-2xl flex-shrink-0 animate-bounce block">
                  {CHARACTERS[selectedRoute.characterGuide]?.avatarEmoji ?? "🐾"}
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 text-[9px] bg-white rounded-full p-0.2 border shadow-xs">
                💬
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="font-black uppercase tracking-wide text-[9.5px] text-amber-800">
                {CHARACTERS[selectedRoute.characterGuide]?.name ?? "가이드"}님의
                한마디:
              </span>
              <p className="italic text-stone-700/95 font-bold leading-relaxed pr-1 text-[11px]">
                “
                {selectedNode.characterComment ||
                  "이곳에 맛 좋은 도토리가 분명 숨어있다냥! 한번 발길을 멈춰 구경해보자냥!"}
                ”
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className="w-full flex flex-col gap-3.5 bg-white border border-cream-border p-4.5 rounded-[28px] shadow-sm"
        id="map-pins-explorer-hud"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">📍</span>
            <div className="flex flex-col">
              <h4 className="text-[12.5px] font-black text-warm-gray-dark leading-none">
                동네 반려 안심 스팟 탐색
              </h4>
              <span className="text-[9.5px] font-medium text-warm-gray mt-1">
                우리 동네의 공원, 수거함, 동반카페 인프라 핀
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5" id="region-pills">
            {(Object.keys(REGION_CENTERS) as RegionKey[]).map((regionKey) => {
              const active = activeRegion === regionKey;

              return (
                <button
                  key={regionKey}
                  type="button"
                  onClick={() => handleRegionChange(regionKey)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    active
                      ? "bg-amber-500/10 text-amber-700 border-2 border-amber-500/40 shadow-xs"
                      : "bg-cream-accent/40 text-warm-gray border-2 border-transparent hover:bg-cream-accent/80"
                  }`}
                >
                  {regionKey === "seongnam"
                    ? "🏙️ 성남시 전체"
                    : regionKey === "ilsan"
                    ? "🌳 일산 덕이동"
                    : regionKey === "bucheon"
                    ? "🏘️ 부천 범안로"
                    : "⛲ 서울숲"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full h-px bg-[#F5EFE1]" />

        <div
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
          id="category-pills"
        >
          <span className="text-[9.5px] font-black text-warm-gray-dark shrink-0 font-sans">
            필터:
          </span>

          <div className="flex gap-1.5 overflow-x-auto">
            {[
              { id: "ALL", emoji: "✨", label: "전체" },
              { id: "PARK", emoji: "🌳", label: "공원" },
              { id: "TOILET", emoji: "💩", label: "배변위생" },
              { id: "CAFE", emoji: "☕", label: "동반카페" },
              { id: "PET_STORE", emoji: "🛒", label: "용품상점" },
              { id: "HOSPITAL", emoji: "🏥", label: "동물병원" },
              { id: "GROOMING", emoji: "✂️", label: "미용스파" },
            ].map((category) => {
              const active = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.id as CategoryKey);
                    setSelectedPin(null);
                  }}
                  className={`px-3 py-1.2 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                    active
                      ? "bg-neutral-900 text-white shadow-soft scale-102"
                      : "bg-[#FDFBF7] text-warm-gray-dark border border-cream-border hover:bg-cream-accent"
                  }`}
                >
                  <span>{category.emoji}</span>
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedPin && (
        <div
          id="location-pin-detail-bubble"
          className="p-4 bg-cream-accent/85 rounded-3xl border border-cream-border flex flex-col gap-3.5 shadow-soft transition-all relative animate-[fadeIn_0.3s_ease-out]"
        >
          <button
            type="button"
            className="absolute top-3.5 right-3.5 text-[9.5px] font-extrabold text-warm-gray/50 bg-white border border-cream-border rounded-full w-5.5 h-5.5 flex items-center justify-center hover:bg-cream-accent shadow-xs cursor-pointer select-none"
            onClick={() => setSelectedPin(null)}
          >
            ✕
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-2 bg-white rounded-2xl border border-cream-border shadow-xs">
                {getPinEmoji(selectedPin.category)}
              </span>

              <div className="flex flex-col">
                <span className="text-xs font-black text-warm-gray-dark leading-tight flex items-center gap-1.5 flex-wrap">
                  {selectedPin.name}
                  {selectedPin.dogFriendlyScore !== undefined && (
                    <span className="text-[10px] text-amber-500 font-extrabold flex items-center bg-amber-50 px-1.5 py-0.2 rounded-sm border border-amber-200">
                      ★ {selectedPin.dogFriendlyScore}
                    </span>
                  )}
                </span>

                <span className="text-[8.5px] font-bold text-warm-gray mt-1 tracking-wider leading-none">
                  {selectedPin.address}
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 text-[8.5px] font-black rounded-lg shrink-0 bg-amber-100 text-amber-800">
              {getPinCategoryLabel(selectedPin.category)}
            </span>
          </div>

          <p className="text-[11.5px] text-warm-gray leading-relaxed font-sans font-semibold">
            {selectedPin.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {selectedPin.dogSizeAllowed && (
              <span className="text-[9.5px] font-bold bg-white text-stone-600 px-2.5 py-1 rounded-xl border border-stone-200">
                🐶 {selectedPin.dogSizeAllowed}
              </span>
            )}

            {selectedPin.indoorAllowed !== undefined && (
              <span className="text-[9.5px] font-bold bg-white text-stone-600 px-2.5 py-1 rounded-xl border border-stone-200">
                🏠 {selectedPin.indoorAllowed ? "실내 동반 허용" : "야외/테라스만 허용"}
              </span>
            )}

            {selectedPin.parkingAvailable !== undefined && (
              <span className="text-[9.5px] font-bold bg-white text-stone-600 px-2.5 py-1 rounded-xl border border-stone-200">
                🚗 {selectedPin.parkingAvailable ? "주차 가능" : "주차 불가"}
              </span>
            )}

            {selectedPin.leashRequired !== undefined && (
              <span className="text-[9.5px] font-bold bg-white text-stone-600 px-2.5 py-1 rounded-xl border border-[#FAEFDF]/70">
                🦮 {selectedPin.leashRequired ? "목줄 필수 착용" : "오프리쉬 구역"}
              </span>
            )}

            {selectedPin.reservationRequired !== undefined && (
              <span className="text-[9.5px] font-bold bg-white text-stone-600 px-2.5 py-1 rounded-xl border border-stone-200">
                📅 {selectedPin.reservationRequired ? "사전 예약 필수" : "예약 없음"}
              </span>
            )}
          </div>

          {selectedPin.notes && (
            <div className="text-[10.5px] text-amber-850 bg-amber-500/5 p-2.5 rounded-2xl border border-amber-500/10 leading-relaxed font-semibold">
              💡 <span className="text-warm-gray-dark font-black">이용 수칙:</span>{" "}
              {selectedPin.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};