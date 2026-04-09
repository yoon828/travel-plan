export interface Trip {
  id: string
  created_at: string
  title: string
  start_date: string
  end_date: string
}

export interface Member {
  id: string
  created_at: string
  trip_id: string
  nickname: string
}

export interface Day {
  id: string
  trip_id: string
  day_number: number
  date: string
  places?: Place[]
  transports?: Transport[]
}

export type PlaceCategory = 'restaurant' | 'cafe' | 'attraction' | 'accommodation' | 'airport'

export interface AutocompletePlaceResult {
  name: string
  address: string
  lat: number | null
  lng: number | null
}

export interface Place {
  id: string
  created_at: string
  day_id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  order_index: number
  memo: string | null
  ticket_url: string | null
  open_hours: string | null
  category: PlaceCategory | null
}

export type TransportMode = 'transit' | 'driving' | 'walking'

export interface Transport {
  id: string
  from_place_id: string
  to_place_id: string
  selected_mode: TransportMode | null
  duration_minutes: number | null
  cost: number | null
}

export type EventType = 'flight' | 'restaurant' | 'etc'

export interface Event {
  id: string
  trip_id: string
  day_id: string
  type: EventType
  title: string
  scheduled_at: string
  location: string | null
  reservation_code: string | null
  memo: string | null
  is_flight: boolean
  recommend_arrive_at: string | null
}

export interface Accommodation {
  id: string
  trip_id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  check_in_date: string | null
  check_out_date: string | null
  check_in_time: string | null
  check_out_time: string | null
  reservation_code: string | null
  memo: string | null
  cost: number | null
}

export type ExpenseCategory = 'transport' | 'food' | 'ticket' | 'accommodation' | 'etc'

export interface Expense {
  id: string
  created_at: string
  trip_id: string
  day_id: string | null
  paid_by: string | null
  title: string
  amount: number
  category: ExpenseCategory | null
  split_count: number | null
}
