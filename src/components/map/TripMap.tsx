'use client'

import { useEffect } from 'react'
import { Map, AdvancedMarker, Pin, Polyline, useMap } from '@vis.gl/react-google-maps'
import { Place } from '@/types'
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '@/lib/googleMaps'

interface TripMapProps {
  places: Place[]
}

function MapController({ places }: TripMapProps) {
  const map = useMap()

  useEffect(() => {
    if (!map || places.length === 0) return

    // 유효한 좌표를 가진 장소만 필터링
    const validPlaces = places.filter((p) => p.lat !== null && p.lng !== null)
    if (validPlaces.length === 0) return

    // 모든 마커가 화면에 들어오도록 bounds 계산
    const bounds = new google.maps.LatLngBounds()
    validPlaces.forEach((place) => {
      bounds.extend({ lat: place.lat!, lng: place.lng! })
    })

    // bounds에 맞춰 지도 조정
    map.fitBounds(bounds, 80)
  }, [map, places])

  return null
}

export function TripMap({ places }: TripMapProps) {
  // 유효한 좌표를 가진 장소만 필터링
  const validPlaces = places.filter((p) => p.lat !== null && p.lng !== null)

  // Polyline 경로 생성
  const path = validPlaces.map((place) => ({
    lat: place.lat!,
    lng: place.lng!,
  }))

  // 초기 지도 중심 (유효한 장소가 있으면 첫 번째, 없으면 기본값)
  const initialCenter = validPlaces.length > 0 ? path[0] : MAP_DEFAULT_CENTER

  return (
    <div className="flex-1 bg-white">
      <Map
        defaultZoom={MAP_DEFAULT_ZOOM}
        defaultCenter={initialCenter}
        mapId="trip-route-map"
        className="w-full h-full"
      >
        <MapController places={places} />

        {/* 마커 표시 */}
        {validPlaces.map((place, index) => (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat!, lng: place.lng! }}
            title={place.name}
          >
            <Pin
              background="#4285F4"
              borderColor="#fff"
              glyphColor="#fff"
              scale={1.2}
            >
              <span className="text-white font-bold text-sm">{index + 1}</span>
            </Pin>
          </AdvancedMarker>
        ))}

        {/* Polyline 연결 */}
        {path.length > 1 && (
          <Polyline
            path={path}
            geodesic={true}
            strokeColor="#4285F4"
            strokeOpacity={0.7}
            strokeWeight={3}
          />
        )}
      </Map>
    </div>
  )
}
