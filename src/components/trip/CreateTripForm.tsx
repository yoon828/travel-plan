'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { createTrip } from '@/app/actions/trips'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export function CreateTripButton() {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full">
        + New Trip
      </Button>
      <CreateTripModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

interface CreateTripModalProps {
  isOpen: boolean
  onClose: () => void
}

function CreateTripModal({ isOpen, onClose }: CreateTripModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('여행 제목을 입력해주세요')
      return
    }
    if (!dateRange?.from) {
      setError('시작일을 선택해주세요')
      return
    }
    if (!dateRange?.to) {
      setError('종료일을 선택해주세요')
      return
    }

    setIsLoading(true)
    try {
      const result = await createTrip({
        title,
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
      })

      if (result.error) {
        setError(result.error)
      } else {
        onClose()
        setTitle('')
        setDateRange(undefined)
        router.refresh()
        router.push(`/trips/${result.trip?.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, 'yyyy.MM.dd', { locale: ko })} - ${format(dateRange.to, 'yyyy.MM.dd', { locale: ko })}`
      : format(dateRange.from, 'yyyy.MM.dd', { locale: ko })
    : '날짜를 선택하세요'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 여행 만들기</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">여행 제목</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 오사카 여름 여행"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>여행 날짜</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground'
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? '생성 중...' : '만들기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
