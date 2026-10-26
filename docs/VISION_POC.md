# 비전 POC (Phase 0) — 상태: **미착수**

앱에는 아직 어떤 ML 모델도 없습니다. `manualProvider`가 기본이며 UI는 "배경 제거·자동 분류는 아직 지원하지 않아요"를 표시합니다.

## 분리해서 검증할 문제
1. 단일 아이템 사진의 배경 제거/크롭 (먼저)
2. 사람 분할(person segmentation) — 의류 분류가 아님
3. 전신 사진의 의류 파싱(garment parsing) — 상의/하의/… 클래스

## 후보와 확인할 점
| 후보 | 용도 | 확인 필요 |
| --- | --- | --- |
| onnxruntime-react-native | 런타임 | Expo SDK 58 config plugin, 개발 빌드, 연산자 호환, 앱 크기 |
| Google ML Kit Selfie Segmentation | 사람 분할만 | 베타 여부, 약관, iOS/Android 차이, RN 래퍼 |
| iOS Vision `VNGenerateForegroundInstanceMaskRequest` / Android ML Kit Subject Segmentation | 단일 아이템 배경 제거 | **추가 후보(제안)**: OS 내장이라 모델 라이선스 부담이 작음. Expo Module로 래핑 필요 |
| levindabhi/cloth-segmentation | 의류 파싱(3클래스) | 아카이브됨, 가중치·데이터셋(iMaterialist) 상업 이용 권리 불명확 → 기본 제외 |

## 통과 기준
단일 아이템 30장+, 착장 30장+ (자체 촬영/합성/적법 라이선스), Android·iOS 실기기에서 품질·시간·피크 메모리·앱 크기 기록 → `docs/DEVICE_BENCHMARKS.md`. 측정 전 수치를 UI/문서에 쓰지 않음.
