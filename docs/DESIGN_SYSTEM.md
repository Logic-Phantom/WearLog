# WearLog 디자인 시스템

출처: 사용자 제공 쇼케이스(스플래시·로그인·홈·코디 추천·옷장·옷 등록·코디 빌더·착용 기록·커뮤니티·날씨·프로필 12화면). 화면을 그대로 복제하지 않고 구조·톤만 토큰화했습니다. 코드: `src/design-system/`.

## 1. 방향 — Photo-first wardrobe editorial
- 옷이 주인공. UI 크롬은 무채색, 강조색은 **잉크 블랙 하나**.
- 큰 라운드 카드, 얇은 그림자, 넉넉한 여백. 옷 이미지는 항상 무채색 배경(`photoBackdrop`) 위.
- 하늘색 그라데이션은 날씨 카드 전용 — 다른 곳에 쓰지 않음.

## 2. 토큰 (`tokens.ts`)
| 그룹 | 라이트 | 다크 | 용도 |
| --- | --- | --- | --- |
| background | `#F6F5F2` | `#111111` | 화면 배경 |
| surface | `#FFFFFF` | `#1B1B1A` | 카드 |
| accent | `#1A1A1A` | `#F3F2EF` | 주 CTA(시작하기·코디 저장하기·등록하기), 선택 칩 |
| photoBackdrop | `#F1F0EC` | `#2A2A28` | 옷 사진/벡터 배경(무채색 고정) |
| weatherFrom/To | `#EAF3FB → #D9E8F6` | `#1B2834 → #16222D` | 날씨 카드 |
| heart | `#E5484D` | `#FF6369` | 하트만 |
| badgeSample / badgeOwned | 회색 / 잉크 | — | 출처 배지(항상 텍스트 동반) |
| kakao / google | `#FEE500` / 흰색+`#DADCE0` | — | 브랜드 로그인 버튼 |

- 간격: 4·8·12·16·20·24·32. 반경: photo 12, tile 16, card 20, sheet 24, 버튼은 pill.
- 타이포(Pretendard): brand 34, screenTitle 24, title 20, sectionTitle 17, body 15, secondary 13, label 13, caption 11, temperature 44(tabular).
- 터치 목표 ≥ 44pt. 옷장 그리드 3열.

## 3. 컴포넌트
| 컴포넌트 | 쇼케이스 대응 |
| --- | --- |
| `PrimaryButton` / `SecondaryButton` / `GhostButton` / `DangerButton` / `IconButton` | 시작하기·로그인·코디 저장하기·편집 |
| `SocialSignInButton` | 카카오로 시작하기 / Google로 시작하기 (미설정 공급자는 비활성 + 사유) |
| `Wordmark` | WearLog / Your Style, Your Log |
| `SegmentedControl` | 날씨 맞춤·취향 맞춤, 내 옷장·샘플 옷장, 오늘의 베스트·최신순 |
| `FilterChip` / `ChipRow` / `MultiChips` | 전체·상의·하의·아우터…, 계절·스타일 태그 |
| `ColorSwatchRow` | 색상 선택(링 + 체크 + 색상명, 밝은 색은 테두리) |
| `SourceBadge` | 샘플 / 내 옷 |
| `Tag` | #데일리룩 #코트 |
| `Card`, `SectionHeader`, `ListRow`, `Divider` | 홈 섹션, 프로필 메뉴 |
| `InlineMessage`, `EmptyState`, `ErrorState`, `ProgressPanel` | 상태 화면(§9.5) |
| `BottomBar`, `BottomSheet`, `ScreenScroll` | 하단 고정 CTA, 지역 선택 시트 |
| `TextField` | 옷 등록 폼(라벨 항상 표시) |
| 기능 컴포넌트: `WeatherCard`, `GarmentVector`, `ItemVisual`, `OutfitBoard`, `GarmentEditor` | 날씨 카드, 샘플 실루엣, 코디 미리보기, 옷 등록 |

## 4. 규칙
1. 화면에서 HEX·간격 숫자 직접 사용 금지 → 토큰. 옷 색은 `domain/palette.ts`에서만.
2. 선택 상태는 색만으로 표현하지 않음(체크·테두리·접근성 상태 동반).
3. 샘플이 나오는 모든 타일·카드에 `SourceBadge`.
4. 아이콘 전용 버튼은 반드시 `label`(스크린리더).
5. Reduce Motion 존중(`useReducedMotion`), 폰트 배율 2배까지 레이아웃 유지.
6. 다크 모드에서도 옷 배경은 무채색.

## 4-1. 2026-10-27 쇼케이스 일치 작업
- 탭 바: JS Tabs + 자체 SVG 선 아이콘(`TabIcon`), 비선택 `tabInactive`, 선택 시 채움 (D-014).
- 새 컴포넌트(`components/Showcase.tsx`): `UnderlineTabs`(내 옷장|샘플 옷장, 추천|최신순|팔로잉), `PillSegment`(light = 날씨 맞춤|취향 맞춤, ink = 전체|이번달|올해), `HeartPill`, `Avatar`, `ValueRow`(카테고리 › 상의), `SectionTitle`(더보기 ›).
- 칩: 비선택 = 옅은 회색 채움(테두리 없음), 선택 = 잉크 채움 + 굵은 글씨(체크 아이콘 제거).
- 헤더: 왼쪽 정렬 제목 + 얇은 ‹ 아이콘.
- 날씨 카드: 위치 줄은 카드 밖, 큰 온도 + 오른쪽 구름 아이콘(`weatherIcon`) + 비/최저·최고.
- 스플래시는 사진 위 고정 밝은 팔레트(`splashColors`).

## 5. 쇼케이스와 다른 점 (의도)
- 2026-10-27부터 사진 샘플 사용(D-015). 아래 항목 중 스플래시·커뮤니티 상세는 쇼케이스 배치를 따르되 D-016의 정책 차이만 남음.
- 스플래시의 실사 행거 사진 → 자체 벡터 구성(외부 사진 라이선스 회피).
- 커뮤니티 상세의 **댓글 입력창은 제외**(프롬프트 §3.10: 하트만). 공유 버튼은 차후.
- 커뮤니티 "팔로잉" 탭 제외(팔로워 랭킹/소셜 그래프는 MVP 범위 밖).
- 코디 추천 상단 "날씨 맞춤 | 취향 맞춤" 대신 "내 옷만 | 샘플 포함"을 1차 세그먼트로 사용 — 프롬프트의 소유/샘플 구분 요구가 더 중요. 날씨·취향은 하나의 점수에 함께 반영되고 이유로 표시.
