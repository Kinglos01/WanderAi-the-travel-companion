import React from 'react';
import { ItineraryData } from '../types';
import { MapPin, Clock } from 'lucide-react';

interface Props {
  data: ItineraryData;
}

export const ItineraryDisplay: React.FC<Props> = ({ data }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-l-4 border-indigo-500 pl-4">
        <h2 className="text-2xl font-bold text-gray-900">{data.destination} Adventure</h2>
        <p className="text-gray-600 mt-1">{data.summary}</p>
      </div>

      <div className="grid gap-6">
        {data.days.map((day, dayIndex) => (
          <div key={dayIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded uppercase tracking-wide mr-3">
                  Day {dayIndex + 1}
                </span>
                {day.dayTitle}
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {day.activities.map((act, actIndex) => (
                <div key={actIndex} className="p-4 hover:bg-gray-50 transition-colors flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-xl">
                    {act.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {act.time}
                    </div>
                    <h4 className="text-gray-900 font-medium">{act.activity}</h4>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
