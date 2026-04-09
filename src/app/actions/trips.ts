'use server'

import { createServerClient } from '@/lib/supabase'
import type { Trip, Day, Place, Member, Transport } from '@/types'

export async function createTrip({
  title,
  startDate,
  endDate,
}: {
  title: string
  startDate: string
  endDate: string
}): Promise<{ trip?: Trip; error?: string }> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('trips')
      .insert([
        {
          title,
          start_date: startDate,
          end_date: endDate,
        },
      ])
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // 시작일~종료일 기간만큼 days 자동 생성
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = []
    for (let d = new Date(start), dayNum = 1; d <= end; d.setDate(d.getDate() + 1), dayNum++) {
      days.push({
        trip_id: data.id,
        day_number: dayNum,
        date: d.toISOString().split('T')[0],
      })
    }

    const { error: daysError } = await supabase.from('days').insert(days)
    if (daysError) {
      return { error: daysError.message }
    }

    return { trip: data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getTrip(
  id: string
): Promise<{ trip?: Trip & { days: (Day & { places: Place[]; transports: Transport[] })[]; members: Member[] }; error?: string }> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('trips')
      .select('*, days(*, places(*)), members(*)')
      .eq('id', id)
      .single()

    if (error) {
      return { error: error.message }
    }

    // transports 조회 (places를 통해 간접적으로 연결)
    const allPlaceIds = data.days.flatMap((day: any) => day.places.map((p: Place) => p.id))
    const { data: transportsData } = await supabase
      .from('transports')
      .select('*')
      .in('from_place_id', allPlaceIds)

    const trip = {
      ...data,
      days: data.days.map((day: Day & { places: Place[] }) => ({
        ...day,
        places: [...day.places].sort((a, b) => a.order_index - b.order_index),
        transports: transportsData || [],
      })),
    }

    return { trip }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deleteTrip(tripId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
