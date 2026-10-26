# WearLog 아키텍처

> 기준일 2026-10-26 · Expo SDK 58 / React Native 0.88 / React 19.3 / TypeScript strict

## 1. 설계 원칙

| 원칙 | 구조로 어떻게 보장하나 |
| --- | --- |
| 로컬 우선 | 옷장·코디·캔버스·착용·취향은 `expo-sqlite` + 앱 전용 파일. 네트워크 계층은 `infrastructure/supabase`, `infrastructure/weather-providers`로만 들어오고, 둘 다 미설정이면 "미설정" 상태로 동작 |
| 샘플 ≠ 내 옷 | `ItemRef` 판별 유니온(`ownedGarment` / `sampleTemplate`)이 저장·직렬화·추천·착용 기록 전 구간을 관통. 착용 기록은 `ownedIdsOf()`에서 샘플을 걸러냄 |
| 설명 가능한 추천 | 가중치·온도 구간·임계값은 `src/domain/recommendation-policy.ts` 한 곳. 엔진은 순수 함수이며 점수를 바꾼 규칙만 `reasons`로 반환 |
| 공급자 교체 가능 | `WeatherProvider`, `CommunityRepository`, `GarmentAnalysisProvider` 인터페이스. 화면은 구현체를 import하지 않음(서비스 1곳에서만 선택) |
| 정직한 UI | 공급자가 안 준 값은 `null` → 화면에 미표시. 앱 계산값은 `ValueSource = 'estimated'`로 "추정" 표기 |

## 2. 레이어

```
src/
├── app/                  # Expo Router 화면(라우팅·조립만). 비즈니스 로직 없음
│   ├── (tabs)/           # 홈 · 커뮤니티 · 코디추천 · 옷장 · 프로필 (쇼케이스 순서)
│   ├── onboarding/       # 스플래시 + 시각적 취향 카드
│   ├── wardrobe/         # 옷 등록/상세
│   ├── builder/          # 코디 빌더(캔버스)
│   ├── community/        # 로그인, 게시 전 확인
│   ├── auth/callback.tsx # OAuth 딥링크 착지점
│   └── weather.tsx, sample-wardrobe.tsx, wear-log.tsx, settings.tsx
├── design-system/        # 토큰(tokens.ts) + 공용 컴포넌트. 화면은 색/간격을 직접 정의하지 않음
├── domain/               # UI·플랫폼 무관: models, categories, palette, recommendation-policy, wear(CPW), errors
├── features/             # 유스케이스 단위 (순수 로직 + 리포지토리 + 기능 전용 컴포넌트)
│   ├── sample-wardrobe/  # 번들 카탈로그·프리셋·벡터 실루엣(GarmentVector)
│   ├── recommendations/  # engine.ts(순수), rec-items.ts, use-recommendations.ts
│   ├── outfit-builder/   # canvas-state.ts(리듀서·undo/redo·직렬화), outfit-repository
│   ├── wardrobe/         # garment-repository, garment-import, GarmentEditor
│   ├── wear-log/         # 멱등 착용 기록, 착용 통계/CPW 쿼리
│   ├── weather/          # weather-signal(순수), weather-service(캐시·폴백), 체감온도 추정
│   ├── taste-onboarding/ # 취향 카드, TasteProfile
│   ├── community/        # 리포지토리 인터페이스 + Supabase 구현, 모더레이션 정책, 게시 서비스
│   ├── auth/             # OAuth 콜백 파싱 등 순수 헬퍼
│   └── vision-analysis/  # 분석 공급자 계약 + manualProvider(기본값)
├── infrastructure/       # OS/외부 어댑터
│   ├── database/         # SQLite 연결 + 트랜잭션 마이그레이션(PRAGMA user_version)
│   ├── file-storage/     # 앱 전용 파생 파일 (.web.ts = 미리보기용 대체)
│   ├── image-processing/ # expo-image-manipulator 파이프라인, JPEG EXIF/GPS 스캐너
│   ├── location/         # 포그라운드 1회 위치
│   ├── weather-providers/# KMA 격자 변환, 지역 목록, 프록시 공급자
│   └── supabase/         # config.ts(순수) / client.ts(네이티브 의존)
├── hooks/                # app-state(취향·날씨 컨텍스트), use-async, use-community-session
└── utils/
supabase/
├── migrations/           # RLS·트리거·스토리지 정책 (새 파일로만 추가)
└── functions/weather-kma # 기상청 서비스 키를 서버에 두는 Edge Function
tests/unit/               # 도메인·정책·리듀서·파서 테스트 (네트워크/네이티브 불필요)
```

의존 방향: `app → features → domain`, `features → infrastructure`. `domain`은 아무것도 import하지 않음(카테고리·팔레트 상호 참조 제외).

## 3. 핵심 흐름

### 오늘의 코디 추천
```
SQLite(garments + wear stats) ─▶ ownedToRecItem ─┐
번들 SAMPLE_TEMPLATES (샘플 포함 모드만) ───────┼─▶ candidatePool ─▶ recommend() ─▶ { items, reasons, gaps }
TasteProfile (kv) ──────────────────────────────┤        ▲
WeatherContext ─▶ resolveWeatherSignal ─────────┘        └ recommendation-policy.ts
```
- `WeatherContext`는 `snapshot`(유효기간 내) / `manual`(사용자 선택) / `none` 중 하나. 만료된 스냅샷은 `none`.
- 결과가 부족하면 `notEnoughItems { missing }` → 화면은 샘플 체험 CTA.

### 날씨 (개인정보 개선점)
```
[사용자 탭] ─▶ expo-location(Balanced, 1회) ─▶ latLonToKmaGrid() + nearestArea() ─▶ 좌표 폐기
          ─▶ Edge Function weather-kma?nx=&ny= (서비스 키는 서버 secret) ─▶ parseKmaProxyResponse(스키마 검증)
          ─▶ kv 캐시(격자 + 번들, validUntil) ─▶ WeatherCard
```
기기 밖으로 나가는 위치 정보는 **5km 격자 번호뿐**입니다. 지역명도 번들 목록으로 기기에서 정하므로 역지오코딩 서비스를 호출하지 않습니다.

### 커뮤니티 게시
```
사용자가 사진 선택 ─▶ renderJpeg(재인코딩, ≤1440px) ─▶ scanJpegMetadata(GPS 있으면 차단)
                 ─▶ 미리보기 + 동의 3종 체크 ─▶ Storage {uid}/{postId}.jpg ─▶ posts insert (트리거: 일일 제한·용량·검토 대기)
```

## 4. 상태 관리
- 전역: `AppStateProvider`(취향, 날씨 설정·번들·수동 날씨, `dataVersion`). 외부 상태 라이브러리 없음.
- 목록: `useAsync(fn, deps)` + `dataVersion` 증가로 재조회. 렌더 중 상태 조정 패턴으로 effect 내 setState 없음.

## 5. 플랫폼
- iOS/Android: NativeTabs, expo-sqlite(WAL), expo-file-system 새 API.
- Web: **UI QA 전용 미리보기**(JS 탭, wasm SQLite, data URI 썸네일). 출시 대상 아님.
- 네이티브 모듈은 모두 Expo Go 포함 모듈(react-native-svg, expo-location 등) → 현재 개발 빌드 불필요. ONNX/Skia 도입 시 development build 필요(ROADMAP 참고).
