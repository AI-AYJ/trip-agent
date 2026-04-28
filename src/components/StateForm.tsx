import React from 'react';
import { UserState, Fatigue, Companion } from '../types';
import { Search, MapPin, Clock, Coffee, Users, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface StateFormProps {
  userState: UserState;
  onChange: (newState: Partial<UserState>) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const INTEREST_OPTIONS = ['맛집', '카페', '관광지', '쇼핑', '공원', '박물관', '역사', '액티비티'];

export const StateForm: React.FC<StateFormProps> = ({ userState, onChange, onSearch, isLoading }) => {
  const toggleInterest = (interest: string) => {
    const next = userState.interests.includes(interest)
      ? userState.interests.filter(i => i !== interest)
      : [...userState.interests, interest];
    onChange({ interests: next });
  };

  return (
    <div className="space-y-8 p-6 bg-white border-r border-brand-border h-full overflow-y-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-display font-bold tracking-tight">상태 설정</h2>
        <p className="text-sm text-gray-500">당신의 현재 상황에 맞는 장소를 추천해드려요.</p>
      </div>

      <div className="space-y-6">
        {/* Region */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <MapPin size={14} /> 지역 선택
          </label>
          <input
            type="text"
            placeholder="예: 서울 강남구, 제주도..."
            className="w-full bg-gray-50 border border-brand-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
            value={userState.region}
            onChange={(e) => onChange({ region: e.target.value })}
          />
        </div>

        {/* Fatigue */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Heart size={14} /> 피로도
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[Fatigue.LOW, Fatigue.MEDIUM, Fatigue.HIGH].map((f) => (
              <button
                key={f}
                data-group="fatigue"
                onClick={() => onChange({ fatigue: f })}
                className={cn(
                  "py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                  userState.fatigue === f
                    ? "bg-brand-accent text-white border-brand-accent shadow-lg shadow-brand-accent/20"
                    : "bg-white text-gray-600 border-brand-border hover:bg-gray-50"
                )}
              >
                {f === Fatigue.LOW ? "보통" : f === Fatigue.MEDIUM ? "조금 피곤" : "많이 피곤"}
              </button>
            ))}
          </div>
        </div>

        {/* Companion */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Users size={14} /> 누구와 함께인가요?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[Companion.SOLO, Companion.COUPLE, Companion.FRIENDS, Companion.FAMILY].map((c) => (
              <button
                key={c}
                data-group="companion"
                onClick={() => onChange({ companion: c })}
                className={cn(
                  "py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                  userState.companion === c
                    ? "bg-brand-accent text-white border-brand-accent shadow-lg shadow-brand-accent/20"
                    : "bg-white text-gray-600 border-brand-border hover:bg-gray-50"
                )}
              >
                {c === Companion.SOLO && "나홀로"}
                {c === Companion.COUPLE && "연인과"}
                {c === Companion.FRIENDS && "친구와"}
                {c === Companion.FAMILY && "가족과"}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Coffee size={14} /> 관심사
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                data-group="interest"
                onClick={() => toggleInterest(interest)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                  userState.interests.includes(interest)
                    ? "bg-brand-ink text-white border-brand-ink"
                    : "bg-white text-gray-500 border-brand-border hover:border-gray-400"
                )}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isLoading || !userState.region}
        data-testid="search-btn"
        onClick={onSearch}
        className={cn(
          "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
          isLoading || !userState.region
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-brand-ink text-white hover:bg-gray-800 shadow-xl"
        )}
      >
        <Search size={20} />
        {isLoading ? "추천 장소 찾는 중..." : "장소 추천받기"}
      </motion.button>
    </div>
  );
};
