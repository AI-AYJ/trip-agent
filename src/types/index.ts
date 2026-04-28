export enum Companion {
  SOLO = 'alone',
  COUPLE = 'couple',
  FRIENDS = 'friends',
  FAMILY = 'family',
}

export enum Fatigue {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface OperatingHours {
  open: string; // HH:mm
  close: string; // HH:mm
}

export interface Place {
  id: string;
  name: string;
  category: 'tourism' | 'cafe' | 'restaurant' | 'culture';
  description: string;
  lat: number;
  lng: number;
  address: string;
  operatingHours: OperatingHours;
  tags: string[];
}

export interface UserState {
  region: string;
  startTime: string; // ISO string or simple time
  fatigue: Fatigue;
  companion: Companion;
  interests: string[];
}

export interface AppState {
  userState: UserState;
  recommendations: Place[];
  favorites: Place[];
  isLoading: boolean;
}
