# 카카오·Google 로그인 설정 (소유자 작업)

로그인은 **커뮤니티 전용 선택 기능**입니다. 아래가 설정되지 않아도 앱은 로컬로 전부 동작하고, 로그인 화면은 미설정 버튼을 비활성 처리합니다. 이 문서의 콘솔 작업은 아직 수행·검증되지 않았습니다.

## 0. 세 종류의 URL을 구분하세요
| 이름 | 예시 형태 | 어디에 등록 |
| --- | --- | --- |
| 앱 딥링크 (redirectTo) | `wearlog://auth/callback` / Expo Go: `exp://<host:port>/--/auth/callback` | Supabase → Authentication → URL Configuration → Redirect URLs |
| Supabase 콜백 | `https://<project-ref>.supabase.co/auth/v1/callback` | Google OAuth Client의 승인된 리디렉션 URI, Kakao 로그인 Redirect URI |
| 앱 scheme | `wearlog` | `app.json` → `expo.scheme` (설정됨) |

예시 값을 그대로 쓰지 말고 실제 project ref를 복사하세요.

## 1. Supabase
1. 프로젝트 생성 → `supabase/migrations/20261026000000_community_init.sql` 적용(`supabase db push` 또는 SQL Editor).
2. `.env.local`에 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`만 입력. **service_role / DB 비밀번호 / OAuth client secret은 앱에 넣지 않음.**
3. Redirect URLs에 `wearlog://auth/callback`과 개발용 `exp://**` 패턴 등록.

## 2. Google
1. Google Cloud Console → OAuth 동의 화면(테스트 모드로 시작, 공개 전 검증 요건 확인).
2. 사용자 인증 정보 → OAuth 클라이언트 ID → **웹 애플리케이션** → 승인된 리디렉션 URI = Supabase 콜백.
3. Supabase → Auth → Providers → Google에 Client ID/Secret 입력(Secret은 Supabase에만).

## 3. Kakao
1. Kakao Developers → 애플리케이션 추가 → 앱 아이콘/플랫폼(Web 도메인 = Supabase 도메인).
2. 카카오 로그인 활성화 → Redirect URI = Supabase 콜백.
3. 보안 → Client Secret 생성·활성화.
4. 동의항목: 닉네임/프로필은 선택. **카카오계정(이메일)은 비즈 앱이 아니면 불가할 수 있음** → Supabase Auth 설정에서 "Allow users without an email" 검토. WearLog는 이메일 없이도 핸들로 프로필 생성이 가능하게 설계됨.
5. Supabase → Providers → Kakao에 REST API 키 / Client Secret 입력.

## 4. 앱 동작
- `signInWithOAuth({ skipBrowserRedirect: true, redirectTo })` → `WebBrowser.openAuthSessionAsync` → PKCE `code` → `exchangeCodeForSession`(코드당 1회).
- Android에서 리다이렉트가 앱 라우터로 바로 들어오면 `src/app/auth/callback.tsx`가 처리.
- 취소 → null 반환, 화면 유지. 오류 → 메시지 + 로컬 기능 그대로.
- Google·Kakao가 같은 이메일을 줘도 **자동 병합하지 않음**(Supabase 기본 동작 확인 필요 — 체크리스트).
- 로그인해도 로컬 옷장·사진·취향은 업로드되지 않음.

## 검증 체크리스트 (미완료)
- [ ] iOS/Android 개발 빌드에서 Google 로그인 왕복
- [ ] iOS/Android 개발 빌드에서 Kakao 로그인 왕복(이메일 미동의 계정 포함)
- [ ] Expo Go 리다이렉트
- [ ] 로그인 취소 / 공급자 비활성 / 세션 만료 후 복원
- [ ] 동일 이메일 두 공급자 → 계정 분리 확인
- [ ] 계정 삭제 → 스토리지·행 삭제 확인

## CutPick에서 실제로 겪은 것 (2026-10-23 CutPick 연동 기록 기준, WearLog에도 동일)
- **이메일 OTP**: Supabase 기본 메일은 링크만 들어 있음. 템플릿 수정은 커스텀 SMTP 연결 후에만 가능 → SMTP 연결 → "Magic link or OTP"와 "Confirm sign up" **두 템플릿 모두**에 `{{ .Token }}`. 새 프로젝트 기본 코드 길이 8자리(앱은 6~10자리 허용). SMTP를 붙이면 `policy-texts.ts`의 `MAIL_SENDER`도 바꾼다.
- **카카오 KOE205**: 요청한 동의항목이 콘솔에서 설정되지 않았을 때. 닉네임은 필수, 프로필 사진·카카오계정(이메일)은 선택으로 설정. 이메일 동의항목은 비즈 앱(개인 개발자 전환 가능)에서만 열림. 이메일 없이 쓰려면 Supabase Kakao "Allow users without email" 켜기. 개인정보 국외이전 정보(Supabase, Inc.)도 콘솔에 등록.
- **Google**: 동의 화면이 "테스트 중"이면 테스트 사용자만 로그인됨 → 출시 전 "앱 게시"(프로덕션). 기본 범위(email·profile)만 쓰고 로고를 올리지 않으면 인증 심사 없이 게시 가능했음.
- Redirect URLs는 `wearlog://**`, `exp://**`(CutPick은 `cutpick://**`).
- **비밀 값 입력(Kakao Client Secret, Google Client Secret, KMA 서비스 키, DB 비밀번호)은 소유자가 직접** 입력한다. 앱·저장소·채팅에 남기지 않는다.
- WearLog는 CutPick과 **별도 Supabase 프로젝트**를 쓴다(스키마·버킷·정책이 다르고, 한쪽 장애·한도가 다른 앱에 번지지 않게). Free 플랜은 조직당 활성 프로젝트 2개까지라 CutPick 1개 + WearLog 1개로 맞음.
