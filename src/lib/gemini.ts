import { GoogleGenAI, Type } from "@google/genai";
import { Place, UserState } from "../types";
import { searchPlacesByRegion } from "./kakao";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function getRecommendations(userState: UserState): Promise<Place[]> {
  // 1. 카카오에서 실제 장소 데이터 가져오기
  const kakaoPlaces = await searchPlacesByRegion(userState.region, userState.interests);

  if (kakaoPlaces.length === 0) return [];

  // 2. Gemini로 설명/태그/영업시간 보강
  const placeList = kakaoPlaces.map(p =>
    `id:${p.id} | name:${p.name} | category:${p.category} | address:${p.address}`
  ).join('\n');

  const prompt = `You are a travel guide. Given these real places from Kakao Maps in ${userState.region}, enrich each with a short Korean description, tags, and estimated operating hours.

User context:
- Fatigue: ${userState.fatigue}
- Companion: ${userState.companion}
- Interests: ${userState.interests.join(', ')}

Places:
${placeList}

Return a JSON array. Each object must have:
- id (same as input)
- description (Korean, 1-2 sentences)
- tags (array of 2-4 Korean keywords)
- operatingHours: { open: "HH:mm", close: "HH:mm" }`;

  const enrichSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        description: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        operatingHours: {
          type: Type.OBJECT,
          properties: {
            open: { type: Type.STRING },
            close: { type: Type.STRING },
          },
          required: ['open', 'close'],
        },
      },
      required: ['id', 'description', 'tags', 'operatingHours'],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: enrichSchema,
      },
    });

    if (!response.text) return kakaoPlaces.map(toPlace);

    const enriched: { id: string; description: string; tags: string[]; operatingHours: { open: string; close: string } }[] =
      JSON.parse(response.text.trim());

    const enrichMap = new Map(enriched.map(e => [e.id, e]));

    return kakaoPlaces.map(p => {
      const extra = enrichMap.get(p.id);
      return {
        ...p,
        description: extra?.description ?? '',
        tags: extra?.tags ?? [],
        operatingHours: extra?.operatingHours ?? { open: '09:00', close: '21:00' },
      };
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return kakaoPlaces.map(toPlace);
  }
}

function toPlace(p: Omit<Place, 'description' | 'operatingHours' | 'tags'>): Place {
  return { ...p, description: '', tags: [], operatingHours: { open: '09:00', close: '21:00' } };
}
