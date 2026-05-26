import React, { useState, useEffect } from 'react';
import { Route, Checkpoint, PetCharacterType, LocationPin } from '../types';
import { CHARACTERS } from '../data';
import { LOCATION_PINS } from '../pinsData';
import { Compass, MapPin, Eye, Navigation, Award, Footprints } from 'lucide-react';

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

export const MapView: React.FC<MapViewProps> = ({
  selectedRoute,
  activeWalk,
  onCheckpointTriggered
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Checkpoint | null>(null);
  const [radarPulse, setRadarPulse] = useState(true);

  // Real-world dynamic pins support (성남/일산/부천/서울숲)
  const [selectedPin, setSelectedPin] = useState<LocationPin | null>(null);
  const [activeRegion, setActiveRegion] = useState<'seongnam' | 'ilsan' | 'bucheon' | 'seoul'>('seongnam');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'PARK' | 'TOILET' | 'CAFE' | 'PET_STORE' | 'HOSPITAL' | 'GROOMING'>('ALL');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 37.4485, lng: 127.1380 });
  const [mapZoom, setMapZoom] = useState<number>(14);

  const REGION_CENTERS = {
    seongnam: { lat: 37.4485, lng: 127.1380, name: '성남시 전체' },
    ilsan: { lat: 37.69345, lng: 126.76015, name: '고양 일산 덕이동' },
    bucheon: { lat: 37.46236, lng: 126.8125, name: '부천 소사/범안로' },
    seoul: { lat: 37.5443, lng: 127.0374, name: '서울숲 모험코스' }
  };

  // Align region and map center when user toggles manually
  const handleRegionChange = (region: 'seongnam' | 'ilsan' | 'bucheon' | 'seoul') => {
    setActiveRegion(region);
    setMapCenter(REGION_CENTERS[region]);
    setMapZoom(region === 'seongnam' ? 14 : 15);
    setSelectedPin(null);
    setSelectedNode(null);
  };

  // Automatically align center/region when selecting a mock route
  useEffect(() => {
    if (selectedRoute && selectedRoute.coordinates && selectedRoute.coordinates.length > 0) {
      const coord = selectedRoute.coordinates[0];
      if (coord.lat && coord.lng) {
        setMapCenter({ lat: coord.lat, lng: coord.lng });
        setMapZoom(15);
        if (selectedRoute.region.includes('덕이') || coord.lat > 37.6) {
          setActiveRegion('ilsan');
        } else if (selectedRoute.region.includes('복정') || (coord.lat > 37.42 && coord.lat < 37.48 && coord.lng > 127.1)) {
          setActiveRegion('seongnam');
        } else if (selectedRoute.region.includes('부천') || (coord.lat > 37.45 && coord.lat < 37.47 && coord.lng < 126.9)) {
          setActiveRegion('bucheon');
        } else {
          setActiveRegion('seoul');
        }
      }
    }
  }, [selectedRoute]);

  // Compute filtered pins
  const getFilteredPins = () => {
    return LOCATION_PINS.filter(pin => {
      // 1. Region alignment matching
      let matchesRegion = false;
      if (activeRegion === 'ilsan') {
        matchesRegion = pin.id.includes('dukyi') || pin.address.includes('고양') || pin.address.includes('일산') || pin.address.includes('탄현');
      } else if (activeRegion === 'bucheon') {
        matchesRegion = pin.id.includes('bucheon') || pin.address.includes('부천') || pin.address.includes('범안로');
      } else if (activeRegion === 'seongnam') {
        matchesRegion = !pin.id.includes('dukyi') && !pin.id.includes('bucheon') && !pin.address.includes('고양') && !pin.address.includes('부천') && !pin.id.includes('seoul');
      } else if (activeRegion === 'seoul') {
        matchesRegion = pin.id.includes('seoul');
      }

      if (!matchesRegion) return false;

      // 2. Category alignment matching
      if (activeCategory === 'ALL') return true;
      return pin.category === activeCategory;
    });
  };

  const filteredPins = getFilteredPins();

  const getPinEmoji = (category: string) => {
    switch (category) {
      case 'PARK': return '🌳';
      case 'TOILET': return '💩';
      case 'CAFE': return '☕';
      case 'PET_STORE': return '🛒';
      case 'HOSPITAL': return '🏥';
      case 'GROOMING': return '✂️';
      default: return '📍';
    }
  };

  const getPinCategoryLabel = (category: string) => {
    switch (category) {
      case 'PARK': return '공원';
      case 'TOILET': return '위생';
      case 'CAFE': return '카페';
      case 'PET_STORE': return '매장';
      case 'HOSPITAL': return '병원';
      case 'GROOMING': return '미용';
      default: return '장소';
    }
  };

  const getPinBorderClass = (category: string) => {
    switch (category) {
      case 'PARK': return 'border-emerald-500 text-emerald-700 bg-emerald-50';
      case 'TOILET': return 'border-amber-500 text-amber-700 bg-amber-50';
      case 'CAFE': return 'border-rose-400 text-rose-700 bg-rose-50';
      case 'PET_STORE': return 'border-sky-400 text-sky-700 bg-sky-50';
      case 'HOSPITAL': return 'border-red-400 text-red-700 bg-red-50';
      case 'GROOMING': return 'border-indigo-400 text-indigo-700 bg-indigo-50';
      default: return 'border-pastel-orange bg-orange-50';
    }
  };

  const getMascotCommentForPin = (category: string) => {
    switch (category) {
      case 'PARK':
        return {
          guide: 'bori',
          comment: '여기 풀밭 냄새 진짜 보송보송하고 폭신폭신하다댕! 우리의 신나는 흙 발도장을 남기기 최고라댕!'
        };
      case 'TOILET':
        return {
          guide: 'janggun',
          comment: '산책을 시작하기 전 시원하게 배변을 보고 깨끗이 수거해 버릴 대환영 후보소라댕! 에티켓을 지키자댕!'
        };
      case 'CAFE':
        return {
          guide: 'mango',
          comment: '신나게 걸은 후 머무르기 딱 좋은 이쁜 카페냥! 시원한 물그릇에 보호자와 같이 개껌 식사 한바가지 즐기자냥!'
        };
      case 'PET_STORE':
        return {
          guide: 'nabi',
          comment: '우와! 씹으면 바스락 소리가 나는 공이랑 건강한 수제 고구마 연어가 다 모여있다냥! 바구니 하나 주라냥!'
        };
      case 'HOSPITAL':
        return {
          guide: 'janggun',
          comment: '산책 중에 다치거나 이상 반응을 보이면 이 안전 병원으로 앞장서서 엄호하겠댕! 미리 눈여겨보댕!'
        };
      case 'GROOMING':
        return {
          guide: 'mungchi',
          comment: '뽀송하게 피로가 풀리는 스파와 수제 털 미용을 즐기고 나면 번개 파워처럼 질주할 수 있다댕! 고고!'
        };
      default:
        return {
          guide: 'mango',
          comment: '맛있는 냄새가 솔솔 나는 특별한 동네 비밀 피난망처가 분명하다냥!'
        };
    }
  };

  // Automatically select the active checkpoint if we are walking
  useEffect(() => {
    if (activeWalk.isWalking && selectedRoute) {
      const activeCp = selectedRoute.checkpoints[activeWalk.checkpointIndex];
      if (activeCp) {
        setSelectedNode(activeCp);
        setSelectedPin(null);
      }
    }
  }, [activeWalk.checkpointIndex, activeWalk.isWalking, selectedRoute]);

  // Keep a cyclic radar sweep animation
  useEffect(() => {
    const timer = setInterval(() => {
      setRadarPulse(prev => !prev);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  // Compute actual position of the character on 2D handdrawn grid (0-100)
  const getCharacterCoords2D = () => {
    if (!selectedRoute || selectedRoute.coordinates.length === 0) {
      return { x: 50, y: 50 };
    }
    const coords = selectedRoute.coordinates;
    const progressFraction = activeWalk.progress / 100;

    const totalSegments = coords.length - 1;
    if (totalSegments <= 0) return coords[0];

    const targetSegmentFloat = progressFraction * totalSegments;
    const segmentIndex = Math.min(Math.floor(targetSegmentFloat), totalSegments - 1);
    const segmentProgress = targetSegmentFloat - segmentIndex;

    const start = coords[segmentIndex];
    const end = coords[segmentIndex + 1];

    if (!start || !end) return coords[0];

    return {
      x: start.x + (end.x - start.x) * segmentProgress,
      y: start.y + (end.y - start.y) * segmentProgress
    };
  };

  const charPosition2D = getCharacterCoords2D();

  // Compute auto-fitted coordinates for real-world pins on Handdrawn 2D canvas (0-100)
  const getProjectedCoordinates = () => {
    if (filteredPins.length === 0) return {};
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    filteredPins.forEach(p => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;

    const projected: Record<string, { x: number; y: number }> = {};
    filteredPins.forEach(p => {
      // Scale coordinates to fit nicely within standard 15% to 85% boundary of Handdrawn map canvas
      const x = lngSpan > 0.0001
        ? 15 + ((p.lng - minLng) / lngSpan) * 70
        : 50;
      const y = latSpan > 0.0001
        ? 85 - ((p.lat - minLat) / latSpan) * 70
        : 50;
      projected[p.id] = { x, y };
    });
    return projected;
  };

  const projected2DPins = getProjectedCoordinates();



  const getRouteColor = (guide: PetCharacterType) => {
    switch (guide) {
      case 'mango': return '#FF8A3D'; // Pastel Orange
      case 'janggun': return '#5C554F'; // Warm Gray
      case 'nabi': return '#59A8DF'; // Pastel Blue
      case 'bori': return '#3EBC9B'; // Pastel Mint
      case 'mungchi': return '#EC4899'; // Pink
      default: return '#FF8A3D';
    }
  };

  const routeColor = selectedRoute ? getRouteColor(selectedRoute.characterGuide) : '#cbd5e1';

  const getCheckpointEmoji = (type: string) => {
    switch (type) {
      case 'sniff': return '🌱';
      case 'chest': return '🎁';
      case 'photo': return '📸';
      case 'rest': return '⛱️';
      case 'landmark': return '🏰';
      default: return '📍';
    }
  };

  // Static decorative items scattered around the village grid for cozy visual context
  const staticDecorations = [
    { x: 12, y: 32, emoji: '🏡', name: '치즈오두막' },
    { x: 86, y: 16, emoji: '🌲', name: '가로수쉼터' },
    { x: 74, y: 76, emoji: '🌳', name: '느티미정원' },
    { x: 92, y: 55, emoji: '🏠', name: '보리쿠키점' },
    { x: 48, y: 88, emoji: '⛲', name: '분수대' },
    { x: 28, y: 52, emoji: '🪵', name: '휴식벤치' },
    { x: 20, y: 12, emoji: '☁️', name: '솜구름' }
  ];

  // Convert Route coordinates to LatLngLiterals for Polyline drawing
  return (
    <div className="w-full flex flex-col gap-4.5" id="map-view-wrapper">
      
      {/* Map visual stage container */}
      <div className="relative w-full aspect-video md:aspect-[1.35] rounded-[36px] bg-[#FDF9F3] border-2 border-cream-border overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.04)] select-none" id="map-stage">
            {/* Sky atmosphere gradient decoration */}
            <div className={`absolute top-0 left-0 w-full h-10 bg-gradient-to-b opacity-25 pointer-events-none ${
              selectedRoute?.purpose === 'morning' ? 'from-amber-200 via-orange-50 to-transparent' :
              selectedRoute?.purpose === 'sunset' ? 'from-rose-400 via-amber-100 to-transparent' :
              selectedRoute?.purpose === 'night' ? 'from-indigo-900 via-purple-950 to-transparent opacity-45' :
              'from-sky-250 to-transparent'
            }`} />

            {/* Dynamic handrawn grids */}
            <div className="absolute inset-0 bg-[radial-gradient(#E8E2D2_1.2px,transparent_1.2px)] [background-size:18px_18px] opacity-70 pointer-events-none" />

            {/* SVG trails */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              id="map-canvas-svg"
            >
              <defs>
                <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render All Background Pathways subtly */}
              <path
                d="M 15 80 Q 25 60 50 45 T 30 30"
                fill="none"
                stroke="#EFEBE0"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <path
                d="M 80 85 C 75 55 60 40 70 20"
                fill="none"
                stroke="#EFEBE0"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <path
                d="M 10 15 L 45 32 L 72 70"
                fill="none"
                stroke="#EFEBE0"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />

              {/* Selected route trail path */}
              {selectedRoute && selectedRoute.coordinates.length > 0 && (
                <>
                  {/* Highlight background track */}
                  <path
                    d={`M ${selectedRoute.coordinates.map(c => `${c.x} ${c.y}`).join(' L ')}`}
                    fill="none"
                    stroke={routeColor}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#routeGlow)"
                    className="opacity-90"
                  />
                  
                  {/* Animated dotted helper line */}
                  <path
                    d={`M ${selectedRoute.coordinates.map(c => `${c.x} ${c.y}`).join(' L ')}`}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    strokeDasharray="2 2.5"
                    strokeLinecap="round"
                    className="animate-[dash_22s_linear_infinite]"
                  />

                  {/* Start point */}
                  <g transform={`translate(${selectedRoute.coordinates[0].x}, ${selectedRoute.coordinates[0].y})`}>
                    <circle r="2.8" fill="#3EBC9B" className="animate-ping opacity-70" />
                    <circle r="1.5" fill="#1C7F62" />
                    <text y="-3.5" fontSize="2.8" fontWeight="950" fontFamily="sans-serif" textAnchor="middle" fill="#1C7F62">START 🚩</text>
                  </g>

                  {/* Goal End Flag */}
                  <g transform={`translate(${selectedRoute.coordinates[selectedRoute.coordinates.length - 1].x}, ${selectedRoute.coordinates[selectedRoute.coordinates.length - 1].y})`}>
                    <circle r="1.6" fill="#FF8A3D" />
                    <text y="-3.5" fontSize="2.8" fontWeight="950" fontFamily="sans-serif" textAnchor="middle" fill="#C0530A">GOAL 🏁</text>
                  </g>
                </>
              )}

              {/* Scent Radar ripple when walking */}
              {activeWalk.isWalking && (
                <g transform={`translate(${charPosition2D.x}, ${charPosition2D.y})`}>
                  <circle
                    r={radarPulse ? "7" : "14"}
                    fill="none"
                    stroke={routeColor}
                    strokeWidth="0.4"
                    className="transition-all duration-1000 ease-out opacity-25"
                  />
                  <circle
                    r={radarPulse ? "3" : "8"}
                    fill="none"
                    stroke={routeColor}
                    strokeWidth="0.25"
                    className="transition-all duration-1000 ease-out opacity-45"
                  />
                </g>
              )}
            </svg>

            {/* Decorative village items on top of SVG */}
            {staticDecorations.map((deco, idx) => (
              <div
                key={idx}
                className="absolute -translate-x-1/2 -translate-y-1/2 hover:scale-120 hover:rotate-6 transition-all duration-300 text-base flex flex-col items-center pointer-events-auto"
                style={{ left: `${deco.x}%`, top: `${deco.y}%` }}
                title={deco.name}
              >
                <span>{deco.emoji}</span>
                <span className="text-[7.5px] font-black text-[#8B7C6D] bg-white/90 px-1.5 py-[1.5px] rounded-lg border border-[#F0ECE1] pointer-events-none mt-[2px] leading-tight select-none shadow-xs scale-85">
                  {deco.name}
                </span>
              </div>
            ))}

            {/* Checkpoints interactive pins */}
            {selectedRoute && selectedRoute.checkpoints.map((cp, idx) => {
              const isCurrentActive = activeWalk.isWalking && activeWalk.checkpointIndex === idx;
              const isDiscovered = cp.discovered || (activeWalk.isWalking && activeWalk.checkpointIndex >= idx);
              
              return (
                <button
                  key={cp.id}
                  id={`cp-marker-${cp.id}`}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-auto flex flex-col items-center group z-10 cursor-pointer"
                  style={{ left: `${cp.x}%`, top: `${cp.y}%` }}
                  onClick={() => {
                    setSelectedNode(cp);
                    if (onCheckpointTriggered) onCheckpointTriggered(cp);
                  }}
                  onMouseEnter={() => setHoveredNode(cp.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Halos pulsing */}
                  {isCurrentActive && (
                    <span className="absolute inset-0 rounded-full w-8 h-8 bg-pastel-orange/45 animate-ping -translate-x-0.5 -translate-y-1" />
                  )}

                  {/* Pin bubble packaging */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm shadow-soft transition-all duration-300 btn-squishy ${
                      isCurrentActive
                        ? 'bg-amber-100 border-amber-400 scale-120 animate-bounce'
                        : isDiscovered
                        ? 'bg-[#FCFAF2] border-pastel-orange scale-100 opacity-95'
                        : 'bg-[#F2EFE8] border-stone-300 opacity-70 scale-90 saturate-50'
                    }`}
                  >
                    <span>{getCheckpointEmoji(cp.type)}</span>
                  </div>

                  {/* Node indexing pin */}
                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full border shadow-xs mt-1 leading-none ${
                    isDiscovered
                      ? 'bg-pastel-orange text-white border-pastel-orange'
                      : 'bg-stone-300 text-stone-600 border-stone-300'
                  }`}>
                    {idx + 1}구역
                  </span>

                  {isDiscovered && (
                    <span className="absolute -top-1 -right-1 text-[9px] bg-pastel-mint text-white rounded-full p-0.2 border shadow-xs select-none">✓</span>
                  )}
                </button>
              );
            })}

            {/* Render Real World Pins on Handdrawn Map via auto-fit projection */}
            {filteredPins.map((pin) => {
              const coords = projected2DPins[pin.id];
              if (!coords) return null;
              const isSelected = selectedPin?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  id={`handdrawn-pin-${pin.id}`}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-auto flex flex-col items-center group z-10 cursor-pointer hover:scale-125 hover:-translate-y-0.5"
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  onClick={() => {
                    setSelectedPin(pin);
                    setSelectedNode(null); // Clear checkpoints
                  }}
                >
                  <div className={`p-1.5 rounded-full border-2 text-sm shadow-soft flex items-center justify-center relative ${
                    isSelected ? 'bg-amber-100 border-amber-600 ring-4 ring-amber-400/20 scale-110 z-20' : getPinBorderClass(pin.category)
                  }`}>
                    <span>{getPinEmoji(pin.category)}</span>
                  </div>
                  <span className="text-[7.5px] font-black leading-none bg-neutral-900 border border-black text-white px-1.2 py-0.5 rounded-sm shadow-xs mt-1 whitespace-nowrap">
                    {pin.name}
                  </span>
                </button>
              );
            })}

            {/* Dynamic active companion guide token */}
            {selectedRoute && (
              <div
                id="active-companion-token"
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 pointer-events-none z-20 flex flex-col items-center ${
                  activeWalk.isWalking ? 'scale-115' : 'scale-100 opacity-95'
                }`}
                style={{ left: `${charPosition2D.x}%`, top: `${charPosition2D.y}%` }}
              >
                {/* Companion soft shadow */}
                <span className="absolute bottom-0 w-8 h-2 bg-black/10 rounded-full blur-[1px] animate-pulse" />

                {/* Speacking box bubble cloud */}
                {activeWalk.isWalking && (
                  <div className="bg-white text-[8px] font-extrabold border-2 border-pastel-orange text-warm-gray-dark px-2 py-0.5 rounded-full shadow-soft mb-1 animate-bounce whitespace-nowrap leading-none flex items-center gap-1">
                    <span>{CHARACTERS[selectedRoute.characterGuide].avatar}</span>
                    <span>모험 중! 🐾</span>
                  </div>
                )}

                {/* Mascot circular coin */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr border-2 border-white shadow-soft flex items-center justify-center text-xl select-none relative overflow-hidden bg-white">
                  {CHARACTERS[selectedRoute.characterGuide].avatarImage ? (
                    <img src={CHARACTERS[selectedRoute.characterGuide].avatarImage} alt={CHARACTERS[selectedRoute.characterGuide].name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <span>{CHARACTERS[selectedRoute.characterGuide].avatarEmoji}</span>
                  )}
                  {activeWalk.isWalking && (
                    <span className="absolute -bottom-1 -right-1 bg-pastel-orange text-white rounded-full p-0.5 border border-white text-[6.5px] animate-pulse font-black leading-none z-10">⚡</span>
                  )}
                </div>
                
                <span className="text-[8.5px] font-black text-warm-gray-dark bg-[#FFFDF9]/95 px-1.5 py-0.5 rounded-full border border-orange-200 mt-1 shadow-xs leading-none">
                  {CHARACTERS[selectedRoute.characterGuide].name}
                </span>
              </div>
            )}

        {/* Soft satellite metadata gauge layout info */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-cream-border shadow-xs flex items-center gap-1.5 pointer-events-none scale-90">
          <Navigation size={12} className="text-pastel-orange rotate-45 stroke-[2.5]" />
          <span className="text-[9px] font-black text-warm-gray-dark">크림마을 보물위성 🛰️</span>
        </div>

        {/* Dynamic active walk dashboard overlay HUD */}
        {activeWalk.isWalking && selectedRoute && (
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#FAEFDF] shadow-soft flex items-center gap-3.5 z-30 transition-all text-xs" id="map-walk-hud">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-warm-gray/60 leading-none mb-0.5">CURRENT GUIDE</span>
              <span className="text-[11px] font-black text-warm-gray-dark flex items-center gap-1">
                {CHARACTERS[selectedRoute.characterGuide].avatar} {CHARACTERS[selectedRoute.characterGuide].name} 선배
              </span>
            </div>
            <div className="h-6 w-[1.5px] bg-[#F5EFE0]" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-warm-gray/60 leading-none mb-0.5">DISCOVERED BOX</span>
              <span className="text-[11.5px] font-black text-rose-500 flex items-center gap-0.5 font-mono animate-pulse">
                🎁 {activeWalk.coinsCount} <span className="text-[9.5px] font-medium text-warm-gray">구역</span>
              </span>
            </div>
          </div>
        )}

        {/* Ambient watermark if route unselected */}
        {!selectedRoute && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#FAF8F5]/50 backdrop-blur-xs pointer-events-none z-10">
            <Compass size={32} className="text-pastel-orange/50 animate-bounce mb-2 stroke-[2.5]" />
            <h4 className="text-xs font-black text-warm-gray-dark">동네의 지도가 펼쳐집니다</h4>
            <p className="text-[10px] text-warm-gray/60 mt-1 max-w-xs leading-relaxed font-semibold">대장들의 지도를 아래에서 하나 선택하셔서 실시간 경로를 탭하거나, AI에게 새로 생성을 지시해 주세요!</p>
          </div>
        )}
      </div>

      {/* Selected Node Bottom Dialog Panel */}
      {selectedRoute && selectedNode && (
        <div
          id="checkpoint-bubble-detail"
          className="p-4 bg-cream-accent/85 rounded-3xl border border-cream-border flex flex-col gap-2.5 shadow-soft transition-all relative animate-[fadeIn_0.3s_ease-out]"
        >
          {/* Close bubble button */}
          <button
            type="button"
            className="absolute top-3.5 right-3.5 text-[9.5px] font-extrabold text-warm-gray/50 bg-white border border-cream-border rounded-full w-5.5 h-5.5 flex items-center justify-center hover:bg-cream-accent shadow-xs cursor-pointer select-none"
            onClick={() => setSelectedNode(null)}
          >
            ✕
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xl">{getCheckpointEmoji(selectedNode.type)}</span>
            <div className="flex flex-col">
              <span className="text-xs font-black text-warm-gray-dark leading-tight">
                {selectedNode.name}
              </span>
              <span className="text-[9px] font-black text-pastel-orange uppercase tracking-wider font-accent">
                {selectedNode.type} exploration zone
              </span>
            </div>
          </div>

          <p className="text-[11.5px] text-warm-gray leading-relaxed font-sans font-medium mt-0.5">
            {selectedNode.description}
          </p>

          <div className={`p-3 rounded-2xl border-2 text-[10.5px] text-warm-gray-dark leading-relaxed flex gap-2.5 items-start shadow-inner transition-all duration-300 ${
            selectedRoute.characterGuide === 'mango' ? 'bg-[#FFF9EE] border-amber-400/75' :
            selectedRoute.characterGuide === 'janggun' ? 'bg-[#F2F4F7] border-slate-400/60' :
            selectedRoute.characterGuide === 'nabi' ? 'bg-[#F0F8FF] border-sky-300/80' :
            selectedRoute.characterGuide === 'bori' ? 'bg-[#F0FAF7] border-teal-300/80' :
            'bg-[#FCF5FC] border-pink-300/85'
          }`}>
            <div className="relative flex-shrink-0">
              {CHARACTERS[selectedRoute.characterGuide].avatarImage ? (
                <img src={CHARACTERS[selectedRoute.characterGuide].avatarImage} alt={CHARACTERS[selectedRoute.characterGuide].name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-xl object-cover border border-slate-200/50 shadow-xs animate-bounce block" />
              ) : (
                <span className="text-2xl flex-shrink-0 animate-bounce block">{CHARACTERS[selectedRoute.characterGuide].avatarEmoji}</span>
              )}
              <span className="absolute -bottom-1 -right-1 text-[9px] bg-white rounded-full p-0.2 border shadow-xs">💬</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`font-black uppercase tracking-wide text-[9.5px] ${
                selectedRoute.characterGuide === 'mango' ? 'text-amber-800' :
                selectedRoute.characterGuide === 'janggun' ? 'text-slate-800' :
                selectedRoute.characterGuide === 'nabi' ? 'text-sky-800' :
                selectedRoute.characterGuide === 'bori' ? 'text-teal-800' :
                'text-pink-800'
              }`}>{CHARACTERS[selectedRoute.characterGuide].name} 가이드님의 한마디:</span>
              <p className="italic text-stone-700/95 font-bold leading-relaxed pr-1 text-[11px]">
                “{selectedNode.characterComment || "이곳에 맛 좋은 도토리가 분명 숨어있다냥! 한번 발길을 멈춰 구경해보자냥!"}”
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Neighborhood & Landmark Pin Search & Filters */}
      <div className="w-full flex flex-col gap-3.5 bg-white border border-cream-border p-4.5 rounded-[28px] shadow-sm" id="map-pins-explorer-hud">
        {/* Region Chooser Title & Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">📍</span>
            <div className="flex flex-col">
              <h4 className="text-[12.5px] font-black text-warm-gray-dark leading-none">동네 반려 안심 스팟 탐색</h4>
              <span className="text-[9.5px] font-medium text-warm-gray mt-1">우리 동네의 공원, 수거함, 동반카페 인프라 핀</span>
            </div>
          </div>

          {/* Region Buttons */}
          <div className="flex flex-wrap gap-1.5" id="region-pills">
            {(Object.keys(REGION_CENTERS) as Array<keyof typeof REGION_CENTERS>).map((regKey) => {
              const active = activeRegion === regKey;
              return (
                <button
                  key={regKey}
                  type="button"
                  onClick={() => handleRegionChange(regKey)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-500/10 text-amber-700 border-2 border-amber-500/40 shadow-xs'
                      : 'bg-cream-accent/40 text-warm-gray border-2 border-transparent hover:bg-cream-accent/80'
                  }`}
                >
                  {regKey === 'seongnam' ? '🏙️ 성남시 전체' :
                   regKey === 'ilsan' ? '🌳 일산 덕이동' :
                   regKey === 'bucheon' ? '🏘️ 부천 범안로' :
                   '⛲ 서울숲'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider line */}
        <div className="w-full h-px bg-[#F5EFE1]" />

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5" id="category-pills">
          <span className="text-[9.5px] font-black text-warm-gray-dark shrink-0 font-sans">필터:</span>
          <div className="flex gap-1.5 overflow-x-auto">
            {[
              { id: 'ALL', emoji: '✨', label: '전체' },
              { id: 'PARK', emoji: '🌳', label: '공원' },
              { id: 'TOILET', emoji: '💩', label: '배변위생' },
              { id: 'CAFE', emoji: '☕', label: '동반카페' },
              { id: 'PET_STORE', emoji: '🛒', label: '용품상점' },
              { id: 'HOSPITAL', emoji: '🏥', label: '동물병원' },
              { id: 'GROOMING', emoji: '✂️', label: '미용스파' },
            ].map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id as any);
                    setSelectedPin(null);
                  }}
                  className={`px-3 py-1.2 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                    active
                      ? 'bg-neutral-900 text-white shadow-soft scale-102'
                      : 'bg-[#FDFBF7] text-warm-gray-dark border border-cream-border hover:bg-cream-accent'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Real World Location Pin Detail Dialog Panel */}
      {selectedPin && (
        <div
          id="location-pin-detail-bubble"
          className="p-4 bg-cream-accent/85 rounded-3xl border border-cream-border flex flex-col gap-3.5 shadow-soft transition-all relative animate-[fadeIn_0.3s_ease-out]"
        >
          {/* Close bubble button */}
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

            <span className={`px-2.5 py-1 text-[8.5px] font-black rounded-lg shrink-0 ${
              selectedPin.category === 'PARK' ? 'bg-emerald-100 text-emerald-800' :
              selectedPin.category === 'TOILET' ? 'bg-amber-100 text-amber-800' :
              selectedPin.category === 'CAFE' ? 'bg-rose-100 text-rose-800' :
              selectedPin.category === 'PET_STORE' ? 'bg-sky-100 text-sky-800' :
              selectedPin.category === 'HOSPITAL' ? 'bg-red-100 text-red-800' :
              'bg-indigo-100 text-indigo-800'
            }`}>
              {getPinCategoryLabel(selectedPin.category)}
            </span>
          </div>

          <p className="text-[11.5px] text-warm-gray leading-relaxed font-sans font-semibold">
            {selectedPin.description}
          </p>

          {/* Key tags (leash, parking, indoor, etc.) */}
          <div className="flex flex-wrap gap-1.5">
            {selectedPin.dogSizeAllowed && (
              <span className="text-[9.5px] font-bold bg-white text-stone-600 px-2.5 py-1 rounded-xl border border-stone-200">
                🐶 {selectedPin.dogSizeAllowed}
              </span>
            )}
            {selectedPin.indoorAllowed !== undefined && (
              <span className="text-[9.5px] font-bold bg-white text-stone-600 px-2.5 py-1 rounded-xl border border-stone-200">
                🏠 {selectedPin.indoorAllowed ? '실내 동반 허용' : '야외/테라스만 허용'}
              </span>
            )}
            {selectedPin.parkingAvailable !== undefined && (
              <span className="text-[9.5px] font-bold bg-white text-stone-600 px-2.5 py-1 rounded-xl border border-stone-200">
                🚗 {selectedPin.parkingAvailable ? '주차 가능' : '주차 불가'}
              </span>
            )}
            {selectedPin.leashRequired !== undefined && (
              <span className="text-[9.5px] font-bold bg-white text-stone-600 px-2.5 py-1 rounded-xl border border-[#FAEFDF]/70">
                🦮 {selectedPin.leashRequired ? '목줄 필수 착용' : '오프리쉬 구역'}
              </span>
            )}
            {selectedPin.reservationRequired !== undefined && (
              <span className="text-[9.5px] font-bold bg-white text-stone-600 px-2.5 py-1 rounded-xl border border-stone-200">
                📅 {selectedPin.reservationRequired ? '사전 예약 필수' : '예약 없음'}
              </span>
            )}
          </div>

          {selectedPin.notes && (
            <div className="text-[10.5px] text-amber-850 bg-amber-500/5 p-2.5 rounded-2xl border border-amber-500/10 leading-relaxed font-semibold">
              💡 <span className="text-warm-gray-dark font-black">이용 수칙:</span> {selectedPin.notes}
            </div>
          )}

          {/* Character Dialogue Overlay */}
          {(() => {
            const mascotObj = getMascotCommentForPin(selectedPin.category);
            const guideChar = CHARACTERS[mascotObj.guide as any] || CHARACTERS['bori'];
            return (
              <div className={`p-3 rounded-2xl border-2 text-[10.5px] text-warm-gray-dark leading-relaxed flex gap-2.5 items-start shadow-inner transition-all duration-300 ${
                guideChar.id === 'mango' ? 'bg-[#FFF9EE] border-amber-400/75' :
                guideChar.id === 'janggun' ? 'bg-[#F2F4F7] border-[#CFD4DC]' :
                guideChar.id === 'nabi' ? 'bg-[#F0F8FF] border-[#B9D9FA]' :
                guideChar.id === 'bori' ? 'bg-[#F0FAF7] border-emerald-300/80' :
                'bg-[#FCF5FC] border-pink-300/85'
              }`}>
                <div className="relative flex-shrink-0">
                  {guideChar.avatarImage ? (
                    <img src={guideChar.avatarImage} alt={guideChar.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-xl object-cover border border-slate-200/50 shadow-xs animate-bounce block" />
                  ) : (
                    <span className="text-2xl flex-shrink-0 animate-bounce block">{guideChar.avatarEmoji}</span>
                  )}
                  <span className="absolute -bottom-1 -right-1 text-[9px] bg-white rounded-full p-0.2 border shadow-xs">💬</span>
                </div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <span className={`font-black uppercase tracking-wide text-[9.5px] ${
                    guideChar.id === 'mango' ? 'text-amber-800' :
                    guideChar.id === 'janggun' ? 'text-slate-800' :
                    guideChar.id === 'nabi' ? 'text-sky-800' :
                    guideChar.id === 'bori' ? 'text-emerald-800' :
                    'text-pink-800'
                  }`}>{guideChar.name} 선배님의 리얼 가이드:</span>
                  <p className="italic text-stone-700/95 font-bold leading-relaxed pr-1 text-[11.2px]">
                    “{mascotObj.comment}”
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
