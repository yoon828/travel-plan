'use client'

import { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Trip, Day, Place } from '@/types'

interface TripDetailProps {
  trip: Trip & { days: (Day & { places: Place[] })[] }
}

export function TripDetail({ trip }: TripDetailProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const tripDays = differenceInDays(endDate, startDate) + 1
  const selectedDay = trip.days[selectedDayIndex]

  return (
    <div className="space-y-6">
      {/* 헤더: 여행 제목과 날짜 */}
      <div>
        <h1 className="text-3xl font-bold">{trip.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {format(startDate, 'yyyy.MM.dd', { locale: ko })} ~{' '}
          {format(endDate, 'yyyy.MM.dd', { locale: ko })} ({tripDays}일)
        </p>
      </div>

      {/* 일차 탭 */}
      {trip.days.length > 0 ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {trip.days.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayIndex(index)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedDayIndex === index
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <div className="font-medium">Day {day.day_number}</div>
                <div className="text-xs">
                  {format(new Date(day.date), 'MM.dd', { locale: ko })}
                </div>
              </button>
            ))}
          </div>

          {/* 목적지 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>
                Day {selectedDay.day_number} - {format(new Date(selectedDay.date), 'MMMM dd', { locale: ko })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDay.places.length > 0 ? (
                <div className="space-y-4">
                  {selectedDay.places.map((place) => (
                    <div key={place.id} className="border-l-4 border-primary pl-4 py-2">
                      <h3 className="font-semibold text-lg">{place.name}</h3>
                      {place.address && (
                        <p className="text-sm text-muted-foreground">{place.address}</p>
                      )}
                      {place.memo && (
                        <p className="text-sm mt-2">{place.memo}</p>
                      )}
                      {place.open_hours && (
                        <Badge variant="secondary" className="mt-2">
                          {place.open_hours}
                        </Badge>
                      )}
                      {place.ticket_url && (
                        <div className="mt-2">
                          <a
                            href={place.ticket_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            티켓 보기 →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">아직 장소가 추가되지 않았습니다</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">아직 일정이 없습니다</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
