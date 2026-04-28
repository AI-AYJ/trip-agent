# LocalPlace Agent

> 이 README는 채점자가 가장 먼저 읽는 표지입니다.

---

## 1. 어떤 병목을 다루는가

- **병목 Task**: 여행지에서 현재 상황(피로도·동행·관심사)에 맞는 장소를 직접 검색하고 지도에 저장한다
- **빈도**: 여행 1회당 3~5회 / 1회당 약 10~20분
- **왜 병목인가**: 카카오맵·네이버맵 직접 검색 시 관심사별 필터링이 불가하고, 동행 유형·피로도 조합은 수동 판단이 필요하다. 결과를 즐겨찾기로 정리하는 과정도 반복적으로 시간을 소모한다.

---

## 2. 왜 AI Agent로 만들었는가

- **룰베이스/매크로/기존 도구로 안 되는 이유**: 카카오맵은 카테고리 검색만 지원하며, 피로도·동행 유형·관심사 조합에 따른 우선순위 결정은 단순 필터로 표현 불가하다.
- **AI 판단이 필요한 지점**: 카카오 API로 가져온 장소 목록에서 사용자 컨텍스트(피로도 HIGH + FAMILY + 관심사)를 반영한 설명·태그 생성 및 추천 우선순위 결정

---

## 3. Agent 구조

- **입력 → 처리 → 출력**
  ```
  지역·피로도·동행·관심사 입력
    → 카카오 로컬 API (관심사별 카테고리 코드로 실제 장소 검색)
    → Gemini AI (장소별 한국어 설명·태그·영업시간 보강)
    → 그리드 카드 + 카카오 지도 마커 표시 + 즐겨찾기 저장
  ```
- **사용 도구**:
  - 모델: Google Gemini 2.5 Flash Lite
  - 외부 API: 카카오 로컬 API (키워드 검색 `/v2/local/search/keyword.json`)
  - 지도: 카카오 맵 SDK
  - 상태 저장: localStorage
- **핵심 제약 (Steering 요약)**:
  - 비용 상한: Gemini 무료 티어 내 사용
  - 도구 화이트리스트: 카카오 로컬 API, Gemini API
  - 사람 개입이 필요한 조건: 즐겨찾기 추가/제거는 사용자가 직접 선택

---

## 4. 실행 방법

```bash
npm install && cp .env.example .env && npm run dev
```

- **필요한 환경변수**: `.env.example` 참조
  - `VITE_GEMINI_API_KEY`: Google AI Studio에서 발급
- **선행 조건**: 카카오 개발자 콘솔에서 REST API 키 발급 및 `http://localhost:3000` 도메인 등록, `src/lib/kakao.ts`의 `APP_KEY`에 입력

---

## API 키 설정 방법

### Gemini API 키
1. [Google AI Studio](https://aistudio.google.com/apikey)에서 API 키 발급
2. `.env` 파일을 열어 아래 항목에 입력:
   ```
   VITE_GEMINI_API_KEY="발급받은_키_입력"
   ```

### 카카오 REST API 키
1. [카카오 개발자 콘솔](https://developers.kakao.com/console/app)에서 앱 생성
2. **앱 키** 탭 → **REST API 키** 복사
3. **플랫폼 → Web → 사이트 도메인**에 `http://localhost:3000` 추가
4. `src/lib/kakao.ts` 파일을 열어 아래 항목에 입력:
   ```ts
   const APP_KEY = '발급받은_REST_API_키_입력';
   ```

---

## 5. 테스트 입력 형식

- **위치**: `test-input/` 폴더
- **형식**: `.json`
- **구조**:
  ```json
  {
    "description": "케이스 설명",
    "userState": {
      "region": "지역명",
      "fatigue": "low | medium | high",
      "companion": "alone | couple | friends | family",
      "interests": ["맛집", "카페", "관광지", ...],
      "startTime": "ISO 8601"
    },
    "kakaoExpected": { "categoryCodes": ["FD6", "CE7"], "minResults": 10 },
    "expected": { "minPlaces": 10, "interestMatchRatio": 0.7, "allFieldsPresent": true }
  }
  ```

---

## 6. 실행 결과 (5회)

| 회차 | 지역 | 관심사 | 추천 수 | 즐겨찾기 | 마커 수 | 마커=즐겨찾기 | 결과 |
|------|------|--------|---------|---------|---------|-------------|------|
| 1 | 서울 강남구 | 맛집, 카페 | 12 | 3 | 3 | ✅ | ✅ |
| 2 | 제주도 | 관광지, 문화 | 10 | 5 | 5 | ✅ | ✅ |
| 3 | 부산 해운대 | 맛집, 쇼핑 | 11 | 2 | 2 | ✅ | ✅ |
| 4 | 강원도 인제군 | 관광지 | 6 | 2 | 2 | ✅ | ✅ |
| 5 | 전주 한옥마을 | 맛집, 카페 | 10 | 3 | 3 | ✅ | ✅ |

> 핵심 검증: 마커 수 = 즐겨찾기 수 (5회 모두 일치)

---

## 자산 위치 안내 (채점자용)

| 항목 | 위치 |
|---|---|
| 사용자 시나리오·수용 기준 | `.kiro/specs/trip-place-agent/requirements.md` |
| 구현 설계 | `.kiro/specs/trip-place-agent/design.md` |
| 실행 단계 분해 | `.kiro/specs/trip-place-agent/tasks.md` |
| 전역 규칙·도메인 컨텍스트 | `.kiro/specs/trip-place-agent/steering.md` |
| 자가 검증 항목 | `CHECKLIST.md` |
| 테스트 입력 | `test-input/case-*.json` |
