export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

export const MAP_DEFAULT_CENTER = {
  lat: 37.5665,
  lng: 126.9780,
}

export const MAP_DEFAULT_ZOOM = 12

export const PLACE_CATEGORIES = [
  { value: 'restaurant', label: '식당', icon: '🍽️' },
  { value: 'cafe', label: '카페', icon: '☕' },
  { value: 'attraction', label: '관광지', icon: '🏛️' },
  { value: 'accommodation', label: '숙소', icon: '🏨' },
  { value: 'airport', label: '공항', icon: '✈️' },
] as const
