import React from 'react';
import { Route, ActiveWalk } from '../types';
import { CHARACTERS } from '../data';
import { Clock, MapPin, Navigation, Route as RouteIcon } from 'lucide-react';

interface RouteDirectionsPanelProps {
  selectedRoute: Route | null;
  activeWalk: ActiveWalk;
  onAdvanceWalk: () => void;
  onCompleteWalk: () => void;
  onStartWalk: () => void;
  onTriggerRandomEvent: () => void;
}

function formatDistance(distance: number): string {
  if (!Number.isFinite(distance)) {
    return '0.00';
  }

  const safeDistance = distance >= 100 ? distance / 1000 : distance;
  return safeDistance.toFixed(safeDistance < 10 ? 2 : 1);
}

function getDifficultyLabel(difficulty: Route['difficulty']): string {
  if (difficulty === 'easy') return '가벼운 코스';
  if (difficulty === 'challenge') return '긴 코스';
  return '보통 코스';
}

export const RouteDirectionsPanel: React.FC<RouteDirectionsPanelProps> = ({
  selectedRoute,
}) => {
  if (!selectedRoute) {
    return (
      <section
        id="empty-directions"
        className="p-6 bg-white border-2 border-dashed border-cream-border rounded-[32px] shadow-soft flex flex-col items-center justify-center gap-3 text-center"
      >
        <Navigation size={28} className="text-pastel-orange stroke-[2.5]" />
        <h4 className="text-sm font-black text-warm-gray-dark">
          루트를 선택하면 상세 경유지가 표시됩니다
        </h4>
        <p className="text-[11px] text-warm-gray leading-relaxed font-medium max-w-sm">
          왼쪽 추천 목록에서 루트를 고르면 거리, 예상 시간, 경유지 순서가 이곳에 정리됩니다.
        </p>
      </section>
    );
  }

  const guide = CHARACTERS[selectedRoute.characterGuide] ?? CHARACTERS.mango;

  return (
    <section
      id="route-directions-panel"
      className="flex flex-col gap-4 border-2 border-cream-border bg-white p-5 rounded-[32px] shadow-soft"
    >
      <div className="flex items-start justify-between gap-3 border-b border-cream-border/60 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pastel-orange-soft border border-[#FFE8DA] flex items-center justify-center text-pastel-orange flex-shrink-0">
            <RouteIcon size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-warm-gray-dark leading-tight">
              루트 상세 안내
            </h3>
            <p className="text-[10.5px] text-warm-gray mt-1 font-medium leading-relaxed">
              실제 위치 기반 경유지 순서입니다. 임의 걸음수·코인·레벨 기능은 제거했습니다.
            </p>
          </div>
        </div>

        <span className="text-[10px] text-pastel-orange font-black bg-pastel-orange-soft border border-[#FFE8DA] px-2.5 py-1 rounded-full whitespace-nowrap">
          {guide.name} 가이드
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-cream-accent/70 p-3 rounded-2xl border border-[#FAEFDF]">
          <span className="text-[9px] font-black text-warm-gray/70 block">거리</span>
          <span className="text-xs font-black text-warm-gray-dark mt-1 block">
            {formatDistance(selectedRoute.distance)}km
          </span>
        </div>
        <div className="bg-cream-accent/70 p-3 rounded-2xl border border-[#FAEFDF]">
          <span className="text-[9px] font-black text-warm-gray/70 block">예상 시간</span>
          <span className="text-xs font-black text-warm-gray-dark mt-1 flex items-center justify-center gap-1">
            <Clock size={12} className="text-pastel-orange" /> {selectedRoute.duration}분
          </span>
        </div>
        <div className="bg-cream-accent/70 p-3 rounded-2xl border border-[#FAEFDF]">
          <span className="text-[9px] font-black text-warm-gray/70 block">강도</span>
          <span className="text-xs font-black text-warm-gray-dark mt-1 block">
            {getDifficultyLabel(selectedRoute.difficulty)}
          </span>
        </div>
      </div>

      <div className="p-4 bg-[#FFFDF9] border border-cream-border rounded-2xl">
        <div className="flex items-start gap-3">
          {guide.avatarImage ? (
            <img
              src={guide.avatarImage}
              alt={guide.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border border-[#FAEFDF] flex-shrink-0"
            />
          ) : (
            <span className="w-11 h-11 rounded-xl bg-pastel-orange-soft flex items-center justify-center text-xl flex-shrink-0">
              {guide.avatarEmoji}
            </span>
          )}
          <div>
            <h4 className="text-xs font-black text-warm-gray-dark">
              {selectedRoute.name}
            </h4>
            <p className="text-[11px] text-warm-gray leading-relaxed font-medium mt-1">
              {selectedRoute.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-black text-warm-gray-dark">
          <MapPin size={14} className="text-pastel-orange stroke-[2.5]" />
          <span>경유지 순서</span>
        </div>

        {selectedRoute.checkpoints.length > 0 ? (
          <ol className="flex flex-col gap-2.5">
            {selectedRoute.checkpoints.map((checkpoint, index) => (
              <li
                key={checkpoint.id}
                className="flex gap-3 p-3 bg-cream-accent/60 border border-[#FAEFDF] rounded-2xl"
              >
                <span className="w-7 h-7 rounded-full bg-pastel-orange text-white flex items-center justify-center text-[11px] font-black flex-shrink-0 shadow-xs">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h5 className="text-[11.5px] font-black text-warm-gray-dark leading-tight">
                    {checkpoint.name}
                  </h5>
                  <p className="text-[10.5px] text-warm-gray leading-relaxed font-medium mt-1">
                    {checkpoint.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[11px] text-warm-gray font-medium bg-cream-accent/60 border border-[#FAEFDF] rounded-2xl p-3">
            이 루트에는 별도 경유지 정보가 없습니다. 지도에서 경로선을 확인해 주세요.
          </p>
        )}
      </div>
    </section>
  );
};
