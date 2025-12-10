import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ItineraryData } from "../types";

// Global constant defined in vite.config.ts
declare const __GEMINI_API_KEY__: string | undefined;

// Define the expected output schema for the model
const itinerarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    destination: { type: Type.STRING, description: "The name of the city/location" },
    coordinates: {
      type: Type.OBJECT,
      properties: {
        lat: { type: Type.NUMBER, description: "Latitude of the destination" },
        lng: { type: Type.NUMBER, description: "Longitude of the destination" },
      },
      required: ["lat", "lng"],
    },
    summary: { type: Type.STRING, description: "A brief 2-sentence summary of the trip vibe." },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayTitle: { type: Type.STRING, description: "Theme of the day (e.g., 'Historical Walk')" },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING, description: "Time of day (e.g., 9:00 AM)" },
                activity: { type: Type.STRING, description: "Name of the activity" },
                description: { type: Type.STRING, description: "Short details about the activity" },
                emoji: { type: Type.STRING, description: "A relevant emoji for the activity" },
              },
              required: ["time", "activity", "description", "emoji"],
            },
          },
        },
        required: ["dayTitle", "activities"],
      },
    },
  },
  required: ["destination", "coordinates", "summary", "days"],
};

export const generateItinerary = async (
  destination: string,
  days: number,
  interests: string
): Promise<ItineraryData> => {
  // 1. Validate API Key Presence
  // Try retrieving from global constant first, then process.env
  let apiKey = '';
  
  if (typeof __GEMINI_API_KEY__ !== 'undefined' && __GEMINI_API_KEY__) {
    apiKey = __GEMINI_API_KEY__;
  } else if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    apiKey = process.env.API_KEY;
  }

  if (!apiKey) {
    console.error("Debug: __GEMINI_API_KEY__ is", typeof __GEMINI_API_KEY__);
    console.error("Debug: process.env.API_KEY is", typeof process !== 'undefined' ? process.env.API_KEY : 'process undefined');
    throw new Error("Gemini API Key is missing. Check .env file for GEMINI_API_KEY and restart the server.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Plan a ${days}-day travel itinerary for ${destination}.
      The user is interested in: ${interests}.
      Ensure the coordinates are accurate for the city center.
      Return strictly valid JSON matching the schema provided.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: itinerarySchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as ItineraryData;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Return a user-friendly error message if possible
    if (error.message.includes('403') || error.message.includes('API_KEY_INVALID')) {
      throw new Error("Invalid API Key. Please check your configuration in .env");
    }
    throw error;
  }
};