/**
 * Privacy policy, terms, community guidelines and the account-deletion page as plain data. No imports
 * on purpose: the same texts render in the app (documents.ts) and are published as web pages for the
 * store listings (scripts/build-legal-site.mjs, run by Node's type stripping). Written from what the
 * code actually does (docs/PRIVACY.md). DRAFTS — review before a public release (docs/RELEASE_CHECKLIST.md).
 */
export interface LegalDoc {
  title: string;
  /** Shown under the title, e.g. "시행일 2026-10-28 · 초안". */
  updatedAt: string;
  sections: { heading: string; body: string }[];
}

export interface PolicyContact {
  /** EXPO_PUBLIC_SUPPORT_EMAIL */
  email: string;
  /** EXPO_PUBLIC_OPERATOR_NAME — person or business responsible for personal data. */
  operator: string;
}

/** Minimum age for a community account (Korean PIPA: under 14 needs guardian consent, which we do not collect). */
export const COMMUNITY_MIN_AGE = 14;

/**
 * Where the Supabase project (community + weather proxy) runs. MUST match the real project region —
 * change together with the project and regenerate docs/legal.
 */
export const SERVER_LOCATION = { country: '대한민국', region: '서울(AWS ap-northeast-2)' } as const;

/** Who sends the sign-in code e-mails. Change when a custom SMTP (Gmail, Resend…) is connected. */
export const MAIL_SENDER = { company: 'Supabase, Inc. (기본 메일 발송)', country: '미국' } as const;

export const POLICY_UPDATED_AT = '2026-10-28';

export function buildPolicyDocs({ email, operator }: PolicyContact): Record<'privacy' | 'terms' | 'guidelines', LegalDoc> {
  const contact = email ? `문의: ${email}` : '문의 연락처가 이 빌드에 설정되지 않았어요(EXPO_PUBLIC_SUPPORT_EMAIL). 공개 출시 전 반드시 설정해야 해요.';
  const officer = `${operator || '운영자(이름 미설정 — EXPO_PUBLIC_OPERATOR_NAME)'} · ${email || '연락처 미설정'}`;
  return {
    privacy: {
      title: '개인정보 처리방침',
      updatedAt: POLICY_UPDATED_AT,
      sections: [
        {
          heading: '요약',
          body: 'WearLog의 옷장·코디·착용 기록·취향은 모두 이 기기 안에만 저장돼요. 날씨를 불러올 때는 약 5km 단위 격자 번호만, 커뮤니티에 로그인하거나 코디를 직접 공개할 때만 아래 정보가 서버로 가요. 로그인하지 않으면 계정 정보는 어디에도 저장되지 않아요.',
        },
        {
          heading: '1. 기기 안에서만 처리되는 정보',
          body: '옷 사진(앱이 만든 축소·재인코딩 사본), 옷 이름·카테고리·색·브랜드·사이즈·가격·구매일·메모, 코디와 캔버스 배치, 착용 기록과 착용당 비용(CPW), 취향 설정, 직접 고른 지역은 이 기기의 앱 저장소에만 있어요. 사진첩의 원본 사진은 읽기만 하고 바꾸거나 지우지 않으며, 사진의 촬영 위치(GPS) 정보는 저장하지 않아요. 다른 앱에서 "공유 → WearLog"로 받은 사진·링크도 등록 화면에만 쓰이고 서버로 보내지 않아요.',
        },
        {
          heading: '2. 위치와 날씨',
          body: '"내 주변 날씨"를 누를 때만 현재 위치를 한 번 읽어요(백그라운드 위치는 요청하지 않아요). 위치는 기기 안에서 기상청 격자 번호(약 5km 단위)로 바꾼 뒤 바로 버리고, 날씨 서버에는 격자 번호만 보내요. 날씨 서버는 이 요청을 기상청 단기예보 서비스에 전달하며, 위치·격자 번호를 사용자와 연결해 저장하지 않아요. 지역을 직접 고르면 위치를 읽지 않아요.',
        },
        {
          heading: '3. 쇼핑몰 링크로 가져오기',
          body: '상품 링크를 붙여 넣거나 공유하면 기기가 그 쇼핑몰 페이지와 상품 사진을 직접 요청해 이름·브랜드·가격을 읽어요. WearLog 서버를 거치지 않으며, 이때 쇼핑몰은 일반 웹 접속과 같은 정보(IP 주소 등)를 받아요. 가져온 사진은 개인 옷장 기록용으로 기기에만 저장돼요.',
        },
        {
          heading: '4. 커뮤니티 이용 시 처리하는 개인정보',
          body: '· 이메일 로그인: 이메일 주소\n· 카카오 로그인: 카카오 회원 식별자, 닉네임, 프로필 사진(선택), 카카오계정 이메일(선택)\n· Google 로그인: Google 계정 식별자, 이메일 주소, 이름·프로필 사진 주소\n· 공통: 공개 핸들, 사용자가 공개를 확정한 사진의 공유용 사본(메타데이터 제거·축소본)과 미리보기, 스타일 태그·상황, 원하면 대략적인 날씨 문구(지역 제외), 하트, 신고, 차단 기록\n· 자동 생성: 로그인 보안을 위한 접속 기록(IP 주소, 접속 시각)\n소셜 로그인으로 받은 이름·프로필 사진은 인증 서버에만 저장되고 앱에 공개되지 않아요. 게시물에는 @핸들만 표시돼요. 옷장·착용 기록·취향은 로그인해도 업로드되지 않아요.',
        },
        { heading: '5. 이용 목적', body: '회원 식별과 로그인, 코디 게시·하트·신고·차단 기능 제공, 운영 정책 위반 대응과 분쟁 처리, 서비스 보안 유지, 날씨 기반 코디 추천.' },
        {
          heading: '6. 보유 및 파기',
          body: '계정을 삭제하면 게시물·공유 이미지·하트·차단 기록·프로필·로그인 계정을 지체 없이 삭제해요. 내가 낸 신고는 운영 기록으로 남기되 작성자 정보는 지워요. 접속 기록은 서버 제공자의 로그 보관 기간이 지나면 자동 삭제돼요. 기기 안의 데이터는 설정 > 기기 데이터 전체 삭제로 언제든 지울 수 있고, 앱을 삭제해도 지워져요.',
        },
        {
          heading: '7. 처리 위탁 및 국외 이전',
          body: `· 수탁자: Supabase, Inc.(미국) — 데이터베이스·인증·이미지 저장·날씨 중계 서버 운영. https://supabase.com/privacy\n· 저장 위치: ${SERVER_LOCATION.country} ${SERVER_LOCATION.region}\n· 이전 일시·방법: 로그인·게시·하트·신고 등 커뮤니티 기능이나 날씨 불러오기를 쓸 때마다 암호화된 네트워크로 전송\n· 이전 항목: 4번의 커뮤니티 항목, 날씨 요청의 격자 번호\n· 보유 기간: 계정 삭제 시까지(날씨 요청은 저장하지 않음)\n· 인증 메일 발송: ${MAIL_SENDER.company}, ${MAIL_SENDER.country} — 이메일 로그인 시 이메일 주소와 인증 코드\n거부 방법: 커뮤니티에 로그인하지 않고 날씨를 직접 고르면 아무 정보도 전송되지 않으며, 옷장·코디·기록은 그대로 쓸 수 있어요.`,
        },
        {
          heading: `8. 만 ${COMMUNITY_MIN_AGE}세 미만 아동`,
          body: `커뮤니티 계정은 만 ${COMMUNITY_MIN_AGE}세 이상만 만들 수 있어요. 만 ${COMMUNITY_MIN_AGE}세 미만은 로그인할 수 없고, 계정이 필요 없는 기기 안 기능만 쓸 수 있어요. 만 ${COMMUNITY_MIN_AGE}세 미만의 계정을 알게 되면 삭제해요.`,
        },
        {
          heading: '9. 이용자의 권리',
          body: '언제든 개인정보 열람·정정·삭제·처리 정지를 요구할 수 있어요. 앱에서 게시물 삭제(설정 > 내 게시물), 계정 삭제(커뮤니티 계정 > 계정 삭제), 기기 데이터 삭제(설정)를 바로 할 수 있고, 그 밖의 요청은 아래 연락처로 보내 주세요.',
        },
        {
          heading: '10. 안전성 확보 조치',
          body: '모든 서버 통신은 HTTPS로 암호화해요. 데이터베이스는 행 단위 접근 제어로 본인 데이터만 수정할 수 있게 했어요. 비밀번호를 쓰지 않는 로그인 방식이라 비밀번호를 저장하지 않아요. 공개되는 사진은 원본이 아니라 촬영 위치 등 메타데이터를 제거하고 다시 만든 사본이에요. 기상청 서비스 키 등 비밀 값은 서버에만 두고 앱에 넣지 않아요.',
        },
        { heading: '11. 개인정보 보호책임자', body: officer },
        { heading: '12. 권익 침해 구제', body: '개인정보 침해 상담·신고: 개인정보침해신고센터(국번 없이 118, privacy.kisa.or.kr), 개인정보분쟁조정위원회(1833-6972, www.kopico.go.kr)' },
        { heading: '13. 변경', body: '내용이 바뀌면 앱과 이 페이지에 시행일과 함께 알려요.' },
      ],
    },
    terms: {
      title: '이용약관',
      updatedAt: POLICY_UPDATED_AT,
      sections: [
        {
          heading: '서비스',
          body: 'WearLog는 내 옷을 기록하고 코디를 만들며, 취향·날씨 규칙으로 코디를 추천하고, 선택적으로 코디 사진을 커뮤니티에 공개해 하트로 공감받는 서비스예요. 추천과 날씨 정보는 참고용이며 정확성을 보장하지 않아요. 날씨 자료 출처: 기상청.',
        },
        { heading: '이용 연령', body: `옷장·코디·추천은 누구나 계정 없이 쓸 수 있어요. 커뮤니티 계정은 만 ${COMMUNITY_MIN_AGE}세 이상만 만들 수 있어요.` },
        { heading: '샘플 콘텐츠', body: '앱에 들어 있는 샘플 옷·샘플 코디·샘플 게시물은 체험용 예시예요. 실제 사용자의 게시물이나 판매 상품이 아니며, 착용 기록·통계에 포함되지 않아요.' },
        {
          heading: '사용자 콘텐츠',
          body: '게시한 사진의 권리는 사용자에게 있어요. 사용자는 사진을 올릴 권리와 사진 속 인물의 동의를 확보해야 해요. 쇼핑몰에서 가져온 상품 사진 등 다른 사람의 저작물을 커뮤니티에 올리면 안 돼요. WearLog는 서비스 제공(표시·저장·축소본 생성)에 필요한 범위에서만 이용해요.',
        },
        { heading: '금지 행위', body: '노출·성적 콘텐츠, 혐오·괴롭힘, 타인 개인정보 노출, 사칭, 저작권 침해, 광고·스팸을 금지해요. 위반 게시물은 숨김·삭제되고 반복 위반 계정은 게시가 제한되거나 삭제될 수 있어요.' },
        { heading: '계정 삭제', body: '커뮤니티 계정 화면에서 언제든 계정과 게시물을 삭제할 수 있어요.' },
        {
          heading: '서비스 변경과 책임',
          body: '무료로 제공되는 서비스로, 커뮤니티·날씨 기능은 운영 사정에 따라 바뀌거나 중단될 수 있어요. 기기 안의 사진 원본은 앱이 수정하거나 삭제하지 않아요. 관련 법령이 허용하는 범위에서 고의·중과실이 없는 손해에 대해 책임을 지지 않아요.',
        },
        { heading: '문의', body: contact },
      ],
    },
    guidelines: {
      title: '커뮤니티 가이드라인',
      updatedAt: POLICY_UPDATED_AT,
      sections: [
        {
          heading: '오늘의 베스트 착장은',
          body: '서로의 코디에서 아이디어를 얻는 공간이에요. 하트만 있고 댓글·DM·싫어요·순위표·외모 점수는 없어요. 베스트 착장은 하트 수가 아니라 운영자가 날씨와 스타일 다양성을 보고 골라요.',
        },
        {
          heading: '올리지 말아 주세요',
          body: '· 노출·성적 콘텐츠, 미성년자를 위험하게 하는 콘텐츠\n· 혐오·괴롭힘\n· 다른 사람의 얼굴·개인정보를 동의 없이 담은 사진, 집·학교 등 위치를 알 수 있는 정보\n· 쇼핑몰 상품 사진 등 다른 사람의 저작물\n· 광고·홍보·외부 판매 유도',
        },
        { heading: '게시 규칙', body: '게시물은 운영자 확인 후 공개될 수 있어요. 하루에 올릴 수 있는 게시물 수에는 제한이 있어요. 내 게시물은 언제든 직접 삭제할 수 있어요.' },
        {
          heading: '신고와 차단',
          body: '게시물 상세에서 신고하거나 계정을 차단할 수 있어요. 서로 다른 사용자의 신고가 여러 번 쌓이면 확인 전까지 자동으로 숨겨져요. 저작권 침해 신고도 같은 메뉴에서 접수돼요. 차단하면 서로의 게시물이 보이지 않고, 차단 목록에서 언제든 해제할 수 있어요.',
        },
        { heading: '문의', body: contact },
      ],
    },
  };
}

/** Google Play "delete account" URL page: how to delete without reinstalling the app. */
export function buildAccountDeletionDoc({ email }: PolicyContact): LegalDoc {
  return {
    title: 'WearLog 계정 및 데이터 삭제',
    updatedAt: POLICY_UPDATED_AT,
    sections: [
      { heading: '앱에서 삭제하기', body: 'WearLog 앱 → 프로필 → 설정 → 커뮤니티 계정 → 커뮤니티 계정 삭제. 바로 처리돼요.' },
      {
        heading: '앱 없이 요청하기',
        body: `${email || '(지원 이메일 미설정)'}로 커뮤니티 핸들과 로그인에 쓴 이메일(또는 카카오·Google 로그인 여부)을 적어 "계정 삭제 요청"을 보내 주세요. 본인 확인 후 7일 안에 삭제하고 결과를 회신해요.`,
      },
      { heading: '삭제되는 데이터', body: '로그인 계정, 프로필(핸들), 게시물과 서버에 올린 공유 이미지·미리보기, 하트, 차단 기록.' },
      {
        heading: '남는 데이터',
        body: '내가 낸 신고는 다른 사용자 보호를 위해 운영 기록으로 남지만 작성자 정보는 지워요. 로그인 보안용 접속 기록은 서버 제공자의 로그 보관 기간이 지나면 자동 삭제돼요. 옷장·코디·착용 기록은 서버에 없으므로 앱의 설정 > 기기 데이터 전체 삭제 또는 앱 삭제로 지울 수 있어요.',
      },
    ],
  };
}
