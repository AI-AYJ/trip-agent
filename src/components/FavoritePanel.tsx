import React from 'react';
import { Place } from '../types';
import { Trash2, MapPin, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getOperatingStatus } from '../lib/utils';

interface FavoritePanelProps {
  favorites: Place[];
  onRemove: (place: Place) => void;
}

export const FavoritePanel: React.FC<FavoritePanelProps> = ({ favorites, onRemove }) => {
  return (
    <div className="h-full flex flex-col bg-white border-l border-brand-border">
      <div className="p-6 border-bottom border-brand-border">
        <h2 className="text-xl font-display font-bold tracking-tight">즐겨찾기</h2>
        <p className="text-xs text-gray-500 mt-1">{favorites.length}개의 장소가 선택되었습니다.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
        <AnimatePresence mode="popLayout">
          {favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <p className="text-sm">선택된 장소가 없습니다.</p>
            </motion.div>
          ) : (
            favorites.map((place, index) => {
              const { isOpen } = getOperatingStatus(place.operatingHours);
              return (
                <motion.div
                  key={place.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group flex gap-4 p-4 bg-white border border-brand-border rounded-xl hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-gray-400 font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                      <h4 className="font-bold text-sm truncate">{place.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span>{place.category}</span>
                      <span className={cn(isOpen ? "text-emerald-500" : "text-red-500")}>
                        {isOpen ? "영업 중" : "영업 종료"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(place)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
