/**
 * In-app 개인정보 처리방침 · 커뮤니티 가이드라인. Written from what the code actually does
 * (docs/PRIVACY.md, docs/COMMUNITY_SAFETY.md) — a DRAFT until legal review and until the owner
 * fills in the 운영자/보호책임자 details. Keep in sync with those docs when data flows change.
 */
import { SUPPORT_EMAIL } from '@/features/community/moderation-policy';

export type PolicyId = 'privacy' | 'guidelines';

export interface PolicySection {
  heading: string;
  body: string[];
}

export interface PolicyDoc {
  id: PolicyId;
  title: string;
  /** Shown under the title. */
  status: string;
  sections: PolicySection[];
}

const contact = SUPPORT_EMAIL ? `문의: ${SUPPORT_EMAIL}` : '문의처는 정식 출시 전에 공개돼요.';

export const POLICIES: Record<PolicyId, PolicyDoc> = {
  privacy: {
    id: 'privacy',
    title: '개인정보 처리방침',
    status: '초안 · 2026-10-28 기준 앱 동작 · 법률 검토 전',
    sections: [
      {
        heading: '기기에만 저장되는 정보',
        body: ['옷 사진(앱이 만든 사본), 옷 정보와 가격, 코디, 착용 기록, 취향 설정은 이 기기 안에만 저장돼요.', '로그인해도 자동으로 업로드되지 않아요. 사진첩의 원본 사진은 읽기만 하고 바꾸거나 지우지 않아요.'],
      },
      {
        heading: '위치와 날씨',
        body: ['"내 주변 날씨"를 누를 때만 위치를 한 번 읽어요. 위치는 기기에서 약 5km 단위 기상청 격자 번호로 바꾼 뒤 바로 버리고, 날씨 서버에는 격자 번호만 보내요.', '백그라운드 위치 권한은 요청하지 않아요. 지역을 직접 고르면 위치를 전혀 읽지 않아요.'],
      },
      {
        heading: '쇼핑몰 링크 가져오기',
        body: ['붙여 넣거나 공유한 상품 링크는 기기가 그 쇼핑몰에 직접 요청해 사진·이름·가격을 읽어요. WearLog 서버를 거치지 않아요.'],
      },
      {
        heading: '커뮤니티(선택)',
        body: [
          '커뮤니티는 로그인한 경우에만 쓸 수 있어요. 게시할 때 고른 코디 사진 사본(위치 정보 제거·축소), 공개 핸들, 고른 태그, 원하면 대략적인 날씨 문구만 서버에 올라가요.',
          '로그인 계정(카카오·Google·이메일)의 식별자와 이메일은 로그인에만 쓰이고 공개 프로필에는 핸들만 보여요.',
          '하트·신고·차단 기록은 서비스 운영과 안전을 위해 서버에 저장돼요.',
        ],
      },
      {
        heading: '삭제',
        body: ['설정 > 기기 데이터 전체 삭제로 기기 안의 모든 WearLog 데이터를 지울 수 있어요.', '커뮤니티 계정 화면에서 계정을 삭제하면 업로드한 이미지, 게시물, 하트, 프로필이 함께 삭제돼요.'],
      },
      {
        heading: '문의',
        body: [contact, '개인정보 보호책임자와 운영자 정보는 정식 출시 전에 이곳에 공개돼요.'],
      },
    ],
  },
  guidelines: {
    id: 'guidelines',
    title: '커뮤니티 가이드라인',
    status: '초안 · 법률 검토 전',
    sections: [
      {
        heading: '오늘의 베스트 착장은',
        body: ['서로의 코디에서 아이디어를 얻는 공간이에요. 하트만 있고 댓글·DM·순위표·외모 점수는 없어요.', '베스트 착장은 하트 수가 아니라 운영자가 날씨와 스타일 다양성을 보고 골라요.'],
      },
      {
        heading: '올리지 말아 주세요',
        body: [
          '다른 사람의 사진이나 허락받지 않은 인물 사진',
          '얼굴·집 주소·학교 등 나나 다른 사람을 알아볼 수 있는 정보',
          '선정적이거나 폭력적인 사진, 혐오·괴롭힘',
          '광고·홍보·외부 판매 유도',
          '저작권이 있는 남의 이미지',
        ],
      },
      {
        heading: '게시 규칙',
        body: ['게시물은 운영자 확인 후 공개될 수 있어요. 하루에 올릴 수 있는 게시물 수에는 제한이 있어요.', '내 게시물은 언제든 직접 삭제할 수 있어요.'],
      },
      {
        heading: '신고와 차단',
        body: ['문제가 있는 게시물이나 사용자는 신고해 주세요. 서로 다른 사용자의 신고가 여러 번 쌓이면 확인 전까지 자동으로 숨겨져요.', '차단하면 서로의 게시물이 보이지 않아요. 차단 목록에서 언제든 해제할 수 있어요.'],
      },
      {
        heading: '문의',
        body: [contact],
      },
    ],
  },
};
