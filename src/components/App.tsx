import React, { useState, useEffect, useMemo } from 'react';
import { Route, FilterState, ActiveWalk, Checkpoint, PetCharacterType, LocationPin } from './types';
import { INITIAL_ROUTES, CHARACTERS, REGIONS, EVENTS_POOL } from './data';
import { LOCATION_PINS } from './pinsData';
import { buildRecommendedUiRoutes } from './utils/routeRecommend';
import {
  SearchBox,
  CategoryFilter,
  DogConditionFilter,
  RadiusFilter,
  RegionFilter,
  PurposeSelector
} from './components/SearchFilters';
import { RouteCard } from './components/RouteCard';
import { AiRoutePanel } from './components/AiRoutePanel';
import { MapView } from './components/MapView';
import { RouteDirectionsPanel } from './components/RouteDirectionsPanel';
import {
  Sparkles,
  Compass,
  Trophy,
  Zap,
  Award,
  Heart,
  Footprints,
  Flame,
  Undo2,
  Calendar,
  Gift,
  MapPin,
  Smile,
  LogOut,
  Cat,
  Share2,
  Home,
  Map,
  MessageSquare,
  User,
  Filter,
  Check
} from 'lucide-react';



interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  awardedAt?: string;
}
const DEFAULT_CHARACTER_ID: PetCharacterType = 'mango';

const DEFAULT_USER_PROFILE = {
  level: 1,
  exp: 15,
  coins: 45,
  totalStepsAccumulated: 8400,
  badges: ['cheesy_starter', 'rose_pioneer'] as string[]
};

function getSafeCharacterId(characterId?: string | null): PetCharacterType {
  if (
    characterId &&
    Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)
  ) {
    return characterId as PetCharacterType;
  }

  return DEFAULT_CHARACTER_ID;
}

function getSafeCharacter(characterId?: string | null) {
  return CHARACTERS[getSafeCharacterId(characterId)];
}

function normalizeUserProfile(profile: any) {
  return {
    ...DEFAULT_USER_PROFILE,
    ...(profile ?? {}),
    level: Number(profile?.level ?? DEFAULT_USER_PROFILE.level),
    exp: Number(profile?.exp ?? DEFAULT_USER_PROFILE.exp),
    coins: Number(profile?.coins ?? DEFAULT_USER_PROFILE.coins),
    totalStepsAccumulated: Number(
      profile?.totalStepsAccumulated ??
        profile?.totalSteps ??
        DEFAULT_USER_PROFILE.totalStepsAccumulated
    ),
    badges: Array.isArray(profile?.badges)
      ? profile.badges
      : DEFAULT_USER_PROFILE.badges
  };
}

function normalizeRoute(
  route: Partial<Route> | null | undefined,
  fallback: Route = INITIAL_ROUTES[0]
): Route {
  const sourceRoute = route ?? {};
  const safeCharacterId = getSafeCharacterId(
    (sourceRoute as { characterGuide?: string }).characterGuide
  );

  return {
    ...fallback,
    ...sourceRoute,
    id:
      sourceRoute.id ||
      `route_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name:
      sourceRoute.name ||
      (sourceRoute as { title?: string }).title ||
      'AI 맞춤 산책 루트',
    description:
      sourceRoute.description ||
      fallback.description ||
      'AI가 현재 조건과 선택한 가이드에 맞춰 생성한 산책 루트입니다.',
    region: sourceRoute.region || fallback.region || '크림빌리지',
    category: sourceRoute.category || fallback.category,
    purpose: sourceRoute.purpose || fallback.purpose,
    difficulty: sourceRoute.difficulty || fallback.difficulty,
    distance: sourceRoute.distance ?? fallback.distance ?? 1,
    duration: sourceRoute.duration ?? fallback.duration ?? 20,
    tags: Array.isArray(sourceRoute.tags) ? sourceRoute.tags : fallback.tags ?? [],
    coordinates: Array.isArray(sourceRoute.coordinates)
      ? sourceRoute.coordinates
      : fallback.coordinates ?? [],
    checkpoints: Array.isArray(sourceRoute.checkpoints)
      ? sourceRoute.checkpoints
      : fallback.checkpoints ?? [],
    characterGuide: safeCharacterId,
  } as Route;
}

function normalizeRoutes(routesCandidate: unknown): Route[] {
  if (!Array.isArray(routesCandidate)) {
    return INITIAL_ROUTES.map((route, index) =>
      normalizeRoute(route, INITIAL_ROUTES[index] ?? INITIAL_ROUTES[0])
    );
  }

  const normalizedRoutes = routesCandidate
    .map((route, index) =>
      normalizeRoute(
        route as Partial<Route>,
        INITIAL_ROUTES[index] ?? INITIAL_ROUTES[0]
      )
    )
    .filter((route) => Boolean(route.id));

  return normalizedRoutes.length > 0
    ? normalizedRoutes
    : INITIAL_ROUTES.map((route, index) =>
        normalizeRoute(route, INITIAL_ROUTES[index] ?? INITIAL_ROUTES[0])
      );
}

const REAL_REGION_FILTERS = [
  { label: '전체 구역', region: '전체동네' },
  { label: '성남·가천대', region: '성남시 전체' },
  { label: '일산 덕이동', region: '일산 덕이동' },
  { label: '부천 범안로', region: '부천 범안로' },
  { label: '서울숲', region: '서울숲' },
];

const GUIDE_FILTER_PRESETS: Record<PetCharacterType, Pick<FilterState, 'category' | 'purpose' | 'region'>> = {
  mango: { category: 'adventure', purpose: 'afternoon', region: '성남시 전체' },
  janggun: { category: 'quiet', purpose: 'morning', region: '성남시 전체' },
  nabi: { category: 'sensory', purpose: 'morning', region: '성남시 전체' },
  bori: { category: 'nature', purpose: 'sunset', region: '성남시 전체' },
  mungchi: { category: 'adventure', purpose: 'night', region: '성남시 전체' },
};

function getPinTextForRegion(pin: LocationPin): string {
  return [pin.id, pin.name, pin.address, pin.description, pin.notes].join(' ').toLowerCase();
}

function pinMatchesCurrentRegion(pin: LocationPin, region: string): boolean {
  const text = getPinTextForRegion(pin);

  if (!region || region === '전체동네') {
    return true;
  }

  if (region.includes('덕이') || region.includes('일산')) {
    return text.includes('덕이') || text.includes('일산') || text.includes('고양') || text.includes('탄현') || text.includes('dukyi');
  }

  if (region.includes('부천') || region.includes('범안')) {
    return text.includes('부천') || text.includes('범안') || text.includes('bucheon');
  }

  if (region.includes('서울숲')) {
    return text.includes('서울숲') || text.includes('seoul');
  }

  return text.includes('성남') || text.includes('가천') || text.includes('복정') || text.includes('태평') || text.includes('수진') || text.includes('탄천') || text.includes('gachon') || text.includes('seongnam');
}

function formatRouteDistance(distance: number): string {
  if (!Number.isFinite(distance)) {
    return '0.00';
  }

  const safeDistance = distance >= 100 ? distance / 1000 : distance;

  return safeDistance.toFixed(safeDistance < 10 ? 2 : 1);
}

function getRouteHeroImage(route: Route): string {
  if (route.category === 'quiet') {
    return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop';
  }

  if (route.category === 'nature') {
    return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop';
  }

  if (route.category === 'sensory') {
    return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop';
  }

  return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop';
}


export default function App() {
  // 1. AI/custom routes are stored separately. Default route cards are generated from real pins.
  const [generatedRoutes, setGeneratedRoutes] = useState<Route[]>(() => {
    const saved = localStorage.getItem('dog_adventure_routes');

    if (saved) {
      try {
        return normalizeRoutes(JSON.parse(saved)).filter((route) =>
          route.id.startsWith('ai-') || route.id.startsWith('gemini')
        );
      } catch (e) {
        return [];
      }
    }

    return [];
  });

  // 2. State for active selection
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route_1');

  // 3. Filters
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'all',
    dogCondition: {
      stamina: 'mid',
      joints: 'normal',
      social: 'friendly'
    },
    radius: 1000,
    region: '전체동네',
    purpose: 'all'
  });


  const recommendedRoutes = useMemo(() => {
    return buildRecommendedUiRoutes({
      pins: LOCATION_PINS,
      filters,
    });
  }, [filters]);

  const routes = useMemo(() => {
    return [...generatedRoutes, ...recommendedRoutes];
  }, [generatedRoutes, recommendedRoutes]);

  const visiblePinsForRegion = useMemo(() => {
    return LOCATION_PINS.filter((pin) => pinMatchesCurrentRegion(pin, filters.region));
  }, [filters.region]);

  const visibleParkCount = visiblePinsForRegion.filter((pin) => pin.category === 'PARK').length;
  const visibleToiletCount = visiblePinsForRegion.filter((pin) => pin.category === 'TOILET').length;

  useEffect(() => {
    if (routes.length === 0) {
      return;
    }

    if (!routes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  // 4. Active Walk Status
  const [activeWalk, setActiveWalk] = useState<ActiveWalk>({
    isWalking: false,
    routeId: '',
    progress: 0,
    checkpointIndex: 0,
    totalSteps: 0,
    coinsCount: 0,
    eventsLog: [],
    durationSeconds: 0,
    completed: false
  });

  // 5. User Achievement Profile (Level, coins, badges) with Local Storage persistence
const [userProfile, setUserProfile] = useState(() => {
  const saved = localStorage.getItem('dog_adventure_user_profile');

  if (saved) {
    try {
      return normalizeUserProfile(JSON.parse(saved));
    } catch (e) {
      return DEFAULT_USER_PROFILE;
    }
  }

  return DEFAULT_USER_PROFILE;
});

  // 10. Mungchi Celebration dialog State
  const [celebrationBadge, setCelebrationBadge] = useState<Achievement | null>(null);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const saved = localStorage.getItem('dog_adventure_onboarded_v2');
    return saved !== 'true';
  });

  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'routes' | 'community' | 'profile'>('home');

  const [focusedNpcId, setFocusedNpcId] = useState<PetCharacterType>('mango');

  // NPC dialogue configuration for interactive deck on Home tab
  const npcInteractData = {
    mango: {
      status: "골목길 전담 탐정 순찰 중 🧭 (근무지: 담벼락 골목길 ☀️)",
      quote: "이 높은 담벼락 너머에 기가 막힌 보물이 숨겨져 있는 거 알아? 내 몽실몽실한 치즈 꼬리를 따라와봐냥, 동네에서 햇살이 제일 예쁘고 따스하게 내려앉는 비밀 놀이터를 보여주겠다냥! ☀️",
      role: "비밀 골목 & 포토 스팟 찾기 대장",
      badge: "from-amber-100 to-amber-200 border-amber-300 text-amber-900",
      vitality: "🔋 컨디션 최고조 (100% 냥파워)",
      taskTitle: "🥭 [대표 퀘스트] 망고 선배의 햇살 어리숙 골목길",
      actionLabel: "망고선배와 햇살 골목 정복하러 가기 🐾",
      applyFilters: () => {
        setFilters(prev => ({
          ...prev,
          category: GUIDE_FILTER_PRESETS.mango.category,
          purpose: GUIDE_FILTER_PRESETS.mango.purpose,
          searchQuery: '',
          region: GUIDE_FILTER_PRESETS.mango.region
        }));
        setActiveTab('routes');
      }
    },
    janggun: {
      status: "안심대로 초소 보초병 🛡️ (근무지: 소리숲 푸른대로 👮)",
      quote: "허리가 찌뿌둥하거나 어린 유모차와 함께하는 마실이어도 장군 선배가 있으면 대환영이오댕! 소음 소대가 적고 바닥이 수평으로 폭신한 안심 보도블록만 발을 디디도록 앞장서서 엄호하겠댕! 🛡️",
      role: "지하지성 극복 안심 통로 대장",
      badge: "from-slate-100 to-slate-200 border-slate-300 text-slate-900",
      vitality: "🛡️ 초심자 파트너 전담 보초 (든든함 100%)",
      taskTitle: "🛡️ [대표 퀘스트] 장군 선배의 가로수 안전 인도",
      actionLabel: "장군선배 늠름하게 보좌받고 출발하기 🐾",
      applyFilters: () => {
        setFilters(prev => ({
          ...prev,
          category: GUIDE_FILTER_PRESETS.janggun.category,
          purpose: GUIDE_FILTER_PRESETS.janggun.purpose,
          searchQuery: '',
          region: GUIDE_FILTER_PRESETS.janggun.region
        }));
        setActiveTab('routes');
      }
    },
    nabi: {
      status: "바스락 비밀 기지 낙엽 은닉 🎁 (근무지: 노랑햇살 아케이드 🍂)",
      quote: "헤헤! 꺄악! 낙엽을 한 벌 힘껏 뭉쳐 밟으면 바스락바스락 노래 소리가 온 동네에 울려퍼진다냥! 낙엽 요새 속에 보물 골드코인을 잔뜩 뒤섞어 놨지롱! 빨랑 발바닥을 들이밀고 킁킁 찾아봐냥냥! 🦋",
      role: "돌발 모험 & 밤낮 보물 가이드",
      badge: "from-sky-100 to-sky-200 border-sky-300 text-sky-900",
      vitality: "🧩 장난 에너지 무한대 (꺄아 100%)",
      taskTitle: "🎁 [대표 퀘스트] 나비 선배의 도토리 낙엽 연주회",
      actionLabel: "나비선배와 무지개 낙엽 밟고 전진하기 🐾",
      applyFilters: () => {
        setFilters(prev => ({
          ...prev,
          category: GUIDE_FILTER_PRESETS.nabi.category,
          purpose: GUIDE_FILTER_PRESETS.nabi.purpose,
          searchQuery: '',
          region: GUIDE_FILTER_PRESETS.nabi.region
        }));
        setActiveTab('routes');
      }
    },
    bori: {
      status: "솔비누 평원 사색 정거장 🌾 (근무지: 속삭임 정원 🍃)",
      quote: "숨을 지그시 들이마셔서 신선한 피톤치드 흙의 축사 냄새를 맡아보댕... 발바닥 너머에서 따뜻한 위로가 피어납니다. 풍경의 노랫소리에 가만히 귀를 세우고 솔바람을 감상하는 안식이개. 🌾",
      role: "풀밭 치유 & 가슴 뻥 힐링 대장",
      badge: "from-emerald-100 to-emerald-200 border-emerald-300 text-emerald-900",
      vitality: "🕊️ 웰빙 천사 정신력 치유 (행복 150%)",
      taskTitle: "🌾 [대표 퀘스트] 보리 선배의 흙내음 사색 정원",
      actionLabel: "보리선배와 풀벌레 읊조리며 힐링하기 🐾",
      applyFilters: () => {
        setFilters(prev => ({
          ...prev,
          category: GUIDE_FILTER_PRESETS.bori.category,
          purpose: GUIDE_FILTER_PRESETS.bori.purpose,
          searchQuery: '',
          region: GUIDE_FILTER_PRESETS.bori.region
        }));
        setActiveTab('routes');
      }
    },
    mungchi: {
      status: "불꽃 고구마 사관학교 기상 ⚡ (근무지: 번개 언덕 광장 🏋️)",
      quote: "지체할 틈이 1초도 없다멍! 헉헉 숨차게 고개길 계단을 성큼성큼 뛰어넘어 보면 온몸에 엔도르핀 번개가 충용된다멍! 나와 함께 은하수 노을 정상에서 세리머니 골드 뱃지를 당차게 거머쥐자멍!! ⚡",
      role: "지치지 않는 뽀짝 체력 대장",
      badge: "from-rose-100 to-rose-200 border-rose-300 text-rose-900",
      vitality: "⚡ 전설의 에너자이저 번개엔진 (체력 200%)",
      taskTitle: "⚡ [대표 퀘스트] 뭉치의 번개 충전 불꽃 등산로",
      actionLabel: "뭉치선배 지적에 맞춰 번갯불 고개 넘기 🐾",
      applyFilters: () => {
        setFilters(prev => ({
          ...prev,
          category: GUIDE_FILTER_PRESETS.mungchi.category,
          purpose: GUIDE_FILTER_PRESETS.mungchi.purpose,
          searchQuery: '',
          region: GUIDE_FILTER_PRESETS.mungchi.region
        }));
        setActiveTab('routes');
      }
    }
  };

  const [communityPosts, setCommunityPosts] = useState(() => {
    const saved = localStorage.getItem('dog_adventure_posts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'post_1', sender: '망고 집사 🐾', time: '10분 전', text: '오늘 날씨가 좋아서 크림빌리지 장미길 뒤쪽 비밀골목 갔는데, 햇살 듬뿍 받으며 졸고 있는 대장 망고 선배를 직접 만났습니다! 묘생샷 한 컷 찍었어요 🐱♥' },
      { id: 'post_2', sender: '해피 파파 🐕', time: '1시간 전', text: '장군이 추천 코스는 역시 인도 폭이 넓어서 가슴이 뻥 뚫리네요! 유모차 끌고 가시는 분들한테도 완전 강추입니다!' },
      { id: 'post_3', sender: '초코 마미 🐩', time: '2시간 전', text: '뭉치 소대장 번개 파워 진짜 대단해요 ⚡ 고구마 언덕 정복하고 다리 후들거렸지만 완주 칭호 받고 완전 감동받았습니다!! 다들 보물 상자 꼭 열고 오셔요!' }
    ];
  });

  const [newPostText, setNewPostText] = useState('');

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    const newPost = {
      id: `post_${Date.now()}`,
      sender: '나의 모험견공 🐾',
      time: '방금 전',
      text: newPostText.trim()
    };
    const updated = [newPost, ...communityPosts];
    setCommunityPosts(updated);
    localStorage.setItem('dog_adventure_posts', JSON.stringify(updated));
    setNewPostText('');
  };

  const handleDismissOnboarding = () => {
    localStorage.setItem('dog_adventure_onboarded_v2', 'true');
    setShowOnboarding(false);
  };

  // Persistence hooks
  useEffect(() => {
    localStorage.setItem('dog_adventure_routes', JSON.stringify(generatedRoutes));
  }, [generatedRoutes]);

  // Removed fake walking simulation. The app now shows route information only.

  const selectedRoute = normalizeRoute(
  routes.find((route) => route.id === selectedRouteId),
  routes[0] ?? INITIAL_ROUTES[0]
);

  // Callback to append route created by Gemini
  const handleRouteGenerated = (newRoute: Route) => {
    const safeRoute = normalizeRoute(newRoute);

    setGeneratedRoutes((prev) => [safeRoute, ...normalizeRoutes(prev)]);
    setSelectedRouteId(safeRoute.id);
    setActiveTab('routes');
  };

  // Filter routes based on states
  const filteredRoutes = routes.filter(route => {
    // Search query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchesSearch = (route.name ?? '').toLowerCase().includes(q) ||
                            (route.description ?? '').toLowerCase().includes(q) ||
                            (route.region ?? '').toLowerCase().includes(q) ||
                            (route.tags ?? []).some(t => t.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    // Category
    if (filters.category !== 'all' && route.category !== filters.category) {
      return false;
    }

    // Purpose
    if (filters.purpose !== 'all' && route.purpose !== filters.purpose) {
      return false;
    }

    // Region
    if (filters.region !== '전체동네' && route.region !== filters.region) {
      return false;
    }

    // Dog condition joint health requirements
    if (filters.dogCondition.joints === 'needed_care' && route.difficulty === 'challenge') {
      return false; // Extreme hills not allowed for special care pets
    }

    return true;
  });

  useEffect(() => {
    if (activeWalk.isWalking || filteredRoutes.length === 0) {
      return;
    }

    if (!filteredRoutes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(filteredRoutes[0].id);
    }
  }, [filteredRoutes, selectedRouteId, activeWalk.isWalking]);

  const homeRecommendedRoutes = (filteredRoutes.length > 0 ? filteredRoutes : routes).slice(0, 2);
  const primaryHomeRoute = homeRecommendedRoutes[0] ?? routes[0] ?? normalizeRoute(null);
  const primaryHomeGuide = getSafeCharacter(primaryHomeRoute.characterGuide);

  // The previous fake walking mode has been removed.
  const handleStartWalkToggle = () => {
    setSelectedRouteId(selectedRoute.id);
    setActiveTab('routes');
  };

  const handleAdvanceWalk = () => {};

  const handleCompleteWalk = () => {};

  const handleTriggerRandomEvent = () => {};

  // Reset AI-generated routes only. Static gamification records were removed.
  const handleResetProfile = () => {
    if (window.confirm("생성된 AI 루트와 임시 저장 데이터를 초기화할까요?")) {
      setGeneratedRoutes([]);
      localStorage.removeItem('dog_adventure_routes');
      const freshRoutes = buildRecommendedUiRoutes({ pins: LOCATION_PINS, filters });
      setSelectedRouteId(freshRoutes[0]?.id ?? '');
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-warm-gray-dark flex flex-col font-sans" id="main-app-container">
      
      {/* 1. Header Banner */}
      <header className="bg-white/80 backdrop-blur-md border-b-2 border-cream-border/60 sticky top-0 z-40 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pastel-orange to-amber-500 shadow-soft flex items-center justify-center text-white flex-shrink-0 animate-pulse">
              <Compass className="animate-spin-slow stroke-[2.2]" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-warm-gray-dark font-sans leading-none">
                  크림빌리지 댕냥 모험길 🧭
                </h1>
                <span className="text-[9.5px] bg-pastel-orange-soft text-pastel-orange border border-[#FFE8DA] px-2 py-0.5 rounded-full font-black">
                  감성 정거장
                </span>
                <button
                  type="button"
                  id="toggle-guidebook-btn"
                  onClick={() => setShowOnboarding(prev => !prev)}
                  className="text-[9.5px] bg-cream-accent hover:bg-[#F3E6D5] text-[#904414] border border-[#FAEFDF] px-2.5 py-0.5 rounded-full font-black ml-1.5 cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span>📖 대장 가이드북</span>
                  <span className="text-[8px] bg-white text-pastel-orange px-1 py-[0.5px] rounded-full">{showOnboarding ? "ON" : "OFF"}</span>
                </button>
              </div>
              <p className="text-[11px] text-warm-gray font-semibold mt-1">
                “발걸음마다 이야기가 피어나는 동네 산책 보물찾기” — 뭉치 소대와 친구들
              </p>
            </div>
          </div>

          {/* Real data summary HUD */}
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap" id="data-summary-hud">
            <div className="bg-pastel-orange-soft/40 px-3.5 py-2 rounded-2xl border-2 border-[#FFE8DA] flex items-center gap-2 shadow-xs">
              <MapPin size={15} className="text-[#BD4C15] stroke-[2.5]" />
              <div className="flex flex-col">
                <span className="text-[8px] text-warm-gray/70 uppercase font-black leading-none">표시 가능 장소</span>
                <span className="text-xs font-black text-[#D55F1B] leading-none mt-1">
                  {visiblePinsForRegion.length} <span className="font-semibold text-[9.5px]">곳</span>
                </span>
              </div>
            </div>

            <div className="bg-pastel-mint-soft px-3.5 py-2 rounded-2xl border-2 border-[#DCEFEA] flex items-center gap-2 shadow-xs">
              <span className="text-base">🌳</span>
              <div className="flex flex-col">
                <span className="text-[8px] text-[#1D7F5F] uppercase font-black leading-none">공원·산책 지점</span>
                <span className="text-xs font-black text-[#136C4E] leading-none mt-1">
                  {visibleParkCount} <span className="font-semibold text-[9.5px]">곳</span>
                </span>
              </div>
            </div>

            <div className="bg-white px-3.5 py-2 rounded-2xl border-2 border-cream-border flex items-center gap-2 shadow-xs">
              <span className="text-base">💩</span>
              <div className="flex flex-col">
                <span className="text-[8px] text-warm-gray/70 uppercase font-black leading-none">배변처리 후보</span>
                <span className="text-xs font-black text-warm-gray-dark leading-none mt-1">
                  {visibleToiletCount} <span className="font-semibold text-[9.5px]">곳</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Onboarding Sticker Passport Booklet */}
      {showOnboarding && (
        <section
          id="onboarding-sticker-passport"
          className="max-w-7xl mx-auto px-5 pt-6 w-full animate-[fadeIn_0.4s_ease-out]"
        >
          <div className="bg-[#FFFDF9] border-2 border-dashed border-[#F3E6D5] rounded-[36px] p-6 sm:p-8 shadow-soft flex flex-col gap-6 relative overflow-hidden">
            {/* Background elements to represent a sticker collection book */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFEEDD] rounded-full blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#E1F7F4] rounded-full blur-3xl opacity-50 pointer-events-none" />

            {/* Header of sticker notebook */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F3E6D5]/60 pb-4 z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📒</span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-warm-gray-dark flex items-center gap-1.5 leading-none">
                    우리 동네 다섯 대장 수첩 <span className="text-xs bg-[#FBF0E1] text-[#904414] border border-[#ECD2BE] px-2 py-0.5 rounded-md">스티커 도감</span>
                  </h2>
                  <p className="text-[11px] text-warm-gray mt-1.5 font-semibold">
                    다섯 대장 스티커를 확인해보세요! 동네 산책의 안전, 감성, 보물을 지탱해 준다냥.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissOnboarding}
                className="self-start sm:self-center bg-[#D55F1B] hover:bg-orange-600 text-white text-[11px] font-black px-4 py-2.5 rounded-full shadow-soft hover:shadow-lg transition-all btn-squishy cursor-pointer select-none leading-none flex items-center gap-1.5 z-10"
              >
                <span>인증 확인! 모험 출발하기 🐾</span>
              </button>
            </div>

            {/* Stickers Grid Row */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4.5 z-10">
              
              {/* Sticker 1: Mango */}
              <div className="bg-[#FFF9EE] border border-[#FAEFDF] rounded-3xl p-4.5 flex flex-col items-center text-center gap-2.5 relative group hover:shadow-soft transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-2.5 right-2.5 text-xs opacity-30 group-hover:opacity-100 transition-opacity">🐈</div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-300 to-orange-400 p-0.5 shadow-md flex items-center justify-center text-2xl animate-pulse overflow-hidden">
                  <div className="bg-white rounded-full w-full h-full flex items-center justify-center overflow-hidden">
                    {CHARACTERS.mango.avatarImage ? (
                      <img src={CHARACTERS.mango.avatarImage} alt="망고" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      "🐱"
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-amber-700 font-extrabold bg-[#FFF1DE] px-2 py-0.5 rounded-md uppercase font-accent">추천 장소 담당</span>
                  <h3 className="text-xs font-black text-warm-gray-dark mt-1.5">대장 망고 선배</h3>
                  <p className="text-[10.5px] text-warm-gray mt-1 leading-relaxed font-semibold">
                    “나를 따라오면 담장 햇살이 가장 예쁜 묘생샷 스팟을 주겠다냥!”
                  </p>
                </div>
              </div>

              {/* Sticker 2: Janggun */}
              <div className="bg-[#F2F4F7] border border-[#E1E5EB] rounded-3xl p-4.5 flex flex-col items-center text-center gap-2.5 relative group hover:shadow-soft transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-2.5 right-2.5 text-xs opacity-30 group-hover:opacity-100 transition-opacity">🛡️</div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-600 to-slate-800 p-0.5 shadow-md flex items-center justify-center text-2xl overflow-hidden">
                  <div className="bg-white rounded-full w-full h-full flex items-center justify-center overflow-hidden">
                    {CHARACTERS.janggun.avatarImage ? (
                      <img src={CHARACTERS.janggun.avatarImage} alt="장군" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      "🐶"
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-slate-700 font-extrabold bg-[#E2E8F0] px-2 py-0.5 rounded-md uppercase font-accent">안전 경로 안내</span>
                  <h3 className="text-xs font-black text-warm-gray-dark mt-1.5">대장 장군 선배</h3>
                  <p className="text-[10.5px] text-warm-gray mt-1 leading-relaxed font-semibold">
                    “수평 보도블록이나 저상 안심 횡담보도를 안내해주니 안전하다댕!”
                  </p>
                </div>
              </div>

              {/* Sticker 3: Nabi */}
              <div className="bg-[#F0F8FF] border border-[#D7E6F5] rounded-3xl p-4.5 flex flex-col items-center text-center gap-2.5 relative group hover:shadow-soft transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-2.5 right-2.5 text-xs opacity-30 group-hover:opacity-100 transition-opacity">🦋</div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-400 p-0.5 shadow-md flex items-center justify-center text-2xl overflow-hidden">
                  <div className="bg-white rounded-full w-full h-full flex items-center justify-center overflow-hidden">
                    {CHARACTERS.nabi.avatarImage ? (
                      <img src={CHARACTERS.nabi.avatarImage} alt="나비" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      "🐈‍⬛"
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-sky-800 font-extrabold bg-[#EBF8FF] px-2 py-0.5 rounded-md uppercase font-accent">숨은 루트 발견</span>
                  <h3 className="text-xs font-black text-warm-gray-dark mt-1.5">대장 나비 선배</h3>
                  <p className="text-[10.5px] text-warm-gray mt-1 leading-relaxed font-semibold">
                    “덤불 속 기절초풍 상자랑 바스락 도토리들을 낙엽에 가득 묻었다냥!”
                  </p>
                </div>
              </div>

              {/* Sticker 4: Bori */}
              <div className="bg-[#F0FAF7] border border-[#D3EDE2] rounded-3xl p-4.5 flex flex-col items-center text-center gap-2.5 relative group hover:shadow-soft transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-2.5 right-2.5 text-xs opacity-30 group-hover:opacity-100 transition-opacity">🌾</div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 p-0.5 shadow-md flex items-center justify-center text-2xl overflow-hidden">
                  <div className="bg-white rounded-full w-full h-full flex items-center justify-center overflow-hidden">
                    {CHARACTERS.bori.avatarImage ? (
                      <img src={CHARACTERS.bori.avatarImage} alt="보리" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      "🐕‍🦺"
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-800 font-extrabold bg-[#E6FFFA] px-2 py-0.5 rounded-md uppercase font-accent">감성 메시지</span>
                  <h3 className="text-xs font-black text-warm-gray-dark mt-1.5">대장 보리 선배</h3>
                  <p className="text-[10.5px] text-warm-gray mt-1 leading-relaxed font-semibold">
                    “폭신폭신한 흙과 풀밭 향기를 들려주며 마음의 치유 한소절을 읊조린다댕.”
                  </p>
                </div>
              </div>

              {/* Sticker 5: Mungchi */}
              <div className="bg-[#FCF5FC] border border-[#F1DDF3] rounded-3xl p-4.5 flex flex-col items-center text-center gap-2.5 relative group hover:shadow-soft transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-2.5 right-2.5 text-xs opacity-30 group-hover:opacity-100 transition-opacity">⚡</div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-400 to-pink-550 p-0.5 shadow-md flex items-center justify-center text-2xl overflow-hidden">
                  <div className="bg-white rounded-full w-full h-full flex items-center justify-center overflow-hidden">
                    {CHARACTERS.mungchi.avatarImage ? (
                      <img src={CHARACTERS.mungchi.avatarImage} alt="뭉치" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      "🐩"
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-pink-800 font-extrabold bg-[#FCF5FC] px-2 py-0.5 rounded-md uppercase font-accent">산책 완주 축하</span>
                  <h3 className="text-xs font-black text-warm-gray-dark mt-1.5">소대장 뭉치 선배</h3>
                  <p className="text-[10.5px] text-warm-gray mt-1 leading-relaxed font-semibold">
                    “칼로리와 언덕 돌파하고 돌아봐라멍! 번쩍번쩍 배지 수첩 축하잔치가 열린다멍!”
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {activeTab === 'routes' && (
        <main className="max-w-7xl mx-auto px-5 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6" id="main-content-layout">
        
        {/* Left column (Bento filter state & input forms + Cards List) */}
        <div className="lg:col-span-5 flex flex-col gap-6 min-w-0" id="left-column">
          
          {/* Bento Selector Panel */}
          <section className="bg-white p-5 rounded-[32px] border-2 border-cream-board/60 flex flex-col gap-5 shadow-soft" id="interactive-selectors">
            <h2 className="text-sm font-black text-warm-gray-dark flex items-center gap-2 tracking-wide font-sans pl-0.5">
              <Smile size={16} className="text-pastel-orange stroke-[2.5]" /> 마음에 쏙 드는 모험 필터 맞춤
            </h2>

            <SearchBox filters={filters} setFilters={setFilters} />
            <CategoryFilter filters={filters} setFilters={setFilters} />
            <DogConditionFilter filters={filters} setFilters={setFilters} />
            <RadiusFilter filters={filters} setFilters={setFilters} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <RegionFilter filters={filters} setFilters={setFilters} />
              <PurposeSelector filters={filters} setFilters={setFilters} />
            </div>
          </section>

          {/* AI Generative Assistant Panel */}
          <section id="assistant-panel" className="animate-[fadeIn_0.5s_ease-out]">
            <AiRoutePanel 
              onRouteGenerated={handleRouteGenerated}
              selectedRadius={filters.radius}
              selectedPurpose={filters.purpose}
              selectedRegion={filters.region}
              preSelectedGuide={focusedNpcId}
            />
          </section>

          {/* One-Touch Neighborhood Landmark & Character Guide Index Panel */}
          <section className="bg-gradient-to-r from-cream-base to-white p-4.5 rounded-[28px] border-2 border-[#FAEFDF] shadow-soft flex flex-col gap-3.5" id="routes-quick-index-hud">
            <div>
              <h3 className="text-xs font-black text-warm-gray-dark flex items-center gap-1.5 leading-none">
                <Filter size={13} className="text-[#D55F1B] stroke-[2.5]" />
                <span>크림마을 골목/가로수 인덱스 교환수첩</span>
              </h3>
              <p className="text-[10px] text-warm-gray mt-1.5 font-semibold leading-relaxed">
                가게나 정원 등 동네 랜드마크를 터치하여 원하는 루트를 단숨에 분류하세요.
              </p>
            </div>
            
            {/* Index row 1: Neighborhood landmarks */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] text-[#A26017] font-extrabold uppercase tracking-widest pl-0.5">지역 가로수길 인덱스:</span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 w-full">
                {REAL_REGION_FILTERS.map((idx) => {
                  const isSelected = filters.region === idx.region;
                  return (
                    <button
                      key={idx.region}
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, region: idx.region }));
                      }}
                      className={`flex-shrink-0 px-3 py-1.5 border-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#FFE8DA] border-pastel-orange text-[#D55F1B] scale-103 shadow-xs' 
                          : 'bg-white border-cream-border text-warm-gray hover:border-[#F0D0B5]'
                      }`}
                    >
                      {idx.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Index row 2: Character Guides */}
            <div className="flex flex-col gap-1.5 border-t border-[#F1E5D5]/50 pt-2.5">
              <span className="text-[9px] text-[#A26017] font-extrabold uppercase tracking-widest pl-0.5">순찰대장 탐지기 인덱스:</span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar w-full">
                {[
                  { label: '전체 대장', id: 'all' },
                  { label: '🐱 망고 선배', id: 'mango' },
                  { label: '🐶 장군 선배', id: 'janggun' },
                  { label: '🐈‍⬛ 나비 선배', id: 'nabi' },
                  { label: '🐕‍🦺 보리 선배', id: 'bori' },
                  { label: '🐩 뭉치 선배', id: 'mungchi' }
                ].map((char) => {
                  const isSelected = filters.searchQuery === (char.id === 'all' ? '' : CHARACTERS[char.id]?.name);
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          searchQuery: char.id === 'all' ? '' : CHARACTERS[char.id]?.name
                        }));
                        if (char.id !== 'all') {
                          setFocusedNpcId(char.id as any);
                          const matching = routes.find(r => r.characterGuide === char.id);
                          if (matching) {
                            setSelectedRouteId(matching.id);
                          }
                        }
                      }}
                      className={`flex-shrink-0 px-3 py-1.5 border rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-100 border-[#FFBB88] text-[#904414] scale-103' 
                          : 'bg-white border-cream-border text-warm-gray hover:border-[#F0D0B5]'
                      }`}
                    >
                      {char.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Active routes selection list */}
          <section className="flex flex-col gap-3.5 mt-1" id="available-routes-list">
            <div className="flex items-center justify-between px-1.5">
              <span className="text-xs font-black text-warm-gray-dark flex items-center gap-1.5 pl-0.5">
                <Compass size={14} className="text-[#D55F1B] stroke-[2.5]" />
                <span>탐험 완주수첩 발견 목록 ({filteredRoutes.length}개)</span>
              </span>
              <span className="text-[10px] text-pastel-orange font-black bg-pastel-orange-soft border border-[#FFE8DA] px-3 py-0.5 rounded-full">
                {filters.region === '전체동네' ? '크림빌리지 전체구역' : filters.region}
              </span>
            </div>

            <div className="flex flex-col gap-3.5 max-h-[480px] overflow-y-auto pr-1.5" id="cards-scroll-stage">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={selectedRouteId === route.id}
                    onSelect={() => {
                      if (!activeWalk.isWalking) {
                        setSelectedRouteId(route.id);
                      } else if (route.id !== activeWalk.routeId) {
                        alert("🐾 모험을 진행 중인 상태에서는 지도를 전환할 수 없습니다! 모험 종료 후 시도해주세요.");
                      }
                    }}
                    onStartWalk={handleStartWalkToggle}
                    isActiveWalk={activeWalk.isWalking && activeWalk.routeId === route.id}
                  />
                ))
              ) : (
                <div className="p-8 text-center bg-[#FFFDF9] rounded-3xl border-2 border-dashed border-[#F3E6D5] flex flex-col items-center justify-center gap-3 shadow-xs">
                  <span className="text-3xl block animate-bounce">🐈🔎</span>
                  <h4 className="text-xs text-warm-gray-dark font-black">맞춤 조건의 모험 수첩을 못 찾았구냥!</h4>
                  <p className="text-[10.5px] text-warm-gray/70 leading-relaxed max-w-xs font-semibold">
                    필터를 살며시 조정해보거나, 아니면 위의 대장 가이드 탭에서 나만의 새로운 모험수첩 그리기를 눌러 맞춤 지도를 바로 받아보는 건 어떻냐냥!
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right column (Visual Map Arena + Navigation Direction Panel) */}
        <div className="lg:col-span-7 flex flex-col gap-6 min-w-0" id="right-column">
          
          {/* Map Viewer Arena */}
          <section className="bg-white p-5 rounded-[32px] border-2 border-cream-border shadow-soft flex flex-col gap-3.5" id="map-view-arena">
            <div className="flex items-center justify-between border-b border-cream-border/50 pb-2.5 px-0.5">
              <div>
                <span className="text-sm font-black text-warm-gray-dark flex items-center gap-1.5 font-sans">
                  🗺️ 실제 지도 기반 추천 루트
                </span>
                <p className="text-[10px] text-warm-gray/70">선택한 추천 루트의 실제 보행 경로와 경유지를 확인하세요.</p>
              </div>
              {selectedRoute && (
                <span className="text-[10px] bg-pastel-orange-soft border-2 border-[#FFE8DA] font-black px-3 py-1 rounded-full text-pastel-orange leading-none uppercase tracking-wide">
                  📍 {selectedRoute.region}
                </span>
              )}
            </div>

            <MapView
              selectedRoute={selectedRoute}
              activeWalk={activeWalk}
            />
          </section>

          {/* Navigation Control directions Panel */}
          <section id="directions-navigator-panel" className="animate-[fadeIn_0.5s_ease-out]">
            <RouteDirectionsPanel
              selectedRoute={selectedRoute}
              activeWalk={activeWalk}
              onAdvanceWalk={handleAdvanceWalk}
              onCompleteWalk={handleCompleteWalk}
              onStartWalk={handleStartWalkToggle}
              onTriggerRandomEvent={handleTriggerRandomEvent}
            />
          </section>

          <section className="bg-white p-5 rounded-[32px] border-2 border-cream-border/60 shadow-soft flex flex-col gap-3.5" id="route-data-note">
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span className="text-xs font-black text-warm-gray-dark">현재 화면은 실제 추천 데이터 기준입니다</span>
            </div>
            <p className="text-[11px] text-warm-gray leading-relaxed font-medium">
              이전의 코인·레벨·가짜 걸음수·랜덤 이벤트 기능은 제거했습니다. 이제 추천 카드, 지도, 상세 안내는 실제 핀 데이터와 루트 계산 결과를 기준으로 표시됩니다.
            </p>
          </section>

        </div>

      </main>
      )}

      {/* 3. Dynamic Tabs Main Content Blocks */}
      {activeTab === 'home' && (
        <main className="relative z-10 max-w-xl mx-auto px-5 pt-8 pb-32 flex-1 w-full flex flex-col animate-[fadeIn_0.35s_ease-out]">
          
          {/* Custom Greeting Header */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-[#D55F1B] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Compass size={13} className="text-pastel-orange stroke-[2.5]" />
                <span>크림빌리지 장미길 순찰본부</span>
              </p>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight mt-1 text-warm-gray-dark">
                반갑다냥, 요원님!<br />
                오늘의 모험을 골라라냥!
              </h1>
            </div>

            <div className="w-13 h-13 rounded-2xl bg-[#FFF5EE] shadow-soft flex items-center justify-center text-xl border-2 border-[#FAEFDF] text-pastel-orange flex-shrink-0 animate-bounce">
              🐾
            </div>
          </header>

          {/* Real data summary dashboard */}
          <section className="grid grid-cols-3 gap-2.5 mb-6 w-full" id="live-neighborhood-traffic-dashboard">
            <div className="bg-white px-3 py-3.5 rounded-2xl border-2 border-cream-border/75 shadow-xs flex flex-col items-center text-center transition-transform hover:scale-102">
              <span className="text-[8.5px] text-warm-gray font-extrabold uppercase tracking-widest block leading-none">표시 가능 장소</span>
              <span className="text-xs font-black text-pastel-orange mt-2 flex items-center gap-1 leading-none font-sans font-mono">
                <MapPin size={12} className="stroke-[2.5]" /> {visiblePinsForRegion.length}개
              </span>
            </div>
            <div className="bg-white px-3 py-3.5 rounded-2xl border-2 border-[#D3EDE2] shadow-xs flex flex-col items-center text-center transition-transform hover:scale-102">
              <span className="text-[8.5px] text-emerald-800 font-extrabold uppercase tracking-widest block leading-none">공원·산책핀</span>
              <span className="text-xs font-black text-emerald-600 mt-2 flex items-center gap-1 leading-none font-sans font-mono">
                <Award size={12} className="stroke-[2.5]" /> {visibleParkCount}개
              </span>
            </div>
            <div className="bg-white px-3 py-3.5 rounded-2xl border-2 border-[#F1DDF3] shadow-xs flex flex-col items-center text-center transition-transform hover:scale-102">
              <span className="text-[8.5px] text-pink-850 font-extrabold uppercase tracking-widest block leading-none">배변처리 후보</span>
              <span className="text-xs font-black text-[#B055C4] mt-2 flex items-center gap-1 leading-none font-sans font-mono">
                <Zap size={11} className="stroke-[2.5] fill-pink-100" /> {visibleToiletCount}개
              </span>
            </div>
          </section>

          {/* Hero Recommendation Banner card - powered by real route recommendation */}
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-pastel-orange via-orange-100 to-yellow-50 p-6 shadow-soft mb-6 border border-[#FFE8DA] w-full">
            <div className="absolute -right-6 -bottom-8 text-[140px] opacity-15 pointer-events-none select-none">
              {primaryHomeGuide.avatarEmoji}
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-[11px] font-black text-pastel-orange mb-4 shadow-xs leading-none">
              ✨ 현재 필터 기준 추천 코스
            </span>

            <h2 className="text-xl sm:text-2xl font-black leading-snug mb-2.5 text-warm-gray-dark pr-8">
              {primaryHomeRoute.name}
            </h2>

            <p className="text-xs text-warm-gray leading-relaxed mb-3 max-w-sm font-semibold">
              {primaryHomeRoute.description}
            </p>
            <p className="text-[10.5px] text-[#9F5614] font-black mb-5">
              📍 {primaryHomeRoute.region} · {formatRouteDistance(primaryHomeRoute.distance)}km · 약 {primaryHomeRoute.duration}분 · {primaryHomeRoute.checkpoints.length}개 경유지
            </p>

            <button 
              onClick={() => {
                setSelectedRouteId(primaryHomeRoute.id);
                setActiveTab('routes');
              }}
              className="rounded-2xl px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11.5px] font-black shadow-lg hover:scale-[1.02] transition-all duration-350 btn-squishy flex items-center gap-1 leading-none cursor-pointer"
            >
              <span>이 추천길 탐험 시작하기 →</span>
            </button>
          </section>

          {/* Quick Search bar */}
          <section className="mb-6 w-full">
            <div className="bg-white rounded-3xl shadow-soft p-4 flex items-center gap-3 border border-cream-border">
              <span className="text-xl">🔍</span>
              <input
                placeholder="어디로 모험하고 싶나요? (예: 장미길, 대로, 골목...)"
                className="bg-transparent outline-none w-full text-xs font-semibold text-warm-gray-dark"
                value={filters.searchQuery}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
                  setActiveTab('routes');
                }}
              />
            </div>
          </section>

          {/* Interactive NPC Guide Center */}
          <section className="mb-7 w-full bg-white border-2 border-cream-border/75 rounded-[36px] p-5 shadow-soft" id="npc-guide-station">
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h3 className="text-base font-black text-warm-gray-dark flex items-center gap-1.5 leading-none">
                  크림마을 대장 NPC 초소 🐾
                </h3>
                <p className="text-[10px] text-warm-gray mt-1 font-semibold">대장을 탭해 대사집을 열고, 특화 퀘스트나 AI 지도를 획득하세요!</p>
              </div>
              <button 
                onClick={() => setShowOnboarding(true)} 
                className="text-[10px] bg-cream-base text-pastel-orange border border-[#FFE8DA] px-3 py-1 rounded-full font-black hover:bg-[#FFE8DA] transition-colors"
              >
                도감 도장 스티커 📒
              </button>
            </div>

            {/* NPC horizontal Selector Rows */}
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3.5 pr-1 w-full justify-between sm:justify-start">
              {[
                { id: 'mango', name: '망고', emoji: '🐱', color: 'from-amber-200 to-amber-100 border-amber-300' },
                { id: 'janggun', name: '장군', emoji: '🐶', color: 'from-zinc-300 to-zinc-200 border-zinc-400' },
                { id: 'nabi', name: '나비', emoji: '🐈‍⬛', color: 'from-sky-200 to-sky-100 border-sky-305' },
                { id: 'bori', name: '보리', emoji: '🐕‍🦺', color: 'from-[#D3EDE2] to-emerald-100 border-emerald-300' },
                { id: 'mungchi', name: '뭉치', emoji: '🐩', color: 'from-[#F1DDF3] to-pink-100 border-pink-300' },
              ].map((mascot) => {
                const charData = getSafeCharacter(mascot.id);
                const isFocused = focusedNpcId === mascot.id;
                return (
                  <button
                    key={mascot.id}
                    id={`npc-selector-btn-${mascot.id}`}
                    type="button"
                    onClick={() => {
                      setFocusedNpcId(mascot.id as any);
                    }}
                    className={`flex-shrink-0 min-w-[72px] sm:min-w-[82px] rounded-2xl p-2.5 border-2 flex flex-col items-center text-center transition-all duration-300 transform select-none cursor-pointer ${
                      isFocused 
                        ? 'bg-gradient-to-b from-[#FFF9EE] to-white border-pastel-orange shadow-md scale-105 ring-4 ring-pastel-orange/5' 
                        : 'bg-cream-base border-cream-border hover:bg-white hover:border-pastel-orange/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1.5 overflow-hidden transition-transform ${isFocused ? 'rotate-6' : ''}`}>
                      {charData?.avatarImage ? (
                        <img src={charData.avatarImage} alt={mascot.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        mascot.emoji
                      )}
                    </div>
                    <span className={`text-[10.5px] font-black ${isFocused ? 'text-[#D55F1B]' : 'text-warm-gray-dark'}`}>{mascot.name}</span>
                    <span className="text-[7.5px] text-warm-gray font-bold line-clamp-1 leading-none mt-0.5">{charData?.role.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected NPC Active Interactive Board Frame */}
            {focusedNpcId && (
              <div 
                className={`mt-1 p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden animate-[fadeIn_0.32s_ease-out] ${
                  focusedNpcId === 'mango' ? 'bg-[#FFFDF7] border-amber-300 text-amber-950' :
                  focusedNpcId === 'janggun' ? 'bg-[#F8FAFC] border-slate-350 text-slate-950' :
                  focusedNpcId === 'nabi' ? 'bg-[#F0F8FF] border-sky-300 text-sky-950' :
                  focusedNpcId === 'bori' ? 'bg-[#F2FAF8] border-teal-300 text-teal-950' :
                  'bg-[#FFF5F6] border-rose-300 text-rose-950'
                }`}
                id={`npc-active-board-${focusedNpcId}`}
              >
                {/* Visual Status Indicator Tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9.5px] font-black uppercase tracking-wider">{npcInteractData[focusedNpcId].status}</span>
                  </div>
                  <span className="text-[8.5px] font-extrabold bg-white px-2 py-0.5 rounded-md border border-black/5 shadow-inner">
                    {npcInteractData[focusedNpcId].vitality}
                  </span>
                </div>

                {/* NPC Animated Character Avatar + Dialogue Bubble */}
                <div className="flex gap-3.5 items-start">
                  <div className="relative flex-shrink-0">
                    <div className="w-13 h-13 rounded-2xl bg-white border border-black/10 flex items-center justify-center text-2xl shadow-soft overflow-hidden hover:scale-105 transition-transform">
                      {CHARACTERS[focusedNpcId]?.avatarImage ? (
                        <img src={CHARACTERS[focusedNpcId].avatarImage} alt={CHARACTERS[focusedNpcId].name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span>💬</span>
                      )}
                    </div>
                    {/* Tiny species badge */}
                    <span className="absolute -bottom-1 -right-1 text-[8px] bg-white border px-1 rounded-md text-warm-gray font-black scale-90 leading-tight">
                      {CHARACTERS[focusedNpcId]?.species.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex-1">
                    <span className="text-[9.5px] font-black uppercase tracking-widest text-[#9F5614]">
                      {CHARACTERS[focusedNpcId]?.name} 대장선배 수다록:
                    </span>
                    <p className="text-[11px] leading-relaxed font-bold italic mt-1 text-stone-800">
                      “{npcInteractData[focusedNpcId].quote}”
                    </p>
                  </div>
                </div>

                {/* NPC Specialty Skill Cards */}
                <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-2xl border border-black/5 flex items-center justify-between text-[10.5px]">
                  <div>
                    <span className="text-warm-gray font-bold">대장 기술(Specialty):</span>
                    <span className="font-extrabold text-stone-900 ml-1.5">{CHARACTERS[focusedNpcId]?.specialty}</span>
                  </div>
                  <span className="text-[8.5px] bg-[#FFF2DE] hover:bg-amber-100 text-[#B8711E] px-2 py-0.5 rounded-full font-black">
                    {npcInteractData[focusedNpcId].role}
                  </span>
                </div>

                {/* RPG CTAs Actions Block - Not breaking core functions! */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {/* Action 1: Apply pre-mapped specialty quest routes */}
                  <button
                    type="button"
                    id={`npc-trigger-quest-${focusedNpcId}`}
                    onClick={() => npcInteractData[focusedNpcId].applyFilters()}
                    className={`w-full py-3.5 px-3 rounded-2xl text-[10.5px] font-black flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.015] transition-all btn-squishy cursor-pointer select-none ${
                      focusedNpcId === 'mango' ? 'bg-amber-400 hover:bg-amber-500 text-white' :
                      focusedNpcId === 'janggun' ? 'bg-slate-700 hover:bg-slate-800 text-white' :
                      focusedNpcId === 'nabi' ? 'bg-sky-400 hover:bg-sky-505 text-white' :
                      focusedNpcId === 'bori' ? 'bg-emerald-500 hover:bg-emerald-650 text-white' :
                      'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    <span>🧭</span>
                    <span>{npcInteractData[focusedNpcId].actionLabel}</span>
                  </button>

                  {/* Action 2: Navigate and pre-fill AI customized generator */}
                  <button
                    type="button"
                    id={`npc-trigger-ai-guide-${focusedNpcId}`}
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        category: focusedNpcId === 'mango' || focusedNpcId === 'mungchi' ? 'adventure' : focusedNpcId === 'janggun' ? 'quiet' : focusedNpcId === 'bori' ? 'nature' : 'sensory',
                        purpose: focusedNpcId === 'mango' ? 'afternoon' : focusedNpcId === 'bori' ? 'sunset' : focusedNpcId === 'mungchi' ? 'night' : 'morning',
                        searchQuery: ''
                      }));
                      setActiveTab('routes');
                      // Quick notification alert to look up card
                      alert(`🤖 AI 제작소의 대장 가이드가 '${CHARACTERS[focusedNpcId]?.name}' 선배로 전담 임명되었습니다! 하단의 AI 맞춤 수첩 그리기를 눌러보세요.`);
                    }}
                    className="w-full py-3.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-[10.5px] font-black flex items-center justify-center gap-1 hover:scale-[1.015] transition-all btn-squishy cursor-pointer select-none"
                  >
                    <span>🤖</span>
                    <span>이 대장과 AI 맞춤 지도 생성 지시</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Recommended routes deck */}
          <section className="mb-8 w-full">
            <div className="flex items-center justify-between mb-4 px-0.5">
              <h3 className="text-base font-black text-warm-gray-dark">추천 산책 코스 🗺️</h3>
              <button onClick={() => { setActiveTab('routes') }} className="text-[11px] text-warm-gray font-bold">더보기</button>
            </div>

            <div className="space-y-4">
              {homeRecommendedRoutes.map((route) => {
                const guide = getSafeCharacter(route.characterGuide);
                return (
                  <div
                    key={route.id}
                    className="overflow-hidden rounded-[28px] bg-white shadow-soft border border-cream-border/60 hover:shadow-lg transition-shadow"
                  >
                    <div
                      className="h-36 bg-cover bg-center relative"
                      style={{
                        backgroundImage: `url(${
getRouteHeroImage(route)
                        })`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <span className="absolute bottom-3.5 left-3.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-warm-gray-dark flex items-center gap-1 shadow-xs border border-cream-border/30">
                        <span>{guide.avatar}</span> {guide.name} 가이드
                      </span>
                    </div>

                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-warm-gray-dark">{route.name}</h4>
                          <p className="text-[10px] text-warm-gray mt-0.5 font-bold">
                            📍 {route.region} · {formatRouteDistance(route.distance)}km · {route.duration}분
                          </p>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg shadow-xs flex-shrink-0 border border-[#FBE0C8]">
                          🐾
                        </div>
                      </div>

                      <p className="text-[11px] text-warm-gray leading-normal mb-3 font-semibold line-clamp-2">
                        {route.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {route.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-lg bg-[#FFF4E7] text-[#D55F1B] text-[9.5px] font-black"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedRouteId(route.id);
                          setActiveTab('routes');
                        }}
                        className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white py-3 font-black text-xs transition-colors flex items-center justify-center gap-1 leading-none cursor-pointer"
                      >
                        <span>루트 지도 열기</span>
                        <span>🧭</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* AI assistant suggestion */}
          <section className="rounded-[32px] bg-gradient-to-br from-sky-155 to-indigo-50/40 p-5 shadow-soft border border-sky-100 flex items-start gap-3.5 w-full">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-soft flex-shrink-0 animate-bounce">
              ☁️
            </div>

            <div className="flex-1">
              <h3 className="font-black text-xs text-indigo-950 mb-1 leading-none">
                보리 선배의 힐링 지혜 💭
              </h3>

              <p className="text-[11px] text-indigo-900 leading-relaxed mb-3.5 font-semibold">
                “오늘 바람 온도가 지친 강아지의 발을 부드럽게 쓰다듬어 준다댕. AI에게 산바람이 부는 골목 전용 지도를 만들어 달라고 요청해보는 건 어떻댕?”
              </p>

              <button
                onClick={() => {
                  setActiveTab('routes');
                }}
                className="rounded-xl bg-white hover:bg-sky-50 px-3 py-2 text-[10.5px] font-black shadow-soft text-indigo-950 border border-indigo-100 transition-colors cursor-pointer"
              >
                AI 나만의 수첩 그리기 🤖
              </button>
            </div>
          </section>

        </main>
      )}

      {/* Explore Tab rendering (Interactive Map Widget + filter layout) */}
      {activeTab === 'explore' && (
        <main className="max-w-7xl mx-auto px-5 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 animate-[fadeIn_0.35s_ease-out]">
          
          {/* Left panel filters */}
          <div className="lg:col-span-4 flex flex-col gap-6 min-w-0">
            <section className="bg-white p-5 rounded-[32px] border-2 border-cream-board/60 flex flex-col gap-4 shadow-soft">
              <div className="flex items-center gap-2 border-b border-cream-border/55 pb-2">
                <Smile size={16} className="text-pastel-orange stroke-[2.5]" />
                <span className="text-xs font-black text-warm-gray-dark font-sans">탐험 전용 영역 필터</span>
              </div>
              <SearchBox filters={filters} setFilters={setFilters} />
              <RegionFilter filters={filters} setFilters={setFilters} />
              <RadiusFilter filters={filters} setFilters={setFilters} />
            </section>

            <section className="bg-white p-5 rounded-[32px] border-2 border-cream-board/60 flex flex-col gap-3 shadow-soft">
              <span className="text-xs font-black text-amber-950">💡 마을 평생 등경 안내</span>
              <p className="text-[11px] text-warm-gray font-semibold leading-relaxed">
                지도에는 실제 조사 핀과 추천 루트의 경유지가 표시됩니다. 필터를 바꾸면 해당 지역의 장소와 추천 경로가 다시 계산됩니다.
              </p>
            </section>
          </div>

          {/* Right side map visualizer */}
          <div className="lg:col-span-8 flex flex-col gap-4 min-w-0">
            <section className="bg-white p-5 rounded-[32px] border-2 border-cream-border shadow-soft flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between border-b border-cream-border/50 pb-2">
                <div>
                  <span className="text-xs sm:text-sm font-black text-warm-gray-dark flex items-center gap-1.5 px-1 font-sans">
                    🗺️ 실제 지도 기반 탐험 아레나
                  </span>
                </div>
                <span className="text-[9px] bg-pastel-orange-soft border border-[#FFE8DA] font-black px-2.5 py-1 rounded-full text-pastel-orange">
                  현 위치: {selectedRoute?.region || '장미길'}
                </span>
              </div>

              <MapView
                selectedRoute={selectedRoute}
                activeWalk={activeWalk}
              />
            </section>
          </div>
        </main>
      )}

      {/* Community Tab */}
      {activeTab === 'community' && (
        <main className="max-w-xl mx-auto px-5 pt-8 pb-32 flex-1 w-full flex flex-col animate-[fadeIn_0.35s_ease-out]">
          <header className="mb-5">
            <span className="text-[10px] bg-pastel-orange-soft border border-[#FFE8DA] text-pastel-orange px-2.5 py-1 rounded-full font-black uppercase">
              우리끼리 속닥속닥 💬
            </span>
            <h1 className="text-2xl font-black text-warm-gray-dark mt-2 leading-none">
              동네 대장 수다 광장 🐾
            </h1>
            <p className="text-[11px] text-warm-gray mt-1.5 font-semibold">
              크림마을에 거주하는 장미길, 소리숲 집사/댕냥 회원님들이 실시간 수다를 나누는 사랑방가이다냥!
            </p>
          </header>

          {/* New message compose board */}
          <section className="bg-[#FFFDF9] border-2 border-[#F3E6D5] rounded-[30px] p-4 shadow-soft mb-6 w-full">
            <form onSubmit={handleAddPost} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <span className="text-xs font-black text-warm-gray-dark">새로운 수다글씨 쓰기</span>
              </div>
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="오늘 어떤 길을 걸으셨나요? 망고가 봤던 볕 좋은 지점이나, 장군이의 안전 횡단보도 이용 소감을 자유롭게 들려주세요!"
                className="w-full bg-white border border-cream-border/80 rounded-2xl p-3 text-xs font-semibold text-warm-gray-dark outline-none h-20 resize-none focus:border-pastel-orange transition-colors"
                maxLength={200}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-warm-gray font-bold">집사 아이디: 나의 모험견공 🐾</span>
                <button
                  type="submit"
                  className="bg-zinc-900 border border-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-black px-4.5 py-2 rounded-xl transition-colors leading-none btn-squishy cursor-pointer"
                >
                  수다 발송 🚀
                </button>
              </div>
            </form>
          </section>

          {/* Social feed timeline */}
          <section className="flex flex-col gap-4 w-full">
            {communityPosts.map((post: any) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-4 border border-cream-border/70 shadow-xs hover:shadow-soft transition-shadow flex gap-3.5 relative"
              >
                <div className="w-10 h-10 rounded-full bg-cream-accent/50 text-xl border border-cream-border/40 flex items-center justify-center flex-shrink-0 font-sans">
                  🐱
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 border-b border-cream-border/40 pb-1.5">
                    <span className="text-xs font-black text-warm-gray-dark">{post.sender}</span>
                    <span className="text-[9.5px] text-warm-gray/60 font-bold">{post.time}</span>
                  </div>
                  <p className="text-xs text-warm-gray-dark font-semibold mt-2 leading-relaxed">
                    {post.text}
                  </p>
                </div>
              </div>
            ))}
          </section>

        </main>
      )}

      {/* Project information tab */}
      {activeTab === 'profile' && (
        <main className="max-w-xl mx-auto px-5 pt-8 pb-32 flex-1 w-full flex flex-col animate-[fadeIn_0.35s_ease-out]">
          <header className="mb-5">
            <span className="text-[10px] bg-[#D3EDE2] border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-full font-black uppercase">
              프로젝트 정보
            </span>
            <h1 className="text-2xl font-black text-warm-gray-dark mt-2 leading-tight">
              데이터 기반 반려견 산책 루트 추천
            </h1>
            <p className="text-[11px] text-warm-gray mt-1.5 font-semibold leading-relaxed">
              이 화면은 예시용 레벨·코인·걸음수 대신 현재 서비스에 연결된 실제 장소 데이터와 추천 로직 상태를 보여줍니다.
            </p>
          </header>

          <section className="bg-white p-5 rounded-[32px] border-2 border-cream-border/60 shadow-soft flex flex-col gap-4 w-full">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-cream-accent/60 border border-[#FAEFDF] rounded-2xl p-3">
                <span className="text-[9px] text-warm-gray font-black block">전체 핀</span>
                <span className="text-sm font-black text-[#D55F1B] mt-1 block">{LOCATION_PINS.length}</span>
              </div>
              <div className="bg-cream-accent/60 border border-[#FAEFDF] rounded-2xl p-3">
                <span className="text-[9px] text-warm-gray font-black block">현재 지역</span>
                <span className="text-sm font-black text-[#136C4E] mt-1 block">{visiblePinsForRegion.length}</span>
              </div>
              <div className="bg-cream-accent/60 border border-[#FAEFDF] rounded-2xl p-3">
                <span className="text-[9px] text-warm-gray font-black block">추천 루트</span>
                <span className="text-sm font-black text-warm-gray-dark mt-1 block">{recommendedRoutes.length}</span>
              </div>
            </div>

            <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-cream-border flex flex-col gap-2">
              <h3 className="text-xs font-black text-warm-gray-dark">현재 유지하는 핵심 기능</h3>
              <ul className="text-[11px] text-warm-gray leading-relaxed font-medium list-disc pl-4 space-y-1">
                <li>실제 장소 핀 기반 루트 추천</li>
                <li>지역·반경·목적·반려견 조건 필터</li>
                <li>짧은/보통/긴 산책 코스 자동 생성</li>
                <li>OpenRouteService 기반 실제 보행 경로 표시</li>
                <li>Gemini 기반 AI 맞춤 루트 생성</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleResetProfile}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-xs font-black shadow-soft cursor-pointer"
            >
              생성된 AI 루트 초기화
            </button>
          </section>
        </main>
      )}

      {/* 4. Footer info */}
      <footer className="bg-white border-t-2 border-cream-border/55 py-6 mt-6 pb-28 text-center text-xs text-warm-gray/80" id="main-footer">
        <div className="max-w-7xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3.5 font-medium">
          <p>© 2026 Cream Village. "어리숙한 발걸음이 모여 따뜻한 비밀 지도가 되는 날까지"</p>
          <div className="flex items-center gap-4 text-warm-gray font-black">
            <span className="hover:text-pastel-orange cursor-help transition-colors">📜 망고 서고</span>
            <span className="hover:text-pastel-orange cursor-help transition-colors">🐾 뭉치 걷기본부</span>
            <span className="hover:text-pastel-orange cursor-help transition-colors">🛡️ 장군 안심연대</span>
          </div>
        </div>
      </footer>

      {/* Embedded Fixed Bottom Navigation Bar matching real production-grade local app UX */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_12px_45px_rgba(0,0,0,0.12)] border border-[#FAEFDF] px-6 py-2.5 flex items-center justify-between z-50 animate-[slideUp_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)] transition-all">
        {[
          { tab: 'home', icon: (active: boolean) => <Home size={18} className={active ? 'text-pastel-orange stroke-[2.5]' : 'text-warm-gray'} />, label: '홈' },
          { tab: 'explore', icon: (active: boolean) => <Map size={18} className={active ? 'text-pastel-orange stroke-[2.5]' : 'text-warm-gray'} />, label: '탐험' },
          { tab: 'routes', icon: (active: boolean) => <Compass size={18} className={active ? 'text-pastel-orange stroke-[2.5]' : 'text-warm-gray'} />, label: '루트' },
          { tab: 'community', icon: (active: boolean) => <MessageSquare size={18} className={active ? 'text-pastel-orange stroke-[2.5]' : 'text-warm-gray'} />, label: '커뮤니티' },
          { tab: 'profile', icon: (active: boolean) => <User size={18} className={active ? 'text-pastel-orange stroke-[2.5]' : 'text-warm-gray'} />, label: '정보' },
        ].map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => {
                setActiveTab(item.tab as any);
              }}
              className={`flex flex-col items-center gap-1.5 transition-all relative cursor-pointer select-none ${
                isActive ? 'scale-105 opacity-100' : 'opacity-60 hover:opacity-90'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'bg-[#FFE8DA] shadow-sm animate-pulse' : 'bg-transparent'
                }`}
              >
                {item.icon(isActive)}
              </div>
              <span className={`text-[9.5px] font-black transition-colors ${isActive ? 'text-[#D55F1B]' : 'text-warm-gray-dark'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>


    </div>
  );
}
