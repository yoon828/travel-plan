'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CreateTripButton } from '@/components/trip/CreateTripForm'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createBrowserClient } from '@/lib/supabase.client'
import type { Trip } from '@/types'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setTrips(data || [])
      } catch (error) {
        console.error('Failed to fetch trips:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrips()
  }, [pathname])

  const handleTripClick = (tripId: string) => {
    router.push(`/trips/${tripId}`)
  }

  const isCurrentTrip = (tripId: string) => {
    return pathname === `/trips/${tripId}`
  }

  return (
    <aside className="w-64 bg-card border-r flex flex-col shrink-0 h-screen sticky top-0">
      {/* Header */}
      <div className="px-6 py-6">
        <h1 className="text-xl font-bold">Travel Planner</h1>
      </div>

      <Separator />

      {/* New Trip Button */}
      <div className="px-4 py-4">
        <CreateTripButton />
      </div>

      <Separator />

      {/* Trip List */}
      <ScrollArea className="flex-1">
        <nav className="px-3 py-4 space-y-1">
          {isLoading ? (
            <p className="text-xs text-muted-foreground px-3 py-2">
              로드 중...
            </p>
          ) : trips.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">
              아직 여행이 없습니다
            </p>
          ) : (
            trips.map((trip) => {
              const dateRange = `${format(new Date(trip.start_date), 'yy.MM.dd', { locale: ko })} ~ ${format(new Date(trip.end_date), 'yy.MM.dd', { locale: ko })}`

              return (
                <button
                  key={trip.id}
                  onClick={() => handleTripClick(trip.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md transition-colors text-sm',
                    isCurrentTrip(trip.id)
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-muted'
                  )}
                >
                  <div className="font-medium truncate">{trip.title}</div>
                  <div className="text-xs opacity-75">{dateRange}</div>
                </button>
              )
            })
          )}
        </nav>
      </ScrollArea>
    </aside>
  )
}
