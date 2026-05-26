import React, { useState, useEffect } from 'react';
import { Route, PetCharacterType } from '../types';
import { CHARACTERS } from '../data';
import { Sparkles, Brain, Loader2, MessageSquare, AlertTriangle, HelpCircle } from 'lucide-react';

interface AiRoutePanelProps {
  onRouteGenerated: (newRoute: Route) => void;
  selectedRadius: number;
  selectedPurpose: string;
  selectedRegion: string;
  preSelectedGuide?: PetCharacterType;
}

export const AiRoutePanel: React.FC<AiRoutePanelProps> = ({
  onRouteGenerated,
  selectedRadius,
  selectedPurpose,
  selectedRegion,
  preSelectedGuide
}) => {
  const [activeGuide, setActiveGuide] = useState<PetCharacterType>('mango');
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync activeGuide with preSelectedGuide when changed by parent NPC center
  useEffect(() => {
    if (preSelectedGuide) {
      setActiveGuide(preSelectedGuide);
    }
  }, [preSelectedGuide]);

  const guide = CHARACTERS[activeGuide];

  const presetSuggestions = {
    mango: [
      "꽃 향기가 참 좋고 길고양이가 아지트로 삼는 아기자기한 담벼락 지름길",
      "사람 무리가 거의 없고 따뜻한 햇살 가볍게 내리쬐는 비밀 탐정 코스"
    ],
    janggun: [
      "휠체어나 유모차도 가기 편하고 자동차 경적이 일절 없는 안심 평지길",
      "다리에 가해진 피로를 치료해주는 푹신하고 매끄러운 수변 흙길 가로수"
    ],
    nabi: [
      "낙엽이 수북하게 쌓여 바스락바스락 걷기 최고인 낙엽 음악대 트랙",
      "길거리에서 동네 비둘기나 참새 친구들을 여유롭게 감상하는 탐구 보물길"
    ],
    bori: [
      "포근하고 푸릇푸릇한 잔디 정원에서 엎드려 솔바람 쐬우는 슬로우 공원길",
      "시골의 냇가 정취가 그대로 남아있는 조용하게 새 소리 듣는 힐링 코스"
    ],
    mungchi: [
      "헉헉 소리나게 계단과 가파른 흙 언덕 고개를 오르내리는 번개 전정길",
      "체력을 단숨에 폭발시켜 꿀잠 자도록 유도하는 서바이벌 장애물 달리기"
    ]
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/generate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: activeGuide,
          requirement: userPrompt || "동네의 보석 같은 감성 지점을 발견하고 싶어!",
          radius: selectedRadius,
          purpose: selectedPurpose === 'all' ? 'afternoon' : selectedPurpose,
          region: selectedRegion === '전체동네' ? '크림빌리지' : selectedRegion
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "어드벤처 지도를 그릴 수 없어졌습니다.");
      }

      const generatedRoute: Route = await response.json();
      onRouteGenerated(generatedRoute);
      setUserPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "서버 혹은 API 연동에 이슈가 생겨 보리가 지도를 그릴 수 없습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getGuideBg = (id: string, isSelected: boolean) => {
    if (isSelected) {
      switch (id) {
        case 'mango': return 'bg-amber-400 border-amber-500 text-white';
        case 'janggun': return 'bg-warm-gray-dark border-neutral-800 text-white';
        case 'nabi': return 'bg-pastel-blue border-emerald-500 text-white';
        case 'bori': return 'bg-pastel-mint border-emerald-600 text-white';
        default: return 'bg-rose-400 border-rose-500 text-white';
      }
    }
    return 'bg-white border-cream-border text-warm-gray hover:bg-cream-accent';
  };

  if (isGenerating) {
    return (
      <div className="p-6 bg-[#FFFDF9] rounded-[32px] border-2 border-dashed border-[#F3E6D5] shadow-soft flex flex-col gap-5 text-center items-center justify-center animate-pulse" id="ai-loading-screen">
        <div className="relative">
          <span className="text-4xl animate-bounce block">🗺️✨</span>
          <span className="absolute -top-1 -right-1 text-xs animate-spin font-bold">📡</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-black text-warm-gray-dark">{guide.name} 대장선배와 5총사가 지도를 구성 중이다냥!</h3>
          <p className="text-[10px] text-warm-gray/70">크림마을 동네 구석구석을 실시간 탐사하여 수첩을 채우고 있다냥.</p>
        </div>

        {/* Mascot Activity Status Rows */}
        <div className="w-full bg-cream-accent/70 p-3.5 rounded-2xl border border-[#FAEFDF]/70 text-left flex flex-col gap-2.5 text-[10.5px]">
          <div className="flex items-center gap-2.5">
            {CHARACTERS.mango.avatarImage ? (
              <img src={CHARACTERS.mango.avatarImage} alt="망고" referrerPolicy="no-referrer" className="w-7 h-7 rounded-lg object-cover border border-amber-200 shadow-xs" />
            ) : (
              <span className="text-lg bg-orange-100 p-1.5 rounded-xl">🐱</span>
            )}
            <div>
              <span className="font-extrabold text-[#D55F1B]">망고 선배의 햇살검증:</span>
              <span className="text-warm-gray ml-1">오후 담장 햇볕 아늑지대 검증완료냥! ☀️</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 border-t border-[#F5EFE0] pt-2">
            {CHARACTERS.janggun.avatarImage ? (
              <img src={CHARACTERS.janggun.avatarImage} alt="장군" referrerPolicy="no-referrer" className="w-7 h-7 rounded-lg object-cover border border-slate-300 shadow-xs" />
            ) : (
              <span className="text-lg bg-slate-100 p-1.5 rounded-xl font-sans">🐶</span>
            )}
            <div>
              <span className="font-extrabold text-slate-700 font-sans">장군 선배의 통학안심:</span>
              <span className="text-warm-gray ml-1">평탄 유모차 보행로 안전도 체크완료댕! 🛡️</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 border-t border-[#F5EFE0] pt-2">
            {CHARACTERS.nabi.avatarImage ? (
              <img src={CHARACTERS.nabi.avatarImage} alt="나비" referrerPolicy="no-referrer" className="w-7 h-7 rounded-lg object-cover border border-sky-200 shadow-xs" />
            ) : (
              <span className="text-lg bg-sky-100 p-1.5 rounded-xl">🐈‍⬛</span>
            )}
            <div>
              <span className="font-extrabold text-sky-800">나비 선배의 보물배치:</span>
              <span className="text-warm-gray ml-1">바스락 주머니 도토리 3개 은닉성공냥! 🎁</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 border-t border-[#F5EFE0] pt-2">
            {CHARACTERS.bori.avatarImage ? (
              <img src={CHARACTERS.bori.avatarImage} alt="보리" referrerPolicy="no-referrer" className="w-7 h-7 rounded-lg object-cover border border-emerald-200 shadow-xs" />
            ) : (
              <span className="text-lg bg-emerald-100 p-1.5 rounded-xl">🐕‍🦺</span>
            )}
            <div>
              <span className="font-extrabold text-emerald-800">보리 선배의 사색구도:</span>
              <span className="text-warm-gray ml-1">솔바람 사색 시편 음악 구상하는 중댕... 🌾</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 border-t border-[#F5EFE0] pt-2">
            {CHARACTERS.mungchi.avatarImage ? (
              <img src={CHARACTERS.mungchi.avatarImage} alt="뭉치" referrerPolicy="no-referrer" className="w-7 h-7 rounded-lg object-cover border border-rose-200 shadow-xs" />
            ) : (
              <span className="text-lg bg-purple-100 p-1.5 rounded-xl">🐩</span>
            )}
            <div>
              <span className="font-extrabold text-purple-800 font-sans">뭉치 선배의 고구마파워:</span>
              <span className="text-warm-gray ml-1 font-sans">에너지 극복 명예 훈장 뱃지 세팅 완료댕! ⚡</span>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center gap-1.5 justify-center text-[10px] text-pastel-orange font-black">
          <Loader2 size={13} className="animate-spin stroke-[2.5]" />
          <span>번개같이 완성해 가는 중이니 몇 초간 기둘려 달라냥...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white rounded-[32px] border-2 border-cream-border shadow-soft flex flex-col gap-4.5" id="ai-route-panel">
      
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-1 border-b border-cream-border/65">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-pastel-orange-soft rounded-2xl text-pastel-orange shadow-inner flex items-center justify-center">
            <Sparkles size={18} className="animate-pulse stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-warm-gray-dark leading-tight">Mungchi AI 가이드 제작소</h3>
            <p className="text-[10px] text-warm-gray/80 mt-0.5">대장 캐릭터를 지정하고 맞춤 모험 테마 보물 지도를 즉석 발급해 보세요.</p>
          </div>
        </div>
        <span className="text-[9px] font-black text-pastel-orange bg-pastel-orange-soft border border-[#FFE8DA] px-2 py-0.5 rounded-full font-mono">
          AI AGENT v1.0
        </span>
      </div>

      {/* Guide selection tabs */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-warm-gray/90 uppercase tracking-wider pl-0.5">나와 걸을 전담 가이드 선택</label>
        <div className="grid grid-cols-5 gap-1.5">
          {(Object.keys(CHARACTERS) as PetCharacterType[]).map((key) => {
            const char = CHARACTERS[key];
            const isActive = activeGuide === key;
            return (
              <button
                key={key}
                id={`ai-guide-tab-${key}`}
                type="button"
                onClick={() => {
                  setActiveGuide(key);
                  setErrorMessage(null);
                }}
                className={`p-1.5 rounded-2xl text-center border-2 flex flex-col items-center gap-1 transition-all btn-squishy cursor-pointer ${getGuideBg(key, isActive)} ${isActive ? 'shadow-soft scale-102 font-bold' : ''}`}
              >
                {char.avatarImage ? (
                  <img src={char.avatarImage} alt={char.name} referrerPolicy="no-referrer" className={`w-10 h-10 rounded-full object-cover shadow-xs border ${isActive ? 'border-white' : 'border-slate-200'}`} />
                ) : (
                  <span className="text-xl">{char.avatarEmoji}</span>
                )}
                <span className="text-[10px] font-extrabold">{char.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* active character card */}
      <div className="p-3.5 bg-cream-accent/65 rounded-2xl border border-[#FAEFDF]/70 flex items-start gap-3 text-[11px] text-warm-gray leading-relaxed shadow-inner">
        {guide.avatarImage && (
          <img src={guide.avatarImage} alt={guide.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-xl object-cover border border-[#F3E6D5] flex-shrink-0 shadow-sm" />
        )}
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-[#9F5614]">🐾 {guide.name} ({guide.species})</span>
            <span className="text-[9px] bg-[#FFF2DE] text-[#B8711E] font-black px-1.5 py-0.2 rounded-full leading-none">{guide.role}</span>
          </div>
          <p className="italic text-warm-gray mt-1 text-[10.5px] border-l-3 border-[#FFDDA4] pl-2.5">
            “{guide.description}”
          </p>
        </div>
      </div>

      {/* Preset suggestions chips */}
      <div className="flex flex-col gap-2">
        <span className="text-[10.5px] font-black text-warm-gray flex items-center gap-1.5 pl-0.5">
          <MessageSquare size={13} className="text-pastel-orange stroke-[2.5]" /> 이런 어드벤처 요청도 좋아요:
        </span>
        <div className="flex flex-col gap-2">
          {presetSuggestions[activeGuide].map((suggestion, idx) => (
            <button
              key={idx}
              id={`preset-btn-${activeGuide}-${idx}`}
              type="button"
              onClick={() => setUserPrompt(suggestion)}
              className="w-full text-left bg-white border border-cream-border hover:border-pastel-orange p-3 rounded-2xl text-[11px] text-warm-gray-dark font-semibold btn-squishy cursor-pointer truncate shadow-xs"
            >
              🐕 "{suggestion}"
            </button>
          ))}
        </div>
      </div>

      {/* Custom input prompt card */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-warm-gray/90 uppercase tracking-wider pl-0.5">상세 맞춤 조건 직접 작성</label>
        <div className="relative">
          <textarea
            id="ai-prompt-area"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            className="w-full p-3.5 bg-white text-xs font-bold text-warm-gray-dark border-2 border-cream-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-pastel-orange/10 focus:border-pastel-orange placeholder-warm-gray/35 resize-none h-20 leading-relaxed shadow-inner"
            placeholder="예시: 디스크 끼가 있어서 높은 계단은 빼고, 조용한 가로수 그늘길 아래에서 쉴 수 있는 가로수길 붉은 벽돌 코스를 설계해줘 보리 선배!"
          />
        </div>
      </div>

      {/* Error message card */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-150 rounded-2xl text-[10.5px] text-red-900 flex items-start gap-1.5 animate-pulse">
          <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action triggers button */}
      <button
        type="button"
        id="btn-trigger-ai-route"
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full py-4 rounded-2xl font-black text-xs text-white shadow-soft transition-all duration-300 btn-squishy flex items-center justify-center gap-2 cursor-pointer ${
          isGenerating
            ? 'bg-amber-400 cursor-not-allowed text-stone-200'
            : 'bg-gradient-to-r from-pastel-orange to-orange-555 hover:from-orange-600 hover:to-orange-500 shadow-premium'
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 size={15} className="animate-spin stroke-[2.5]" />
            <span>{guide.name} 선배가 코 밑에 땀 흘리며 수첩 그리는 중... (약 5초)</span>
          </>
        ) : (
          <>
            <Brain size={15} className="animation-pulse text-amber-100" />
            <span>{guide.name} 선배와 비밀 아지트 지도 그리기 ✉️</span>
          </>
        )}
      </button>

    </div>
  );
};
