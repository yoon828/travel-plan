'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { addPlace, deletePlace, reorderPlaces, deleteTrip } from '@/app/actions'
import type { Trip, Day, Place } from '@/types'

interface TripDetailProps {
  trip: Trip & { days: (Day & { places: Place[] })[] }
}

interface FormState {
  name: string
  address: string
  memo: string
}

export function TripDetail({ trip: initialTrip }: TripDetailProps) {
  const router = useRouter()
  const [trip, setTrip] = useState(initialTrip)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formState, setFormState] = useState<FormState>({ name: '', address: '', memo: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const tripDays = differenceInDays(endDate, startDate) + 1
  const selectedDay = trip.days[selectedDayIndex]

  const handleAddPlace = async () => {
    if (!formState.name.trim()) return

    setIsLoading(true)
    const result = await addPlace({
      dayId: selectedDay.id,
      name: formState.name,
      address: formState.address || undefined,
      memo: formState.memo || undefined,
    })

    if (result.place) {
      const updatedDays = trip.days.map((day) =>
        day.id === selectedDay.id ? { ...day, places: [...day.places, result.place!] } : day
      )
      setTrip({ ...trip, days: updatedDays })
      setFormState({ name: '', address: '', memo: '' })
      setShowAddForm(false)
    }
    setIsLoading(false)
  }

  const handleDeletePlace = async (placeId: string) => {
    setIsLoading(true)
    const result = await deletePlace(placeId)

    if (result.success) {
      const updatedDays = trip.days.map((day) =>
        day.id === selectedDay.id
          ? { ...day, places: day.places.filter((p) => p.id !== placeId) }
          : day
      )
      setTrip({ ...trip, days: updatedDays })
    }
    setIsLoading(false)
  }

  const handleMovePlace = async (placeId: string, direction: 'up' | 'down') => {
    const places = selectedDay.places
    const currentIndex = places.findIndex((p) => p.id === placeId)

    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === places.length - 1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newPlaces = [...places]
    ;[newPlaces[currentIndex], newPlaces[newIndex]] = [newPlaces[newIndex], newPlaces[currentIndex]]

    const orderedPlaces = newPlaces.map((place, index) => ({
      id: place.id,
      order_index: index,
    }))

    setIsLoading(true)
    const result = await reorderPlaces(orderedPlaces)

    if (result.success) {
      const updatedDays = trip.days.map((day) =>
        day.id === selectedDay.id ? { ...day, places: newPlaces } : day
      )
      setTrip({ ...trip, days: updatedDays })
    }
    setIsLoading(false)
  }

  const handleDeleteTrip = async () => {
    setIsLoading(true)
    const result = await deleteTrip(trip.id)

    if (result.success) {
      setShowDeleteDialog(false)
      router.push('/')
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* 헤더: 여행 제목과 날짜 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{trip.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {format(startDate, 'yyyy.MM.dd', { locale: ko })} ~{' '}
            {format(endDate, 'yyyy.MM.dd', { locale: ko })} ({tripDays}일)
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isLoading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          삭제
        </Button>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>여행 삭제</DialogTitle>
            <DialogDescription>
              정말로 "{trip.title}" 여행을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrip}
              disabled={isLoading}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Day {selectedDay.day_number} - {format(new Date(selectedDay.date), 'MMMM dd', { locale: ko })}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                장소 추가
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 장소 추가 폼 */}
              {showAddForm && (
                <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                  <div>
                    <Input
                      placeholder="장소 이름"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="주소"
                      value={formState.address}
                      onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="메모"
                      value={formState.memo}
                      onChange={(e) => setFormState({ ...formState, memo: e.target.value })}
                      rows={2}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddPlace}
                      disabled={isLoading || !formState.name.trim()}
                    >
                      추가
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddForm(false)}
                      disabled={isLoading}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}

              {/* 장소 목록 */}
              {selectedDay.places.length > 0 ? (
                <div className="space-y-3">
                  {selectedDay.places.map((place, index) => (
                    <div key={place.id} className="border-l-4 border-primary pl-4 py-2 flex justify-between items-start">
                      <div className="flex-1">
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

                      {/* 순서 변경 및 삭제 버튼 */}
                      <div className="flex gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMovePlace(place.id, 'up')}
                          disabled={isLoading || index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMovePlace(place.id, 'down')}
                          disabled={isLoading || index === selectedDay.places.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlace(place.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">아직 장소가 추가되지 않았습니다</p>
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
