# 테스트

## 명령
```bash
npm test            # jest (jest-expo preset)
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npx expo-doctor
```

## 2026-10-26 실행 결과
| 명령 | 결과 |
| --- | --- |
| `npx jest` | 6 suites, 68 tests 통과 |
| `npx tsc --noEmit` | 오류 0 |
| `npx expo lint` | 오류·경고 0 |
| `npx expo-doctor` | 20/20 통과 |
| `npx expo export -p web` | 번들 성공 |
| 웹 미리보기(375×812, 라이트/다크) | 온보딩 → 취향 → 홈 → 샘플 옷장(색·핏·패턴 변경) → 코디 빌더(색 변경·저장) 수동 확인 |

## 단위 테스트 범위 (`tests/unit/`)
- `sample-catalog`: 팔레트 유효성, 필수 샘플 종류, 그릴 수 있는 핏/패턴만 노출, 프리셋 무결성(≥8, 슬롯 규칙)
- `recommendation`: 필수 카테고리 부족 보고, 슬롯 규칙, 취향 반영+이유, 추위=아우터 필수/더위=아우터 제외, 비=우산(방수 단정 금지), 고정/제외, 최근 착용 페널티, 샘플 모드 분리
- `canvas-state`: 이동·중심 기준 확대·크기 제한, undo/redo, 히스토리 상한, 레이어, 샘플만 색 변경, JSON 왕복·잘못된 JSON 거부, load
- `wear-cpw`: CPW 경계값, 멱등 키, 고유 이벤트 카운트, 샘플 제외, 로컬 날짜
- `kma-weather`: 격자 변환(서울/부산/제주), 범위 밖, 온도 구간 경계, 체감온도 유효 범위, 프록시 응답 검증(잘못된 값→null), 만료 캐시, 수동 '실내'
- `community-auth`: OAuth 콜백 파싱(쿼리/프래그먼트/오류), Expo Go URL, 공급자 목록, 핸들 검증, 태그·제목 정제, 공개 날씨 문구

## 미검증 (정직하게)
- iOS/Android 실기기·시뮬레이터: **미실행**
- SQLite 마이그레이션 실기기, 사진 선택/카메라, 파일 저장: 미실행(웹 wasm SQLite로 저장만 확인)
- Supabase RLS·스토리지 정책 실행, OAuth 왕복, Edge Function: 미실행
- 네트워크 추적(사진·옷장 데이터 미전송) 테스트: 미실행
