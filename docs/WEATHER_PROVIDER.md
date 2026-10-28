# 날씨 공급자

## 선택: 기상청 단기예보 조회서비스 (공공데이터포털 15084084)
- 엔드포인트: `apis.data.go.kr/1360000/VilageFcstInfoService_2.0` — `getUltraSrtNcst`(초단기실황), `getVilageFcst`(단기예보).
- 호출 경로: 앱 → Supabase Edge Function `weather-kma?nx=&ny=` → 기상청. **서비스 키는 `supabase secrets set KMA_SERVICE_KEY=...`로만 보관**, 앱 번들·`EXPO_PUBLIC_*`·Git에 넣지 않음.
- 앱이 보내는 위치: 5km 격자 번호만(`latLonToKmaGrid`, 기상청 활용가이드의 LCC 상수). 지역명은 번들 목록으로 기기에서 결정.

## 필드 매핑 (공급자가 준 것만)
| WeatherSnapshot | 기상청 | 비고 |
| --- | --- | --- |
| temperatureC | T1H(실황) / TMP(예보) | |
| min/maxTemperatureC | TMN/TMX, 없으면 오늘 TMP 최저·최고 | |
| precipitationProbabilityPct | POP | 실황엔 없음 → 다음 예보 시각 값 |
| precipitationMm | RN1 / PCP("강수없음"=0, "1mm 미만"=0.5, 범위는 하한) | |
| precipitationType | PTY 0~7 → none/rain/rainSnow/snow/shower | |
| windSpeedMps, humidityPct | WSD, REH | |
| conditionLabelKo | PTY 우선, 아니면 SKY(맑음/구름많음/흐림) | |
| apparentTemperatureC | **미제공** → 겨울철 체감온도 식으로 추정(T≤10°C, V≥4.8km/h)만, `estimated` | D-011 |

시간대: now(실황) / morning 09시 / afternoon 15시 / evening 19시(이미 지난 시간대는 제외). `validUntil` = 수신 + 60분, 지나면 화면·추천에서 "날씨 정보 없음".

## 실패 처리
타임아웃 8초, 429/5xx만 최대 2회 지수 백오프, 4xx는 즉시 실패, 응답 스키마 검증 실패 시 값 생성 없이 오류. 모든 실패 → `WeatherCard` 오류 문구 + 수동 날씨 선택. 옷장·코디·기록은 영향 없음.

## 확인이 필요한 항목 (소유자 작업, 미검증)
- [ ] 공공데이터포털 활용신청 → 개발/운영 계정 트래픽 한도 확인 및 기록
- [ ] 이용허락범위·출처표시 문구 확인(현재 UI: "출처 기상청")
- [x] (2026-10-28) Edge Function 배포(JWT 검증 유지, 키 미설정 시 503 확인, D-028)
- [x] (2026-10-28) `KMA_SERVICE_KEY` 저장(소유자). 함수가 키를 읽음(503 → 502로 바뀜)
- [ ] **기상청이 키를 아직 인식하지 않음**: 로그 `kma-http-403-reason-30` = SERVICE_KEY_IS_NOT_REGISTERED_ERROR. 활용신청이 오늘 연장 처리돼 동기화 대기(보통 최대 1시간)일 가능성 → 공공데이터포털 API 상세의 "조회하기"(미리보기)로 키 자체를 먼저 확인하고, 1시간 뒤에도 같으면 키 값을 다시 복사해 저장
- [ ] 200 응답 후 필드·base_time 계산 검증(`vilageBase`/`ncstBase`)
- 함수 보강(2026-10-28 재배포): Encoding 키를 넣어도 자동 복원(`%` 포함 시 decode), 오류 로그에 data.go.kr `returnReasonCode` 포함(키는 기록하지 않음). 30=미등록 키, 22=일일 한도 초과, 12=서비스 없음
- [ ] 동시 사용자 증가 시 격자 단위 서버 캐시 필요 여부(현재 `Cache-Control: max-age=600`만)
- [ ] 무료 Supabase Edge Function 호출 한도 → `docs/COSTS_AND_DISTRIBUTION.md`

## 대안 평가
- Open-Meteo: 무료 플랜 비상업 조건 → 수익화 가능 앱의 운영 기본값 불가. 프로토타입 비교용으로만.
- 클라이언트 직접 호출: 키 추출 가능 → 불가.
