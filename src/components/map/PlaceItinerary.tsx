'use client'

import { Place } from '@/types'
import { PLACE_CATEGORIES } from '@/lib/googleMaps'

interface PlaceItineraryProps {
  places: Place[]
}

export function PlaceItinerary({ places }: PlaceItineraryProps) {
  const getCategoryIcon = (category: string) => {
    return PLACE_CATEGORIES.find((cat) => cat.value === category)?.icon || '📍'
  }

  return (
    <div className="w-full lg:w-72 border-r border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 space-y-3">
        {places.length === 0 ? (
          <p className="text-gray-500 text-sm">이 날의 목적지가 없습니다.</p>
        ) : (
          places.map((place, index) => {
            const hasCoordinates = place.lat !== null && place.lng !== null
            return (
              <div key={place.id} className="pb-3 border-b border-gray-100 last:border-0">
                <div className="flex gap-3">
                  <div className="text-lg font-bold text-blue-500 min-w-6">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{getCategoryIcon(place.category)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {place.name}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {place.address || '주소 없음'}
                        </p>
                        {!hasCoordinates && (
                          <p className="text-xs text-orange-500 mt-1">(지도 미표시)</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
