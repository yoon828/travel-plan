'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { upsertTransport, getDirectionsAction } from '@/app/actions/transports'
import type { Place, Transport, TransportMode } from '@/types'

interface TransportSelectorProps {
  fromPlace: Place
  toPlace: Place
  existingTransport: Transport | undefined
  onTransportSaved: (transport: Transport) => void
}

const TRANSPORT_MODES = [
  { value: 'transit' as TransportMode, label: '대중교통', icon: '🚌' },
  { value: 'driving' as TransportMode, label: '자가용', icon: '🚗' },
  { value: 'walking' as TransportMode, label: '도보', icon: '🚶' },
] as const

export function TransportSelector({
  fromPlace,
  toPlace,
  existingTransport,
  onTransportSaved,
}: TransportSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(
    existingTransport?.selected_mode || null
  )
  const [durationMinutes, setDurationMinutes] = useState<number | null>(
    existingTransport?.duration_minutes || null
  )
  const [cost, setCost] = useState<number | null>(existingTransport?.cost || null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCostInput, setShowCostInput] = useState(existingTransport?.cost !== null && existingTransport?.cost !== undefined)
  const [error, setError] = useState<string | null>(null)

  const handleModeSelect = async (mode: TransportMode) => {
    setSelectedMode(mode)
    setIsLoading(true)
    setError(null)

    // 유효한 좌표 확인
    if (!fromPlace.lat || !fromPlace.lng || !toPlace.lat || !toPlace.lng) {
      setError('출발지/도착지 좌표가 없습니다')
      setIsLoading(false)
      return
    }

    console.log('api 호출')
    // Routes API 호출 (서버에서 실행)
    const result = await getDirectionsAction({
      fromLat: fromPlace.lat,
      fromLng: fromPlace.lng,
      toLat: toPlace.lat,
      toLng: toPlace.lng,
      mode,
    })
    console.log(3, result)

    if (result.error) {
      setError(result.error)
    } else if (result.durationMinutes) {
      setDurationMinutes(result.durationMinutes)

      // 대중교통인 경우만 비용 처리
      if (mode === 'transit') {
        if (result.cost) {
          // API에서 fare 정보가 있으면 자동 설정
          setCost(result.cost)
          setShowCostInput(false)
        } else {
          // fare 정보가 없으면 수동 입력 필드 표시
          setCost(null)
          setShowCostInput(true)
        }
      } else {
        // 대중교통이 아니면 비용 초기화
        setCost(null)
        setShowCostInput(false)
      }
    }

    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!selectedMode || !durationMinutes) {
      setError('이동 수단과 소요 시간이 필요합니다')
      return
    }

    // 대중교통인데 비용 입력 필드가 표시되었지만 값이 없는 경우
    if (selectedMode === 'transit' && showCostInput && !cost) {
      setError('대중교통 비용을 입력해주세요')
      return
    }

    setIsLoading(true)
    const result = await upsertTransport({
      fromPlaceId: fromPlace.id,
      toPlaceId: toPlace.id,
      selectedMode,
      durationMinutes,
      cost: selectedMode === 'transit' ? cost : null,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.transport) {
      onTransportSaved(result.transport)
    }

    setIsLoading(false)
  }

  return (
    <div className="border-l-4 border-amber-300 pl-4 py-3 space-y-3 bg-amber-50">
      {/* 경로 표시 */}
      <div className="text-sm font-medium text-muted-foreground">
        {fromPlace.name} → {toPlace.name}
      </div>

      {/* 이동 수단 선택 */}
      <div className="flex gap-2">
        {TRANSPORT_MODES.map((mode) => (
          <Button
            key={mode.value}
            variant={selectedMode === mode.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeSelect(mode.value)}
            disabled={isLoading || !fromPlace.lat || !fromPlace.lng || !toPlace.lat || !toPlace.lng}
            className="gap-1"
          >
            {isLoading && selectedMode === mode.value && (
              <Loader2 className="w-3 h-3 animate-spin" />
            )}
            {mode.icon} {mode.label}
          </Button>
        ))}
      </div>

      {/* 소요 시간 표시 */}
      {durationMinutes && (
        <Badge variant="secondary">
          ⏱️ {durationMinutes}분
        </Badge>
      )}

      {/* 비용 입력 (대중교통이고 fare 정보가 없을 때만) */}
      {selectedMode === 'transit' && showCostInput && (
        <div className="space-y-1">
          <label className="text-sm font-medium">비용 (원)</label>
          <Input
            type="number"
            placeholder="예: 2500"
            value={cost || ''}
            onChange={(e) => setCost(e.target.value ? parseInt(e.target.value, 10) : null)}
            disabled={isLoading}
            min="0"
          />
        </div>
      )}

      {/* 자동 설정된 비용 표시 (fare 정보가 있을 때) */}
      {selectedMode === 'transit' && cost && !showCostInput && (
        <Badge variant="secondary">
          💰 {cost}원
        </Badge>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* 저장 버튼 */}
      {selectedMode && durationMinutes && (
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading || (selectedMode === 'transit' && showCostInput && !cost)}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              저장 중...
            </>
          ) : (
            '저장'
          )}
        </Button>
      )}
    </div>
  )
}
