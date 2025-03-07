import React from 'react'

interface BehaviorFrequencyTraitProps {
  trait: string
  frequency: string
  value: number
}

export function BehaviorFrequencyTrait({ trait, frequency, value }: BehaviorFrequencyTraitProps) {
  const position = ((value - 1) / 4) * 100

  return (
    <div className="flex flex-col mb-8">
      <h3 className="text-lg font-medium text-gray-900">{trait}</h3>
      <p className="text-base text-gray-700 mb-6">Frequência atual: {frequency}</p>
      
      <div className="relative h-2 mb-4">
        <div className="h-1 bg-gray-200 absolute w-full top-1/2 transform -translate-y-1/2 rounded-full"></div>
        <div
          className="absolute w-6 h-6 bg-indigo-500 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 border-2 border-white shadow"
          style={{ left: `${position}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <span>Nunca {trait.toLowerCase()}</span>
        <span>Sempre {trait.toLowerCase()}</span>
      </div>
    </div>
  )
}