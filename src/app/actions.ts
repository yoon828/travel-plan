'use server'

import { createServerClient } from '@/lib/supabase'
import type { Trip, Day, Place, PlaceCategory } from '@/types'

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
): Promise<{ trip?: Trip & { days: (Day & { places: Place[] })[] }; error?: string }> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('trips')
      .select('*, days(*, places(*))')
      .eq('id', id)
      .single()

    if (error) {
      return { error: error.message }
    }

    return { trip: data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function addPlace({
  dayId,
  name,
  address,
  memo,
  lat,
  lng,
  category,
}: {
  dayId: string
  name: string
  address?: string
  memo?: string
  lat?: number
  lng?: number
  category?: PlaceCategory
}): Promise<{ place?: Place; error?: string }> {
  try {
    const supabase = await createServerClient()

    const { data: places } = await supabase
      .from('places')
      .select('order_index')
      .eq('day_id', dayId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = places && places.length > 0 ? places[0].order_index + 1 : 0

    const { data, error } = await supabase
      .from('places')
      .insert([
        {
          day_id: dayId,
          name,
          address: address || null,
          memo: memo || null,
          lat: lat || null,
          lng: lng || null,
          category: category || null,
          order_index: nextOrderIndex,
        },
      ])
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    return { place: data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deletePlace(placeId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from('places').delete().eq('id', placeId)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function reorderPlaces(places: Array<{ id: string; order_index: number }>): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerClient()

    for (const place of places) {
      const { error } = await supabase
        .from('places')
        .update({ order_index: place.order_index })
        .eq('id', place.id)

      if (error) {
        return { error: error.message }
      }
    }

    return { success: true }
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
