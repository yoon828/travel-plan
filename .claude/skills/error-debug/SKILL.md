---
name: error-debug
description: 에러가 발생했을 때 원인을 파악하고 단계적으로 해결한다. 에러 메시지, 스택 트레이스, 콘솔 로그를 분석할 때 자동 적용
---

# Error Debug Skill

## 역할
에러를 단순히 수정하는 것이 아니라, **왜 발생했는지 원인을 파악**하고
**재발하지 않도록 근본적으로 해결**하는 것이 목표다.

---

## Step 1. 에러 파악 (분석)

에러를 전달받으면 아래 순서로 분석한다.

### 1-1. 에러 유형 분류
에러 메시지를 보고 아래 중 어떤 유형인지 먼저 판단한다.

| 유형 | 예시 |
|------|------|
| **TypeError** | `Cannot read properties of undefined` |
| **ReferenceError** | `is not defined` |
| **Network Error** | `Failed to fetch`, CORS, 404, 500 |
| **Supabase Error** | `relation does not exist`, RLS 정책 차단 |
| **Google Maps Error** | `InvalidKeyMapError`, `ApiNotActivatedMapError` |
| **Next.js Error** | Hydration mismatch, `useClient` 누락 |
| **TypeScript Error** | 타입 불일치, `null` 가능성 미처리 |
| **Build Error** | import 경로 오류, 환경변수 누락 |

### 1-2. 에러 발생 위치 파악
스택 트레이스에서 아래 정보를 추출한다.
- 어느 파일, 몇 번째 줄에서 발생했는가
- 어떤 함수/컴포넌트에서 발생했는가
- 에러가 처음 발생한 지점 vs 전파된 지점 구분

### 1-3. 재현 조건 파악
- 항상 발생하는가, 특정 조건에서만 발생하는가
- 특정 데이터 입력 시에만 발생하는가
- 빌드 시 발생하는가, 런타임에 발생하는가

### 1-4. 원인 가설 수립
분석 결과를 바탕으로 가능한 원인을 **우선순위 순서**로 나열한다.
```
원인 1 (가능성 높음): ...
원인 2 (가능성 중간): ...
원인 3 (가능성 낮음): ...
```

---

## Step 2. 에러 해결

### 2-1. 해결 전 체크리스트
수정 코드를 작성하기 전에 반드시 확인한다.
- [ ] 관련 파일을 직접 읽었는가 (`Read` 도구 사용)
- [ ] 에러가 발생한 정확한 라인을 확인했는가
- [ ] 수정이 다른 파일에 영향을 주는지 파악했는가

### 2-2. 해결 방식 선택
에러 유형에 따라 아래 방식으로 해결한다.

**TypeError / ReferenceError**
```typescript
// ❌ 잘못된 접근 - 바로 접근
const name = user.profile.name

// ✅ 올바른 접근 - 옵셔널 체이닝 + 기본값
const name = user?.profile?.name ?? '이름 없음'
```

**Supabase 에러**
```typescript
// 에러 코드별 처리
const { data, error } = await supabase.from('trips').select('*')

if (error) {
  // PGRST116: 결과 없음 (정상 케이스)
  if (error.code === 'PGRST116') return null
  // 42501: RLS 정책 차단
  if (error.code === '42501') throw new Error('권한이 없습니다')
  // 그 외 DB 에러
  throw new Error(`DB 오류: ${error.message}`)
}
```

**Google Maps 에러**
```
InvalidKeyMapError     → API 키 확인, 환경변수 로드 확인
ApiNotActivatedMapError → Google Cloud Console에서 해당 API 활성화 필요
RefererNotAllowedMapError → API 키 도메인 제한 설정 확인
```

**Next.js Hydration 에러**
```typescript
// ❌ 서버/클라이언트 불일치
const time = new Date().toLocaleString()

// ✅ 클라이언트에서만 렌더링
const [time, setTime] = useState('')
useEffect(() => {
  setTime(new Date().toLocaleString())
}, [])
```

**환경변수 누락**
```typescript
// 환경변수 유효성 검사를 src/lib/env.ts에서 중앙 관리
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
]

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`환경변수 누락: ${key}`)
  }
})
```

### 2-3. 수정 후 검증
수정 코드 작성 후 반드시 아래를 확인한다.
- 수정한 부분이 에러 원인을 직접적으로 해결하는가
- 수정으로 인해 다른 곳이 깨지지 않는가
- 동일한 패턴의 에러가 다른 파일에도 있는지 검색

---

## Step 3. 에러 재발 방지

에러를 해결한 후 아래 중 해당하는 것을 적용한다.

### 재발 방지 패턴

**1. 에러 바운더리 추가** (컴포넌트 에러)
```typescript
// src/components/common/ErrorBoundary.tsx 생성 또는 활용
```

**2. 공통 에러 핸들러** (Supabase 반복 패턴)
```typescript
// src/lib/supabase.ts에 공통 핸들러 추가
export async function supabaseQuery<T>(
  query: Promise<{ data: T | null; error: unknown }>
): Promise<T> {
  const { data, error } = await query
  if (error) throw error
  if (!data) throw new Error('데이터 없음')
  return data
}
```

**3. TypeScript 타입 보강** (타입 에러 반복 시)
```typescript
// src/types/index.ts에 타입 추가 또는 수정
```

---

## 응답 형식

에러를 분석하고 해결할 때 항상 아래 형식으로 응답한다.

```
## 에러 분석
- 유형: (에러 유형)
- 발생 위치: (파일명, 라인)
- 원인: (근본 원인 설명)

## 해결 방법
(수정 코드)

## 재발 방지
(추가 조치 또는 주의사항)
```

---

## 주의사항
- 에러 메시지만 보고 바로 코드 수정하지 말 것 → 반드시 파일을 먼저 읽을 것
- 증상만 없애는 임시방편 금지 → 근본 원인 해결
- 수정 범위는 최소화 → 에러와 관련 없는 코드는 건드리지 말 것
- 여러 원인이 의심될 경우 → 가장 가능성 높은 것부터 하나씩 검증