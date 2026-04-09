'use server'

import { createServerClient } from '@/lib/supabase'
import type { Place, PlaceCategory } from '@/types'

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

export async function updatePlace({
  placeId,
  name,
  address,
  memo,
  lat,
  lng,
  category,
}: {
  placeId: string
  name: string
  address?: string
  memo?: string
  lat?: number
  lng?: number
  category?: PlaceCategory
}): Promise<{ place?: Place; error?: string }> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('places')
      .update({
        name,
        address: address || null,
        memo: memo || null,
        lat: lat || null,
        lng: lng || null,
        category: category || null,
      })
      .eq('id', placeId)
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
