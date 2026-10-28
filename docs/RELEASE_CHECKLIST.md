# 출시 체크리스트 (라이선스 · 정책 · 저작권 · 연동)

작성 2026-10-28. CutPick `docs/RELEASE_CHECKLIST.md`를 기준으로 WearLog에 맞게 다시 점검. **[코드]** = 저장소에 반영됨, **[소유자]** = 계정·결제·법적 판단이 필요해 소유자가 직접. 끝나면 `- [x]`.

## A. 코드에 반영된 것
- [x] [코드] 개인정보 처리방침·이용약관·커뮤니티 가이드라인·계정 삭제 안내(`src/features/legal/policy-texts.ts`) — 실제 데이터 흐름 기준(격자 번호만 전송, 링크 가져오기는 기기 직접, 로그인해도 옷장 미업로드, Supabase 위탁, 만 14세, 보호책임자, 권익 구제). **초안**.
- [x] [코드] 앱 내 오픈소스 라이선스 화면(설정) — 번들 80개 패키지 + Pretendard·Ionicons, `scripts/generate-oss-licenses.mjs` 감사 통과(docs/MODEL_AND_LIBRARY_LICENSES.md).
- [x] [코드] 이미지·데이터 출처 화면(샘플 사진 출처, 기상청 공공누리 제1유형).
- [x] [코드] 커뮤니티 로그인 전 **만 14세 이상 + 약관·처리방침 동의** 체크(없으면 카카오·Google·이메일 버튼 비활성).
- [x] [코드] Google 로그인 버튼을 브랜딩 가이드대로(4색 G, #747775 테두리, "Google로 로그인").
- [x] [코드] 카카오 버튼 색·radius 12·문구 "카카오 로그인".
- [x] [코드] 스토어용 정책 웹페이지 생성기 `scripts/build-legal-site.mjs` → `docs/legal/*.html`(처리방침·약관·가이드라인·계정 삭제). 운영자 이름·이메일이 없으면 실행이 실패하도록 함(가짜 연락처 방지).
- [x] [코드] 기존 보안 설계: 서비스 키·client secret은 앱/`EXPO_PUBLIC_*`에 없음, 백그라운드 위치·광고 ID·미디어 전체 권한 차단(`app.json` blockedPermissions).

## B. 출시 차단 항목 (반드시 해결)
- [ ] **[소유자] 카카오 공식 심볼** — 카카오 디자인 가이드: "심볼 없이 카카오 로그인 버튼을 구성할 수 없음", 형태·비율·색 변경 불가. 공식 리소스(https://developers.kakao.com/tool/resource/login)에서 심볼 SVG/PNG를 받아 `assets/brand/`에 넣고 `Brand.tsx`의 Ionicons 말풍선을 교체(다운로드 승인 필요).
- [ ] **[소유자] 샘플 사진·앱 아이콘 출처·권리** — 소유자 제공 보드의 원본(직접 촬영/AI 생성 도구/구매 스톡)과 인물 초상권. AI 생성이면 도구명·날짜·약관(상업 이용) 기록 → `docs/SAMPLE_CATALOG.md`와 앱 출처 화면에 기재.
- [ ] **[소유자] 운영자·연락처** — `.env.local`에 `EXPO_PUBLIC_SUPPORT_EMAIL`, `EXPO_PUBLIC_OPERATOR_NAME`(개인정보 보호책임자). 없으면 처리방침이 "미설정"으로 표시됨.
- [ ] **[소유자] iOS 로그인 정책(App Store 4.8)** — 카카오·Google 로그인을 제공하면 이메일 비공개가 가능한 동등한 로그인(사실상 Sign in with Apple)도 필요. 선택: ① Sign in with Apple 추가(Supabase Apple 공급자 + Apple 키) ② iOS에서는 소셜 버튼 숨기고 이메일만. CutPick과 같은 미결 사항.
- [ ] **[소유자] 위치정보법 검토** — "내 주변 날씨"는 기기 위치를 읽어 5km 격자로 바꾼 뒤 서버에 격자만 보냄(좌표·사용자 연결 저장 없음). 개인위치정보를 이용한 서비스로 볼 여지가 있어 **위치기반서비스사업 신고 필요 여부**를 방송통신위원회 안내/전문가로 확인. 불확실하면 출시 버전에서 지역 직접 선택만 남기는 대안 가능.
- [ ] **[소유자] 샘플 게시물 표시 방식** — 서버 미설정 시 샘플 게시물이 가짜 핸들·하트 수(2.4k 등)·댓글 수·"1시간 전"과 함께 보임("샘플 게시물이에요" 안내는 있음). 스토어 심사·표시광고 관점에서 실제 활동처럼 보일 위험 → 출시 빌드에서는 하트·댓글 수·시간 표시를 빼거나 샘플 피드를 서버 미설정 빌드에서만 노출 권장(CutPick은 작성자·하트 수 없이 표시).
- [ ] **[소유자] 처리방침·약관 법률 검토** — 개인정보보호위원회 "개인정보 처리방침 작성지침" 기준 확인. Supabase 실제 리전에 맞게 `SERVER_LOCATION` 수정(현재 서울 가정).

## C. 연동 (Supabase · 카카오 · Google) — CutPick과 같은 구조
코드(`supabase-community-repository.ts`, `social-auth.ts`, `auth/callback.tsx`, 마이그레이션, `weather-kma` Edge Function)는 있고 **실서버·콘솔 설정은 미진행**. 절차는 `docs/SOCIAL_AUTH_SETUP.md`.
- [ ] Supabase 새 프로젝트 `wearlog`(Free, Seoul) — DB 비밀번호는 소유자가 생성·보관
- [ ] SQL Editor에서 `supabase/migrations/20261026000000_community_init.sql` 실행
- [ ] RLS 테스트 SQL 작성(CutPick `supabase/tests/rls_test.sql` 이식) → 실행·기록
- [ ] Auth → URL Configuration: Redirect URLs `wearlog://**`, `exp://**`
- [ ] Email 공급자(OTP 코드 템플릿에 `{{ .Token }}` — 커스텀 SMTP 필요)
- [ ] 카카오 앱 생성 → 카카오 로그인 ON, Redirect URI `https://<ref>.supabase.co/auth/v1/callback`, 동의항목(닉네임 필수·프로필 사진/이메일 선택), 개인정보 국외이전 정보 등록 → REST API 키·Client Secret을 Supabase Kakao 공급자에 **소유자가 입력**
- [ ] Google Cloud 프로젝트 `wearlog` → OAuth 동의 화면(외부) → 웹 클라이언트, 리디렉션 URI = Supabase 콜백 → Client ID·Secret을 Supabase Google 공급자에 **소유자가 입력** → 출시 전 "앱 게시"(프로덕션)
- [ ] `.env.local`에 URL·publishable key(공개 값)
- [ ] `supabase secrets set KMA_SERVICE_KEY=...`(소유자) + `weather-kma` 배포, 공공데이터포털 활용신청(개발계정 일 10,000건)
- [ ] 실기기에서 카카오·Google·이메일 로그인 왕복, 두 계정으로 게시→하트→신고→차단→삭제→계정 삭제

## D. 스토어
- [ ] `node scripts/build-legal-site.mjs` → GitHub Pages(`main` `/docs`) → 처리방침 URL `…/WearLog/legal/privacy.html`, Play 계정 삭제 URL `…/legal/account-deletion.html`
- [ ] Play 데이터 보안 양식: 위치(대략, 선택·전송은 격자만·저장 안 함), 사진(기기 내 처리, 게시 시만 업로드), 이메일·사용자 ID(커뮤니티 선택), 앱 활동(하트·신고)
- [ ] 콘텐츠 등급: 사용자 생성 콘텐츠·사용자 간 공유 "예", 타겟 연령 만 14세 이상
- [ ] 개인 개발자 계정: 비공개 테스트 12명 × 14일
- [ ] 상표: KIPRIS에서 "WearLog/웨어로그" 9류·42류·25류 검색(미실행)
- [ ] 운영 인력: 승인제(`require_review=true`) 유지 시 매일 검토 담당자 지정. 없으면 커뮤니티 없이 출시
- [ ] Supabase Free 1주 비활성 일시중지 → Pro 전환 여부
