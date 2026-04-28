# 설계 문서: 지역 기반 장소 추천 에이전트 (trip-place-agent)

## 개요

사용자의 현재 상태(피로도, 동행 여부, 관심사)와 선택한 지역을 기반으로 **카카오 로컬 API**가 실제 장소를 검색하고, **Gemini AI**가 설명·태그·영업시간을 보강하며, 사용자가 선택한 장소를 즐겨찾기로 관리하고 카카오 맵에 마커로 표시하는 인터랙티브 장소 추천 에이전트입니다.

### 목표

- 카카오 로컬 API로 실제 존재하는 장소 데이터 확보 (AI 환각 방지)
- Gemini AI는 카카오 결과를 받아 설명·태그·영업시간만 보강
- 즐겨찾기 추가/제거 시 카카오 맵 마커 실시간 동기화
- localStorage를 통한 상태 영속 저장

### 범위

`trip-agent/` 프로젝트 전체. 주요 파일:
- `src/lib/kakao.ts` — 카카오 로컬 API 키워드 검색
- `src/lib/gemini.ts` — Gemini AI 보강 로직
- `src/components/MapComponent.tsx` — 카카오 맵 마커 동기화
- `src/components/ValidationAgent.tsx` — 체크리스트 자동 검증
- `src/App.tsx` — 전체 상태 관리

---

## 아키텍처

```
사용자: 지역·피로도·동행·관심사 입력
  → StateForm
  → handleSearch
  → [1단계] kakao.ts: 관심사 → 카테고리 코드 → 키워드 검색 API
  → [2단계] gemini.ts: 카카오 결과 받아 설명·태그·영업시간 보강
  → recommendations 상태 → PlaceCard 그리드
  → 사용자 즐겨찾기 선택 → favorites 상태
  → FavoritePanel + MapComponent(카카오 맵 마커)
  → localStorage 저장
```

---

## 데이터 흐름

### 1단계: 카카오 로컬 API 검색 (`kakao.ts`)

관심사를 카카오 카테고리 코드로 매핑 후 `/v2/local/search/keyword.json` 병렬 호출.

```
관심사 → 카테고리 코드 매핑
맛집   → FD6 (음식점)
카페   → CE7 (카페)
관광지 → AT4 (관광명소)
박물관 → CT1 (문화시설)
역사   → AT4
문화   → CT1
쇼핑   → MT1 (대형마트)
공원   → AT4
액티비티 → AT4
```

반환 필드: `id, name, category, lat, lng, address`

### 2단계: Gemini AI 보강 (`gemini.ts`)

카카오 결과를 프롬프트에 포함하여 각 장소의 `description`, `tags`, `operatingHours`만 생성 요청.
모델: `gemini-2.5-flash-lite` / `responseMimeType: "application/json"` / `responseSchema` 강제.

Gemini 실패 시 카카오 결과를 기본값(`description: '', operatingHours: {open:'09:00', close:'21:00'}`)으로 그대로 반환.

---

## 컴포넌트 설계

### MapComponent

- `favorites: Place[]` + `center: [lat, lng]` props 수신
- `markersRef: Map<id, {marker, infoWindow}>` 로 마커 캐시 관리
- favorites 변경 시 추가/제거된 항목만 처리 (전체 재생성 금지)
- `ResizeObserver`로 `display:none → block` 전환 시 `relayout()` 자동 호출

### ValidationAgent

화면 우측 하단 플로팅 버튼. 클릭 시 CHECKLIST.md 항목을 DOM + 상태 기반으로 자동 검증.
검증 항목: DOM 구조, 응답 시간, 관심사 일치율, 필드 누락, 즐겨찾기 동기화, localStorage 등.

---

## 데이터 모델

### Place

```typescript
interface Place {
  id: string;
  name: string;
  category: 'tourism' | 'cafe' | 'restaurant' | 'culture';
  description: string;   // Gemini 보강
  lat: number;           // 카카오 원본
  lng: number;           // 카카오 원본
  address: string;       // 카카오 원본
  operatingHours: { open: string; close: string }; // Gemini 보강 (HH:mm)
  tags: string[];        // Gemini 보강
}
```

### localStorage 저장 형식

```json
{ "state": { "region": "...", "fatigue": "low", ... }, "favs": [...] }
```

---

## 오류 처리

| 실패 상황 | 감지 조건 | 복구 처리 |
|-----------|-----------|-----------|
| 카카오 API 오류 (401/429 등) | catch | 빈 배열 반환 |
| 카카오 결과 0개 | `length === 0` | Gemini 호출 생략, 빈 배열 반환 |
| Gemini API 오류 | catch | 카카오 결과를 기본값으로 반환 |
| 영업시간 파싱 오류 | try/catch in `getOperatingStatus` | `{ isOpen: false, isClosingSoon: false }` |
| localStorage 파싱 실패 | try/catch | 초기 상태로 시작 |

---

## 성능 고려사항

- 카카오 API 카테고리별 병렬 호출 (`Promise.all`)
- 마커 전체 재생성 금지 — 추가/제거 항목만 처리
- `ResizeObserver`로 지도 탭 전환 시 `relayout()` 호출 (지도 깨짐 방지)
- 그리드/지도 뷰는 `display:none`으로 DOM 유지 (MapComponent 재마운트 방지)

---

## 파일 구조

```
trip-agent/
├── index.html                        # 카카오 맵 SDK 스크립트
├── .env                              # VITE_GEMINI_API_KEY
├── src/
│   ├── App.tsx                       # 전체 상태 관리
│   ├── components/
│   │   ├── MapComponent.tsx          # 카카오 맵 마커 동기화
│   │   ├── ValidationAgent.tsx       # 체크리스트 자동 검증
│   │   ├── StateForm.tsx             # 입력 폼
│   │   ├── PlaceCard.tsx             # 장소 카드
│   │   └── FavoritePanel.tsx         # 즐겨찾기 패널
│   ├── lib/
│   │   ├── kakao.ts                  # 카카오 로컬 API 검색
│   │   ├── gemini.ts                 # Gemini AI 보강
│   │   └── utils.ts                  # 영업시간 계산
│   └── types/index.ts
└── test-input/case-*.json
```
