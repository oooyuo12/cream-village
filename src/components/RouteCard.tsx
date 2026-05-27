import React from 'react';
import { Route, PetCharacter } from '../types';
import { CHARACTERS } from '../data';
import { Footprints, Award, Zap, Heart, CheckCircle2, FlameKindling, Star } from 'lucide-react';

interface RouteCardProps {
  route: Route;
  isSelected: boolean;
  onSelect: () => void;
  onStartWalk: () => void;
  isActiveWalk: boolean;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  onSelect,
  onStartWalk,
  isActiveWalk
}) => {
  const guide: PetCharacter = CHARACTERS[route.characterGuide] ?? CHARACTERS.mango;
  const displayDistance = Number.isFinite(route.distance)
    ? route.distance >= 100
      ? (route.distance / 1000).toFixed(2)
      : route.distance.toFixed(route.distance < 10 ? 2 : 1)
    : '0.00';

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <span className="text-[9.5px] bg-[#E2F7F0] text-[#1D7F5F] font-black px-2.5 py-0.5 rounded-full">쉬움 🐾</span>;
      case 'challenge':
        return <span className="text-[9.5px] bg-[#FFEBEA] text-[#D84B42] font-black px-2.5 py-0.5 rounded-full">체력단련 🔥</span>;
      default:
        return <span className="text-[9.5px] bg-[#FFF2DE] text-[#B8711E] font-black px-2.5 py-0.5 rounded-full">평탄 보통 🧭</span>;
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'adventure':
        return { label: '비밀요새 모험', style: 'bg-pastel-orange-soft text-pastel-orange border border-orange-200/40' };
      case 'quiet':
        return { label: '조용한 치유단', style: 'bg-pastel-lavender-soft text-pastel-lavender border border-purple-200/40' };
      case 'nature':
        return { label: '초록솔밭 힐링', style: 'bg-pastel-mint-soft text-pastel-mint border border-teal-200/30' };
      case 'sensory':
        return { label: '우당탕 노리', style: 'bg-pink-50 text-pink-500 border border-pink-200/30' };
      default:
        return { label: '동네 마실길', style: 'bg-amber-50 text-amber-800' };
    }
  };

  const catTheme = getCategoryTheme(route.category);

  // Sticker stamp based on character guide role
  const getGuideStamp = (charId: string) => {
    switch (charId) {
      case 'mango':
        return (
          <div className="absolute top-2 right-16 transform rotate-12 bg-[#FFF8EB] border-2 border-dashed border-amber-400/80 text-amber-700 text-[9px] font-black px-2.5 py-0.5 rounded-xl shadow-xs z-10 font-sans flex items-center gap-1.5 pointer-events-none animate-pulse">
            <span className="text-[11px]">🥭</span>
            <span>망고선배의 최애 장소공개냥!</span>
          </div>
        );
      case 'janggun':
        return (
          <div className="absolute top-2 right-16 transform -rotate-6 bg-[#EDF2F7] border-2 border-dashed border-slate-400/80 text-slate-700 text-[9px] font-black px-2.5 py-0.5 rounded-xl shadow-xs z-10 font-sans flex items-center gap-1.5 pointer-events-none">
            <span className="text-[11px]">🛡️</span>
            <span>장군의 횡단보도 안심가이드댕!</span>
          </div>
        );
      case 'nabi':
        return (
          <div className="absolute top-2 right-16 transform rotate-6 bg-[#EBF8FF] border-2 border-dashed border-sky-400/80 text-sky-700 text-[9px] font-black px-2.5 py-0.5 rounded-xl shadow-xs z-10 font-sans flex items-center gap-1.5 pointer-events-none">
            <span className="text-[11px]">🎁</span>
            <span>나비의 낙엽 보물상자 보관함냥!</span>
          </div>
        );
      case 'bori':
        return (
          <div className="absolute top-2 right-16 transform -rotate-12 bg-[#E6FFFA] border-2 border-dashed border-teal-400/80 text-teal-800 text-[9px] font-black px-2.5 py-0.5 rounded-xl shadow-xs z-10 font-sans flex items-center gap-1.5 pointer-events-none">
            <span className="text-[11px]">🌾</span>
            <span>보리의 감성소리 피카소쉼터댕!</span>
          </div>
        );
      default:
        return (
          <div className="absolute top-2 right-16 transform rotate-3 bg-[#FFF5F5] border-2 border-dashed border-pink-400/80 text-pink-700 text-[9px] font-black px-2.5 py-0.5 rounded-xl shadow-xs z-10 font-sans flex items-center gap-1.5 pointer-events-none animate-bounce">
            <span className="text-[11px]">⚡</span>
            <span>뭉치선배의 고구마 고개 번개댕!</span>
          </div>
        );
    }
  };

  // Soft banner background depending on character guide for delightful personality
  const getGuideBg = (charId: string) => {
    switch (charId) {
      case 'mango': return 'from-[#FFFAED] to-[#FFF3DF]';
      case 'janggun': return 'from-[#F5F7F8] to-[#EBEFF2]';
      case 'nabi': return 'from-[#F3F9FE] to-[#E6F4FF]';
      case 'bori': return 'from-[#F0FBFA] to-[#E1F7F4]';
      default: return 'from-[#FCF5FC] to-[#F3EBF9]';
    }
  };

  return (
    <div
      id={`route-card-${route.id}`}
      onClick={onSelect}
      className={`p-5 rounded-[28px] border-2 transition-all duration-300 cursor-pointer flex flex-col gap-3.5 relative overflow-hidden select-none ${
        isSelected
          ? 'bg-white border-pastel-orange shadow-premium scale-[1.015] transform ring-4 ring-pastel-orange/5'
          : 'bg-white border-cream-border hover:border-pastel-orange/40 hover:shadow-soft'
      }`}
    >
      {/* Absolute Beautiful Mascot Side Indicator */}
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${
        route.characterGuide === 'mango' ? 'from-amber-400 to-orange-400' :
        route.characterGuide === 'janggun' ? 'from-slate-600 to-slate-800' :
        route.characterGuide === 'nabi' ? 'from-[#55ACEE] to-[#2B6CB0]' :
        route.characterGuide === 'bori' ? 'from-pastel-mint to-teal-600' :
        'from-rose-400 to-pink-500'
      }`} />

      {/* Guide Recommendation Sticker Stamp */}
      {getGuideStamp(route.characterGuide)}

      {/* Header Info */}
      <div className="flex items-start justify-between pl-1">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-extrabold ${catTheme.style}`}>
              {catTheme.label}
            </span>
            {getDifficultyBadge(route.difficulty)}
          </div>
          <h3 className="text-sm font-black text-warm-gray-dark font-sans tracking-tight mt-1.5 flex items-center gap-1">
            {route.id.startsWith('gemini') && <span className="text-pastel-orange text-xs animate-bounce">✨</span>}
            {route.name}
          </h3>
        </div>
        
        {/* Guide Avatar Circle Representor */}
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${getGuideBg(route.characterGuide)} flex flex-col items-center justify-center font-bold text-xl select-none flex-shrink-0 shadow-inner border border-cream-border relative hover:rotate-6 transition-transform overflow-hidden`}>
          {guide.avatarImage ? (
            <img src={guide.avatarImage} alt={guide.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <span>{guide.avatarEmoji}</span>
          )}
          <span className="absolute -bottom-1 -right-1 text-[9px] bg-white text-warm-gray-dark font-black rounded-lg px-1 py-0.2 border border-cream-border shadow-xs scale-90">
            {guide.avatar}
          </span>
        </div>
      </div>

      <p className="text-xs text-warm-gray pl-1 leading-relaxed line-clamp-2 font-medium">
        {route.description}
      </p>

      {/* Modern Premium Info Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 px-3 py-2 bg-cream-accent/60 rounded-2xl border border-[#FAEFDF]/60 text-center">
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-extrabold text-warm-gray/70 uppercase tracking-wider">탐험 거리</span>
          <span className="text-xs font-bold text-warm-gray-dark flex items-center gap-0.5 mt-0.5 font-accent">
            <Footprints size={12} className="text-pastel-orange stroke-[2.5]" /> {displayDistance} <span className="text-[10px] font-medium text-warm-gray">km</span>
          </span>
        </div>
        <div className="flex flex-col items-center border-x border-[#FAEFDF]">
          <span className="text-[9px] font-extrabold text-warm-gray/70 uppercase tracking-wider">소요 시간</span>
          <span className="text-xs font-bold text-warm-gray-dark flex items-center gap-0.5 mt-0.5 font-accent">
            <Star size={11} className="text-pastel-orange fill-pastel-orange/20" /> {route.duration} <span className="text-[10px] font-medium text-warm-gray">분</span>
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-extrabold text-warm-gray/70 uppercase tracking-wider">탐색 상자</span>
          <span className="text-xs font-bold text-pastel-orange flex items-center gap-0.5 mt-0.5 font-accent">
            <Zap size={11} className="fill-amber-300 text-amber-500 animate-pulse stroke-[2]" /> {route.checkpoints.length} <span className="text-[10px] font-medium text-warm-gray">개</span>
          </span>
        </div>
      </div>

      {/* Guide Interactive Dialog Box */}
      <div className="pl-3 pr-2 py-2.5 rounded-2xl bg-pastel-orange-soft border border-[#FFE8DA] text-[10.5px] text-warm-gray-dark leading-relaxed flex gap-2.5 items-center shadow-xs">
        {guide.avatarImage ? (
          <img src={guide.avatarImage} alt={guide.name} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover border border-[#FFE8DA] flex-shrink-0" />
        ) : (
          <span className="text-base flex-shrink-0">💬</span>
        )}
        <div>
          <span className="font-extrabold text-[#D55F1B]">{guide.name} 가이드 선배 한마디:</span>
          <p className="italic text-warm-gray mt-0.5">
            “{route.checkpoints[0]?.characterComment || "이 길엔 아담한 포토 스팟이 있다냥! 나와 같이 산책가자냥!"}”
          </p>
        </div>
      </div>

      {/* Tag Labels */}
      <div className="flex flex-wrap gap-1.5 pl-1">
        {route.tags.map(tag => (
          <span key={tag} className="text-[10px] text-warm-gray/80 bg-cream-base px-2.5 py-0.5 rounded-full font-semibold border border-cream-border/60 hover:text-pastel-orange transition-colors">
            #{tag}
          </span>
        ))}
      </div>

      {/* Interactive CTA Buttons on select */}
      {isSelected && (
        <div className="pt-2 pl-1 animate-[fadeIn_0.3s_ease-out]" id="action-trigger-box">
          <button
            type="button"
            id={`btn-start-${route.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onStartWalk();
            }}
            className={`w-full py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-soft transition-all duration-300 btn-squishy cursor-pointer ${
              isActiveWalk
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-pastel-orange hover:bg-orange-600 text-white'
            }`}
          >
            {isActiveWalk ? (
              <>
                <FlameKindling size={15} className="animate-bounce" />
                <span>오늘의 모험 일시 정지 (중단)</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} className="stroke-[2.5]" />
                <span>{guide.name}선배 앞장세우고 어드벤처 수령! 🐾</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
