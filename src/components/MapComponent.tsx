import React, { useEffect, useRef } from 'react';
import { Place } from '../types';
import { getOperatingStatus } from '../lib/utils';

// Kakao Maps 타입 선언
declare global {
  interface Window {
    kakao: any;
  }
}

interface MapComponentProps {
  favorites: Place[];
  center: [number, number]; // [lat, lng]
}

const CATEGORY_EMOJI: Record<string, string> = {
  tourism: '🏰',
  cafe: '☕',
  restaurant: '🍽️',
  culture: '🎭',
};

const CATEGORY_LABEL: Record<string, string> = {
  tourism: '관광지',
  cafe: '카페',
  restaurant: '맛집',
  culture: '문화',
};

export const MapComponent: React.FC<MapComponentProps> = ({ favorites, center }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowRef = useRef<any>(null);

  // 지도 초기화
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) return;
      const options = {
        center: new window.kakao.maps.LatLng(center[0], center[1]),
        level: 5,
      };
      mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options);
    };

    if (window.kakao?.maps) {
      window.kakao.maps.load(initMap);
    } else {
      const script = document.querySelector(
        'script[src*="dapi.kakao.com"]'
      ) as HTMLScriptElement | null;
      if (script) {
        const onLoad = () => window.kakao.maps.load(initMap);
        script.addEventListener('load', onLoad);
        return () => script.removeEventListener('load', onLoad);
      }
    }
  }, []);

  // display:none → block 전환 시 지도 크기 재계산
  useEffect(() => {
    if (!mapRef.current || !mapInstanceRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapRef.current && mapRef.current.offsetWidth > 0) {
        mapInstanceRef.current.relayout();
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  // center 변경 시 지도 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao?.maps) return;
    const moveLatLng = new window.kakao.maps.LatLng(center[0], center[1]);
    mapInstanceRef.current.setCenter(moveLatLng);
  }, [center]);

  // favorites 변경 시 마커 동기화
  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao?.maps) return;

    const currentIds = new Set(favorites.map(p => p.id));

    // 제거된 마커 삭제
    markersRef.current.forEach((markerObj, id) => {
      if (!currentIds.has(id)) {
        markerObj.marker.setMap(null);
        markerObj.infoWindow.close();
        markersRef.current.delete(id);
      }
    });

    // 새로 추가된 마커 생성
    favorites.forEach(place => {
      if (markersRef.current.has(place.id)) return;

      const { isOpen } = getOperatingStatus(place.operatingHours);
      const position = new window.kakao.maps.LatLng(place.lat, place.lng);

      const marker = new window.kakao.maps.Marker({
        map: mapInstanceRef.current,
        position,
        title: place.name,
      });

      const infoContent = `
        <div style="
          padding: 10px 14px;
          min-width: 160px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          line-height: 1.6;
          border-radius: 10px;
        ">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #1a1a1a;">
            ${CATEGORY_EMOJI[place.category] ?? '📍'} ${place.name}
          </div>
          <div style="color: #6b7280; font-size: 11px; margin-bottom: 4px;">
            ${CATEGORY_LABEL[place.category] ?? place.category}
          </div>
          <div style="color: #6b7280; font-size: 11px; margin-bottom: 6px;">
            ${place.address}
          </div>
          <div style="
            display: inline-block;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 999px;
            background: ${isOpen ? '#d1fae5' : '#fee2e2'};
            color: ${isOpen ? '#065f46' : '#991b1b'};
          ">
            ${isOpen ? '● 영업 중' : '● 영업 종료'}
          </div>
        </div>
      `;

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoContent,
        removable: true,
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 기존 열린 인포윈도우 닫기
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
        infoWindow.open(mapInstanceRef.current, marker);
        infoWindowRef.current = infoWindow;
      });

      markersRef.current.set(place.id, { marker, infoWindow });
    });

    // 마커가 있으면 bounds 맞추기
    if (favorites.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds();
      favorites.forEach(p => {
        bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng));
      });
      mapInstanceRef.current.setBounds(bounds);
    }
  }, [favorites]);

  return (
    <div className="w-full h-full relative z-0">
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
      />
      {favorites.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 text-sm text-gray-400 font-medium shadow">
            즐겨찾기에 장소를 추가하면 지도에 표시됩니다
          </div>
        </div>
      )}
    </div>
  );
};
