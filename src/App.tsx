/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserState, AppState, Place, Fatigue, Companion } from './types';
import { getRecommendations } from './lib/gemini';
import { StateForm } from './components/StateForm';
import { PlaceCard } from './components/PlaceCard';
import { MapComponent } from './components/MapComponent';
import { FavoritePanel } from './components/FavoritePanel';
import { Map, Compass, LayoutGrid, Map as MapIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { ValidationAgent } from './components/ValidationAgent';

const INITIAL_USER_STATE: UserState = {
  region: '',
  startTime: new Date().toISOString(),
  fatigue: Fatigue.LOW,
  companion: Companion.SOLO,
  interests: ['맛집', '카페'],
};

const STORAGE_KEY = 'localplace_agent_data';

export default function App() {
  const [userState, setUserState] = useState<UserState>(INITIAL_USER_STATE);
  const [recommendations, setRecommendations] = useState<Place[]>([]);
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const [lastSearchMs, setLastSearchMs] = useState<number | null>(null);

  // Load from storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { state, favs } = JSON.parse(saved);
        if (state) setUserState(state);
        if (favs) setFavorites(favs);
      } catch (e) {
        console.error("Failed to parse storage data", e);
      }
    }
  }, []);

  // Save to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: userState, favs: favorites }));
  }, [userState, favorites]);

  const handleSearch = async () => {
    if (!userState.region) return;
    setIsLoading(true);
    const t0 = Date.now();
    const results = await getRecommendations(userState);
    setLastSearchMs(Date.now() - t0);
    setRecommendations(results);
    setIsLoading(false);
    setViewMode('grid');
    setTimeout(() => { if (gridScrollRef.current) gridScrollRef.current.scrollTop = 0; }, 0);
  };

  const toggleFavorite = (place: Place) => {
    setFavorites(prev => {
      const exists = prev.find(p => p.id === place.id);
      if (exists) return prev.filter(p => p.id !== place.id);
      return [...prev, place];
    });
  };

  const mapCenter = useMemo((): [number, number] => {
    if (favorites.length > 0) {
      const avgLat = favorites.reduce((s, p) => s + p.lat, 0) / favorites.length;
      const avgLng = favorites.reduce((s, p) => s + p.lng, 0) / favorites.length;
      return [avgLat, avgLng];
    }
    if (recommendations.length > 0) {
      const avgLat = recommendations.reduce((s, p) => s + p.lat, 0) / recommendations.length;
      const avgLng = recommendations.reduce((s, p) => s + p.lng, 0) / recommendations.length;
      return [avgLat, avgLng];
    }
    return [37.5665, 126.9780]; // Seoul default
  }, [favorites, recommendations]);

  return (
    <div className="flex h-screen w-full bg-brand-bg overflow-hidden font-sans">
      {/* Left Sidebar: Settings */}
      <aside className="w-80 shrink-0 z-20 shadow-2xl">
        <StateForm 
          userState={userState} 
          isLoading={isLoading}
          onChange={(patch) => setUserState(prev => ({ ...prev, ...patch }))}
          onSearch={handleSearch}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-brand-bg">
        {/* Top Navbar */}
        <header className="h-20 shrink-0 border-b border-brand-border bg-white flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-accent rounded-xl text-white">
              <Compass size={24} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold leading-none">LocalPlace Agent</h1>
              {userState.region && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-gray-400 font-medium">{userState.region} 탐색 중</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                viewMode === 'grid' ? "bg-white text-brand-ink shadow-sm" : "text-gray-500 hover:text-brand-ink"
              )}
            >
              <LayoutGrid size={16} /> 그리드
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                viewMode === 'map' ? "bg-white text-brand-ink shadow-sm" : "text-gray-500 hover:text-brand-ink"
              )}
            >
              <MapIcon size={16} /> 지도 전체보기
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Main Dashboard Interaction Area */}
          <div className="flex-1 overflow-hidden relative">
            {/* Grid View */}
            <div
              ref={gridScrollRef}
              className="absolute inset-0 overflow-y-auto p-8"
              style={{ display: viewMode === 'grid' ? 'block' : 'none' }}
            >
                  {recommendations.length > 0 ? (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles size={18} className="text-brand-accent" />
                          <h2 className="text-2xl font-display font-bold">당신을 위한 추천</h2>
                        </div>
                        <p className="text-sm text-gray-400">총 {recommendations.length}개의 장소를 찾았습니다.</p>
                      </div>

                      {/* Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendations.map(p => (
                          <PlaceCard
                            key={p.id}
                            place={p}
                            isFavorite={favorites.some(f => f.id === p.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-sm mx-auto">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
                        <Compass className="text-gray-300" size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">탐험을 시작해볼까요?</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                          왼쪽 패널에서 여행하고 싶은 지역과 상황을 입력하고 <br/>
                          '장소 추천받기' 버튼을 눌러보세요.
                        </p>
                      </div>
                    </div>
                  )}
            </div>

            {/* Map Full View - always mounted to prevent re-init */}
            <div
              data-testid="map-container"
              className="absolute inset-0"
              style={{ display: viewMode === 'map' ? 'block' : 'none' }}
            >
              <MapComponent favorites={favorites} center={mapCenter} />
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar: Favorites */}
      <aside className="w-80 shrink-0 z-20">
        <FavoritePanel 
          favorites={favorites} 
          onRemove={toggleFavorite} 
        />
      </aside>

      {/* Global Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6"
          >
            <div className="relative">
               <div className="w-20 h-20 border-4 border-gray-100 border-t-brand-accent rounded-full animate-spin" />
               <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-accent animate-pulse" size={32} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold">인공지능이 최적의 장소를 분석 중입니다</h2>
              <p className="text-gray-500">잠시만 기다려주세요, 당신만의 여행 가이드를 완성하고 있어요.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ValidationAgent
        recommendations={recommendations}
        favorites={favorites}
        interests={userState.interests}
        region={userState.region}
        lastSearchMs={lastSearchMs}
      />
    </div>
  );
}
