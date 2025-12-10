import React from 'react';
import { ItineraryData, WeatherData } from '../types';
import { ItineraryDisplay } from './ItineraryDisplay';
import { WeatherWidget } from './WeatherWidget';
import { Plane, AlertCircle } from 'lucide-react';

interface DashboardProps {
  loading: boolean;
  error: string | null;
  result: ItineraryData | null;
  weather: WeatherData | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ loading, error, result, weather }) => {
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="animate-pulse">Generating your perfect trip...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3 max-w-lg">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl m-4 md:m-8">
        <div className="bg-indigo-50 p-6 rounded-full mb-6">
          <Plane className="w-12 h-12 text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-700">Ready to explore?</h2>
        <p className="mt-2 text-center max-w-sm">Use the sidebar to enter your destination and interests. WanderAI will handle the rest.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {weather && <WeatherWidget data={weather} location={result.destination} />}
      <ItineraryDisplay data={result} />
    </div>
  );
};
