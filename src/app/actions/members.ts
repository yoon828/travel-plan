'use server'

import { createServerClient } from '@/lib/supabase'
import type { Member } from '@/types'

export async function addMember({
  tripId,
  nickname,
}: {
  tripId: string
  nickname: string
}): Promise<{ member?: Member; error?: string }> {
  try {
    const supabase = await createServerClient()
    const trimmedNickname = nickname.trim()

    // 중복 멤버 확인
    const { data: existingMembers, error: checkError } = await supabase
      .from('members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('nickname', trimmedNickname)

    if (checkError) {
      return { error: checkError.message }
    }

    if (existingMembers && existingMembers.length > 0) {
      return { error: '이미 추가된 멤버입니다' }
    }

    // 멤버 추가
    const { data, error } = await supabase
      .from('members')
      .insert([
        {
          trip_id: tripId,
          nickname: trimmedNickname,
        },
      ])
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    return { member: data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function removeMember(memberId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from('members').delete().eq('id', memberId)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
