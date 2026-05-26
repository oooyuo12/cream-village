import React from 'react';
import { FilterState } from '../types';
import { CATEGORIES, REGIONS, PURPOSES } from '../data';
import { Search, Compass, MapPin, Heart, Map, Clock } from 'lucide-react';

interface SearchFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const SearchBox: React.FC<SearchFiltersProps> = ({ filters, setFilters }) => {
  return (
    <div className="relative w-full" id="search-box-container">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-pastel-orange">
        <Search size={18} className="stroke-[2.5]" />
      </div>
      <input
        type="text"
        id="search-input"
        className="w-full pl-11 pr-4 py-3.5 bg-pastel-orange-soft/60 border-2 border-[#FFE8DA] rounded-2xl text-warm-gray-dark placeholder-warm-gray/50 focus:outline-none focus:ring-4 focus:ring-pastel-orange/15 focus:border-pastel-orange text-xs font-semibold transition-all shadow-xs"
        placeholder="어디로 떠나볼까요? 모험 코스나 키워드를 입력하세요..."
        value={filters.searchQuery}
        onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
      />
    </div>
  );
};

export const CategoryFilter: React.FC<SearchFiltersProps> = ({ filters, setFilters }) => {
  // Pastel badge styling callback based on category ID
  const getCatBadgeStyle = (id: string, isSelected: boolean) => {
    if (!isSelected) {
      return "bg-white text-warm-gray hover:bg-cream-accent border border-cream-border/90";
    }
    switch (id) {
      case 'adventure':
        return "bg-pastel-orange text-white shadow-soft font-bold";
      case 'quiet':
        return "bg-pastel-lavender text-white shadow-soft font-bold";
      case 'nature':
        return "bg-pastel-mint text-white shadow-soft font-bold";
      case 'sensory':
        return "bg-pink-400 text-white shadow-soft font-bold";
      default:
        return "bg-warm-gray text-white shadow-soft font-bold";
    }
  };

  return (
    <div className="flex flex-col gap-2" id="category-filter-container">
      <span className="text-[11px] font-extrabold text-warm-gray tracking-wider uppercase flex items-center gap-1.5 pl-0.5">
        <Compass size={14} className="text-pastel-orange stroke-[2.5]" /> 탐험 가이드 스타일
      </span>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isSelected = filters.category === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-btn-${cat.id}`}
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, category: cat.id as any }))}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all btn-squishy cursor-pointer ${getCatBadgeStyle(cat.id, isSelected)}`}
            >
              <span className="text-sm">{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const DogConditionFilter: React.FC<SearchFiltersProps> = ({ filters, setFilters }) => {
  return (
    <div className="p-4 bg-pastel-orange-soft/40 rounded-3xl border border-[#FFEADA] flex flex-col gap-3.5" id="dog-condition-filter">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-warm-gray-dark flex items-center gap-1.5 font-sans">
          <Heart size={14} className="text-[#FF7F43] fill-[#FFA880] stroke-[2.5]" /> 맞춤 케어 처방 (컨디션 조건)
        </span>
        <span className="text-[9px] bg-[#FFE0CE] text-[#BD4C15] font-extrabold px-2 py-0.5 rounded-full font-mono">
          AI SAFE MATCHING
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Stamina */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-warm-gray pl-0.5">에너지 강도</label>
          <div className="relative">
            <select
              id="stamina-select"
              value={filters.dogCondition.stamina}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dogCondition: { ...prev.dogCondition, stamina: e.target.value as any }
              }))}
              className="w-full bg-white text-warm-gray-dark border-2 border-cream-border text-[11px] font-semibold rounded-xl pl-2 pr-6 py-2 focus:outline-none focus:ring-2 focus:ring-pastel-orange/20 focus:border-pastel-orange cursor-pointer appearance-none shadow-xs"
            >
              <option value="low">산책 하수 (보통 걷기)</option>
              <option value="mid">평온 산책 (기본 페이스)</option>
              <option value="high">질주 본능 (러닝 페이스)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-warm-gray text-[9px]">▼</div>
          </div>
        </div>

        {/* Joints */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-warm-gray pl-0.5">관절 및 미끄럼</label>
          <div className="relative">
            <select
              id="joints-select"
              value={filters.dogCondition.joints}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dogCondition: { ...prev.dogCondition, joints: e.target.value as any }
              }))}
              className="w-full bg-white text-warm-gray-dark border-2 border-cream-border text-[11px] font-semibold rounded-xl pl-2 pr-6 py-2 focus:outline-none focus:ring-2 focus:ring-pastel-orange/20 focus:border-pastel-orange cursor-pointer appearance-none shadow-xs"
            >
              <option value="normal">안심 일반 길</option>
              <option value="needed_care">경사/턱 제외 (안심 흙길)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-warm-gray text-[9px]">▼</div>
          </div>
        </div>

        {/* Socialization */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-warm-gray pl-0.5">사회성 성향</label>
          <div className="relative">
            <select
              id="social-select"
              value={filters.dogCondition.social}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dogCondition: { ...prev.dogCondition, social: e.target.value as any }
              }))}
              className="w-full bg-white text-warm-gray-dark border-2 border-cream-border text-[11px] font-semibold rounded-xl pl-2 pr-6 py-2 focus:outline-none focus:ring-2 focus:ring-pastel-orange/20 focus:border-pastel-orange cursor-pointer appearance-none shadow-xs"
            >
              <option value="friendly">친화력 만렙 (인싸형)</option>
              <option value="shy">조용한 독고다이 (힐링형)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-warm-gray text-[9px]">▼</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RadiusFilter: React.FC<SearchFiltersProps> = ({ filters, setFilters }) => {
  const radii = [
    { value: 500, label: '500m 근방' },
    { value: 1000, label: '1km 동네' },
    { value: 2000, label: '2km 정복' },
    { value: 5000, label: '5km 대장정' }
  ];

  return (
    <div className="flex flex-col gap-2" id="radius-filter-container">
      <span className="text-[11px] font-extrabold text-warm-gray tracking-wider uppercase flex items-center gap-1.5 pl-0.5">
        <Map size={14} className="text-pastel-orange stroke-[2.5]" /> 탐험 목표 사정거리
      </span>
      <div className="grid grid-cols-4 gap-2">
        {radii.map((rad) => {
          const isSelected = filters.radius === rad.value;
          return (
            <button
              key={rad.value}
              id={`rad-btn-${rad.value}`}
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, radius: rad.value }))}
              className={`py-2 rounded-2xl text-[11px] font-bold text-center transition-all cursor-pointer btn-squishy ${
                isSelected
                  ? 'bg-pastel-orange text-white shadow-soft'
                  : 'bg-white text-warm-gray border border-cream-border hover:bg-cream-accent'
              }`}
            >
              {rad.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const RegionFilter: React.FC<SearchFiltersProps> = ({ filters, setFilters }) => {
  return (
    <div className="flex flex-col gap-2" id="region-filter-container">
      <span className="text-[11px] font-extrabold text-warm-gray tracking-wider uppercase flex items-center gap-1.5 pl-0.5">
        <MapPin size={13} className="text-pastel-orange stroke-[2.5]" /> 탐험 마당 구역
      </span>
      <div className="relative">
        <select
          id="region-select"
          value={filters.region}
          onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
          className="w-full bg-white text-warm-gray-dark border border-cream-border text-xs font-bold rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pastel-orange cursor-pointer shadow-xs appearance-none"
        >
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              📍 {region === '전체동네' ? '전체 크림타운 마을길' : region}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-pastel-orange text-[10px]">
          ▼
        </div>
      </div>
    </div>
  );
};

export const PurposeSelector: React.FC<SearchFiltersProps> = ({ filters, setFilters }) => {
  return (
    <div className="flex flex-col gap-2" id="purpose-selector-container">
      <span className="text-[11px] font-extrabold text-warm-gray tracking-wider uppercase flex items-center gap-1.5 pl-0.5 font-sans">
        <Clock size={13} className="text-pastel-orange stroke-[2.5]" /> 하루 햇살 시간대
      </span>
      <div className="grid grid-cols-2 gap-2">
        {PURPOSES.map((p) => {
          const isSelected = filters.purpose === p.id;
          return (
            <button
              key={p.id}
              id={`purpose-btn-${p.id}`}
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, purpose: p.id as any }))}
              className={`p-3 rounded-2xl text-left text-xs font-bold flex items-center gap-2 transition-all btn-squishy cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-pastel-orange to-amber-500 text-white shadow-soft'
                  : 'bg-white text-warm-gray border border-cream-border hover:bg-cream-accent'
              }`}
            >
              <span className="text-base">{p.emoji}</span>
              <span className="truncate">{p.name === '모든 시간' ? '아무때나' : p.name.split(' (')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
