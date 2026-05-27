import React, { useState, useEffect, useMemo } from 'react';
import { Route, FilterState, ActiveWalk, Checkpoint, PetCharacterType } from './types';
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
          category: 'adventure',
          purpose: 'afternoon',
          searchQuery: '',
          region: '크림빌리지 장미길'
        }));
        setSelectedRouteId('route_1');
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
          category: 'quiet',
          purpose: 'morning',
          searchQuery: '',
          region: '소리숲 푸른대로'
        }));
        setSelectedRouteId('route_2');
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
          category: 'sensory',
          purpose: 'morning',
          searchQuery: '',
          region: '노랑햇살 아케이드'
        }));
        setSelectedRouteId('route_4');
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
          category: 'nature',
          purpose: 'sunset',
          searchQuery: '',
          region: '속삭임 정원'
        }));
        setSelectedRouteId('route_3');
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
          category: 'adventure',
          purpose: 'night',
          searchQuery: '',
          region: '번개 언덕 광장'
        }));
        setSelectedRouteId('route_5');
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

  useEffect(() => {
    localStorage.setItem('dog_adventure_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Handle active walking elapsed clock
  useEffect(() => {
    let interval: any = null;
    if (activeWalk.isWalking && !activeWalk.completed) {
      interval = setInterval(() => {
        setActiveWalk(prev => {
          const nextSec = prev.durationSeconds + 1;
          const randomStep = Math.floor(Math.random() * 3) + 1; // 1-3 steps per second
          return {
            ...prev,
            durationSeconds: nextSec,
            totalSteps: prev.totalSteps + randomStep
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWalk.isWalking, activeWalk.completed]);

  const selectedRoute = normalizeRoute(
  routes.find((route) => route.id === selectedRouteId),
  routes[0] ?? INITIAL_ROUTES[0]
);

  // Callback to append route created by Gemini
  const handleRouteGenerated = (newRoute: Route) => {
    const safeRoute = normalizeRoute(newRoute);
    const guide = getSafeCharacter(safeRoute.characterGuide);

    setGeneratedRoutes((prev) => [safeRoute, ...normalizeRoutes(prev)]);
    setSelectedRouteId(safeRoute.id);
    setActiveTab('routes');

    // Add success note in logs
    setActiveWalk(prev => ({
      ...prev,
      eventsLog: [
        ...prev.eventsLog,
        `✨ AI 가이드 ${guide.name}이가 새로운 어드벤처 지도 '${safeRoute.name}'를 완성했습니다. 수첩을 펴고 출발해보세요!`
      ]
    }));
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

  // Start walking toggle
  const handleStartWalkToggle = () => {
    if (activeWalk.isWalking) {
      // Prompt confirm or cancel
      if (window.confirm("🐾 현재 진행 중인 모험을 중지하고 복귀할까요? 기록이 누락될 수 있습니다.")) {
        setActiveWalk({
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
      }
    } else {
      setActiveWalk({
        isWalking: true,
        routeId: selectedRoute.id,
        progress: 0,
        checkpointIndex: 0,
        totalSteps: 0,
        coinsCount: 0,
        eventsLog: [`🚀 ${getSafeCharacter(selectedRoute.characterGuide).name} 가이드와 함께 두근두근 어드벤처 모험길에 첫 발을 내딛었습니다!`],
        durationSeconds: 0,
        completed: false
      });
    }
  };

  // Move forward on simulated walk path
  const handleAdvanceWalk = () => {
    if (!selectedRoute) return;
    const totalCheckpoints = selectedRoute.checkpoints.length;
    const nextIndex = activeWalk.checkpointIndex + 1;

    // Award bonus coins for exploring
    const coinsEarned = Math.floor(Math.random() * 5) + 3; // 3-7 gold
    
    // Create random story logs for immersive gameplay
    const randomEvent = EVENTS_POOL[Math.floor(Math.random() * EVENTS_POOL.length)];

    let nextProgress = (nextIndex / totalCheckpoints) * 100;
    if (nextProgress > 100) nextProgress = 100;

    const currentCheckpoint = selectedRoute.checkpoints[activeWalk.checkpointIndex];

    const currentComment = currentCheckpoint 
      ? `[${currentCheckpoint.name}] 🐾 ${getSafeCharacter(selectedRoute.characterGuide).name}: "${currentCheckpoint.characterComment || '잘 따라오고 있어냥!'}"`
      : '구역 탐험 완료!';

    setActiveWalk(prev => {
      const messages = [...prev.eventsLog];
      messages.push(`📍 ${getCheckpointRelName(activeWalk.checkpointIndex)} '${currentCheckpoint?.name || '신명 지점'}' 탐색 성공! (${coinsEarned}개 꿀간식 획득!)`);
      messages.push(currentComment);
      messages.push(`🌲 ${randomEvent}`);

      return {
        ...prev,
        checkpointIndex: nextIndex,
        progress: nextProgress,
        coinsCount: prev.coinsCount + coinsEarned,
        eventsLog: messages
      };
    });

    // Award profile coins
    setUserProfile(prev => ({
      ...prev,
      coins: prev.coins + coinsEarned,
      exp: prev.exp + 10
    }));
  };

  const getCheckpointRelName = (idx: number) => {
    if (idx === 0) return "첫째 마당";
    if (idx === 1) return "둘째 코너";
    return `${idx + 1}구역`;
  };

  // Complete walk reward chest trigger
  const handleCompleteWalk = () => {
    const finalReward = 15; // +15 gold coins
    const finalSteps = activeWalk.totalSteps;

    // Check exp levels
    let nextExp = userProfile.exp + 55;
    let nextLevel = userProfile.level;
    if (nextExp >= 100) {
      nextLevel += 1;
      nextExp = nextExp - 100;
    }

    // Award new emotional badges depending on guide in MUNGCHI badge ceremony
    let earnedBadgeId = "village_expert";
    let badgeItem: Achievement = {
      id: "village_expert",
      title: "동네 보석 전문가 코인 주머니",
      icon: "🏆",
      description: "Cream Village 구석구석을 씩씩하게 걸은 용감하고 인자한 산책 파트너에게 주는 완주 훈장!"
    };

    if (selectedRoute.characterGuide === 'mango') {
      earnedBadgeId = 'mango_golden_nap';
      badgeItem = {
        id: 'mango_golden_nap',
        title: '망고의 담벼락 햇살 메달',
        icon: '🐱✨',
        description: '탐험 기사 망고와 함께 가장 아늑하게 볕이 닿는 숨은 비밀 휴식처들을 정복한 마스터!'
      };
    } else if (selectedRoute.characterGuide === 'janggun') {
      earnedBadgeId = 'janggun_safe_shield';
      badgeItem = {
        id: 'janggun_safe_shield',
        title: '장군의 안심 지킴이 방패',
        icon: '🛡️🐶',
        description: '장군 선배의 늠름한 수호를 받아 턱이 높거나 소음이 가득한 거리를 무사히 통과한 영웅!'
      };
    } else if (selectedRoute.characterGuide === 'nabi') {
      earnedBadgeId = 'nabi_rainbow_chest';
      badgeItem = {
        id: 'nabi_rainbow_chest',
        title: '나비의 바스락 보물 단지',
        icon: '🎁🐈',
        description: '아깽이 나비의 장난꾸러기 도토리 요새를 발견해, 밤 낙엽 바스락 연주를 완주해낸 모험단!'
      };
    } else if (selectedRoute.characterGuide === 'bori') {
      earnedBadgeId = 'bori_clover_crown';
      badgeItem = {
        id: 'bori_clover_crown',
        title: '보리의 솔바람 클로버 관',
        icon: '🌾🐕',
        description: '천사견 보리와 함께 흙과 풀잎 향을 실컷 음미하며 지친 발바닥을 완전 치유해낸 힐러!'
      };
    } else if (selectedRoute.characterGuide === 'mungchi') {
      earnedBadgeId = 'mungchi_thunder_bolt';
      badgeItem = {
        id: 'mungchi_thunder_bolt',
        title: '뭉치의 번개 파워 슈즈',
        icon: '⚡🐩',
        description: '지치지 않는 뭉치 소대장과 함께 가파른 고구마 언덕 트랙 계단을 단번에 독파한 에너자이저!'
      };
    }

    const uniqueBadges = Array.from(new Set([...userProfile.badges, earnedBadgeId]));

    setUserProfile(prev => ({
      ...prev,
      level: nextLevel,
      exp: nextExp,
      coins: prev.coins + finalReward,
      totalStepsAccumulated: prev.totalStepsAccumulated + finalSteps,
      badges: uniqueBadges
    }));

    // Trigger local celebration
    setCelebrationBadge(badgeItem);

    // Reset active walk
    setActiveWalk({
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
  };

  // Trigger random extra events
  const handleTriggerRandomEvent = () => {
    const randomEvent = EVENTS_POOL[Math.floor(Math.random() * EVENTS_POOL.length)];
    const bonus = Math.floor(Math.random() * 3) + 1; // +1 to +3 coins

    setActiveWalk(prev => ({
      ...prev,
      coinsCount: prev.coinsCount + bonus,
      eventsLog: [...prev.eventsLog, `🎁 나비가 낙엽 속에서 기절초풍 상자를 한 개 더 굴려 보냈습니다! +${bonus} 코인 보너스!`, `✨ ${randomEvent}`]
    }));

    setUserProfile(prev => ({
      ...prev,
      coins: prev.coins + bonus
    }));
  };

  // Reset profile to default
  const handleResetProfile = () => {
    if (window.confirm("🐾 수집하신 보물 코인과 레벨, 비밀 배지 기록을 모두 지우고 모험을 초기 상태로 되돌릴까요?")) {
      setUserProfile({
        level: 1,
        exp: 15,
        coins: 45,
        totalStepsAccumulated: 8400,
        badges: ['cheesy_starter', 'rose_pioneer']
      });
      setGeneratedRoutes([]);
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

          {/* User Profile HUD */}
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap" id="user-profile-hud">
            
            {/* Steps meter */}
            <div className="bg-pastel-orange-soft/40 px-3.5 py-2 rounded-2xl border-2 border-[#FFE8DA] flex items-center gap-2 shadow-xs">
              <Footprints size={15} className="text-[#BD4C15] animate-bounce" />
              <div className="flex flex-col">
                <span className="text-[8px] text-warm-gray/70 uppercase font-black leading-none">누적 걸음수</span>
                <span className="text-xs font-black font-mono text-[#D55F1B] leading-none mt-1 font-accent">
                  {userProfile.totalStepsAccumulated.toLocaleString()} <span className="font-semibold text-[9.5px]">보</span>
                </span>
              </div>
            </div>

            {/* Coins */}
            <div className="bg-pastel-mint-soft px-3.5 py-2 rounded-2xl border-2 border-[#DCEFEA] flex items-center gap-2 shadow-xs">
              <span className="text-base">🪙</span>
              <div className="flex flex-col">
                <span className="text-[8px] text-[#1D7F5F] uppercase font-black leading-none">획득 골드코인</span>
                <span className="text-xs font-black font-mono text-[#136C4E] leading-none mt-1 font-accent">
                  {userProfile.coins} <span className="font-semibold text-[9.5px]">개</span>
                </span>
              </div>
            </div>

            {/* Level badge card */}
            <div className="bg-gradient-to-r from-pastel-orange to-amber-500 px-4 py-2 rounded-2xl text-white shadow-soft flex items-center gap-2.5">
              <Award size={15} className="animate-pulse text-amber-100" />
              <div className="flex flex-col pr-1.5">
                <span className="text-[8px] opacity-90 font-black leading-none">레벨 등급</span>
                <span className="text-xs font-black font-mono leading-none mt-1">Lv.{userProfile.level}</span>
              </div>
              {/* Exp Bar */}
              <div className="w-10 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="bg-white h-full transition-all duration-500" style={{ width: `${userProfile.exp}%` }} />
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
                {[
                  { label: '전체 구역', region: '전체동네' },
                  { label: '장미길 정원', region: '크림빌리지 장미길' },
                  { label: '푸른 대로', region: '소리숲 푸른대로' },
                  { label: '속삭임 수풀', region: '속삭임 정원' },
                  { label: '햇살 아케이드', region: '노랑햇살 아케이드' },
                  { label: '번개 광장', region: '번개 언덕 광장' }
                ].map((idx) => {
                  const isSelected = filters.region === idx.region;
                  return (
                    <button
                      key={idx.region}
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, region: idx.region }));
                        const matching = routes.find(r => idx.region === '전체동네' || r.region === idx.region);
                        if (matching) {
                          setSelectedRouteId(matching.id);
                        }
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
                  🗺️ 2D 크림마을 대장정 어드벤처 위젯
                </span>
                <p className="text-[10px] text-warm-gray/70">마을의 구역 노드와 보물 상자를 탭해 가이드들의 대사집을 구경해 보세요.</p>
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

          {/* Emotional Badges Drawer block - Redesigned as gorgeous sticker pouch */}
          <section className="bg-white p-5 rounded-[32px] border-2 border-cream-border/60 shadow-soft flex flex-col gap-3.5" id="collected-awards-drawer">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-warm-gray-dark flex items-center gap-1.5 pl-0.5">
                🏅 수집 완료된 아지트 보물 포치 배지 ({userProfile.badges.length} / 7)
              </span>
              <button
                type="button"
                id="btn-reset-map"
                onClick={handleResetProfile}
                className="text-[9.5px] text-[#A82B14] font-black bg-red-50/70 border-2 border-[#FED7D7] hover:bg-red-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
              >
                기록 초기화 🔄
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* starter badge */}
              <div className="bg-cream-accent/50 border border-cream-border rounded-2xl p-3 flex items-center gap-3 transition-transform hover:scale-103">
                <span className="text-xl bg-white shadow-xs rounded-xl p-1.5 border border-cream-border flex items-center justify-center">👶</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] font-black text-warm-gray-dark">신참 산책조</span>
                  <span className="text-[9px] text-warm-gray/60 font-semibold mt-0.5">마을 첫 등급권</span>
                </div>
              </div>

              {/* rose_pioneer badge */}
              <div className="bg-cream-accent/50 border border-cream-border rounded-2xl p-3 flex items-center gap-3 transition-transform hover:scale-103">
                <span className="text-xl bg-white shadow-xs rounded-xl p-1.5 border border-cream-border flex items-center justify-center">🌹</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] font-black text-warm-gray-dark">장미 가로수</span>
                  <span className="text-[9px] text-warm-gray/60 font-semibold mt-0.5">꽃 탐정단 완주</span>
                </div>
              </div>

              {/* Dynamic unlocked badges from list */}
              {userProfile.badges.includes('mango_golden_nap') && (
                <div className="bg-amber-50/60 border-2 border-amber-200 rounded-2xl p-3 flex items-center gap-3 animate-[fadeIn_0.5s_ease-out] transition-transform hover:scale-103 shadow-xs">
                  <span className="text-xl bg-amber-400 text-white shadow-xs rounded-xl p-1.5 border border-amber-500 flex items-center justify-center">🐈</span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-amber-950">망고 햇살관</span>
                    <span className="text-[9px] text-amber-800 font-semibold mt-0.5">담장 햇볕 마스터</span>
                  </div>
                </div>
              )}

              {userProfile.badges.includes('janggun_safe_shield') && (
                <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-3 flex items-center gap-3 animate-[fadeIn_0.5s_ease-out] transition-transform hover:scale-103 shadow-xs">
                  <span className="text-xl bg-slate-200 shadow-xs rounded-xl p-1.5 border border-slate-300 flex items-center justify-center">🛡️</span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-slate-900">장군 수호령</span>
                    <span className="text-[9px] text-slate-650 font-semibold mt-0.5">안전로 가로수패</span>
                  </div>
                </div>
              )}

              {userProfile.badges.includes('nabi_rainbow_chest') && (
                <div className="bg-[#EBF8FF] border-2 border-[#BEE3F8] rounded-2xl p-3 flex items-center gap-3 animate-[fadeIn_0.5s_ease-out] transition-transform hover:scale-103 shadow-xs">
                  <span className="text-xl bg-white shadow-xs rounded-xl p-1.5 border border-sky-200 flex items-center justify-center">🎁</span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-sky-950">나비 요새장</span>
                    <span className="text-[9px] text-sky-750 font-semibold mt-0.5">낙엽 바스락 연주</span>
                  </div>
                </div>
              )}

              {userProfile.badges.includes('bori_clover_crown') && (
                <div className="bg-[#E6FFFA] border-2 border-[#B2F5EA] rounded-2xl p-3 flex items-center gap-3 animate-[fadeIn_0.5s_ease-out] transition-transform hover:scale-103 shadow-xs">
                  <span className="text-xl bg-white shadow-xs rounded-xl p-1.5 border border-teal-200 flex items-center justify-center w-9 h-9 overflow-hidden flex-shrink-0">
                    {CHARACTERS.bori.avatarImage ? (
                      <img src={CHARACTERS.bori.avatarImage} alt="보리" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      "🌾"
                    )}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-teal-950">보리 네잎관</span>
                    <span className="text-[9px] text-teal-750 font-semibold mt-0.5">솔바람 흙 치유증</span>
                  </div>
                </div>
              )}

              {userProfile.badges.includes('mungchi_thunder_bolt') && (
                <div className="bg-[#FFF5F5] border-2 border-[#FEB2B2] rounded-2xl p-3 flex items-center gap-3 animate-[fadeIn_0.5s_ease-out] transition-transform hover:scale-103 shadow-xs">
                  <span className="text-xl bg-white shadow-xs rounded-xl p-1.5 border border-rose-200 flex items-center justify-center w-9 h-9 overflow-hidden flex-shrink-0">
                    {CHARACTERS.mungchi.avatarImage ? (
                      <img src={CHARACTERS.mungchi.avatarImage} alt="뭉치" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      "⚡"
                    )}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-rose-950">번개 대장군</span>
                    <span className="text-[9px] text-rose-750 font-semibold mt-0.5">언덕 돌파 신발</span>
                  </div>
                </div>
              )}
            </div>
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

          {/* Real-world Local Social Walk Dashboard Widget */}
          <section className="grid grid-cols-3 gap-2.5 mb-6 w-full" id="live-neighborhood-traffic-dashboard">
            <div className="bg-white px-3 py-3.5 rounded-2xl border-2 border-cream-border/75 shadow-xs flex flex-col items-center text-center transition-transform hover:scale-102">
              <span className="text-[8.5px] text-warm-gray font-extrabold uppercase tracking-widest block leading-none">오늘의 산책 동반</span>
              <span className="text-xs font-black text-pastel-orange mt-2 flex items-center gap-1 leading-none font-sans font-mono">
                <Footprints size={12} className="stroke-[2.5]" /> 24마리 분주함
              </span>
            </div>
            <div className="bg-white px-3 py-3.5 rounded-2xl border-2 border-[#D3EDE2] shadow-xs flex flex-col items-center text-center transition-transform hover:scale-102">
              <span className="text-[8.5px] text-emerald-800 font-extrabold uppercase tracking-widest block leading-none">안심 보보 만족도</span>
              <span className="text-xs font-black text-emerald-600 mt-2 flex items-center gap-1 leading-none font-sans font-mono">
                <Award size={12} className="stroke-[2.5]" /> 100% 안전보호
              </span>
            </div>
            <div className="bg-white px-3 py-3.5 rounded-2xl border-2 border-[#F1DDF3] shadow-xs flex flex-col items-center text-center transition-transform hover:scale-102">
              <span className="text-[8.5px] text-pink-850 font-extrabold uppercase tracking-widest block leading-none">오늘 낙엽수확수</span>
              <span className="text-xs font-black text-[#B055C4] mt-2 flex items-center gap-1 leading-none font-sans font-mono">
                <Zap size={11} className="stroke-[2.5] fill-pink-100" /> 164개 상자발견
              </span>
            </div>
          </section>

          {/* Hero Recommendation Banner card */}
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-pastel-orange via-orange-100 to-yellow-50 p-6 shadow-soft mb-6 border border-[#FFE8DA] w-full">
            <div className="absolute -right-6 -bottom-8 text-[140px] opacity-15 pointer-events-none select-none">
              🐱
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-[11px] font-black text-pastel-orange mb-4 shadow-xs leading-none">
              ✨ 오늘의 인기 추천 코스
            </span>

            <h2 className="text-xl sm:text-2xl font-black leading-snug mb-2.5 text-warm-gray-dark pr-8">
              망고의 비밀 담벼락<br />
              햇빛 머무는 길 정복하기 🧭
            </h2>

            <p className="text-xs text-warm-gray leading-relaxed mb-5 max-w-sm font-semibold">
              가이드 망고 선배와 함께 햇빛이 가득 들어서 고양이가 꾸벅꾸벅 조는 동네 최고의 따사로운 아지트를 구경해보세요!
            </p>

            <button 
              onClick={() => {
                setSelectedRouteId('route_1');
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
              {routes.slice(0, 2).map((route) => {
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
                          route.id === 'route_1'
                            ? 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop'
                            : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'
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
                            📍 {route.region} · {route.distance}km · {route.duration}분
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
                2D 지도에 노출된 노드와 기절초풍 나비 상자는 실제 해당 동네의 주요 편의 시설 및 놀이터 근처를 뜻해요. 해당 지점을 탭하면 대장들의 수다가 쏟아져 나온답니다냥!
              </p>
            </section>
          </div>

          {/* Right side map visualizer */}
          <div className="lg:col-span-8 flex flex-col gap-4 min-w-0">
            <section className="bg-white p-5 rounded-[32px] border-2 border-cream-border shadow-soft flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between border-b border-cream-border/50 pb-2">
                <div>
                  <span className="text-xs sm:text-sm font-black text-warm-gray-dark flex items-center gap-1.5 px-1 font-sans">
                    🗺️ 크림마을 대동여 2D 지도 아레나
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

      {/* Profile/Stamps Booklet passport Tab */}
      {activeTab === 'profile' && (
        <main className="max-w-xl mx-auto px-5 pt-8 pb-32 flex-1 w-full flex flex-col animate-[fadeIn_0.35s_ease-out]">
          <header className="mb-5">
            <span className="text-[10px] bg-[#D3EDE2] border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-full font-black uppercase">
              크림마을 요원패스 👤
            </span>
            <h1 className="text-2xl font-black text-warm-gray-dark mt-2 leading-none">
              나의 탐험 저널 카드스텁 🗺️
            </h1>
            <p className="text-[11px] text-warm-gray mt-1.5 font-semibold">
              대장들과 함께 호흡하며 수집한 비밀 뱃지와 레벨 통계를 우아하게 실증하는 공간이다댕!
            </p>
          </header>

          {/* Interactive Player ID HUD Box */}
          <section className="bg-gradient-to-br from-pastel-orange via-orange-100 to-amber-50 rounded-[36px] p-6 shadow-soft mb-6 border-2 border-cream-border/65 relative overflow-hidden text-warm-gray-dark w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFFFFF]/30 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-4 border-b border-[#F0D0B5] pb-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-soft flex items-center justify-center text-3xl border border-cream-border animate-pulse">
                🐾
              </div>
              <div>
                <h3 className="font-black text-base text-amber-950 flex items-center gap-1.5">
                  나의 모험견공 요원 <span className="text-[9px] bg-white text-pastel-orange border border-[#FFE8DA] px-2 py-0.5 rounded-md">수습 대장</span>
                </h3>
                <p className="text-[11px] text-warm-gray font-bold mt-1">
                  크림빌리지 장미길 어귀를 수호하는 명예 집사 순찰단
                </p>
              </div>
            </div>

            {/* Exp grid statistics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-cream-border/30">
                <span className="text-[10px] text-warm-gray font-black block">누적 걸음수</span>
                <span className="text-sm font-black font-mono text-[#D55F1B] leading-none mt-1.5 block">
                  {userProfile.totalStepsAccumulated.toLocaleString()} <span className="text-[9.5px] font-semibold">Step</span>
                </span>
              </div>
              <div className="bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-cream-border/30">
                <span className="text-[10px] text-warm-gray font-black block">소유 골드코인</span>
                <span className="text-sm font-black font-mono text-[#136C4E] leading-none mt-1.5 block">
                  {userProfile.coins} <span className="text-[9.5px] font-semibold">Gold</span>
                </span>
              </div>
              <div className="bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-cream-border/30">
                <span className="text-[10px] text-warm-gray font-black block">등급 레벨</span>
                <span className="text-sm font-black font-mono text-indigo-950 leading-none mt-1.5 block font-accent">
                  Lv.{userProfile.level} <span className="text-[9px] text-[#A05216] font-bold">({userProfile.exp}%)</span>
                </span>
              </div>
            </div>

            {/* Levelup bar progress */}
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-black text-amber-950">
                <span>레벨 누적 경험치</span>
                <span>{userProfile.exp} / 100 EXP</span>
              </div>
              <div className="w-full h-2.5 bg-white/40 rounded-full overflow-hidden border border-[#FFE8DA]">
                <div className="bg-gradient-to-r from-pastel-orange to-amber-500 h-full transition-all duration-500" style={{ width: `${userProfile.exp}%` }} />
              </div>
            </div>
          </section>

          {/* Badges and Certification stamps book cabinet */}
          <section className="bg-white p-5 rounded-[32px] border-2 border-cream-border/60 shadow-soft flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between border-b border-cream-border/40 pb-2">
              <span className="text-xs font-black text-warm-gray-dark flex items-center gap-1 font-sans">
                🏆 수집 완료된 비밀 훈장/배지 ({userProfile.badges.length} / 7)
              </span>
              <button
                type="button"
                onClick={handleResetProfile}
                className="text-[9.5px] text-[#A82B14] font-black bg-red-100 hover:bg-red-205 border border-red-300 px-3 py-1 rounded-xl cursor-pointer transition-colors"
              >
                기록 초기화 🔄
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-cream-accent/50 border border-[#F0D0B5]/50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center border border-cream-border flex-shrink-0">
                  <Award size={16} className="text-pastel-orange" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11.5px] font-black text-warm-gray-dark">신참 산책대원</span>
                  <span className="text-[9px] text-warm-gray/65 font-bold mt-0.5">가장 위대한 첫 걸음</span>
                </div>
              </div>

              <div className="bg-cream-accent/50 border border-[#F0D0B5]/50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center border border-cream-border flex-shrink-0">
                  <Sparkles size={15} className="text-amber-500" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11.5px] font-black text-warm-gray-dark">꽃골목 탐정단</span>
                  <span className="text-[9px] text-warm-gray/65 font-bold mt-0.5">장미길 가로수 완주작</span>
                </div>
              </div>

              {userProfile.badges.includes('mango_golden_nap') && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2.5 animate-[fadeIn_0.5s_ease-out]">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center border border-amber-200 flex-shrink-0">
                    <Cat size={15} className="text-amber-600" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-amber-950">망고 햇살훈장</span>
                    <span className="text-[9px] text-amber-850 font-semibold mt-0.5">담장 햇살 명예요원</span>
                  </div>
                </div>
              )}

              {userProfile.badges.includes('janggun_safe_shield') && (
                <div className="bg-slate-50 border border-slate-300 rounded-2xl p-3 flex items-center gap-2.5 animate-[fadeIn_0.5s_ease-out]">
                  <span className="text-xl bg-slate-200 shadow-xs rounded-xl p-1.5 border border-slate-300 flex items-center justify-center w-8 h-8 font-sans">🛡️</span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-slate-900">장군 수호령</span>
                    <span className="text-[9px] text-slate-655 font-semibold mt-0.5">안전로 가로수패</span>
                  </div>
                </div>
              )}

              {userProfile.badges.includes('nabi_rainbow_chest') && (
                <div className="bg-[#EBF8FF] border border-[#BEE3F8] rounded-2xl p-3 flex items-center gap-2.5 animate-[fadeIn_0.5s_ease-out]">
                  <span className="text-xl bg-white shadow-xs rounded-xl p-1.5 border border-sky-100 flex items-center justify-center w-8 h-8 font-sans">🎁</span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-sky-950">나비 요새장</span>
                    <span className="text-[9px] text-sky-755 font-semibold mt-0.5">낙엽 도토리 보물선</span>
                  </div>
                </div>
              )}

              {userProfile.badges.includes('bori_clover_crown') && (
                <div className="bg-[#E6FFFA] border border-[#B2F5EA] rounded-2xl p-3 flex items-center gap-2.5 animate-[fadeIn_0.5s_ease-out]">
                  <span className="text-xl bg-white shadow-xs rounded-xl p-1.5 border border-teal-200 flex items-center justify-center w-8 h-8 overflow-hidden">
                    {CHARACTERS.bori.avatarImage ? (
                      <img src={CHARACTERS.bori.avatarImage} alt="보리" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      "🌾"
                    )}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-teal-950">보리 네잎관</span>
                    <span className="text-[9px] text-teal-755 font-semibold mt-0.5">솔바람 흙 치유증</span>
                  </div>
                </div>
              )}

              {userProfile.badges.includes('mungchi_thunder_bolt') && (
                <div className="bg-[#FFF5F5] border border-[#FEB2B2] rounded-2xl p-3 flex items-center gap-2.5 animate-[fadeIn_0.5s_ease-out]">
                  <span className="text-xl bg-white shadow-xs rounded-xl p-1.5 border border-rose-200 flex items-center justify-center w-8 h-8 overflow-hidden">
                    {CHARACTERS.mungchi.avatarImage ? (
                      <img src={CHARACTERS.mungchi.avatarImage} alt="뭉치" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      "⚡"
                    )}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-rose-950">번개 대장군</span>
                    <span className="text-[9px] text-rose-755 font-semibold mt-0.5">언덕 돌파 신발력</span>
                  </div>
                </div>
              )}
            </div>
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
          { tab: 'profile', icon: (active: boolean) => <User size={18} className={active ? 'text-pastel-orange stroke-[2.5]' : 'text-warm-gray'} />, label: '프로필' },
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

      {/* 5. ACTIVE MUNGCHI BADGE CELEBRATION MODAL OVERLAY */}
      {celebrationBadge && (
        <div
          id="mungchi-celebration-modal"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-[fadeIn_0.3s_ease-out]"
          onClick={() => setCelebrationBadge(null)}
        >
          <div
            className="bg-[#FFFDF9] p-6 sm:p-7 max-w-md w-full rounded-[42px] border-4 border-[#FFA05E] shadow-2xl flex flex-col items-center text-center gap-4.5 relative animate-[scaleIn_0.35s_cubic-bezier(0.175,0.885,0.32,1.275)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti simulation decorations */}
            <div className="absolute top-4 left-4 text-lg animate-bounce text-yellow-400">✨</div>
            <div className="absolute top-4 right-4 text-base animate-pulse text-pastel-orange">🌟</div>
            <div className="absolute bottom-6 left-6 text-lg animate-pulse text-rose-450">🌸</div>
            <div className="absolute bottom-6 right-6 text-base animate-bounce text-pastel-mint">🍂</div>

            {/* Badge visual banner */}
            <div className="relative">
              <div className="w-16 h-16 rounded-[22px] bg-gradient-to-tr from-pastel-orange to-amber-500 shadow-md flex items-center justify-center text-3xl animate-bounce overflow-hidden bg-white">
                {CHARACTERS.mungchi.avatarImage ? (
                  <img src={CHARACTERS.mungchi.avatarImage} alt="뭉치" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  "🐩"
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-white text-rose-500 rounded-full px-1.5 py-0.5 border border-cream-border text-[8px] font-black shadow-xs">뭉치인정</span>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-[9.5px] font-black text-pastel-orange tracking-widest uppercase font-accent">CREAM VILLAGE ADVENTURE CERTIFICATE</span>
              <h2 className="text-base sm:text-lg font-black text-warm-gray-dark leading-tight">
                {celebrationBadge.title} 수집 완료!<br/>
                <span className="text-[#BD4C15] font-extrabold text-sm sm:text-base">“크림마을 명예 대장인장 수여냥!”</span>
              </h2>
            </div>

            {/* 5-Leader Conquest Stamped Certificate Layout */}
            <div className="w-full bg-[#FFFBF2] p-4 rounded-3xl border-2 border-dashed border-[#F0D0B5]/85 flex flex-col gap-3 relative shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(#E8E2D2_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />
              
              <div className="text-[10px] text-warm-gray border-b border-[#F0D0B5]/40 pb-1.5 font-bold uppercase tracking-wide">
                🏆 대장 5형제 명예 연합 정복인증
              </div>

              {/* Grid of the 5 character stamps */}
              <div className="grid grid-cols-5 gap-1 pt-1 z-10">
                
                {/* Mango Stamp */}
                <div className="flex flex-col items-center gap-1 group transform rotate-3">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-dashed border-amber-400 flex items-center justify-center text-lg shadow-xs select-none relative overflow-hidden">
                    {CHARACTERS.mango.avatarImage ? (
                      <img src={CHARACTERS.mango.avatarImage} alt="망고" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span>🐱</span>
                    )}
                    <span className="absolute -bottom-0.5 right-0 text-[6.5px] bg-amber-400 text-white rounded-full p-0.2 px-0.4 leading-none font-black scale-80 z-10">합격</span>
                  </div>
                  <span className="text-[7.5px] font-black text-amber-800">🥭 망고합격냥</span>
                </div>

                {/* Janggun Stamp */}
                <div className="flex flex-col items-center gap-1 group transform -rotate-6">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-dashed border-slate-400 flex items-center justify-center text-lg shadow-xs select-none relative overflow-hidden">
                    {CHARACTERS.janggun.avatarImage ? (
                      <img src={CHARACTERS.janggun.avatarImage} alt="장군" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span>🐶</span>
                    )}
                    <span className="absolute -bottom-0.5 right-0 text-[6.5px] bg-[#5C554F] text-white rounded-full p-0.2 px-0.4 leading-none font-black scale-80 z-10">안전</span>
                  </div>
                  <span className="text-[7.5px] font-black text-slate-800 font-sans">🛡️ 장군안심댕</span>
                </div>

                {/* Nabi Stamp */}
                <div className="flex flex-col items-center gap-1 group transform rotate-12">
                  <div className="w-10 h-10 rounded-full bg-[#EBF8FF] border-2 border-dashed border-sky-400 flex items-center justify-center text-lg shadow-xs select-none relative overflow-hidden">
                    {CHARACTERS.nabi.avatarImage ? (
                      <img src={CHARACTERS.nabi.avatarImage} alt="나비" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span>🐈‍⬛</span>
                    )}
                    <span className="absolute -bottom-0.5 right-0 text-[6.5px] bg-sky-450 text-white rounded-full p-0.2 px-0.4 leading-none font-black scale-80 z-10">발견</span>
                  </div>
                  <span className="text-[7.5px] font-black text-sky-800">🎁 나비보물냥</span>
                </div>

                {/* Bori Stamp */}
                <div className="flex flex-col items-center gap-1 group transform -rotate-3">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-dashed border-teal-400 flex items-center justify-center text-lg shadow-xs select-none relative overflow-hidden">
                    {CHARACTERS.bori.avatarImage ? (
                      <img src={CHARACTERS.bori.avatarImage} alt="보리" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span>🐕‍🦺</span>
                    )}
                    <span className="absolute -bottom-0.5 right-0 text-[6.5px] bg-[#3EBC9B] text-white rounded-full p-0.2 px-0.4 leading-none font-black scale-80 z-10">치유</span>
                  </div>
                  <span className="text-[7.5px] font-black text-teal-800">🌾 보리클로버</span>
                </div>

                {/* Mungchi Stamp */}
                <div className="flex flex-col items-center gap-1 group transform rotate-6 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-dashed border-pink-400 flex items-center justify-center text-lg shadow-xs select-none relative overflow-hidden">
                    {CHARACTERS.mungchi.avatarImage ? (
                      <img src={CHARACTERS.mungchi.avatarImage} alt="뭉치" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span>🐩</span>
                    )}
                    <span className="absolute -bottom-0.5 right-0 text-[6.5px] bg-pink-500 text-white rounded-full p-0.2 px-0.4 leading-none font-black scale-80 z-10">완정</span>
                  </div>
                  <span className="text-[7.5px] font-black text-pink-800 font-sans">⚡ 뭉치열정댕</span>
                </div>

              </div>

              <div className="text-[10px] text-warm-gray leading-normal border-t border-[#F0D0B5]/40 pt-2 font-semibold">
                위 유저는 크림마을 골묵 구석구석을 탐사하여 <strong className="text-amber-800 font-black">"{celebrationBadge.title}"</strong> 칭호를 획득하였으므로 이 보증서를 도장 쾅 찍어 인가한다냥멍!
              </div>
            </div>

            <p className="text-[10.5px] text-warm-gray font-semibold leading-relaxed max-w-xs -mt-1">
              {celebrationBadge.description}
            </p>

            <div className="flex gap-2.5 items-center py-3 px-3.5 bg-pastel-orange-soft/45 rounded-2xl text-[10.5px] text-[#A05216] leading-relaxed italic border border-[#FFE8DA] font-bold shadow-inner text-left">
              {CHARACTERS.mungchi.avatarImage ? (
                <img src={CHARACTERS.mungchi.avatarImage} alt="뭉치" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-pink-200 object-cover flex-shrink-0" />
              ) : (
                <span>🐩</span>
              )}
              <span>뭉치 소대장: “헥헥! 이번 정복으로 수첩 지도가 훨씬 빵빵해졌다멍! 보상 골드도 주머니에 고이 집어넣었으니, 다음 미지 골목도 얼른 번개같이 달리자개!!”</span>
            </div>

            <button
              type="button"
              id="btn-close-celebration"
              onClick={() => setCelebrationBadge(null)}
              className="w-full py-4 bg-gradient-to-r from-pastel-orange to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-xs font-black shadow-premium cursor-pointer transition-all btn-squishy"
            >
              다섯 대장들과 앞발 하이파이브 하고 출발하기 🐾
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
