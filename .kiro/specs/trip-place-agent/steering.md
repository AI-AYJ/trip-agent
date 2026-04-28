# 전역 규칙 (Steering)

이 파일은 trip-place-agent 구현 전반에 걸쳐 항상 적용되는 규칙입니다.
requirements.md의 병목 원인·암묵 규칙·실패 비용에서 도출되었으며, design.md·tasks.md와 일관성을 유지합니다.

---

## 1. 영업 시간 판단 — 허용 불가 실패

**근거: 실패 비용 2 (영업 종료 장소 추천 시 현장 방문 불가)**

- `getOperatingStatus`는 반드시 try/catch로 감싸야 한다.
- 파싱 실패 시 `{ isOpen: false, isClosingSoon: false }` 반환 (영업 종료로 안전 처리).
- 자정 넘김 케이스(close < open)는 close에 +24시간 보정 적용.
- 영업 종료 시간까지 **60분 미만** 남은 경우 `isClosingSoon: true`.

```typescript
// 올바른 구현
export function getOperatingStatus(hours: OperatingHours) {
  try {
    const now = new Date();
    const openTime = parse(hours.open, 'HH:mm', now);
    let closeTime = parse(hours.close, 'HH:mm', now);
    if (isAfter(openTime, closeTime)) closeTime = addHours(closeTime, 24);
    const isOpen = isWithinInterval(now, { start: openTime, end: closeTime });
    const isClosingSoon = isOpen && isAfter(now, addHours(closeTime, -1));
    return { isOpen, isClosingSoon };
  } catch {
    return { isOpen: false, isClosingSoon: false };
  }
}
```

---

## 2. Gemini 프롬프트 — 판단 컨텍스트 필수 포함

**근거: 병목 원인 4 (피로도·동행·관심사 조합은 룰베이스로 판단 불가)**

Gemini API 호출 시 프롬프트에 반드시 아래 컨텍스트를 포함해야 한다:

- `fatigue: high` → 프롬프트에 `"Prioritize indoor, low-effort, nearby places"` 명시
- `companion: family | friends` → 프롬프트에 `"Prioritize places with high group satisfaction over individual preference"` 명시
- `interests` → 관심사 목록을 프롬프트에 포함하고 해당 카테고리 장소를 우선 배치 요청

```typescript
// gemini.ts 프롬프트 예시
const fatigueHint = userState.fatigue === 'high'
  ? 'Prioritize indoor, low-effort, nearby places. Avoid long walks or strenuous activities.'
  : '';
const companionHint = ['family', 'friends'].includes(userState.companion)
  ? 'Prioritize places with high group satisfaction over individual preference.'
  : '';
```

---

## 3. 추천 결과 부족 안내 — 빈 화면 금지

**근거: 실패 비용 3 (추천 결과 0개 시 버그로 인식)**

- `recommendations.length === 0` + API 호출 완료 → "추천 결과를 불러오지 못했습니다. 다시 시도해주세요." + 재시도 버튼
- `0 < recommendations.length < 10` → "현재 시간 기준 영업 중인 장소가 N개입니다" 안내 배너
- 빈 화면(아무 메시지 없음)은 허용하지 않는다.

---

## 4. 마커 수 = 즐겨찾기 수 — 항상 일치

**근거: 실패 비용 4 (즐겨찾기 장소가 지도에 미표시 시 핵심 기능 실패)**

- `markersRef.size`는 항상 `favorites.length`와 동일해야 한다.
- 마커 전체 재생성 방식 금지. 추가/제거된 항목만 처리.
- 즐겨찾기 변경 후 `markersRef.size !== favorites.length`이면 버그로 간주.

---

## 5. localStorage 저장 — 즐겨찾기 소실 금지

**근거: 실패 비용 5 (새로고침 후 즐겨찾기 소실 시 신뢰도 하락)**

- favorites 변경 시 즉시 localStorage에 저장 (useEffect 의존성 배열에 favorites 포함).
- 저장 키: `'localplace_agent_data'`
- 저장 형식: `{ state: UserState, favs: Place[] }`
- 로드 시 파싱 실패 → 초기 상태로 시작 (favorites 빈 배열, region 빈 문자열).

---

## 6. 지역 미선택 시 추천 금지

**근거: 요구사항 1.4**

- `userState.region.trim() === ''`이면 Gemini API 호출 금지.
- 추천 버튼은 `disabled` 상태로 표시.
- 이 규칙은 UI(버튼 비활성화)와 로직(`handleSearch` 가드) 양쪽에 모두 적용.

---

## 7. 카카오 맵 API 키

- appkey: ``
- SDK URL: `//dapi.kakao.com/v2/maps/sdk.js?appkey=...&libraries=services,clusterer,drawing&autoload=false`
- Leaflet 사용 금지. 카카오 맵 SDK만 사용.
