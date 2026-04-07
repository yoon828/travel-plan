-- ================================================
-- Travel Planner - DB Schema
-- RLS는 인증 기능 추가 시 설정 예정
-- ================================================

-- trips (여행)
create table trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now()
);

-- members (여행 멤버)
create table members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  nickname text not null,
  created_at timestamptz default now()
);

-- days (일차)
create table days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_number integer not null,
  date date not null
);

-- places (목적지)
create table places (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references days(id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  order_index integer not null,
  memo text,
  ticket_url text,
  open_hours text,
  created_at timestamptz default now()
);

-- transport (이동 수단)
create table transport (
  id uuid primary key default gen_random_uuid(),
  from_place_id uuid references places(id) on delete cascade,
  to_place_id uuid references places(id) on delete cascade,
  selected_mode text, -- 'transit' | 'driving' | 'walking' | 'train'
  duration_minutes integer,
  cost integer
);

-- events (고정 이벤트: 항공편, 식당 예약 등)
create table events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_id uuid references days(id) on delete cascade,
  type text not null, -- 'flight' | 'restaurant' | 'etc'
  title text not null,
  scheduled_at timestamptz not null,
  location text,
  reservation_code text,
  memo text,
  -- 항공편 전용
  is_flight boolean default false,
  recommend_arrive_at timestamptz -- scheduled_at - 3시간 자동 계산
);

-- accommodations (숙소)
create table accommodations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  check_in_date date,
  check_out_date date,
  check_in_time time,
  check_out_time time,
  reservation_code text,
  memo text,
  cost integer
);

-- expenses (지출 내역)
create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_id uuid references days(id),
  paid_by uuid references members(id), -- 결제한 멤버
  title text not null,
  amount integer not null,
  category text, -- 'transport' | 'food' | 'ticket' | 'accommodation' | 'etc'
  split_count integer, -- 나눌 인원수 (전체 or 일부)
  created_at timestamptz default now()
);

-- ================================================
-- 인덱스
-- ================================================
create index idx_members_trip_id on members(trip_id);
create index idx_days_trip_id on days(trip_id);
create index idx_places_day_id on places(day_id);
create index idx_transport_from_place on transport(from_place_id);
create index idx_transport_to_place on transport(to_place_id);
create index idx_events_trip_id on events(trip_id);
create index idx_events_day_id on events(day_id);
create index idx_accommodations_trip_id on accommodations(trip_id);
create index idx_expenses_trip_id on expenses(trip_id);
create index idx_expenses_paid_by on expenses(paid_by);
