import React, { useState, useEffect } from 'react';
import { User, ViewState, ItineraryData, WeatherData } from './types';
import { subscribeToAuthChanges, logout, saveSession } from './services/firebase';
import { generateItinerary } from './services/geminiService';
import { fetchWeather } from './services/weatherService';

import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Button } from './components/Button';

import { 
  LayoutDashboard, 
  History as HistoryIcon, 
  LogOut, 
  Compass, 
  Plane, 
  Calendar, 
  Heart, 
  Sparkles 
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Generation State
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ItineraryData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time auth changes from Firebase
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    // Auth subscription will handle state update
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setWeather(null);
    
    // Automatically switch to dashboard view to show loading/results
    setView(ViewState.DASHBOARD);
    if (window.innerWidth < 768) setIsMenuOpen(false); // Close mobile menu on submit

    try {
      // 1. Call Gemini
      const itinerary = await generateItinerary(destination, days, interests);
      setResult(itinerary);

      // 2. Call External API (Weather)
      const weatherData = await fetchWeather(itinerary.coordinates);
      if (weatherData) {
        setWeather(weatherData);
      }

      // 3. Save to History (Firestore)
      // Note: We don't pass userId anymore; the service handles it for security.
      if (user) {
        await saveSession({
          prompt: `Trip to ${destination} for ${days} days. Interests: ${interests}`,
          response: itinerary,
          weather: weatherData || undefined,
        });
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <span className="font-bold text-xl text-indigo-600 flex items-center gap-2">
            <Compass className="w-6 h-6" /> WanderAI
        </span>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Sidebar Control Panel */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-80 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col shadow-xl md:shadow-none
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-100 hidden md:flex items-center gap-2">
          <Compass className="w-8 h-8 text-indigo-600" />
          <span className="font-bold text-2xl tracking-tight text-gray-800">WanderAI</span>
        </div>

        {/* View Switcher (Tabs) */}
        <div className="px-4 py-4">
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setView(ViewState.DASHBOARD)}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
                view === ViewState.DASHBOARD 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Planner
            </button>
            <button
              onClick={() => setView(ViewState.HISTORY)}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
                view === ViewState.HISTORY 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <HistoryIcon className="w-4 h-4 mr-2" />
              History
            </button>
          </div>
        </div>

        {/* Form Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-6">
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Destination</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    placeholder="e.g. Tokyo, Paris"
                  />
                  <Plane className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Duration (Days)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Interests & Vibe</label>
                <div className="relative">
                  <textarea
                    required
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm resize-none"
                    placeholder="e.g. I love history, spicy food, and hidden local spots. No hiking."
                  />
                  <Heart className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <Button type="submit" isLoading={loading} className="w-full py-3 shadow-md hover:shadow-lg transform transition-all active:scale-95">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Itinerary
              </Button>
            </form>

            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-xs text-indigo-700 leading-relaxed">
                <strong>Pro Tip:</strong> Try entering a weird combination like "Cyberpunk vibes and tea ceremonies" for unique results!
              </p>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3 border border-indigo-200">
              {user.displayName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-xs font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3 h-3 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto h-[calc(100vh-65px)] md:h-screen w-full relative">
        {view === ViewState.DASHBOARD ? (
          <Dashboard 
            loading={loading}
            result={result}
            weather={weather}
            error={error}
          />
        ) : (
          <History user={user} />
        )}
      </main>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-0 md:hidden backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;