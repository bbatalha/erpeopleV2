import React from 'react'
import { Brain, Clock } from 'lucide-react'

interface DISCReportHeaderProps {
  userName: string
  totalTime?: number
}

export function DISCReportHeader({ userName, totalTime }: DISCReportHeaderProps) {
  return (
    <div className="text-center mb-12">
      <div className="flex justify-center mb-4">
        <Brain className="w-16 h-16 text-indigo-600" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Sua Jornada Profissional em Foco</h1>
      <p className="text-xl text-gray-600 mb-6">
        Descubra seus pontos fortes e oportunidades de crescimento
      </p>
      {totalTime && (
        <div className="inline-flex items-center px-4 py-2 bg-indigo-50 rounded-full text-indigo-700">
          <Clock className="w-4 h-4 mr-2" />
          <span>
            Tempo total: {Math.floor(totalTime / 1000 / 60)}min
            {Math.floor(totalTime / 1000 % 60)}s
          </span>
        </div>
      )}
    </div>
  )
}