import React from 'react'
import { getProfileDescription } from '../utils/discCalculator'

interface DISCExecutiveSummaryProps {
  userName: string
  totalTime: number
  primaryProfile: string
  secondaryProfile: string
}

export function DISCExecutiveSummary({ 
  userName, 
  totalTime,
  primaryProfile,
  secondaryProfile 
}: DISCExecutiveSummaryProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-2xl mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Olá {userName},
      </h2>
      <p className="text-lg text-gray-700 mb-6 leading-relaxed">
        Você nos revelou um perfil profissional único. Seu estilo predominante 
        combina {primaryProfile === 'I' ? 'influência' : 'dinamismo'} com 
        {secondaryProfile === 'D' ? ' assertividade' : 
          secondaryProfile === 'I' ? ' sociabilidade' : 
          secondaryProfile === 'S' ? ' estabilidade' : ' precisão'}, 
        indicando uma forte capacidade de inspirar e motivar pessoas.
      </p>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">Principais Características:</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {getProfileCharacteristics(primaryProfile).map((char, index) => (
            <li key={index}>{char}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function getProfileCharacteristics(profile: string): string[] {
  const characteristics = {
    D: [
      'Focado em resultados e metas',
      'Decisivo e direto nas ações',
      'Natural capacidade de liderança'
    ],
    I: [
      'Comunicativo e entusiasta',
      'Focado em construir relações',
      'Naturalmente criativo'
    ],
    S: [
      'Consistente e confiável',
      'Excelente trabalho em equipe',
      'Forte senso de cooperação'
    ],
    C: [
      'Analítico e preciso',
      'Foco em qualidade e detalhes',
      'Excelente capacidade de planejamento'
    ]
  }

  return characteristics[profile as keyof typeof characteristics] || []
}