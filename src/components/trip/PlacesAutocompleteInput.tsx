'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import type { AutocompletePlaceResult } from '@/types'

interface PlacesAutocompleteInputProps {
  onPlaceSelect: (place: AutocompletePlaceResult) => void
  disabled?: boolean
  placeholder?: string
}

export function PlacesAutocompleteInput({
  onPlaceSelect,
  disabled = false,
  placeholder = '장소를 검색하세요...',
}: PlacesAutocompleteInputProps) {
  const [inputValue, setInputValue] = useState<string>('')
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([])
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(
    null
  )
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isComposingRef = useRef<boolean>(false)
  const latestRequestIdRef = useRef<number>(0)

  // Google Maps API 초기화
  useEffect(() => {
    if (!window.google?.maps?.places) {
      console.error('Google Maps Places API not loaded')
      return
    }

    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()

    // PlacesService는 map이 필요하지만, getDetails()에는 map이 필수가 아님
    const tempDiv = document.createElement('div')
    const tempMap = new window.google.maps.Map(tempDiv, {
      center: { lat: 37.5665, lng: 126.978 },
      zoom: 12,
    })
    placesServiceRef.current = new window.google.maps.places.PlacesService(tempMap)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      // Google Maps 리소스 정리
      autocompleteServiceRef.current = null
      placesServiceRef.current = null
    }
  }, [])

  // 드롭다운 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const triggerSearch = (value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!value.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!autocompleteServiceRef.current) return

      setIsLoading(true)

      // Race condition 방지: 이 요청의 ID를 저장
      const currentRequestId = ++latestRequestIdRef.current

      try {
        const response =
          await autocompleteServiceRef.current.getPlacePredictions({
            input: value,
          })

        // 응답이 도착했을 때 이것이 최신 요청인지 확인
        if (currentRequestId === latestRequestIdRef.current) {
          setSuggestions(response.predictions)
          setShowDropdown(true)
        }
      } catch (error) {
        console.error('Autocomplete error:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 150)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // IME 조합 중이면 검색 트리거 건너뜀
    if (isComposingRef.current) {
      return
    }

    triggerSearch(value)
  }

  const handlePlaceSelect = async (
    prediction: google.maps.places.AutocompletePrediction
  ) => {
    if (!placesServiceRef.current || !prediction.place_id) return

    setIsLoading(true)

    try {
      const result = await new Promise<google.maps.places.PlaceResult>(
        (resolve, reject) => {
          placesServiceRef.current!.getDetails(
            {
              placeId: prediction.place_id,
              fields: ['name', 'formatted_address', 'geometry'],
            },
            (result, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
                resolve(result)
              } else {
                reject(new Error(`Place details error: ${status}`))
              }
            }
          )
        }
      )

      const place: AutocompletePlaceResult = {
        name: result.name || '',
        address: result.formatted_address || '',
        lat: result.geometry?.location?.lat() ?? null,
        lng: result.geometry?.location?.lng() ?? null,
      }

      setInputValue(place.name)
      setSuggestions([])
      setShowDropdown(false)
      onPlaceSelect(place)
    } catch (error) {
      console.error('Place details error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompositionStart = () => {
    isComposingRef.current = true
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false
    const value = e.currentTarget.value
    triggerSearch(value)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        disabled={disabled}
        className="w-full"
      />

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-input bg-popover shadow-md"
        >
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handlePlaceSelect(prediction)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <div className="font-medium">{prediction.description?.split(',')[0]}</div>
              <div className="text-xs text-muted-foreground">
                {prediction.description}
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )}
    </div>
  )
}
