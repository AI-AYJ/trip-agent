import React from 'react';
import { Place } from '../types';
import { MapPin, Clock, Star, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, getOperatingStatus } from '../lib/utils';

interface PlaceCardProps {
  place: Place;
  isFavorite: boolean;
  onToggleFavorite: (place: Place) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, isFavorite, onToggleFavorite }) => {
  const { isOpen, isClosingSoon } = getOperatingStatus(place.operatingHours);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative bg-white border rounded-2xl p-5 transition-all hover:shadow-xl flex flex-col justify-between h-full",
        isFavorite ? "border-brand-accent ring-1 ring-brand-accent" : "border-brand-border"
      )}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-accent bg-blue-50 px-2 py-0.5 rounded">
              {place.category === 'tourism' && "관광지"}
              {place.category === 'cafe' && "카페"}
              {place.category === 'restaurant' && "맛집"}
              {place.category === 'culture' && "문화"}
            </span>
            <h3 className="text-lg font-bold font-display">{place.name}</h3>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleFavorite(place)}
            className={cn(
              "p-2 rounded-full transition-all border",
              isFavorite 
                ? "bg-brand-accent border-brand-accent text-white" 
                : "bg-white border-brand-border text-gray-400 hover:text-brand-accent"
            )}
          >
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
          </motion.button>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {place.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {place.tags.map(tag => (
            <span key={tag} className="text-[11px] text-gray-400">#{tag}</span>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-brand-border space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin size={14} className="text-gray-400 shrink-0" />
          <span className="truncate">{place.address}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={14} className="text-gray-400 shrink-0" />
            <span>{place.operatingHours.open} - {place.operatingHours.close}</span>
          </div>
          <div className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
            isOpen 
              ? isClosingSoon 
                ? "bg-amber-100 text-amber-700" 
                : "bg-emerald-100 text-emerald-700"
              : "bg-red-50 text-red-600"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", isOpen ? "bg-current" : "bg-red-400")} />
            {isOpen ? (isClosingSoon ? "마감 임박" : "영업 중") : "영업 종료"}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
