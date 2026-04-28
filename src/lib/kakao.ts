import { Place } from '../types';

const INTEREST_TO_KAKAO: Record<string, string> = {
  '맛집': 'FD6',
  '카페': 'CE7',
  '관광지': 'AT4',
  '박물관': 'CT1',
  '역사': 'AT4',
  '문화': 'CT1',
  '쇼핑': 'MT1',
  '공원': 'AT4',
  '액티비티': 'AT4',
};

const KAKAO_TO_CATEGORY: Record<string, Place['category']> = {
  'FD6': 'restaurant',
  'CE7': 'cafe',
  'AT4': 'tourism',
  'CT1': 'culture',
  'MT1': 'tourism',
};

const APP_KEY = '';

interface KakaoDoc {
  id: string;
  place_name: string;
  category_group_code: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
}

async function keywordSearch(query: string, categoryCode?: string): Promise<KakaoDoc[]> {
  const params = new URLSearchParams({ query, size: '15' });
  if (categoryCode) params.set('category_group_code', categoryCode);
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
    { headers: { Authorization: `KakaoAK ${APP_KEY}` } }
  );
  const data = await res.json();
  return data.documents ?? [];
}

export async function searchPlacesByRegion(
  region: string,
  interests: string[]
): Promise<Omit<Place, 'description' | 'operatingHours' | 'tags'>[]> {
  const categoryCodes = interests.length > 0
    ? [...new Set(interests.map(i => INTEREST_TO_KAKAO[i]).filter(Boolean))]
    : ['FD6', 'CE7', 'AT4', 'CT1'];

  // 각 카테고리별로 "지역 + 카테고리" 키워드 검색
  const fetches = categoryCodes.map(code =>
    keywordSearch(region, code).catch(() => [] as KakaoDoc[])
  );

  const allDocs = await Promise.all(fetches);
  const seen = new Set<string>();
  const results: Omit<Place, 'description' | 'operatingHours' | 'tags'>[] = [];

  allDocs.forEach((docs, i) => {
    const code = categoryCodes[i];
    docs.forEach(d => {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        results.push({
          id: d.id,
          name: d.place_name,
          category: KAKAO_TO_CATEGORY[code] ?? 'tourism',
          lat: parseFloat(d.y),
          lng: parseFloat(d.x),
          address: d.road_address_name || d.address_name,
        });
      }
    });
  });

  return results;
}
