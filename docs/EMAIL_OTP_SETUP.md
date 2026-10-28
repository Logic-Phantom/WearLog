# 이메일 로그인(인증 코드) 설정 — 커스텀 SMTP + 템플릿

앱의 "이메일로 시작하기"는 **메일 속 인증 코드**를 입력받는다(`verifyEmailCode`, 6~10자리 허용). Supabase 기본 메일은 링크만 들어 있고, 2026-10 기준 **템플릿은 커스텀 SMTP를 연결해야 수정**할 수 있다(대시보드 확인 2026-10-28: "Set up custom SMTP to edit templates"). 기본 메일 발송은 시간당 몇 통으로 제한돼 출시용으로도 부족하다.

## 1. SMTP 연결 (소유자 — 비밀번호가 필요해 직접 입력)
Supabase → Authentication → Emails → **SMTP Settings** → Enable custom SMTP

| 항목 | 테스트용(Gmail) | 운영 권장(자체 도메인) |
| --- | --- | --- |
| Host / Port | `smtp.gmail.com` / `465` | Resend `smtp.resend.com` / `465` 등 |
| Username | Gmail 주소 | 공급자 안내 값 |
| Password | Google 계정 → 보안 → 2단계 인증 → **앱 비밀번호**(16자리) | 공급자 API 키 |
| Sender email / name | Gmail 주소 / `WearLog` | `no-reply@<도메인>` / `WearLog` |

> Gmail은 하루 발송 한도가 있고 스팸 분류될 수 있어 **테스트 전용**. 운영은 도메인 인증(SPF·DKIM)된 발송 서비스.
> SMTP를 바꾸면 `src/features/legal/policy-texts.ts`의 `MAIL_SENDER`(처리방침 국외 이전 항목)도 고치고 `scripts/build-legal-site.mjs`로 페이지를 다시 만든다. 예: Gmail → `{ company: 'Google LLC (Gmail SMTP)', country: '미국' }`.

## 2. 템플릿 (SMTP 연결 후 붙여 넣기)
새 사용자는 "Confirm sign up", 기존 사용자는 "Magic link or OTP" 메일을 받으므로 **둘 다** 코드(`{{ .Token }}`)를 넣는다.

### Magic link or OTP
- 제목: `[WearLog] 로그인 인증 코드`
```html
<h2>WearLog 로그인</h2>
<p>아래 인증 코드를 앱에 입력해 주세요.</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px">{{ .Token }}</p>
<p>코드는 1시간 동안만 쓸 수 있어요. 요청하지 않았다면 이 메일은 무시해 주세요.</p>
```

### Confirm sign up
- 제목: `[WearLog] 가입 인증 코드`
```html
<h2>WearLog에 오신 걸 환영해요</h2>
<p>아래 인증 코드를 앱에 입력하면 가입이 완료돼요.</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px">{{ .Token }}</p>
<p>요청하지 않았다면 이 메일은 무시해 주세요.</p>
```

## 3. 확인
- Authentication → Sign In / Providers → Email: "Email OTP length"(기본 8자리, 앱은 6~10 허용), 만료(기본 3600초).
- 앱에서 이메일 입력 → 코드 메일 수신 → 입력 → 핸들 만들기 화면까지 왕복(실기기 미검증).
