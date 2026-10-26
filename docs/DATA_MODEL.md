# 데이터 모델

타입 정의: `src/domain/models.ts`. 로컬 스키마: `src/infrastructure/database/migrations.ts`. 서버 스키마: `supabase/migrations/`.

## 로컬 (SQLite `wearlog.db`, 기기 밖으로 나가지 않음)
| 테이블 | 내용 | 비고 |
| --- | --- | --- |
| `kv` | 취향 프로필(`tasteProfile.v1`), 날씨 설정(`weather.prefs.v1`), 날씨 캐시(`weather.cache.v1` — 격자 번호 + 스냅샷, 좌표 없음) | JSON |
| `garments` | 내 옷. 색은 `colorId` 배열, 가격은 정수(원), 사진은 앱 내부 파일 URI | 사진 BLOB 없음 |
| `outfits` | 코디. `item_refs_json` = `ItemRef[]`(`ownedGarment` / `sampleTemplate`+customization) | 출처 보존 |
| `canvas_layouts` | 코디별 캔버스 JSON(정규화 좌표, `canvasVersion: 1`) | outfit 삭제 시 CASCADE |
| `wear_events` | 날짜·코디·메모·`idempotency_key UNIQUE` | 중복 착용 방지 |
| `wear_event_items` | (event, garment) PK. **내 옷만** | 옷 삭제 시 링크만 삭제, 날짜 기록은 유지 |
| `feedback_events` | 향후 개인화 학습용(아직 미사용) | |

마이그레이션: `PRAGMA user_version` + 단계별 트랜잭션. 출시된 마이그레이션은 수정하지 않고 새 항목 추가.

### 파일
`Paths.document/wearlog/garments/<garmentId>/{original.jpg, thumb.jpg, cutout.png}` — 모두 파생본. 사진첩 원본은 읽기만 하고 수정·삭제하지 않음. 옷 삭제 시 해당 폴더 삭제.

### 계산 규칙
- `wearCount(item)` = 해당 옷이 연결된 고유 착용 이벤트 수.
- `CPW = 구매가 / wearCount` (구매가 > 0, wearCount > 0). 아니면 "가격 미입력" / "착용 기록 없음".
- 샘플 템플릿은 옷 개수·착용·CPW 어디에도 포함되지 않음(`ownedIdsOf`).

## 번들(읽기 전용)
- `SAMPLE_TEMPLATES`(34종), `SAMPLE_PRESETS`(9개), `GARMENT_COLORS`(16색), `STYLE_CARDS`, `KOREA_AREAS`(32개 시·구). 사용자 변경은 원본이 아니라 코디의 `customization`에 저장.

## 서버 (Supabase — 커뮤니티 opt-in 전용)
| 테이블 | 소유·읽기·쓰기 | 삭제 시 |
| --- | --- | --- |
| `profiles` | 누구나 읽기 / 본인만 insert·update | 계정 삭제 시 삭제 |
| `posts` | 공개+승인된 글 또는 본인 글만 읽기 / 본인 insert·delete / `moderation_status`·`featured_on`·경로는 특권 역할만 | 스토리지 → 행 순서로 삭제 |
| `hearts` | 본인 행만 / (post_id, user_id) PK / 본인 글 하트 금지 | CASCADE |
| `reports` | 본인 신고만 조회 / 사용자당 대상 1회 / 자기 신고 금지 | 대상 삭제 시 NULL로 남아 운영 기록 유지 |
| `blocks` | 본인 행만 / 자기 차단 금지 | 계정 삭제 시 양방향 삭제 |
| `community_settings` | 정책 없음(대시보드/service role만) | — |
| Storage `outfit-images` | 공개 읽기 / `{uid}/` 폴더에만 jpg 업로드·삭제 / 2MB·image/jpeg | 계정 삭제 시 폴더 비움 |

서버에 올라가는 것: 사용자가 고른 게시 사본(EXIF/GPS 제거) + 핸들 + 태그 + (선택) 거친 날씨 문구. 로컬 outfit/garment ID·캔버스 JSON·좌표는 올라가지 않음.
