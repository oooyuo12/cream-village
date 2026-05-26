import React from 'react';
import { Route, ActiveWalk, Checkpoint } from '../types';
import { CHARACTERS } from '../data';
import { Footprints, Trophy, Sparkles, Navigation, Milestone, Swords, Landmark, Smile } from 'lucide-react';

interface RouteDirectionsPanelProps {
  selectedRoute: Route | null;
  activeWalk: ActiveWalk;
  onAdvanceWalk: () => void;
  onCompleteWalk: () => void;
  onStartWalk: () => void;
  onTriggerRandomEvent: () => void;
}

export const RouteDirectionsPanel: React.FC<RouteDirectionsPanelProps> = ({
  selectedRoute,
  activeWalk,
  onAdvanceWalk,
  onCompleteWalk,
  onStartWalk,
  onTriggerRandomEvent
}) => {
  if (!selectedRoute) {
    return (
      <div className="p-8 text-center bg-[#FFFDF9] border-2 border-dashed border-[#F3E6D5] rounded-[32px] shadow-soft flex flex-col items-center justify-center gap-4.5 relative overflow-hidden" id="empty-directions">
        {/* Absolute sticker decorations */}
        <div className="absolute top-2.5 right-4 text-sm animate-pulse">🌾🧡</div>
        <div className="absolute bottom-2 left-4 text-xs opacity-40">🐾</div>
        
        {CHARACTERS.bori.avatarImage ? (
          <img src={CHARACTERS.bori.avatarImage} alt="보리" referrerPolicy="no-referrer" className="w-16 h-16 rounded-[24px] object-cover border border-[#FFE8DA] animate-bounce shadow-inner" />
        ) : (
          <div className="w-16 h-16 rounded-[24px] bg-pastel-orange-soft border border-[#FFE8DA] flex items-center justify-center text-3xl animate-bounce shadow-inner">
            🐕‍🦺🐾
          </div>
        )}
        <div className="flex flex-col gap-1 pr-1 pl-1">
          <h4 className="text-xs font-black text-warm-gray-dark font-sans text-center leading-relaxed">
            마음에 드는 모험 수첩을 펴달라댕! 📖
          </h4>
          <p className="text-[10.5px] text-warm-gray font-semibold leading-relaxed mt-1 text-center">
            산책길을 하나 선택하면 나와 친구들이 직접 <br/>
            구간별 냄새 힌트와 아지트 경로를 안내해 준다개!
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-[#F0FAF7] border border-[#D3EDE2] text-[10.5px] text-[#2C624D] leading-relaxed italic max-w-sm shadow-xs font-black mt-1 flex items-center gap-2">
          {CHARACTERS.bori.avatarImage && (
            <img src={CHARACTERS.bori.avatarImage} alt="보리" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover border border-[#D3EDE2] flex-shrink-0" />
          )}
          <span>보리: “솔바람 구석에 숨겨둔 골목 사진 스팟도 많으니 얼른 같이 탐험을 떠나보자댕! 대기 완료개! 🌾”</span>
        </div>
      </div>
    );
  }

  const guide = CHARACTERS[selectedRoute.characterGuide];
  const activeCheckpoint: Checkpoint | undefined = selectedRoute.checkpoints[activeWalk.checkpointIndex];

  // Map checkpoint index to readable relative strings
  const getCheckpointRel = (idx: number) => {
    if (idx === 0) return "첫 호기심 분기점 📍";
    if (idx === 1) return "둘째 보물 요새 🎪";
    return `${idx + 1}번째 비밀 스팟 🌲`;
  };

  const getGuideCommentsColors = (charId: string) => {
    switch (charId) {
      case 'mango': return 'bg-[#FFF9ED] border-[#FFE9C8] text-warm-gray-dark';
      case 'janggun': return 'bg-[#F2F4F6] border-[#D1D8DC] text-warm-gray-dark';
      case 'nabi': return 'bg-[#F0F8FF] border-[#CCE6FF] text-warm-gray-dark';
      case 'bori': return 'bg-[#F0FAF7] border-[#CCEFE3] text-warm-gray-dark';
      default: return 'bg-[#FCF5FC] border-[#F2DDF4] text-warm-gray-dark';
    }
  };

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

  return (
    <div className="flex flex-col gap-4 border-2 border-cream-border bg-white p-5 rounded-[32px] shadow-soft" id="route-directions-panel">
      
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-cream-border/60 pb-3">
        <span className="text-xs font-black text-warm-gray-dark flex items-center gap-1.5 font-sans">
          <Milestone size={15} className="text-pastel-orange stroke-[2.5]" /> 실시간 감성 모험 길잡이 (Guide HUD)
        </span>
        <span className="text-[10px] text-pastel-orange font-black bg-pastel-orange-soft border px-2 py-0.5 rounded-full">
          Guide Companion: {guide.name}
        </span>
      </div>

      {activeWalk.isWalking ? (
        <div className="flex flex-col gap-4.5" id="active-nav-section">
          
          {/* Walking stats grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            
            <div className="bg-pastel-orange-soft/50 p-2.5 rounded-2xl border border-[#FFE8DA]">
              <span className="text-[9px] font-black text-[#BD4C15] tracking-wider uppercase block">오늘의 비밀 발걸음</span>
              <span className="text-xs font-black font-mono text-[#D55F1B] flex justify-center items-center gap-1 mt-1 font-accent">
                <Footprints size={12} className="text-pastel-orange stroke-[2.5]" /> {activeWalk.totalSteps.toLocaleString()} <span className="text-[9px] font-medium text-warm-gray">보</span>
              </span>
            </div>

            <div className="bg-[#EFFFFA] p-2.5 rounded-2xl border border-pastel-mint-soft/80">
              <span className="text-[9px] font-black text-pastel-mint tracking-wider uppercase block font-sans">모험 진행률</span>
              <span className="text-xs font-black font-mono text-pastel-mint flex justify-center items-center gap-1 mt-1 font-accent">
                <Sparkles size={11} className="text-pastel-mint animate-spin" /> {Math.round(activeWalk.progress)}%
              </span>
            </div>

            <div className="bg-pink-50/50 p-2.5 rounded-2xl border border-pink-100">
              <span className="text-[9px] font-black text-pink-500 tracking-wider uppercase block">발굴된 기부 상자</span>
              <span className="text-xs font-black font-mono text-pink-600 flex justify-center items-center gap-1 mt-1 font-accent">
                🎁 {activeWalk.coinsCount} <span className="text-[9px] font-medium text-warm-gray">개</span>
              </span>
            </div>

          </div>

          {/* Core instruction text with character guidance */}
          {activeCheckpoint ? (
            <div className="p-4 bg-cream-accent border border-[#FAEFDF] rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] bg-pastel-orange text-white font-black px-2.5 py-0.5 rounded-full">
                  📍 {getCheckpointRel(activeWalk.checkpointIndex)}
                </span>
                <span className="text-[9.5px] font-mono font-bold text-warm-gray/60">
                  Target: {activeCheckpoint.x}, {activeCheckpoint.y}
                </span>
              </div>

              <div className="flex flex-col gap-1 pl-0.5">
                <h4 className="text-xs font-black text-warm-gray-dark flex items-center gap-1">
                  <span>{getCheckpointEmoji(activeCheckpoint.type)}</span>
                  <span>{activeCheckpoint.name}</span>
                </h4>
                <p className="text-[11.5px] text-warm-gray leading-relaxed font-sans font-medium mt-1">
                  {activeCheckpoint.description}
                </p>
              </div>

              {/* Speech bubble dialogue */}
              <div className={`flex gap-3 items-start p-3 rounded-xl border shadow-inner ${getGuideCommentsColors(selectedRoute.characterGuide)}`}>
                {guide.avatarImage ? (
                  <img src={guide.avatarImage} alt={guide.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-xl object-cover border border-slate-200/60 shadow-sm flex-shrink-0 animate-bounce" />
                ) : (
                  <span className="text-2xl flex-shrink-0 animate-bounce">{guide.avatarEmoji}</span>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black text-[#9F5614]">
                    {guide.name} 대장선배:
                  </span>
                  <p className="text-[11px] font-semibold italic leading-relaxed text-warm-gray-dark/95">
                    “{activeCheckpoint.characterComment || "여기 숨어있는 냄새는 나만 알 수 있어! 찬찬히 따라와라냥!"}”
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-emerald-50/50 border border-pastel-mint-soft rounded-[28px] flex flex-col gap-3 text-center items-center justify-center">
              <Trophy size={32} className="text-yellow-400 animate-bounce" />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-black text-pastel-mint">🎉 축하합니다! 동네 한 바퀴 완전 정복!</h4>
                <p className="text-xs text-warm-gray leading-relaxed font-semibold">대장선배와 뭉치가 준비한 보물 궤짝 축하연 배지를 열람하세요.</p>
              </div>
              <div className="p-3 bg-white/90 rounded-2xl border border-[#FAEFDF] text-[11px] text-[#A25A12] leading-relaxed italic max-w-sm shadow-sm font-semibold flex items-center gap-2.5">
                {CHARACTERS.mungchi.avatarImage ? (
                  <img src={CHARACTERS.mungchi.avatarImage} alt="뭉치" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border border-[#EFDDA4] flex-shrink-0 shadow-xs" />
                ) : (
                  <span className="text-base flex-shrink-0">🐾</span>
                )}
                <p className="leading-tight text-left">
                  <strong className="text-pink-850 font-sans">뭉치 소대장:</strong> “꾸에엑! 대박! 완전 사뿐사뿐 가볍게 돌았잖아멍! 기념 금냥 배지 수집 완료!!”
                </p>
              </div>
            </div>
          )}

          {/* Action buttons during active walks */}
          <div className="flex flex-col gap-2.5 pt-1.5" id="nav-actions">
            
            {activeCheckpoint ? (
              <button
                type="button"
                id="btn-advance-walk"
                onClick={onAdvanceWalk}
                className="w-full py-4 px-4 bg-pastel-orange hover:bg-orange-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-soft btn-squishy cursor-pointer"
              >
                <span>🐾 킁킁 냄새 맡으며 다음 스팟으로 전진 (Explore Next)</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-complete-walk"
                onClick={onCompleteWalk}
                className="w-full py-4 px-4 bg-pastel-mint hover:bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-glow-mint btn-squishy cursor-pointer"
              >
                <span>🏆 보물 배지 전당 등록 및 코인 꿀간식 타기!</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-trigger-event"
                onClick={onTriggerRandomEvent}
                className="py-2.5 px-3 bg-pink-50 hover:bg-pink-100 border border-pink-100 text-pink-600 rounded-xl text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-97"
              >
                <span>🎁 나비 몰래 상자 뒤지기</span>
              </button>

              <button
                type="button"
                id="btn-quit-walk"
                onClick={onStartWalk}
                className="py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-650 rounded-xl text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-97"
              >
                <span>목적지 이탈 (종료)</span>
              </button>
            </div>

          </div>

          {/* Real-time mascot walkie talkie radio sticker */}
          <div className="bg-[#FFFDF6] border-2 border-dashed border-pastel-orange/55 rounded-2xl p-3.5 flex flex-col gap-1.5 shadow-xs relative overflow-hidden" id="pet-radio">
            <div className="absolute top-2 right-3 text-[9px] bg-pastel-orange-soft text-pastel-orange px-2 py-0.5 rounded-full font-black scale-90 animate-pulse">
              📡 CH.99 댕냥무전 ON
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm animate-pulse">📻</span>
              <span className="text-[10px] font-black text-[#A25A12] uppercase tracking-wider">옆동네 대장의 실시간 주위 조력 무전</span>
            </div>
            <div className="text-[10.5px] leading-relaxed font-semibold text-warm-gray-dark flex flex-col gap-2.5">
              {selectedRoute.characterGuide === 'mango' ? (
                <div className="flex items-start gap-2">
                  {CHARACTERS.bori.avatarImage ? (
                    <img src={CHARACTERS.bori.avatarImage} alt="보리" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border border-[#D3EDE2] flex-shrink-0 animate-pulse" />
                  ) : (
                    <span className="text-base">🐕‍🦺</span>
                  )}
                  <p className="text-warm-gray-dark/90 leading-normal">
                    <strong className="text-[#104D36]">보리 대장의 무선:</strong> “망고 선배 뒤를 따를 때, 왼쪽의 자갈 흙기슭은 뾰족가시가 섞여있으니 발끝 젤리를 부디 조심해달라댕! 🌾”
                  </p>
                </div>
              ) : selectedRoute.characterGuide === 'janggun' ? (
                <div className="flex items-start gap-2">
                  {CHARACTERS.mango.avatarImage ? (
                    <img src={CHARACTERS.mango.avatarImage} alt="망고" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border border-amber-200 flex-shrink-0 animate-pulse" />
                  ) : (
                    <span className="text-base">🐱</span>
                  )}
                  <p className="text-warm-gray-dark/90 leading-normal">
                    <strong className="text-amber-850">망고 대장의 무선:</strong> “장군 선배가 보초 서는 평탄 횡단보도 바로 건너편 우체통에 햇살이 예술냥! 묘생샷 찰칵을 깜빡하지 마라냥! 🥭”
                  </p>
                </div>
              ) : selectedRoute.characterGuide === 'nabi' ? (
                <div className="flex items-start gap-2">
                  {CHARACTERS.janggun.avatarImage ? (
                    <img src={CHARACTERS.janggun.avatarImage} alt="장군" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border border-slate-300 flex-shrink-0 animate-pulse" />
                  ) : (
                    <span className="text-base">🛡️</span>
                  )}
                  <p className="text-warm-gray-dark/90 leading-normal">
                    <strong className="text-slate-800 font-sans">장군 대장의 무선:</strong> “나비 개구쟁이가 낙엽에 보물을 파묻어 구멍을 팠으니 보물을 수령할 때 턱에 걸리지 않도록 주위를 엄호하겠소댕! 🛡️”
                  </p>
                </div>
              ) : selectedRoute.characterGuide === 'bori' ? (
                <div className="flex items-start gap-2">
                  {CHARACTERS.nabi.avatarImage ? (
                    <img src={CHARACTERS.nabi.avatarImage} alt="나비" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border border-sky-200 flex-shrink-0 animate-pulse" />
                  ) : (
                    <span className="text-base">🐈‍⬛</span>
                  )}
                  <p className="text-warm-gray-dark/90 leading-normal">
                    <strong className="text-sky-850">나비 대장의 무선:</strong> “헤헤! 꺄악! 보리 선배가 감성 풀벌레 시편을 읊어대면, 나는 뒤에서 풀숲 낙엽 장단을 맞추겠다냥! 짱 신나냥! 🦋”
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  {CHARACTERS.bori.avatarImage ? (
                    <img src={CHARACTERS.bori.avatarImage} alt="보리" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border border-[#D3EDE2] flex-shrink-0 animate-pulse" />
                  ) : (
                    <span className="text-base">🐕‍🦺</span>
                  )}
                  <p className="text-warm-gray-dark/90 leading-normal">
                    <strong className="text-[#104D36]">보리 대장의 무선:</strong> “체력 대장 뭉치 선배! 고구마 고개를 너무 가파르게 달리다 지치지 말고, 내 클로버 쉼터에서 한숨 돌려가댕! 🍀”
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active logs section with beautiful modern styling */}
          {activeWalk.eventsLog.length > 0 && (
            <div className="flex flex-col gap-2 pt-1 border-t border-cream-border/60" id="events-log-container">
              <span className="text-[10px] font-black text-warm-gray tracking-wider uppercase pl-0.5">실시간 동네 어드벤처 관찰기록 (Daily Log)</span>
              <div className="bg-cream-accent/40 border border-cream-border/60 rounded-2xl p-3.5 max-h-24 overflow-y-auto text-[10.5px] text-warm-gray flex flex-col gap-2 font-medium">
                {activeWalk.eventsLog.slice().reverse().map((log, idx) => (
                  <span key={idx} className="block border-b border-[#FAF6EE] pb-2 leading-relaxed">
                    {log}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="p-5 bg-gradient-to-br from-pastel-orange-soft/60 to-cream-accent/60 border border-[#FFE8DA] rounded-3xl flex flex-col gap-4 text-center items-center justify-center" id="nav-idle-section">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#FFE8DA] shadow-soft flex items-center justify-center text-2xl animate-bounce">
            🎈
          </div>
          <div className="flex flex-col gap-1.5">
            <h4 className="text-sm font-black text-warm-gray-dark">탐험 선배 {guide.name} 준비 완료냥!</h4>
            <p className="text-[11.5px] text-warm-gray leading-relaxed font-sans max-w-sm font-semibold">
              이 코스는 총 <span className="text-[#BD4C15] font-black">{selectedRoute.distance}km</span> 이며, 
              동네 마실처럼 <span className="text-[#BD4C15] font-black">{selectedRoute.duration}분</span> 가량 소요됩니다. 
              {guide.name} 대장이 가방 정리를 다 끝냈어요!
            </p>
          </div>

          <button
            type="button"
            id="btn-idle-start-walk"
            onClick={onStartWalk}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-pastel-orange to-orange-555 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-soft hover:shadow-lg btn-squishy cursor-pointer font-sans"
          >
            <Smile size={14} className="stroke-[2.5]" />
            <span>이 대장과 어드벤처 행군 시작! 🐾</span>
          </button>
        </div>
      )}

    </div>
  );
};
