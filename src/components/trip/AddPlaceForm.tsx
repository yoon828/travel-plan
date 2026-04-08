'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { addPlace } from '@/app/actions'
import type { Place, PlaceCategory, AutocompletePlaceResult } from '@/types'
import { PLACE_CATEGORIES } from '@/lib/googleMaps'
import { PlacesAutocompleteInput } from './PlacesAutocompleteInput'

interface AddPlaceFormProps {
  dayId: string
  onPlaceAdded: (place: Place) => void
  onCancel: () => void
}

interface PlaceFormData {
  name: string
  address: string
  memo: string
  lat: number | null
  lng: number | null
  category: PlaceCategory | null
  isManualInput: boolean
}

export function AddPlaceForm({ dayId, onPlaceAdded, onCancel }: AddPlaceFormProps) {
  const [formData, setFormData] = useState<PlaceFormData>({
    name: '',
    address: '',
    memo: '',
    lat: null,
    lng: null,
    category: null,
    isManualInput: false,
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handlePlaceSelect = (place: AutocompletePlaceResult) => {
    setFormData((prev) => ({
      ...prev,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
    }))
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCategorySelect = (category: PlaceCategory) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category === category ? null : category,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('장소 이름을 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const result = await addPlace({
        dayId,
        name: formData.name,
        address: formData.address || undefined,
        memo: formData.memo || undefined,
        lat: formData.lat ?? undefined,
        lng: formData.lng ?? undefined,
        category: formData.category || undefined,
      })

      if (result.error) {
        alert(`장소 추가 실패: ${result.error}`)
        return
      }

      if (result.place) {
        onPlaceAdded(result.place)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 카테고리 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">카테고리</label>
        <div className="flex flex-wrap gap-2">
          {PLACE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleCategorySelect(cat.value as PlaceCategory)}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                formData.category === cat.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background hover:bg-accent'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 장소 입력 섹션 */}
      {!formData.isManualInput ? (
        <div className="space-y-2">
          <label htmlFor="autocomplete" className="text-sm font-medium">
            장소 검색
          </label>
          <PlacesAutocompleteInput
            onPlaceSelect={handlePlaceSelect}
            disabled={isLoading}
            placeholder="장소를 검색하세요..."
          />
          {formData.name && (
            <div className="rounded-lg border border-input bg-muted p-3 text-sm">
              <div className="font-medium">{formData.name}</div>
              {formData.address && (
                <div className="text-xs text-muted-foreground">{formData.address}</div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                isManualInput: true,
                name: '',
                address: '',
                lat: null,
                lng: null,
              }))
            }
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            장소가 없는 경우 직접 입력 →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            장소 이름 *
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="장소 이름을 입력하세요"
            value={formData.name}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
          <Input
            name="address"
            type="text"
            placeholder="주소 (선택)"
            value={formData.address}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                isManualInput: false,
                name: '',
                address: '',
              }))
            }
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            ← Google 검색으로 돌아가기
          </button>
        </div>
      )}

      {/* 공통 메모 필드 */}
      <div className="space-y-2">
        <label htmlFor="memo" className="text-sm font-medium">
          메모
        </label>
        <Textarea
          id="memo"
          name="memo"
          placeholder="메모를 입력하세요 (선택)"
          value={formData.memo}
          onChange={handleInputChange}
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading || !formData.name.trim()}
          className="flex-1"
        >
          {isLoading ? '추가 중...' : '추가'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          취소
        </Button>
      </div>
    </form>
  )
}
