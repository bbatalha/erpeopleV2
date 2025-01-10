import React from 'react'

interface BehaviorFrequencyTraitProps {
  trait: string
  frequency: string
  value: number
}

export function BehaviorFrequencyTrait({ trait, frequency, value }: BehaviorFrequencyTraitProps) {
  const position = ((value - 1) / 3) * 100

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <h3 className="text-base font-medium text-gray-900">{trait}</h3>
      <p className="text-sm text-gray-600 mb-4">Frequência atual: {frequency}</p>
      
      <div className="relative">
        <div className="h-1 bg-blue-100 rounded-full" />
        <div
          className="absolute w-3 h-3 bg-indigo-600 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${position}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Nunca {trait}</span>
        <span>Sempre {trait}</span>
      </div>
    </div>
  )
}