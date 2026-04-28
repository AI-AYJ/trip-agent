import { GoogleGenAI, Type } from "@google/genai";
import { Place, UserState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const placeSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    category: { type: Type.STRING, enum: ['tourism', 'cafe', 'restaurant', 'culture'] },
    description: { type: Type.STRING },
    lat: { type: Type.NUMBER },
    lng: { type: Type.NUMBER },
    address: { type: Type.STRING },
    operatingHours: {
      type: Type.OBJECT,
      properties: {
        open: { type: Type.STRING, description: "format HH:mm" },
        close: { type: Type.STRING, description: "format HH:mm" },
      },
      required: ["open", "close"]
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["id", "name", "category", "description", "lat", "lng", "address", "operatingHours", "tags"]
};

export async function getRecommendations(userState: UserState): Promise<Place[]> {
  const prompt = `Recommend at least 10 interesting places in ${userState.region}.
User context:
- Start Time: ${new Date(userState.startTime).toLocaleTimeString()}
- Fatigue Level: ${userState.fatigue}
- Companion: ${userState.companion}
- Interests: ${userState.interests.join(", ")}

Requirements:
- Only include places within ${userState.region}.
- Include a variety of categories: tourism, cafe, restaurant, culture.
- Provide realistic coordinates (latitude/longitude) for ${userState.region}.
- Provide realistic operating hours.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: placeSchema
        }
      }
    });

    if (!response.text) return [];
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
}
