import React from 'react';
import { WeatherData } from '../types';
import { CloudSun, Wind, Thermometer } from 'lucide-react';

interface WeatherWidgetProps {
  data?: WeatherData;
  location: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data, location }) => {
  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl p-6 text-white shadow-lg mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold opacity-90">Current Weather</h3>
          <p className="text-2xl font-bold">{location}</p>
        </div>
        <CloudSun className="w-10 h-10 opacity-80" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="flex items-center space-x-3 bg-white/20 p-3 rounded-lg backdrop-blur-sm">
          <Thermometer className="w-5 h-5" />
          <div>
            <p className="text-xs opacity-80">Temperature</p>
            <p className="font-bold">{data.temperature}°C</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-white/20 p-3 rounded-lg backdrop-blur-sm">
          <Wind className="w-5 h-5" />
          <div>
            <p className="text-xs opacity-80">Wind Speed</p>
            <p className="font-bold">{data.windSpeed} km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
};
