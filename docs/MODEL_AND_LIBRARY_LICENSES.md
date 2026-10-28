# 라이선스 점검 (라이브러리 · 글꼴 · 아이콘 · 이미지 · 데이터)

점검일 2026-10-28. 방법: `npx expo export -p android --source-maps`로 **실제 앱 번들**을 만들고 소스맵에 들어간 `node_modules` 패키지 + `package.json` 런타임 의존성을 `scripts/generate-oss-licenses.mjs`로 감사(허용 목록 밖이면 실패). 결과는 앱의 설정 → 오픈소스 라이선스 화면(`src/features/legal/oss-licenses.json`)에 그대로 표시된다. `tests/unit/legal.test.ts`가 허용 목록을 다시 검사한다.

## 1. 앱에 포함되는 JS 패키지 — 문제 없음
| 라이선스 | 개수 | 의무 |
| --- | --- | --- |
| MIT | 76 | 저작권 표시·라이선스 문구 포함 → 앱 내 화면으로 충족 |
| ISC | 2 | 동일 |
| 0BSD | 1 (tslib) | 없음 |
| MIT AND Apache-2.0 | 1 (`@expo-google-fonts/material-symbols`, expo-router 경유) | Apache-2.0 원문 포함 → 화면에 원문 포함 |

GPL·LGPL·AGPL·SSPL·CC-BY-NC 등 **카피레프트·비상업 라이선스 없음**. `expo-share-intent` 9.0.0도 MIT. 직접 수정한 `patches/expo-share-intent+9.0.0.patch`는 MIT 조건상 문제 없음(수정본 배포 허용).

참고(앱에 포함 안 됨, 빌드 도구만): `node-forge`(BSD-3 OR GPL-2.0 → BSD 선택), `caniuse-lite`(CC-BY-4.0), `argparse`(Python-2.0), BlueOak 계열 — 배포물에 들어가지 않아 의무 없음.

네이티브 코드: React Native·Hermes·Expo 모듈(MIT), expo-image가 쓰는 Glide/SDWebImage(BSD·MIT·Apache-2.0), SQLite(퍼블릭 도메인). **네이티브 서드파티 고지는 자동 감사 범위 밖** — Play/App Store 제출 전 Android `oss-licenses` 수준의 정밀 감사를 원하면 별도 진행(CutPick과 같은 수준에서 멈춤).

## 2. 글꼴·아이콘
| 항목 | 라이선스 | 상태 |
| --- | --- | --- |
| Pretendard 4종(otf, 약 6.3MB) | SIL OFL 1.1 | `assets/fonts/Pretendard-OFL.txt` 동봉, 앱 화면 고지. 폰트 단독 판매 금지 외 제약 없음 |
| Ionicons(ttf) | MIT | 앱 화면 고지 |
| Material Symbols(ttf, expo-router 포함) | Apache-2.0 | 패키지 항목으로 고지 |
| 자체 SVG 탭 아이콘·옷 실루엣 | 프로젝트 소유 | — |

## 3. 브랜드 로고(소셜 로그인 버튼) — **출시 차단 1건**
| 공급자 | 가이드 요구 | 현재 |
| --- | --- | --- |
| Google | 표준 4색 "G" 필수, 흰 배경·1px #747775 테두리·#1F1F1F 글자, "Google로 로그인/계속하기" | ✅ 2026-10-28 수정(4색 G SVG, 색·문구) |
| Kakao | 컨테이너 #FEE500, **공식 말풍선 심볼 필수(형태 변경 불가)**, 글자 #000 85%, radius 12, 문구 "카카오 로그인" | 🟡 색·radius·문구는 수정. **심볼은 Ionicons 말풍선 임시** → 공식 리소스(developers.kakao.com/tool/resource/login)로 교체 필요 |

## 4. 이미지
| 항목 | 출처 | 상태 |
| --- | --- | --- |
| 사진 샘플 37종·착장 12장·아바타 4장·스플래시 | 소유자 제공 보드(2026-10-27) | ⚠️ **원본 출처 미기재** — 생성 도구(AI 여부)·촬영자·모델 초상권 확인 필요. AI 생성이면 도구 약관(상업 이용 허용 여부)과 생성 기록 보관. 실존 인물·브랜드 로고 없음을 출시 전 재확인 |
| 앱 아이콘(행거+흰 티) | 소유자 제공 | ⚠️ 동일 — 권리 확인 |
| 옷 실루엣 벡터 34종 | 자체 제작 | ✅ |

## 5. 데이터
| 항목 | 조건 | 상태 |
| --- | --- | --- |
| 기상청 단기예보 조회서비스(공공데이터포털 15084084) | 공공누리 **제1유형(출처표시)**, 무료, 개발계정 일 10,000건(운영계정은 활용사례 등록 후 증량) | ✅ UI "출처 기상청" + 앱 출처 화면. 상업적 이용 문구는 페이지에 명시 없음 — 제1유형은 상업 이용 허용 유형이나 활용신청 시 약관 재확인 |
| 쇼핑몰 상품 메타데이터·사진 | 사용자가 연 페이지 1건을 기기에서 직접 요청, 개인 기록용 | ⚠️ 개인적 이용은 저작권법상 사적 복제 범위로 보이나, **커뮤니티 공개는 금지**(약관·가이드라인에 명시). 쇼핑몰 약관상 자동 수집 금지 조항과의 관계는 법률 검토 항목 |

## 6. 재생성 방법
```bash
npx expo export -p android --source-maps --output-dir <tmp>
node scripts/generate-oss-licenses.mjs <tmp>/_expo/static/js/android/<entry>.map
```
의존성을 바꾸면 다시 실행하고 커밋한다.
