'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface DaySelectorProps {
  days: { day_number: number; date: string }[]
  selectedDayIndex: number
  onChange: (dayIndex: number) => void
}

export function DaySelector({
  days,
  selectedDayIndex,
  onChange,
}: DaySelectorProps) {
  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex gap-2 p-4 overflow-x-auto">
        {days.map((day, index) => (
          <button
            key={day.day_number}
            onClick={() => onChange(index)}
            className={`px-4 py-2 whitespace-nowrap rounded-lg transition-colors ${
              selectedDayIndex === index
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="font-medium">Day {day.day_number}</div>
            <div className="text-xs opacity-80">
              {format(new Date(day.date), 'MM.dd', { locale: ko })}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
