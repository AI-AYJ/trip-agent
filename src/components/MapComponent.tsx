import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Place } from '../types';
import { getOperatingStatus } from '../lib/utils';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  favorites: Place[];
  center: [number, number];
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export const MapComponent: React.FC<MapComponentProps> = ({ favorites, center }) => {
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {favorites.map((place) => {
          const { isOpen } = getOperatingStatus(place.operatingHours);
          return (
            <Marker key={place.id} position={[place.lat, place.lng]}>
              <Popup>
                <div className="p-1 space-y-1">
                  <h4 className="font-bold text-base">{place.name}</h4>
                  <p className="text-xs text-gray-500">{place.address}</p>
                  <p className="text-xs font-medium">
                    {place.category === 'tourism' && "🏰 관광지"}
                    {place.category === 'cafe' && "☕ 카페"}
                    {place.category === 'restaurant' && "🍽️ 맛집"}
                    {place.category === 'culture' && "🎭 문화"}
                  </p>
                  <div className={`text-[10px] font-bold ${isOpen ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isOpen ? "● 영업 중" : "● 영업 종료"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
