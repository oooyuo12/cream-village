import { PetCharacter, Route } from './types';

import mangoAvatar from './assets/images/mango_avatar_1779519876588.png';
import janggunAvatar from './assets/images/janggun_avatar_1779519900264.png';
import nabiAvatar from './assets/images/nabi_avatar_1779519918901.png';
import boriAvatar from './assets/images/bori_avatar_1779519937488.png';
import mungchiAvatar from './assets/images/mungchi_avatar_1779519956861.png';

export const CHARACTERS: Record<string, PetCharacter> = {
  mango: {
    id: 'mango',
    name: '망고',
    species: '치즈태비 고양이',
    personality: '호기심과 용기가 가득한 타고난 탐험가냥',
    role: '숨겨진 장소와 지름길 발견 담당',
    specialty: '비밀 골목길 & 골목 사진 스팟 탐색',
    avatar: '🥭',
    avatarEmoji: '🐱',
    avatarImage: mangoAvatar,
    color: 'from-amber-400 to-orange-500 text-amber-900 border-amber-300 bg-amber-50',
    description: '“이 담벼락 너머에 뭐가 있는지 알아? 내 꼬리를 따라와봐, 엄청난 비밀 장소를 보여줄게!”'
  },
  janggun: {
    id: 'janggun',
    name: '장군',
    species: '작은 검정 믹스견',
    personality: '든든하고 듬직하게 길을 지키는 맏형댕',
    role: '안전하고 넓은 안심 가이드',
    specialty: '유모차 가능 도로 & 안전 횡단보도 안내',
    avatar: '🛡️',
    avatarEmoji: '🐶',
    avatarImage: janggunAvatar,
    color: 'from-slate-700 to-slate-900 text-white border-slate-600 bg-slate-100',
    description: '“다치지 않게 조심조심! 내가 먼저 냄새를 맡고 왔으니 안심하고 걸어도 좋아.”'
  },
  nabi: {
    id: 'nabi',
    name: '나비',
    species: '턱시도 아기 고양이',
    personality: '어디로 튈지 모르는 귀여운 장난꾸러기냥',
    role: '돌발 모험과 보물상자 담당',
    specialty: '길가 낙엽 아래 도토리, 나비 친구 찾기',
    avatar: '🦋',
    avatarEmoji: '🐈‍⬛',
    avatarImage: nabiAvatar,
    color: 'from-sky-400 to-indigo-500 text-sky-950 border-sky-300 bg-sky-50',
    description: '“헤헤, 저기 벤치 아래 반짝이는 연못 상자가 있어! 빨리 열어보고 싶지 않아?”'
  },
  bori: {
    id: 'bori',
    name: '보리',
    species: '크림색 강아지',
    personality: '평온한 미소로 평화를 주는 힐링댕',
    role: '힐링 지점과 소리/풍경 감상 담당',
    specialty: '바람 소리 명당, 흙냄새 가득 정원 추천',
    avatar: '🌾',
    avatarEmoji: '🐕‍🦺',
    avatarImage: boriAvatar,
    color: 'from-emerald-400 to-teal-500 text-emerald-950 border-emerald-300 bg-emerald-50',
    description: '“이곳 풀밭은 유난히 폭신해. 머물면서 솔바람 소리를 함께 듣고 시원한 흙냄새를 맡아보자.”'
  },
  mungchi: {
    id: 'mungchi',
    name: '뭉치',
    species: '스피츠/포메라니안',
    personality: '단 1초도 쉴 틈 없는 엄청난 활력 에너자이저',
    role: '성취와 활발한 스포츠 산책 담당',
    specialty: '칼로리 소모 언덕길 & 보상 뱃지 축하',
    avatar: '⚡',
    avatarEmoji: '🐩',
    avatarImage: mungchiAvatar,
    color: 'from-rose-400 to-pink-500 text-rose-950 border-rose-300 bg-rose-50',
    description: '“신나게 뛰자! 저 높은 언덕을 3분만에 돌파하면 나와 함께 골드 뱃지를 획득할 수 있어!”'
  }
};

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'route_1',
    name: '망고의 비밀 담벼락 햇살 탐험',
    description: '고양이 망고가 직접 찾은 담벼락 햇살이 아름다운 비밀 골목길 코스. 수많은 꽃들과 고즈넉한 한옥풍 감성을 즐겨보세요!',
    category: 'adventure',
    characterGuide: 'mango',
    purpose: 'afternoon',
    distance: 1.2,
    duration: 25,
    difficulty: 'normal',
    region: '크림빌리지 장미길',
    coordinates: [
      { x: 15, y: 80, lat: 37.5452, lng: 127.0355 },
      { x: 22, y: 65, lat: 37.5458, lng: 127.0368 },
      { x: 38, y: 55, lat: 37.5463, lng: 127.0375 },
      { x: 50, y: 45, lat: 37.5468, lng: 127.0382 },
      { x: 42, y: 25, lat: 37.5475, lng: 127.0390 },
      { x: 30, y: 30, lat: 37.5482, lng: 127.0396 }
    ],
    checkpoints: [
      {
        id: 'cp_1_1',
        name: '붉은 양옥 담벼락',
        description: '오후 2시에 가장 햇살이 이쁘게 닿는 망고의 최애 쉼터. 장미 동굴이 이뻐요!',
        x: 22,
        y: 65,
        lat: 37.5458,
        lng: 127.0368,
        type: 'photo',
        discovered: false,
        characterComment: '“여기 담벼락 아래에 서서 사진을 찍으면, 누구든 오늘의 견생/묘생 최고 샷을 가질 수 있어!”'
      },
      {
        id: 'cp_1_2',
        name: '호기심 유발 우체통',
        description: '빨갛고 오래된 우체통 아래, 동네 길고양이들이 비밀 편지를 놓고 간다는 후문이!',
        x: 50,
        y: 45,
        lat: 37.5468,
        lng: 127.0382,
        type: 'sniff',
        discovered: false,
        characterComment: '“히히, 여기 편지함 주변에 맛있는 마따따비 향이 은은하게 나는데? 얼른 킁킁해보자구!”'
      },
      {
        id: 'cp_1_3',
        name: '미지의 장난감 상자',
        description: '골동품 가구 앞 나비 한마리가 날아다니는 숨은 골목 어귀.',
        x: 42,
        y: 25,
        lat: 37.5475,
        lng: 127.0390,
        type: 'chest',
        discovered: false,
        characterComment: '“앗! 낙엽 속에 작은 보물 주머니가 숨겨져 있어! 용기 있게 한 번 열어볼까?”'
      }
    ],
    tags: ['숨은골목', '포토존', '장미길', '냥감성']
  },
  {
    id: 'route_2',
    name: '장군의 가로수 안심 산책길',
    description: '왕복 차선에서 분리된 안전한 보도블록 유모차가 들어가기도 편안한 도로. 횡단보도가 모두 신호 연동되어 안심하고 걷기 좋습니다.',
    category: 'quiet',
    characterGuide: 'janggun',
    purpose: 'morning',
    distance: 2.1,
    duration: 40,
    difficulty: 'easy',
    region: '소리숲 푸른대로',
    coordinates: [
      { x: 80, y: 85, lat: 37.5412, lng: 127.0345 },
      { x: 75, y: 60, lat: 37.5420, lng: 127.0358 },
      { x: 65, y: 40, lat: 37.5428, lng: 127.0372 },
      { x: 55, y: 30, lat: 37.5435, lng: 127.0386 },
      { x: 70, y: 20, lat: 37.5442, lng: 127.0402 },
      { x: 85, y: 35, lat: 37.5450, lng: 127.0418 }
    ],
    checkpoints: [
      {
        id: 'cp_2_1',
        name: '드넓은 가로수 안심 인도',
        description: '오토바이가 다니지 않는 넓고 쾌적한 웰컴 펫 워킹 구역.',
        x: 75,
        y: 60,
        lat: 37.5420,
        lng: 127.0358,
        type: 'rest',
        discovered: false,
        characterComment: '“이 길은 턱이 낮고 사람들과 부딪힐 염려가 적어. 한발한발 가볍게 산책하자.”'
      },
      {
        id: 'cp_2_2',
        name: '동네 순찰 반려식물 쉼터',
        description: '펫 워터 스테이션과 귀여운 전용 목줄 걸이가 있는 우아한 벤치.',
        x: 55,
        y: 30,
        lat: 37.5435,
        lng: 127.0386,
        type: 'landmark',
        discovered: false,
        characterComment: '“횡단보도를 가기 전 시원한 물 한잔 마시고 갈 수 있는 쉼터야. 동생들을 보살피는 건 형으로서 당연하니까!”'
      }
    ],
    tags: ['안전길', '목줄안심', '유모차편리', '초심자코스']
  },
  {
    id: 'route_3',
    name: '보리의 솔비누 흙내음 평원',
    description: '폭신폭신한 천연 잔디와 흙이 펼쳐진 도심 속 숲길. 강아지들의 후각을 완벽히 마사지하고 발바닥에 힐링을 주는 웰빙 낙원.',
    category: 'nature',
    characterGuide: 'bori',
    purpose: 'sunset',
    distance: 1.5,
    duration: 35,
    difficulty: 'normal',
    region: '속삭임 정원',
    coordinates: [
      { x: 10, y: 15, lat: 37.5438, lng: 127.0322 },
      { x: 25, y: 28, lat: 37.5445, lng: 127.0335 },
      { x: 45, y: 32, lat: 37.5452, lng: 127.0348 },
      { x: 60, y: 50, lat: 37.5458, lng: 127.0360 },
      { x: 72, y: 70, lat: 37.5466, lng: 127.0374 }
    ],
    checkpoints: [
      {
        id: 'cp_3_1',
        name: '피톤치드 폭포 정원',
        description: '흙이 소복하게 깔려 맨발로 짚어도 기분 좋은 치유의 나무 숲길.',
        x: 25,
        y: 28,
        lat: 37.5445,
        lng: 127.0335,
        type: 'sniff',
        discovered: false,
        characterComment: '“눈을 지그시 감고 흙의 보송보송한 가을 내음을 크게 들이마셔봐. 가만히 서있기만 해도 행복해져.”'
      },
      {
        id: 'cp_3_2',
        name: '노을빛 시냇물 쉼터',
        description: '시원한 물소리가 은은하게 들리고 아름다운 억새가 가득 피어있는 쉼터.',
        x: 60,
        y: 50,
        lat: 37.5458,
        lng: 127.0360,
        type: 'photo',
        discovered: false,
        characterComment: '“구름 사이로 비치는 노을이 시냇물을 황금빛으로 물들이고 있어. 이 순간을 기억하며 다 함께 찰칵!”'
      }
    ],
    tags: ['흙길', '피톤치드', '힐링', '잔디광장']
  },
  {
    id: 'route_4',
    name: '나비의 도토리 보물찾기 골목',
    description: '나비가 굴려둔 알록달록 무지개 낙엽과 반짝거리는 장난감 상자들을 따라 걷는 아기자기한 랜덤 미션 놀이터 코스.',
    category: 'sensory',
    characterGuide: 'nabi',
    purpose: 'morning',
    distance: 1.0,
    duration: 20,
    difficulty: 'easy',
    region: '노랑햇살 아케이드',
    coordinates: [
      { x: 40, y: 90, lat: 37.5448, lng: 127.0385 },
      { x: 50, y: 78, lat: 37.5442, lng: 127.0392 },
      { x: 65, y: 82, lat: 37.5435, lng: 127.0399 },
      { x: 78, y: 75, lat: 37.5428, lng: 127.0406 },
      { x: 90, y: 55, lat: 37.5420, lng: 127.0412 }
    ],
    checkpoints: [
      {
        id: 'cp_4_1',
        name: '무지개 낙엽 바스락 지대',
        description: '밟을 때마다 바스락- 소리가 크게 들려 귀여운 흥미를 유발하는 지점.',
        x: 50,
        y: 78,
        lat: 37.5442,
        lng: 127.0392,
        type: 'sniff',
        discovered: false,
        characterComment: '“바스락바스락! 낙엽 소리 진짜 깜짝 놀라고 재밌지 않아? 이 잎사귀 속에 무언가를 숨겨놨지롱!”'
      },
      {
        id: 'cp_4_2',
        name: '나비의 사과상자 요새',
        description: '나비가 머물며 쉴 수 있게 제작된 작은 원목 박스.',
        x: 78,
        y: 75,
        lat: 37.5428,
        lng: 127.0406,
        type: 'chest',
        discovered: false,
        characterComment: '“꺄아! 내 아지트 박스에서 엄청 흔들리는 깃털 보물을 찾았어! 획득하면 모험 에너지가 만땅충전!”'
      }
    ],
    tags: ['랜덤보물', '바스락낙엽', '미소충전', '놀이산책']
  },
  {
    id: 'route_5',
    name: '뭉치의 번개 충전 불꽃 언덕길',
    description: '엄청난 에너지 반려견 뭉치가 제안하는 쉼 없는 신나라 액티비티 구역! 계단길과 가벼운 고구마 고개를 돌파해 뱃지를 세워보세요.',
    category: 'adventure',
    characterGuide: 'mungchi',
    purpose: 'night',
    distance: 2.8,
    duration: 50,
    difficulty: 'challenge',
    region: '번개 언덕 광장',
    coordinates: [
      { x: 30, y: 10, lat: 37.5468, lng: 127.0315 },
      { x: 50, y: 15, lat: 37.5475, lng: 127.0328 },
      { x: 70, y: 18, lat: 37.5482, lng: 127.0342 },
      { x: 80, y: 35, lat: 37.5488, lng: 127.0356 },
      { x: 90, y: 10, lat: 37.5495, lng: 127.0370 }
    ],
    checkpoints: [
      {
        id: 'cp_5_1',
        name: '지그재그 불꽃 계단',
        description: '허벅지 힘 대결! 지치지 않는 뭉치가 즐겨 달리는 계단 스포티 운동회 지점.',
        x: 50,
        y: 15,
        lat: 37.5475,
        lng: 127.0328,
        type: 'landmark',
        discovered: false,
        characterComment: '“헉헉! 여기까지 쉬지 않고 올라왔어? 너 진짜 대단한 탐험 파트너구나! 더 파워풀하게 달려볼까? 고고!”'
      },
      {
        id: 'cp_5_2',
        name: '별빛 정상 노을 마루',
        description: '힘들게 정복하고 나면 밤하늘의 은하수가 한눈에 쏟아지는 시원한 최고 전망대.',
        x: 80,
        y: 35,
        lat: 37.5488,
        lng: 127.0356,
        type: 'chest',
        discovered: false,
        characterComment: '“예쓰!! 번개 탐험 완벽 완료!! 우주 최고 에너자이저 뱃지와 간식 박스를 선물로 줄게! 받아라 번개 파워!!”'
      }
    ],
    tags: ['파워달리기', '체력증진', '뱃지보상', '밤바람']
  }
];

export const REGIONS = [
  '전체동네',
  '성남시 전체',
  '일산 덕이동',
  '부천 범안로',
  '서울숲'
];
export const CATEGORIES = [
  { id: 'all', name: '전체 모험', emoji: '🌟' },
  { id: 'adventure', name: '담벼락 비밀탐험', emoji: '🧭' },
  { id: 'quiet', name: '안심 편안산책', emoji: '🛡️' },
  { id: 'nature', name: '풀밭 감성힐링', emoji: '🌾' },
  { id: 'sensory', name: '랜덤 보물찾기', emoji: '🎁' }
];
export const PURPOSES = [
  { id: 'all', name: '모든 시간', emoji: '⏱️' },
  { id: 'morning', name: '아침 기지개 (Stretching)', emoji: '🌅' },
  { id: 'afternoon', name: '오후 두리번 (Exploration)', emoji: '🌞' },
  { id: 'sunset', name: '노을빛 사색 (Healing)', emoji: '🌇' },
  { id: 'night', name: '안전 밤순찰 (Patrol)', emoji: '🌙' }
];

export const EVENTS_POOL = [
  '나비가 길가 덤불에서 반짝이는 돌멩이를 찾았습니다! 💎 +5코인 지각!',
  '보리가 노랗게 익은 들꽃 향을 실컷 맡아 행복도 100%에 달했습니다. 🌸',
  '장군이가 보행에 소음이 큰 도로를 탐지하고 안전한 화단 우회 도로를 안내했습니다. 🗺️',
  '망고가 지름길 담벼락 아래 아늑한 잠자리를 발견해 기지개를 켭니다! 🐾',
  '뭉치와 함께 벤치를 지나자, 숨겨둔 도토리가 떨어졌습니다! 🐿️ 도토리 간식 획득!',
  '아주 가벼운 가을 벌 수리를 한 마리 만났으나 장군이의 안전 엄호로 귀엽게 지나쳤습니다! 🐕',
  '풀숲 아래 나비가 심어둔 수수께끼 초콜릿 상자 모양 뱃지를 주웠습니다! 🍫 (+10코인)'
];
