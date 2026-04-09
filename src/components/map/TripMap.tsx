'use client'

import { useEffect } from 'react'
import { Map, AdvancedMarker, Pin, Polyline, useMap } from '@vis.gl/react-google-maps'
import { Place } from '@/types'
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, CATEGORY_COLORS } from '@/lib/googleMaps'

interface TripMapProps {
  places: Place[]
}

// validPlaces가 바뀔 때만 fitBounds 실행 (place IDs 기준 비교)
function MapController({ validPlaces }: { validPlaces: Place[] }) {
  const map = useMap()
  const placeIds = validPlaces.map((p) => p.id).join(',')

  useEffect(() => {
    if (!map || validPlaces.length === 0) return

    const bounds = new google.maps.LatLngBounds()
    validPlaces.forEach((place) => {
      bounds.extend({ lat: place.lat!, lng: place.lng! })
    })
    map.fitBounds(bounds, 80)
  // placeIds는 string이라 값 비교 → 장소 목록이 바뀔 때만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, placeIds])

  return null
}

export function TripMap({ places }: TripMapProps) {
  const validPlaces = places.filter((p) => p.lat !== null && p.lng !== null)
  const path = validPlaces.map((place) => ({ lat: place.lat!, lng: place.lng! }))
  const initialCenter = validPlaces.length > 0 ? path[0] : MAP_DEFAULT_CENTER

  return (
    <div className="flex-1 relative bg-gray-100">
      {validPlaces.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <p className="bg-white text-gray-500 text-sm px-4 py-2 rounded-lg shadow">
            지도에 표시할 목적지가 없습니다
          </p>
        </div>
      )}
      <Map
        defaultZoom={MAP_DEFAULT_ZOOM}
        defaultCenter={initialCenter}
        mapId="trip-route-map"
        className="w-full h-full"
      >
        <MapController validPlaces={validPlaces} />

        {validPlaces.map((place, index) => {
          const markerColor = CATEGORY_COLORS[place.category ?? ''] ?? '#4285F4'
          return (
            <AdvancedMarker
              key={place.id}
              position={{ lat: place.lat!, lng: place.lng! }}
              title={place.name}
            >
              <Pin
                background={markerColor}
                borderColor="#fff"
                glyphColor="#fff"
                glyph={String(index + 1)}
                scale={1.2}
              />
            </AdvancedMarker>
          )
        })}

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
