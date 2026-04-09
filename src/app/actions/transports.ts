'use server'

import { createServerClient } from '@/lib/supabase'
import { ROUTES_API_URL } from '@/lib/googleMaps'
import type { Transport, TransportMode } from '@/types'

export async function upsertTransport({
  fromPlaceId,
  toPlaceId,
  selectedMode,
  durationMinutes,
  cost,
}: {
  fromPlaceId: string
  toPlaceId: string
  selectedMode: TransportMode | null
  durationMinutes: number | null
  cost: number | null
}): Promise<{ transport?: Transport; error?: string }> {
  try {
    const supabase = await createServerClient()

    // 기존 transport 확인
    const { data: existingTransport, error: selectError } = await supabase
      .from('transports')
      .select('id')
      .eq('from_place_id', fromPlaceId)
      .eq('to_place_id', toPlaceId)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows found (정상)
      return { error: selectError.message }
    }

    let result

    if (existingTransport) {
      // Update 기존 transport
      const { data, error } = await supabase
        .from('transports')
        .update({
          selected_mode: selectedMode,
          duration_minutes: durationMinutes,
          cost,
        })
        .eq('id', existingTransport.id)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      result = data
    } else {
      // Insert 새 transport
      const { data, error } = await supabase
        .from('transports')
        .insert([
          {
            from_place_id: fromPlaceId,
            to_place_id: toPlaceId,
            selected_mode: selectedMode,
            duration_minutes: durationMinutes,
            cost,
          },
        ])
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      result = data
    }

    return { transport: result }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

const ROUTES_TRAVEL_MODE: Record<TransportMode, string> = {
  transit: 'TRANSIT',
  driving: 'DRIVE',
  walking: 'WALK',
}

export async function getDirectionsAction({
  fromLat,
  fromLng,
  toLat,
  toLng,
  mode,
}: {
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  mode: TransportMode
}): Promise<{ durationMinutes: number | null; cost: number | null; error?: string }> {
  try {
    console.log('api 확인')
    const apiKey = process.env.NEXT_GOOGLE_MAPS_SERVER_API_KEY
    if (!apiKey) {
      return { durationMinutes: null, cost: null, error: 'API 키가 설정되지 않았습니다' }
    }
    console.log('api 호출')
    const response = await fetch(ROUTES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.legs.duration,routes.travelAdvisory.transitFare',
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: fromLat, longitude: fromLng } } },
        destination: { location: { latLng: { latitude: toLat, longitude: toLng } } },
        travelMode: ROUTES_TRAVEL_MODE[mode],
      }),
    })
    console.log(response)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      console.error('[Routes API 403 원인]', JSON.stringify(errorBody, null, 2))
      return { durationMinutes: null, cost: null, error: `API 오류: ${response.status}` }
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      return { durationMinutes: null, cost: null, error: '경로를 찾을 수 없습니다' }
    }

    const leg = data.routes[0].legs[0]
    const durationSeconds = parseInt(leg.duration, 10)
    const durationMinutes = Math.round(durationSeconds / 60)

    let cost: number | null = null
    if (mode === 'transit' && data.routes[0].travelAdvisory?.transitFare) {
      cost = parseInt(data.routes[0].travelAdvisory.transitFare.units, 10)
    }

    return { durationMinutes, cost }
  } catch (error) {
    console.log(JSON.stringify(error))
    return { durationMinutes: null, cost: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
