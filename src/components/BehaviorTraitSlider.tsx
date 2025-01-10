import React from 'react'

interface BehaviorTraitSliderProps {
  leftTrait: string
  rightTrait: string
  value: number
  readOnly?: boolean
  onChange?: (value: number) => void
}

export function BehaviorTraitSlider({
  leftTrait,
  rightTrait,
  value,
  readOnly = true,
  onChange
}: BehaviorTraitSliderProps) {
  const position = ((value - 1) / 4) * 100 // Convert 1-5 scale to 0-100%

  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>{leftTrait}</span>
        <span>{rightTrait}</span>
      </div>
      <div className="relative">
        <div className="h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 rounded-full" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full cursor-pointer transform -translate-x-1/2 transition-all shadow-md"
          style={{ left: `${position}%` }}
        />
        {!readOnly && (
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={value}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        )}
      </div>
    </div>
  )
}