import React from 'react'
import { Info } from 'lucide-react'

interface BehaviorComparisonProps {
  currentTraits: Record<number, number>
  targetTraits: Record<number, number>
  currentDate: string
  targetDate: string
  questions: Array<{
    id: number
    type: 'trait'
    leftTrait?: string
    rightTrait?: string
  }>
}

export function BehaviorComparison({ 
  currentTraits, 
  targetTraits, 
  currentDate,
  targetDate,
  questions 
}: BehaviorComparisonProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Comparação de Perfis Comportamentais
        </h2>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2" />
            <span>{formatDate(currentDate)}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-pink-500 rounded-full mr-2" />
            <span>{formatDate(targetDate)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map(question => {
          const currentValue = currentTraits[question.id] || 3
          const targetValue = targetTraits[question.id] || 3
          const currentPosition = ((currentValue - 1) / 4) * 100
          const targetPosition = ((targetValue - 1) / 4) * 100
          
          const getDifference = () => {
            const diff = Math.abs(currentValue - targetValue)
            if (diff <= 1) return 'small'
            if (diff <= 2) return 'medium'
            return 'large'
          }

          const differenceClass = {
            small: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            large: 'bg-red-100 text-red-800'
          }[getDifference()]

          return (
            <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">
                      {question.leftTrait} vs {question.rightTrait}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-xs ${differenceClass}`}>
                      {getDifference() === 'small' ? 'Alinhado' : 'Oportunidade de Desenvolvimento'}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {getTraitDescription(question.leftTrait!, question.rightTrait!)}
                  </p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <Info className="w-5 h-5" />
                </button>
              </div>

              <div className="relative h-8">
                <div className="absolute w-full h-1 bg-gray-200 top-1/2 transform -translate-y-1/2 rounded-full" />
                
                {/* Current Profile Indicator */}
                <div
                  className="absolute w-4 h-4 bg-indigo-600 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 shadow-md"
                  style={{ left: `${currentPosition}%` }}
                />
                
                {/* Target Profile Indicator */}
                <div
                  className="absolute w-4 h-4 bg-pink-500 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 shadow-md"
                  style={{ left: `${targetPosition}%` }}
                />

                {/* Scale Labels */}
                <div className="absolute w-full flex justify-between text-xs text-gray-500 mt-4">
                  <span>{question.leftTrait}</span>
                  <span>{question.rightTrait}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function getTraitDescription(leftTrait: string, rightTrait: string): string {
  // Add descriptions for each trait pair
  const descriptions: Record<string, string> = {
    'Crítico_Amigável': 'Equilíbrio entre análise crítica e abordagem amigável',
    'Orientado à qualidade_Orientado à velocidade': 'Balanço entre precisão e agilidade',
    'Autônomo_Trabalho em equipe': 'Capacidade de trabalhar independentemente vs. colaborativamente',
    // Add more descriptions as needed
  }
  
  return descriptions[`${leftTrait}_${rightTrait}`] || 'Análise comparativa dos traços comportamentais'
}