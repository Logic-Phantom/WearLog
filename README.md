# WearLog (웨어로그)

> 내 옷을 기록하고, 내 취향으로 조합하고, 오늘의 코디를 발견하다.

로컬 우선 디지털 옷장 앱 (Android + iOS). React Native + Expo SDK 58 + TypeScript strict.

- 옷을 하나도 등록하지 않아도 **샘플 옷장**(자체 제작 벡터 34종, 16색, 프리셋 9개)으로 바로 코디
- 취향 카드 온보딩 → 추천 점수에 실제 반영
- 기상청 단기예보 기반 날씨(격자 번호만 전송) 또는 직접 고른 날씨로 **이유가 보이는 추천**
- 코디 빌더(이동·크기·회전·레이어·undo/redo), 멱등 착용 기록과 CPW
- 선택형 커뮤니티 "오늘의 베스트 착장"(하트·신고·차단만), 카카오·Google·이메일 로그인 — 로그인 없이도 전부 로컬 동작

## 시작하기

```bash
npm install
npx expo start
```

Expo Go로 바로 실행됩니다(현재 개발 빌드가 필요한 네이티브 모듈 없음). 커뮤니티·실제 날씨를 쓰려면 `.env.example`을 `.env.local`로 복사해 Supabase 공개 값을 넣고 `docs/SOCIAL_AUTH_SETUP.md`, `docs/WEATHER_PROVIDER.md`를 따르세요. 비워 두면 커뮤니티는 "서버 미설정", 날씨는 수동 선택으로 동작합니다.

```bash
npm test            # 단위 테스트
npm run typecheck
npm run lint
npx expo-doctor
```

## 문서
| 문서 | 내용 |
| --- | --- |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | 레이어, 의존 방향, 핵심 흐름 |
| [DECISIONS](docs/DECISIONS.md) | 결정 기록(프롬프트 대비 변경 포함) |
| [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md) | 쇼케이스 기반 토큰·컴포넌트 |
| [DATA_MODEL](docs/DATA_MODEL.md) | 로컬/서버 스키마, 권한, 삭제 규칙 |
| [WEATHER_PROVIDER](docs/WEATHER_PROVIDER.md) | 기상청 프록시, 필드 매핑, 남은 확인 |
| [SOCIAL_AUTH_SETUP](docs/SOCIAL_AUTH_SETUP.md) | 카카오·Google 콘솔 설정(소유자 작업) |
| [COMMUNITY_SAFETY](docs/COMMUNITY_SAFETY.md) | 서버 강제 규칙, 운영 절차 |
| [SAMPLE_CATALOG](docs/SAMPLE_CATALOG.md) | 에셋 출처·라이선스 |
| [PRIVACY](docs/PRIVACY.md) | 어떤 데이터가 어디로 가는지 |
| [VISION_POC](docs/VISION_POC.md) | 의류 분할 POC 계획(미착수) |
| [TESTING](docs/TESTING.md) · [ROADMAP](docs/ROADMAP.md) | 검증 결과와 남은 일 |

## 진행 현황

### ✅ 완료된 작업
| 영역 | 내용 |
| --- | --- |
| 프로젝트 기반 | Expo SDK 58 · RN 0.88 · TS strict, `src/app` Expo Router, 5탭(홈·커뮤니티·코디추천·옷장·프로필), Jest·ESLint·expo-doctor 설정 |
| 디자인 시스템 | 쇼케이스 기반 토큰(라이트/다크), 버튼·세그먼트·칩·색상 스와치·출처 배지·소셜 로그인 버튼·텍스트필드·상태 화면 컴포넌트 |
| 온보딩 | 스플래시 + 시각적 취향 카드 4단계(다중 선택·건너뛰기·이전), 취향 프로필 저장 및 추천 반영 |
| 샘플 옷장 | 자체 제작 SVG 실루엣 23종 / 템플릿 34종 / 16색 / 프리셋 9개, 색·핏·패턴 즉시 반영, 샘플과 내 옷 분리 |
| 내 옷장 | 사진 선택·촬영 또는 직접 입력으로 등록, 상세(착용 횟수·CPW), 수정, 삭제, 카테고리 필터, 3열 그리드 |
| 추천 엔진 | 취향·상황·날씨·색 조합·최근 착용 반영, 실제 적용된 이유만 표시, 고정/제외, 내 옷만/샘플 포함 |
| 코디 빌더 | 이동·크기·회전·반전·레이어·복제·삭제, 실행 취소/다시 실행, 샘플 색 변경, JSON 저장 |
| 착용 기록 | 같은 날 같은 코디 중복 방지(DB 수준), CPW 계산, 최근 60일 목록·삭제 |
| 날씨 | 기상청 격자 변환(기기 내), 프록시 공급자(타임아웃·재시도·응답 검증), 캐시 만료, 수동 날씨·지역 선택, 체감온도 "추정", Edge Function `weather-kma` |
| 커뮤니티·로그인 | Supabase 스키마·RLS·스토리지 정책, 카카오/Google/이메일 로그인, 오늘의 베스트·최신 피드, 하트(낙관적 반영·롤백), 신고·차단, 게시 전 동의 + EXIF/GPS 제거 확인, 계정 삭제 |
| 문서 | 아키텍처, 결정 기록, 디자인 시스템, 데이터 모델, 날씨, 소셜 로그인 설정, 커뮤니티 안전, 샘플 출처, 개인정보, 테스트, 로드맵 |
| 검증 | 단위 테스트 68개 통과, 타입체크·린트 0건, expo-doctor 20/20, 웹 번들 성공, 웹 미리보기 수동 확인 |

### ⬜ 앞으로 할 작업 (우선순위 순)
1. **실기기 확인** — Expo Go로 iOS/Android에서 전체 흐름(사진 선택·카메라·SQLite·NativeTabs·SVG) 확인
2. **Supabase 연결** — 프로젝트 생성, 마이그레이션 적용, RLS 테스트 SQL 작성·실행, `weather-kma` 배포, 기상청 활용신청과 이용허락범위 확인
3. **소셜 로그인 설정** — Google·Kakao 콘솔 설정 후 실기기 로그인 왕복 검증 (`docs/SOCIAL_AUTH_SETUP.md` 체크리스트)
4. **코디 → 이미지 캡처** — 게시용 파생 이미지 생성 방법 결정(라이선스·Expo 호환 확인)
5. **옷장 보강** — 검색·정렬, 중복 병합, 샘플 → "내 옷으로 등록", 데이터 내보내기/백업/복원
6. **착용 기록 보강** — 월/주 캘린더 뷰, 착용 날짜 수정, 저장 코디 유사도 페널티 연결
7. **캔버스 제스처** — 드래그·핀치(gesture-handler v3 API 확인 후)
8. **출시 전 필수** — 개인정보처리방침·커뮤니티 가이드라인 화면, 내 게시물·차단 목록 화면, 운영 절차, 라이브러리 라이선스 점검 문서, 정식 앱 아이콘
9. **비전 POC (Phase 0)** — 단일 아이템 배경 제거 → 사람 분할 → 의류 파싱 순으로 별도 검증 (`docs/VISION_POC.md`)
10. **후순위** — 인사이트 통계, 부족 카테고리 안내, 유료화 검토

자세한 상태는 [ROADMAP](docs/ROADMAP.md)에 있습니다.

## 작업 내역 (Work Log)

### 2026-10-26 — 프로젝트 초기 구조·아키텍처·디자인 시스템
**구현**
- Expo SDK 58 프로젝트 생성(CutPick/KeepOn과 동일 의존 버전), `src/app` Expo Router, 5탭(홈·커뮤니티·코디추천·옷장·프로필).
- 디자인 시스템: 쇼케이스 기반 토큰(라이트/다크), 버튼·세그먼트·칩·색상 스와치·출처 배지·소셜 로그인 버튼·텍스트필드 등.
- 도메인: 모델, 카테고리, 16색 팔레트(+조화 규칙), `recommendation-policy.ts`(가중치·온도 구간·슬롯), CPW/멱등 키.
- 샘플 옷장: 자체 제작 SVG 실루엣 23 shape / 템플릿 34종 / 프리셋 9개, 색·핏·패턴 즉시 반영. 샘플은 착용·CPW·옷 개수에서 제외.
- 추천 엔진(순수 함수): 취향·상황·날씨·색 조화·최근 착용 반영, 실제 적용된 규칙만 이유로 표시, 고정/제외, 내 옷만/샘플 포함.
- 코디 빌더: 리듀서 기반(정규화 좌표, undo/redo 50단계, JSON 저장), 버튼 조작, 샘플 색 변경.
- SQLite 스키마 v1(트랜잭션 마이그레이션), 옷/코디/캔버스/착용 리포지토리, 앱 전용 파생 파일 저장.
- 날씨: KMA 격자 변환·지역 목록(기기 내), 프록시 공급자(타임아웃·재시도·스키마 검증), 캐시 TTL, 수동 날씨, 겨울 체감온도 "추정", Edge Function `weather-kma`.
- 커뮤니티/인증: CutPick 구현 이식(PKCE, Expo Go 리다이렉트 보정, 코드 1회 교환) + 마이그레이션(하트·신고·차단·큐레이션, CutPick 신고 삭제 버그 수정 반영, 승인 후 공개 기본), 게시 전 동의 3종 + EXIF/GPS 제거 확인.

**프롬프트 대비 개선/변경** — 위경도 대신 5km 격자 번호만 전송, 역지오코딩 미사용 / Skia 대신 리듀서+View 캔버스(교체 가능) / 쇼케이스 탭 순서 / `src/app` 라우트. 근거: `docs/DECISIONS.md`.

**실행한 검증 (2026-10-26)**
- `npx jest` 68/68 통과 · `npx tsc --noEmit` 통과 · `npx expo lint` 0건 · `npx expo-doctor` 20/20 · `npx expo export -p web` 성공
- 웹 미리보기(375×812): 온보딩→취향→홈→샘플 옷장(색·핏·패턴)→코디 빌더(색 변경·SQLite 저장) 수동 확인, 웹 콘솔 경고 1건 수정

**미검증 / 미실행**
- Android·iOS 실기기/시뮬레이터 실행 없음. 사진 선택·카메라·파일 저장·NativeTabs는 기기 미확인.
- Supabase 프로젝트·RLS·스토리지·OAuth·Edge Function 실제 실행 없음. RLS 테스트 SQL 미작성.
- 비전 모델 없음(POC 미착수). 네트워크 추적 개인정보 테스트 미실행. 성능 수치 없음.
- 라이선스: 의존 패키지는 Expo/RN 생태계 MIT 계열로 알려져 있으나 `docs/MODEL_AND_LIBRARY_LICENSES.md` 정식 점검은 미작성. Pretendard OFL 1.1 동봉. 기상청 이용허락범위 확인 필요.
- 개인정보: 사진은 기기 내 파생본만, 외부 전송은 사용자가 게시한 사본과 격자 번호뿐(코드 경로 기준, 네트워크 실측 전).

### 2026-10-26 — README 정리 및 GitHub 업로드
- README에 "진행 현황(완료/앞으로 할 작업)" 섹션 추가.
- Git 저장소 초기화 후 `https://github.com/Logic-Phantom/WearLog` `main` 브랜치에 첫 푸시.
