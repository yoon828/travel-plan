'use client'

import { useState } from 'react'
import { Place, Transport } from '@/types'
import { PLACE_CATEGORIES } from '@/lib/googleMaps'
import { TransportSelector } from '@/components/trip/TransportSelector'

interface PlaceItineraryProps {
  places: Place[]
  transports: Transport[]
}

const TRANSPORT_MODE_LABELS: Record<string, { icon: string; label: string }> = {
  transit: { icon: '🚌', label: '대중교통' },
  driving: { icon: '🚗', label: '자가용' },
  walking: { icon: '🚶', label: '도보' },
}

export function PlaceItinerary({ places, transports: initialTransports }: PlaceItineraryProps) {
  const [transports, setTransports] = useState<Transport[]>(initialTransports)

  const getCategoryIcon = (category: string) => {
    return PLACE_CATEGORIES.find((cat) => cat.value === category)?.icon || '📍'
  }

  const getTransport = (fromPlaceId: string, toPlaceId: string) => {
    return transports.find((t) => t.from_place_id === fromPlaceId && t.to_place_id === toPlaceId)
  }

  const handleTransportSaved = (transport: Transport) => {
    setTransports((prev) => {
      const filtered = prev.filter((t) => !(t.from_place_id === transport.from_place_id && t.to_place_id === transport.to_place_id))
      return [...filtered, transport]
    })
  }

  return (
    <div className="w-full lg:w-72 border-r border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 space-y-3">
        {places.length === 0 ? (
          <p className="text-gray-500 text-sm">이 날의 목적지가 없습니다.</p>
        ) : (
          places.map((place, index) => {
            const hasCoordinates = place.lat !== null && place.lng !== null
            const nextPlace = index < places.length - 1 ? places[index + 1] : null
            const transportInfo = nextPlace ? getTransport(place.id, nextPlace.id) : null

            return (
              <div key={place.id}>
                <div className="pb-3 border-b border-gray-100">
                  <div className="flex gap-3">
                    <div className="text-lg font-bold text-blue-500 min-w-6">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className="text-xl">{getCategoryIcon(place.category ?? '')}</span>
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

                {/* 이동 수단 정보 또는 선택 UI */}
                {nextPlace && (
                  <>
                    {!transportInfo ? (
                      <div className="py-2 my-2">
                        <TransportSelector
                          fromPlace={place}
                          toPlace={nextPlace}
                          existingTransport={undefined}
                          onTransportSaved={handleTransportSaved}
                        />
                      </div>
                    ) : (
                      <div className="py-2 px-3 bg-amber-50 text-xs border-l-2 border-amber-300 my-2">
                        <div className="font-medium text-amber-900">
                          {TRANSPORT_MODE_LABELS[transportInfo.selected_mode || '']?.icon}{' '}
                          {TRANSPORT_MODE_LABELS[transportInfo.selected_mode || '']?.label || '이동'}
                        </div>
                        {transportInfo.duration_minutes && (
                          <div className="text-amber-700">⏱️ {transportInfo.duration_minutes}분</div>
                        )}
                        {transportInfo.cost && (
                          <div className="text-amber-700">💰 {transportInfo.cost.toLocaleString()}원</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
