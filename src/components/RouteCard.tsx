import React from 'react';
import { Route, PetCharacter } from '../types';
import { CHARACTERS } from '../data';
import { Clock, MapPinned, Navigation, ShieldCheck, Star } from 'lucide-react';

interface RouteCardProps {
  route: Route;
  isSelected: boolean;
  onSelect: () => void;
  onStartWalk: () => void;
  isActiveWalk: boolean;
}

function formatDistance(distance: number): string {
  if (!Number.isFinite(distance)) {
    return '0.00';
  }

  const safeDistance = distance >= 100 ? distance / 1000 : distance;
  return safeDistance.toFixed(safeDistance < 10 ? 2 : 1);
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  onSelect,
}) => {
  const guide: PetCharacter = CHARACTERS[route.characterGuide] ?? CHARACTERS.mango;
  const displayDistance = formatDistance(route.distance);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <span className="text-[9.5px] bg-[#E2F7F0] text-[#1D7F5F] font-black px-2.5 py-0.5 rounded-full">쉬움</span>;
      case 'challenge':
        return <span className="text-[9.5px] bg-[#FFEBEA] text-[#D84B42] font-black px-2.5 py-0.5 rounded-full">긴 코스</span>;
      default:
        return <span className="text-[9.5px] bg-[#FFF2DE] text-[#B8711E] font-black px-2.5 py-0.5 rounded-full">보통</span>;
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'adventure':
        return { label: '활동형', style: 'bg-pastel-orange-soft text-pastel-orange border border-orange-200/40' };
      case 'quiet':
        return { label: '안전·조용함', style: 'bg-pastel-lavender-soft text-pastel-lavender border border-purple-200/40' };
      case 'nature':
        return { label: '공원·자연', style: 'bg-pastel-mint-soft text-pastel-mint border border-teal-200/30' };
      case 'sensory':
        return { label: '탐색형', style: 'bg-pink-50 text-pink-500 border border-pink-200/30' };
      default:
        return { label: '동네 산책', style: 'bg-amber-50 text-amber-800' };
    }
  };

  const catTheme = getCategoryTheme(route.category);

  return (
    <article
      id={`route-card-${route.id}`}
      onClick={onSelect}
      className={`p-5 rounded-[28px] border-2 transition-all duration-300 cursor-pointer flex flex-col gap-3.5 relative overflow-hidden select-none ${
        isSelected
          ? 'bg-white border-pastel-orange shadow-premium scale-[1.01] transform ring-4 ring-pastel-orange/5'
          : 'bg-white border-cream-border hover:border-pastel-orange/40 hover:shadow-soft'
      }`}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${
        route.characterGuide === 'mango' ? 'from-amber-400 to-orange-400' :
        route.characterGuide === 'janggun' ? 'from-slate-600 to-slate-800' :
        route.characterGuide === 'nabi' ? 'from-[#55ACEE] to-[#2B6CB0]' :
        route.characterGuide === 'bori' ? 'from-pastel-mint to-teal-600' :
        'from-rose-400 to-pink-500'
      }`} />

      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-extrabold ${catTheme.style}`}>
              {catTheme.label}
            </span>
            {getDifficultyBadge(route.difficulty)}
            {route.id.startsWith('ai-') || route.id.startsWith('gemini') ? (
              <span className="text-[9.5px] bg-amber-50 text-amber-700 font-black px-2.5 py-0.5 rounded-full border border-amber-200">
                AI 추천
              </span>
            ) : null}
          </div>

          <h3 className="text-sm font-black text-warm-gray-dark tracking-tight mt-1.5 leading-snug">
            {route.name}
          </h3>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-cream-accent flex items-center justify-center select-none flex-shrink-0 shadow-inner border border-cream-border overflow-hidden">
          {guide.avatarImage ? (
            <img src={guide.avatarImage} alt={guide.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">{guide.avatarEmoji}</span>
          )}
        </div>
      </div>

      <p className="text-xs text-warm-gray pl-1 leading-relaxed line-clamp-2 font-medium">
        {route.description}
      </p>

      <div className="grid grid-cols-3 gap-2.5 px-3 py-2 bg-cream-accent/60 rounded-2xl border border-[#FAEFDF]/60 text-center">
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-extrabold text-warm-gray/70 uppercase tracking-wider">거리</span>
          <span className="text-xs font-bold text-warm-gray-dark flex items-center gap-0.5 mt-0.5">
            <MapPinned size={12} className="text-pastel-orange stroke-[2.5]" /> {displayDistance} <span className="text-[10px] font-medium text-warm-gray">km</span>
          </span>
        </div>
        <div className="flex flex-col items-center border-x border-[#FAEFDF]">
          <span className="text-[9px] font-extrabold text-warm-gray/70 uppercase tracking-wider">예상 시간</span>
          <span className="text-xs font-bold text-warm-gray-dark flex items-center gap-0.5 mt-0.5">
            <Clock size={11} className="text-pastel-orange" /> {route.duration} <span className="text-[10px] font-medium text-warm-gray">분</span>
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-extrabold text-warm-gray/70 uppercase tracking-wider">경유지</span>
          <span className="text-xs font-bold text-pastel-orange flex items-center gap-0.5 mt-0.5">
            <Navigation size={11} className="text-pastel-orange stroke-[2]" /> {route.checkpoints.length} <span className="text-[10px] font-medium text-warm-gray">곳</span>
          </span>
        </div>
      </div>

      <div className="pl-3 pr-2 py-2.5 rounded-2xl bg-pastel-orange-soft border border-[#FFE8DA] text-[10.5px] text-warm-gray-dark leading-relaxed flex gap-2.5 items-center shadow-xs">
        <ShieldCheck size={16} className="text-[#D55F1B] flex-shrink-0 stroke-[2.4]" />
        <p className="text-warm-gray leading-relaxed">
          <span className="font-extrabold text-[#D55F1B]">{guide.name} 기준 추천:</span>{' '}
          실제 장소 핀과 반려견 조건을 바탕으로 생성된 루트입니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 pl-1">
        {route.tags.slice(0, 5).map(tag => (
          <span key={tag} className="text-[10px] text-warm-gray/80 bg-cream-base px-2.5 py-0.5 rounded-full font-semibold border border-cream-border/60">
            #{tag}
          </span>
        ))}
      </div>

      {isSelected && (
        <div className="pt-2 pl-1 animate-[fadeIn_0.3s_ease-out]" id="action-trigger-box">
          <div className="w-full py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 bg-zinc-900 text-white shadow-soft">
            <Star size={14} className="text-amber-200 fill-amber-200/30" />
            <span>지도에서 이 루트를 표시 중입니다</span>
          </div>
        </div>
      )}
    </article>
  );
};
