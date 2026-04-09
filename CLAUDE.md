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
│   │   └── [id]/         # 여행 상세 페이지
│   │       └── route/    # 경로 시각화 페이지 (/trips/[id]/route)
├── components/           # 재사용 컴포넌트
│   ├── trip/             # 일정 관련
│   ├── map/              # 지도/경로 관련
│   │   ├── RouteView.tsx      # 경로 페이지 최상위 (APIProvider + 레이아웃)
│   │   ├── TripMap.tsx        # 지도 렌더링 (Marker + Polyline)
│   │   ├── DaySelector.tsx    # Day 탭 선택 UI
│   │   └── PlaceItinerary.tsx # 목적지 순서 목록 패널
│   ├── budget/           # 예산 관련
│   └── common/           # 공통 UI
├── lib/
│   ├── supabase.ts       # 서버 컴포넌트용 Supabase 클라이언트
│   ├── supabase.client.ts # 클라이언트 컴포넌트용 Supabase 클라이언트
│   └── googleMaps.ts     # Google Maps 유틸 (API 키, 색상 상수 등)
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
  - [x] 멤버 등록 기능 추가 필요
  - [ ] 오른쪽에 확정 버튼을 눌러서 멤버를 더이상 수정할 수 없도록 기능 추가 
- [x] 여행 목록 조회 UI (사이드바에서 구현)
- [x] 여행 상세 페이지
- [ ] 여행 하는 나라의 화폐 단위를 입력 받아서 실시간 환율 정보 제공
- [x] 일차별 목적지 추가 / 삭제 / 순서 변경
  - [x] 목적지 카테고리는 식당, 카페, 관광지, 숙소, 공항으로 구분
  - [x] 목적지는 google map에서 검색해서 검색된 장소 이름으로 등록 (기본)
  - [x] google map에 장소가 없는 경우에만 일반 텍스트로 입력 받아서 등록
  - [x] 목적지 수정
- [x] Google Maps에 경로 시각화
  - [x] 경로는 상세 페이지에서 바로 보이는게 아닌, "경로보기" 버튼을 누르면 `/trips/[id]/route` 경로 페이지로 이동
  - [x] 각 목적지마다 마커 표기 및 Polyline으로 연결해서 보여주기
  - [x] 지도 옆에 목적지 순서 표기 (PlaceItinerary 패널)
  - [x] @vis.gl/react-google-maps 기존 라이브러리 유지 (Google Directions API 연동 고려)
- [ ] 이동 수단별 소요 시간 / 비용 표시
  - [ ] 대중교통, 자가용, 도보 case 존재
  - [ ] 대중교통을 이용하는 경우에만 비용 표기 
- [ ] mobile 에서도 확인가능하도록 반응형 컴포넌트 구현 

### 📋 Phase 2
- [ ] 항공편 3시간 전 도착 권유 표시
  - [ ] 목적지의 카테고리가 공항이라면 비행기 시간을 입력받기
  - [ ] "{비행기 시간의 3시간 전}시 도착 필수!" 라고 보여주기
- [ ] 숙소 정보 등록 및 지도 표시 (지도에는 항상 표기)
- [ ] 지도 옆에 목록에서 목적지 순서 변경할 수 있도록 수정
- [ ] 지도에 순서와 라인을 보여주는 걸 on/off할 수 있도록 할 수 있는 기능

### 📋 Phase 3
- [ ] 예산 관리 (지출 입력, 결제자 지정)
  - [ ] 예산 관리 페이지가 따로 존재  
- [ ] 멤버별 지출 현황 및 정산 결과
- [ ] 날씨 연동

### 📋 Phase 4
- [ ] AI 일정 추천
- [ ] 링크 공유 기능
- [ ] 현재 날짜와 여행 날짜가 일치하면 해당되는 탭 보여주기
  - [ ] 여행 상세 페이지 진입할 때 판단
  - 예) 여행 날짜 : 11/1 ~ 11/3 , 현재 날짜 11/3 이면 마지막 Day tab으로 바로 로딩되도록

---

## 브랜치 전략 (GitHub Flow)

```
main                        ← 배포 브랜치 (항상 배포 가능 상태 유지)
├── feature/trip-form       ← 기능 개발
├── fix/expense-bug         ← 버그 수정
├── refactor/supabase-query ← 리팩토링
└── chore/env-setup         ← 설정 변경
```

### 브랜치 네이밍 규칙

| prefix | 용도 | PR 대상 |
|--------|------|---------|
| `feature/` | 새 기능 개발 | `main` |
| `fix/` | 버그 수정 | `main` |
| `refactor/` | 리팩토링 | `main` |
| `chore/` | 설정, 패키지, 문서 | `main` |

### 규칙
- IMPORTANT 모든 작업은 `main`에서 브랜치를 파고 시작 [important ]
- 브랜치 수명은 짧게 유지 (1~3일 이내 merge 권장)
- `main`에 직접 push 금지, 반드시 PR을 통해 merge
- merge 완료 후 브랜치 즉시 삭제

---

## 코딩 컨벤션
- TypeScript strict 모드 사용
- 컴포넌트: `src/components/` 하위 도메인별 폴더로 분리
- Supabase 클라이언트: `src/lib/supabase.ts` 에서만 import
- 타입 정의: `src/types/index.ts` 에 중앙 관리
- 서버 컴포넌트 기본, 상호작용 필요한 경우만 `'use client'`
- `useState` 사용 시 항상 제너릭 타입 명시: `useState<Type>(initialValue)`

---

## 참고 사항
- Google Maps API는 `@vis.gl/react-google-maps` 라이브러리 사용
- Supabase Row Level Security (RLS) 는 초기엔 비활성화, 인증 추가 시 설정
- 지출 금액 단위는 원(KRW) 기준