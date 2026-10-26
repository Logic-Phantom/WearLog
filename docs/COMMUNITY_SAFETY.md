# 커뮤니티 안전·운영 — "오늘의 베스트 착장"

## 범위
- 있음: 착장 게시(명시적 opt-in), 하트, 신고(7개 사유), 차단(양방향 숨김), 내 게시물·계정 삭제, 운영자 큐레이션(`featured_on`).
- 없음(의도): 댓글, DM, 싫어요, 외모 점수, 순위표, 팔로워 랭킹, 위치 공개.

## 서버에서 강제되는 규칙 (`supabase/migrations/20261026000000_community_init.sql`)
| 규칙 | 기본값 | 위치 |
| --- | --- | --- |
| 승인 후 공개 | `require_review = true` | `community_settings`, insert 트리거 |
| 하루 게시 한도 | 5건/24시간 | insert 트리거 |
| 스토리지 상한 | 800MB에서 업로드 중지 | insert 트리거 |
| 신고 자동 숨김 | 서로 다른 신고자 3명 | reports after-insert 트리거 |
| 중복 신고 | 사용자당 대상 1회 | 부분 unique 인덱스 |
| 자기 하트/자기 신고/자기 차단 | 금지 | RLS·CHECK |
| 업로드 경로 | `{auth.uid()}/...jpg`만 | Storage 정책 + posts CHECK |
| 모더레이션·큐레이션 필드 | 특권 역할만 변경 | update 트리거 |
| 차단 | 피드·상세 RPC에서 양방향 제외 | `get_feed` |

## 운영 절차 (공개 전 필수 — 미작성 항목은 출시 차단)
- [ ] 승인 담당자와 확인 주기(최소 매일) 지정 — 대시보드에서 `moderation_status` `pending → visible`
- [ ] 베스트 착장 선정 기준 공개 문구(예: "운영자가 날씨·스타일 다양성을 기준으로 매일 선정") 및 `featured_on` 설정 방법
- [ ] 신고 처리 SLA, 자동 숨김 해제 기준, 악의적 대량 신고 대응(신규 계정 가중치 등)
- [ ] 저작권 신고·삭제 요청 연락처(`EXPO_PUBLIC_SUPPORT_EMAIL`)
- [ ] 개인정보 처리방침·커뮤니티 가이드라인 화면 (아직 앱에 없음)
- [ ] `supabase/tests/rls_test.sql` 작성 및 실제 프로젝트에서 실행 (CutPick의 테스트를 기반으로 이식 예정 — **미작성**)
