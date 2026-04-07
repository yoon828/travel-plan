'use server'

import { createServerClient } from '@/lib/supabase'
import type { Trip } from '@/types'

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

    return { trip: data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
