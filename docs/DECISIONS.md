# 결정 기록 (DECISIONS)

형식: 날짜 · 문제 · 결정 · 대안 · 리스크. 슈퍼프롬프트와 다르게 간 부분은 **[프롬프트 대비 변경]** 표시.

## D-001 (2026-10-26) 기반 스택: CutPick과 동일한 Expo SDK 58
- 결정: Expo SDK 58 / RN 0.88 / React 19.3 / TS 6 strict / Expo Router(typed routes) / expo-sqlite. CutPick·KeepOn과 동일 버전.
- 이유: 두 저장소에서 이미 동작이 검증된 조합이고, 공유 패턴(디자인 시스템, SQLite, Supabase 커뮤니티)을 그대로 옮길 수 있음. `npx expo-doctor` 20/20 통과.
- 리스크: SDK 59 출시 시 동반 업그레이드 필요.

## D-002 (2026-10-26) 라우트 위치: `src/app` **[프롬프트 대비 변경]**
- 프롬프트는 루트 `app/`을 제안. CutPick/KeepOn 규칙(AGENTS.md)처럼 `src/app`에 두어 라우트와 비라우트 코드를 한 루트 아래로 정리.
- 라우트 파일은 화면 조립만 담당하고 로직은 `features/`에.

## D-003 (2026-10-26) 날씨 공급자: 기상청 단기예보 + Supabase Edge Function 프록시
- 결정: `WeatherProvider` 인터페이스 + `KmaProxyProvider`. 서비스 키는 `supabase secrets`에만, 앱은 `nx, ny` 격자 번호만 전송.
- **개선점 [프롬프트 대비 강화]**: 위경도→KMA 격자 변환과 지역명 결정을 **기기에서** 수행(`kma-grid.ts`, `korea-areas.ts`). 정확한 좌표가 프록시·로그·역지오코딩 서비스로 나가지 않음.
- 대안: Open-Meteo — 무료 플랜이 비상업 조건이라 수익화 가능 앱의 운영 기본값에서 제외(프롬프트 §3.9). 클라이언트 직접 호출 — 키 노출로 제외.
- 리스크: Supabase 미설정 시 실제 날씨 없음 → 수동 날씨 선택으로 폴백(구현됨). Edge Function은 **아직 배포·호출 검증 전**.

## D-004 (2026-10-26) 디자인 방향: 쇼케이스 기반 "모노 에디토리얼"
- 따뜻한 오프화이트 배경, 흰 카드, **유일한 강조색 = 잉크 블랙**. 하늘색은 날씨 표면 전용. 카카오 노랑/구글 흰색은 브랜드 버튼 전용.
- 옷 사진·벡터 뒤 배경(`photoBackdrop`)은 무채색 고정 → 옷 색 왜곡 방지.
- 폰트: Pretendard 단일(OFL). 워드마크도 Pretendard SemiBold로 처리해 폰트 라이선스 항목을 하나로 유지.

## D-005 (2026-10-26) 탭 구성: 홈 · 커뮤니티 · 코디추천 · 옷장 · 프로필 **[프롬프트 대비 변경]**
- 프롬프트 권장(오늘/옷장/코디/커뮤니티/기록) 대신 쇼케이스 순서를 따름. "기록"은 프롬프트 §9.2 허용대로 프로필 하위 + 코디 빌더의 "오늘 착용함"으로 접근.

## D-006 (2026-10-26) 샘플 그래픽: 자체 제작 SVG 경로(react-native-svg)
- 100×100 viewBox의 경로 데이터(`garment-shapes.ts`). 색은 팔레트 ID → HEX, 핏은 실제로 다른 경로가 있을 때만 선택 가능(테스트로 강제).
- react-native-svg는 Expo Go 포함 모듈 → 개발 빌드 불필요. Skia보다 가볍고 웹 미리보기에서도 동작.

## D-007 (2026-10-26) 이미지 파이프라인: CutPick 패턴 재사용
- `expo-image-manipulator`로 네이티브 디코드·리사이즈·재인코딩(EXIF 블록 제거) + JPEG 메타데이터 스캐너로 GPS 재확인. 원본은 읽기만.

## D-008 (2026-10-26) 캔버스: 순수 리듀서 + View 렌더링, Skia는 보류 **[프롬프트 대비 변경]**
- 상태(정규화 좌표·z-index·undo/redo 50단계·JSON 직렬화)는 `canvas-state.ts` 순수 리듀서. 렌더는 절대 위치 View + SVG.
- 모든 조작을 버튼으로 제공(접근성 §9.4). 드래그/핀치는 후속 POC(gesture-handler v3 API 확인 후).
- 이유: Skia는 무거운 네이티브 의존이고, 현재 요구(배치·회전·레이어)는 View 변환으로 충분. 리듀서가 렌더러와 분리돼 있어 Skia로 바꿔도 상태 코드는 유지.

## D-009 (2026-10-26) 인증·커뮤니티: CutPick의 Supabase 구현 이식 + 보완
- Kakao/Google = Supabase 내장 OAuth, 시스템 브라우저 + PKCE, Expo Go 리다이렉트 보정(CutPick D-026), 코드 교환 1회 보장. 이메일 OTP는 보조 수단(쇼케이스의 "이메일로 시작하기").
- CutPick에서 2026-10-23 발견된 버그(신고 CHECK 때문에 신고된 게시물/계정 삭제 불가)를 **처음부터 반영**: 대상 필수 조건을 insert 정책으로 이동.
- 추가 서버 규칙: 자기 게시물 하트·자기 신고 금지, `featured_on`(베스트 착장 큐레이션 날짜)은 특권 역할만 변경.
- `require_review` 기본값 **true** (운영 인력 확인 전까지 승인 후 공개, 프롬프트 §3.10). CutPick은 즉시 공개로 바꿨지만 WearLog는 아직 운영 절차가 없음.

## D-010 (2026-10-26) "오늘의 베스트 착장" = 운영자 큐레이션 날짜, 정렬은 시간순
- 하트 수로 정렬하지 않음. `get_feed(p_featured)`는 오늘(KST) `featured_on` 게시물을 `created_at desc`로 반환. 순위표·1위 표시 없음.

## D-011 (2026-10-26) 체감온도: 공급자 미제공 → 겨울 풍속냉각 공식만 "추정"으로
- 기상청 단기예보는 체감온도를 주지 않음. T ≤ 10°C, 풍속 ≥ 4.8km/h 범위에서만 KMA 겨울철 체감온도 식으로 계산하고 `apparentTemperatureSource='estimated'`, UI에 "(추정)". 범위 밖은 표시 안 함.
- 추천은 공급자 제공 체감온도만 기준으로 쓰고, 추정값은 기준으로 쓰지 않음(기온 사용).

## D-012 (2026-10-26) 의류 분할(ML): 아직 미도입
- `GarmentAnalysisProvider` 계약 + `manualProvider`만 존재. 모든 속성은 사용자가 선택하고 UI에 "자동 분석 미지원" 명시. Phase 0 POC(docs/VISION_POC.md) 통과 전 모델 번들 금지.

## D-013 (2026-10-26) 착용 기록 멱등성: DB 수준 보장
- `wear_events.idempotency_key UNIQUE` + `INSERT OR IGNORE` + 링크 테이블 PK. 같은 날 같은 코디는 몇 번 눌러도 1회. 착용 횟수는 링크 테이블 COUNT로 계산(캐시 카운터 없음).
