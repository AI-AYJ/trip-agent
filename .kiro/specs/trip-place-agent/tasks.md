# 구현 계획: 지역 기반 장소 추천 에이전트 (trip-place-agent)

## 개요

카카오 로컬 API로 실제 장소를 검색하고, Gemini AI가 설명·태그·영업시간을 보강하며, 사용자가 선택한 장소를 즐겨찾기로 관리하고 카카오 맵에 마커로 표시합니다.

---

## 태스크

- [x] 1. index.html에 카카오 맵 SDK 스크립트 태그 추가
  - `libraries=services,clusterer,drawing`, `autoload=false` 포함
  - _요구사항: 4.7 / steering: 7_

- [x] 2. src/index.css에서 Leaflet CSS 제거
  - _요구사항: 4.7_

- [x] 3. MapComponent.tsx — 카카오 맵 초기화 구현
  - `window.kakao?.maps` 분기 후 `kakao.maps.load(initMap)` 호출
  - ResizeObserver로 display:none → block 전환 시 `relayout()` 자동 호출
  - _요구사항: 4.6, 4.7 / steering: 7_

- [x] 4. MapComponent.tsx — `markersRef: Map<id, {marker, infoWindow}>` 마커 캐시 구현
  - favorites 변경 시 추가/제거된 항목만 처리 (전체 재생성 금지)
  - _요구사항: 4.4, 4.5 / steering: 4_

- [x] 5. MapComponent.tsx — 마커 클릭 시 인포윈도우 표시
  - 장소명, 카테고리, 주소, 영업 여부 포함
  - 단일 인포윈도우 패턴 (새 클릭 시 이전 닫기)
  - _요구사항: 4.3_

- [x] 6. MapComponent.tsx — favorites 있을 때 `setBounds` 자동 범위 조정
  - _요구사항: 4.1, 4.6_

- [x] 7. kakao.ts — 카카오 로컬 API 키워드 검색 구현
  - 관심사 → 카테고리 코드 매핑 (FD6/CE7/AT4/CT1/MT1)
  - 카테고리별 병렬 호출 (`Promise.all`)
  - _요구사항: 2.1, 2.2, 2.3_

- [x] 8. gemini.ts — 카카오 결과를 받아 설명·태그·영업시간 보강
  - 카카오 결과 0개 시 Gemini 호출 생략, 빈 배열 반환
  - Gemini 실패 시 카카오 결과를 기본값으로 반환
  - _요구사항: 2.9 / steering: 2_

- [x] 9. utils.ts — getOperatingStatus에 try/catch 추가
  - 파싱 실패 시 `{ isOpen: false, isClosingSoon: false }` 반환
  - 자정 넘김 케이스(close < open) +24시간 보정
  - _요구사항: 2.6, 2.7 / steering: 1_

- [x] 10. App.tsx — localStorage 저장/복원 구현
  - 저장 키: `localplace_agent_data`, 형식: `{ state, favs }`
  - 파싱 실패 시 초기 상태로 시작
  - _요구사항: 6.1, 6.2, 6.3 / steering: 5_

- [x] 11. StateForm.tsx — region 빈값 시 추천 버튼 disabled
  - _요구사항: 1.4 / steering: 6_

- [x] 12. ValidationAgent.tsx — CHECKLIST 자동 검증 컴포넌트 구현
  - DOM 쿼리 + 상태 기반으로 체크리스트 항목 자동 판정
  - 우측 하단 플로팅 버튼으로 실행

---

## 참고

- 태스크 1~12 모두 완료 상태
- 카카오 REST API 키: `src/lib/kakao.ts`의 `APP_KEY`에 직접 입력
- Gemini API 키: `.env`의 `VITE_GEMINI_API_KEY`에 입력
