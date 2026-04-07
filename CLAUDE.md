@AGENTS.md
# 여행 계획 웹 앱 - Travel Planner

## 프로젝트 개요
여행 일정을 관리하고, 이동 수단/비용/지도를 한눈에 볼 수 있는 웹 앱.
동행자와 함께 예산을 관리하고 정산까지 할 수 있음.

---

## 기술 스택
| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript |
| DB / 백엔드 | Supabase (PostgreSQL) |
| 스타일링 | Tailwind CSS |
| 지도 | Google Maps JavaScript API |
| 경로 / 이동시간 | Google Directions API |
| 장소 검색 | Google Places API |
| 배포 | Vercel |

---

## 환경변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## 폴더 구조
```
src/
├── app/                  # Next.js App Router 페이지
│   ├── page.tsx          # 메인 (여행 목록)
│   ├── trips/
│   │   ├── new/          # 새 여행 만들기
│   │   └── [id]/         # 여행 상세 페이지
├── components/           # 재사용 컴포넌트
│   ├── trip/             # 일정 관련
│   ├── map/              # 지도 관련
│   ├── budget/           # 예산 관련
│   └── common/           # 공통 UI
├── lib/
│   ├── supabase.ts       # Supabase 클라이언트
│   └── googleMaps.ts     # Google Maps 유틸
├── types/                # TypeScript 타입 정의
└── hooks/                # 커스텀 훅
```

---

## DB 스키마

### trips (여행)
```sql
create table trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  destination text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now()
);
```

### members (여행 멤버)
```sql
create table members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  nickname text not null,
  created_at timestamptz default now()
);
```

### days (일차)
```sql
create table days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_number integer not null,
  date date not null
);
```

### places (목적지)
```sql
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
```

### transport (이동 수단)
```sql
create table transport (
  id uuid primary key default gen_random_uuid(),
  from_place_id uuid references places(id) on delete cascade,
  to_place_id uuid references places(id) on delete cascade,
  selected_mode text, -- 'transit' | 'driving' | 'walking' | 'train'
  duration_minutes integer,
  cost integer
);
```

### events (고정 이벤트: 항공편, 식당 예약 등)
```sql
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
```

### accommodations (숙소)
```sql
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
```

### expenses (지출 내역)
```sql
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
```

---

## 핵심 비즈니스 로직

### 항공편 시간 계산
- `scheduled_at`이 입력되면 `recommend_arrive_at = scheduled_at - 3시간` 자동 저장
- UI에서 "공항 도착 권장 시간: OO:OO" 으로 표시
- 이전 일정과 비교해서 타이트하면 경고 표시

### 예산 정산 로직
- 각 지출 항목마다 `paid_by`(결제자)와 `split_count`(분할 인원) 저장
- 1인당 부담액 = `amount / split_count`
- 멤버별 총 지출액 vs 총 부담액 비교
- 정산 결과: "A는 B에게 N원 보내야 함" 형태로 계산

---

## 개발 로드맵

### ✅ Phase 1 (MVP) - 현재 진행 중
- [x] 프로젝트 초기 세팅 (Next.js + Supabase 연결)
- [x] DB 스키마 적용 (모든 테이블 생성 완료)
- [x] 여행 생성 폼 (제목, 날짜 입력 기능 완료)
  - [ ] 멤버 등록 기능 추가 필요
- [ ] 여행 목록 조회 UI
- [ ] 여행 상세 페이지 (기본 틀만 구현)
- [ ] 일차별 목적지 추가 / 삭제 / 순서 변경
- [ ] Google Maps에 경로 시각화
- [ ] 이동 수단별 소요 시간 / 비용 표시

### 📋 Phase 2
- [ ] 고정 이벤트 등록 (항공편, 식당 예약)
- [ ] 항공편 3시간 전 도착 권유 표시
- [ ] 숙소 정보 등록 및 지도 표시
- [ ] 목적지별 정보 등록 (티켓 링크, 운영시간 등)

### 📋 Phase 3
- [ ] 예산 관리 (지출 입력, 결제자 지정)
- [ ] 멤버별 지출 현황 및 정산 결과
- [ ] 날씨 연동

### 📋 Phase 4
- [ ] AI 일정 추천
- [ ] 공유 & 협업 (링크 공유)

---

## 코딩 컨벤션
- TypeScript strict 모드 사용
- 컴포넌트: `src/components/` 하위 도메인별 폴더로 분리
- Supabase 클라이언트: `src/lib/supabase.ts` 에서만 import
- 타입 정의: `src/types/index.ts` 에 중앙 관리
- 서버 컴포넌트 기본, 상호작용 필요한 경우만 `'use client'`

---

## 참고 사항
- Google Maps API는 `@vis.gl/react-google-maps` 라이브러리 사용
- Supabase Row Level Security (RLS) 는 초기엔 비활성화, 인증 추가 시 설정
- 지출 금액 단위는 원(KRW) 기준