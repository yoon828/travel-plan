export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

export const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'

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

// 이동 수단 → Routes API travelMode 매핑
export const TRAVEL_MODE_MAP: Record<'transit' | 'driving' | 'walking', string> = {
  transit: 'TRANSIT',
  driving: 'DRIVE',
  walking: 'WALK',
}

// Google Routes API 호출
export async function getDirections({
  fromLat,
  fromLng,
  toLat,
  toLng,
  mode,
}: {
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  mode: 'transit' | 'driving' | 'walking'
}): Promise<{ durationMinutes: number | null; cost: number | null; error?: string }> {
  try {
    const response = await fetch(
      ROUTES_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'routes.legs.duration,routes.legs.travelAdvisory.transitFare',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: fromLat, longitude: fromLng } } },
          destination: { location: { latLng: { latitude: toLat, longitude: toLng } } },
          travelMode: TRAVEL_MODE_MAP[mode],
        }),
      }
    )

    if (!response.ok) {
      return { durationMinutes: null, cost: null, error: '네트워크 요청 실패' }
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      return { durationMinutes: null, cost: null, error: '경로를 찾을 수 없습니다' }
    }

    const leg = data.routes[0].legs[0]

    // 소요 시간: "300s" 형식 → 분
    const durationSeconds = parseInt(leg.duration, 10)
    const durationMinutes = Math.round(durationSeconds / 60)

    // Fare 정보 (대중교통에만 제공, 일부 지역만 지원)
    let cost: number | null = null
    if (mode === 'transit' && leg.travelAdvisory?.transitFare) {
      cost = parseInt(leg.travelAdvisory.transitFare.units, 10)
    }

    return { durationMinutes, cost }
  } catch (error) {
    return { durationMinutes: null, cost: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
