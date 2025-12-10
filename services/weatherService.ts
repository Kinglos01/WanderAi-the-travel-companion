import { Coordinates, WeatherData } from "../types";

// Uses Open-Meteo API (Free, no key required)
export const fetchWeather = async (coords: Coordinates): Promise<WeatherData | null> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,weather_code,wind_speed_10m`
    );

    if (!response.ok) {
      throw new Error('Weather API failed');
    }

    const data = await response.json();
    
    return {
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m
    };
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return null;
  }
};
