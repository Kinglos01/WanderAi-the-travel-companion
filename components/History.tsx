import React, { useEffect, useState } from 'react';
import { getSessions } from '../services/mockFirebase';
import { Session } from '../types';
import { Calendar, MapPin, Clock } from 'lucide-react';

export const History: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    // In a real app, this would be an async fetch from Firestore
    const data = getSessions();
    setSessions(data);
  }, []);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <Clock className="w-12 h-12 mb-4 opacity-20" />
        <p>No trip history found yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6 text-indigo-600" />
        Your Trip History
      </h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{session.response.destination}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>
              {session.weather && (
                <span className="text-xs bg-sky-100 text-sky-800 px-2 py-1 rounded-full font-medium">
                  {session.weather.temperature}°C
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 italic">
              "{session.prompt}"
            </p>

            <div className="space-y-2">
               {session.response.days.slice(0, 2).map((day, idx) => (
                 <div key={idx} className="flex items-center text-sm text-gray-700">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                    <span className="font-medium mr-1">{day.dayTitle}:</span> 
                    <span className="text-gray-500 truncate">{day.activities.length} activities</span>
                 </div>
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
