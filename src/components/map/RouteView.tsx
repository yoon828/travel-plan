'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { APIProvider } from '@vis.gl/react-google-maps'
import { ArrowLeft, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Trip, Day, Place, Transport } from '@/types'
import { GOOGLE_MAPS_API_KEY } from '@/lib/googleMaps'
import { DaySelector } from './DaySelector'
import { PlaceItinerary } from './PlaceItinerary'
import { TripMap } from './TripMap'

interface RouteViewProps {
  trip: Trip & { days: (Day & { places: Place[]; transports: Transport[] })[] }
}

function RouteViewContent({ trip }: RouteViewProps) {
  const router = useRouter()
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0)

  const selectedDay = trip.days[selectedDayIndex]
  const selectedPlaces = useMemo(() => selectedDay?.places ?? [], [selectedDay])
  const selectedTransports = useMemo(() => selectedDay?.transports ?? [], [selectedDay])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="border-b border-gray-200 bg-white">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              뒤로
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{trip.title}</h1>
              <p className="text-xs text-gray-500">경로보기</p>
            </div>
          </div>
          <Map className="w-5 h-5 text-gray-400" />
        </div>

        {/* Day 탭 */}
        <DaySelector
          days={trip.days}
          selectedDayIndex={selectedDayIndex}
          onChange={setSelectedDayIndex}
        />
      </div>

      {/* 본문: 목록 + 지도 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <PlaceItinerary places={selectedPlaces} transports={selectedTransports} />
        <TripMap places={selectedPlaces} />
      </div>
    </div>
  )
}

export function RouteView({ trip }: RouteViewProps) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
      <RouteViewContent trip={trip} />
    </APIProvider>
  )
}
