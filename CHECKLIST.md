# 자가 검증 체크리스트 (정답 정의 강화 버전 - 수정 v4)

> 모든 항목은 자동 판정 가능 (boolean / 수치 비교 / JSON 구조 기반)

---

## 요구사항 1: 입력

- [ ] `input[name="region"]` DOM 요소가 정확히 1개 존재한다
- [ ] 피로도 버튼 개수 `=== 3`
- [ ] 동행 버튼 개수 `=== 4`
- [ ] 관심사 버튼 개수 `>= 8`
- [ ] `region === ''`일 때 추천 버튼 `disabled === true`
- [ ] `region === ''` 상태에서 클릭 시 API 호출 횟수 `=== 0`

---

## 요구사항 2: 장소 추천

- [ ] 응답 시간 `< 3초`
- [ ] `recommendations.length >= 10`

- [ ] 관심사 기반 추천 조건
  - 선택한 관심사와 일치하는 장소 비율 `>= 70%`

- [ ] 모든 Place 객체는 아래 필드를 포함해야 한다
  - `id`, `name`, `category`, `description`
  - `lat`, `lng`, `address`
  - `operatingHours.open`, `operatingHours.close`
  - `tags`

- [ ] 필드 누락 객체 개수 `=== 0`

---

## 운영 상태 판정

- [ ] `isOpen === true` 장소 비율 `>= 70%`
- [ ] `isClosingSoon === true` 장소는 전체의 `<= 30%`
- [ ] `closing_time - current_time < 60분`인 장소는 상위 30% index에 포함되지 않는다

---

## 요구사항 3: 즐겨찾기

- [ ] favorite 추가 시 `favorites.length_before +1 === after`
- [ ] 제거 시 `favorites.length_before -1 === after`
- [ ] 중복 ID 개수 `=== 0`

---

## 요구사항 4: 지도

- [ ] 지도 컨테이너 DOM 개수 `=== 1`
- [ ] Marker 개수 `=== favorites.length`
- [ ] Marker 추가 처리 시간 `< 1초`
- [ ] Marker 제거 처리 시간 `< 1초`

---

## 요구사항 5: 결과 출력

- [ ] FavoritePanel 항목 수 `=== favorites.length`
- [ ] 각 항목 순번 형식 `/^\d{2}$/` 만족

---

## 요구사항 6: 상태 저장

- [ ] localStorage key 존재 여부 `=== true`
- [ ] JSON 파싱 성공 여부 `=== true`
- [ ] `stored.favs.length === favorites.length`

---

## 실패 케이스

- [ ] invalid 시간 입력 시 예외 발생 `=== false`
- [ ] API 응답 `[]`일 때 crash 발생 `=== false`

---

## 성능

- [ ] 추천 API 응답 시간 `< 3초`
- [ ] Marker 전체 재생성 횟수 `=== 0`

---

## 코드 품질

- [ ] lint 에러 개수 `=== 0`

---

## 5회 일관성 테스트

- [ ] 동일 입력 5회 실행 시 관심사와 일치하지 않는 카테고리 비율 `<= 15%`
- [ ] 동일 입력 5회 실행 시 추천 결과 Top3 일치율 `>= 70%`
- [ ] Favorite 결과 5회 반복 시 완전 동일 (`=== 100%`)
