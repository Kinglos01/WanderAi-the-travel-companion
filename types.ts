// Data Models

export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Activity {
  time: string;
  activity: string;
  description: string;
  emoji: string;
}

export interface ItineraryData {
  destination: string;
  coordinates: Coordinates;
  summary: string;
  days: {
    dayTitle: string;
    activities: Activity[];
  }[];
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
}

export interface Session {
  id: string;
  userId: string;
  prompt: string;
  response: ItineraryData;
  weather?: WeatherData; // Combined external API data
  createdAt: string;
}

// UI Types
export enum ViewState {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY'
}
