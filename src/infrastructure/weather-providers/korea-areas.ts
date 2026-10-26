/**
 * Bundled area list for manual region choice and for labeling a GPS fix at city/구 level without
 * calling a reverse-geocoding service (keeps coordinates on the device). Coordinates are approximate
 * city/district centers (public information), used only to pick a 5 km KMA grid cell.
 */
export interface KoreaArea {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

export const KOREA_AREAS: readonly KoreaArea[] = [
  { id: 'seoul-jongno', label: '서울 종로구', lat: 37.5735, lon: 126.979 },
  { id: 'seoul-jung', label: '서울 중구', lat: 37.5641, lon: 126.9979 },
  { id: 'seoul-mapo', label: '서울 마포구', lat: 37.5663, lon: 126.9019 },
  { id: 'seoul-yongsan', label: '서울 용산구', lat: 37.5326, lon: 126.9905 },
  { id: 'seoul-seongdong', label: '서울 성동구', lat: 37.5634, lon: 127.0369 },
  { id: 'seoul-gangnam', label: '서울 강남구', lat: 37.5172, lon: 127.0473 },
  { id: 'seoul-songpa', label: '서울 송파구', lat: 37.5146, lon: 127.1059 },
  { id: 'seoul-yeongdeungpo', label: '서울 영등포구', lat: 37.5264, lon: 126.8962 },
  { id: 'seoul-gwanak', label: '서울 관악구', lat: 37.4784, lon: 126.9516 },
  { id: 'seoul-nowon', label: '서울 노원구', lat: 37.6542, lon: 127.0568 },
  { id: 'incheon', label: '인천', lat: 37.4563, lon: 126.7052 },
  { id: 'suwon', label: '경기 수원시', lat: 37.2636, lon: 127.0286 },
  { id: 'seongnam', label: '경기 성남시', lat: 37.42, lon: 127.1265 },
  { id: 'goyang', label: '경기 고양시', lat: 37.6584, lon: 126.832 },
  { id: 'yongin', label: '경기 용인시', lat: 37.2411, lon: 127.1776 },
  { id: 'chuncheon', label: '강원 춘천시', lat: 37.8813, lon: 127.7298 },
  { id: 'gangneung', label: '강원 강릉시', lat: 37.7519, lon: 128.8761 },
  { id: 'cheongju', label: '충북 청주시', lat: 36.6424, lon: 127.489 },
  { id: 'daejeon', label: '대전', lat: 36.3504, lon: 127.3845 },
  { id: 'sejong', label: '세종', lat: 36.48, lon: 127.289 },
  { id: 'jeonju', label: '전북 전주시', lat: 35.8242, lon: 127.148 },
  { id: 'gwangju', label: '광주', lat: 35.1595, lon: 126.8526 },
  { id: 'mokpo', label: '전남 목포시', lat: 34.8118, lon: 126.3922 },
  { id: 'yeosu', label: '전남 여수시', lat: 34.7604, lon: 127.6622 },
  { id: 'daegu', label: '대구', lat: 35.8714, lon: 128.6014 },
  { id: 'pohang', label: '경북 포항시', lat: 36.019, lon: 129.3435 },
  { id: 'andong', label: '경북 안동시', lat: 36.5684, lon: 128.7294 },
  { id: 'ulsan', label: '울산', lat: 35.5384, lon: 129.3114 },
  { id: 'busan', label: '부산', lat: 35.1796, lon: 129.0756 },
  { id: 'changwon', label: '경남 창원시', lat: 35.2279, lon: 128.6811 },
  { id: 'jeju', label: '제주 제주시', lat: 33.4996, lon: 126.5312 },
  { id: 'seogwipo', label: '제주 서귀포시', lat: 33.2541, lon: 126.56 },
];

export function getArea(id: string): KoreaArea | undefined {
  return KOREA_AREAS.find((a) => a.id === id);
}

/** Nearest bundled area by equirectangular distance (good enough at city scale). */
export function nearestArea(lat: number, lon: number): KoreaArea {
  let best = KOREA_AREAS[0];
  let bestD = Number.POSITIVE_INFINITY;
  const k = Math.cos((lat * Math.PI) / 180);
  for (const a of KOREA_AREAS) {
    const d = (a.lat - lat) ** 2 + ((a.lon - lon) * k) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}
