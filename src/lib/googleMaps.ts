export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

export const MAP_DEFAULT_CENTER = {
  lat: 37.5665,
  lng: 126.9780,
}

export const MAP_DEFAULT_ZOOM = 12

export const PLACE_CATEGORIES = [
  { value: 'restaurant', label: '식당', icon: '🍽️' },
  { value: 'cafe', label: '카페', icon: '☕️' },
  { value: 'attraction', label: '관광지', icon: '🏛️' },
  { value: 'accommodation', label: '숙소', icon: '🏨' },
  { value: 'airport', label: '공항', icon: '✈️' },
] as const

// Day별 경로 색상 (Polyline)
export const DAY_COLORS = [
  '#4285F4', // 파랑
  '#EA4335', // 빨강
  '#FBBC04', // 노랑
  '#34A853', // 초록
  '#FF6D00', // 주황
  '#9C27B0', // 보라
  '#00BCD4', // 청록
] as const

// 카테고리별 마커 색상
export const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#EA4335',
  cafe: '#FBBC04',
  attraction: '#4285F4',
  accommodation: '#34A853',
  airport: '#9C27B0',
}
