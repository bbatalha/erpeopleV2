import React from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface DISCAdvancedAnalyticsProps {
  scores: {
    D: number
    I: number
    S: number
    C: number
  }
}

export function DISCAdvancedAnalytics({ scores }: DISCAdvancedAnalyticsProps) {
  // Calculate advanced metrics
  const metrics = {
    adaptability: (scores.I + scores.S) / 2,
    leadership: (scores.D * 0.6 + scores.I * 0.4),
    analytical: (scores.C * 0.7 + scores.S * 0.3),
    communication: (scores.I * 0.5 + scores.S * 0.3 + scores.D * 0.2),
    emotionalStability: (scores.S * 0.4 + scores.C * 0.4 + scores.I * 0.2)
  }

  const ratios = {
    taskVsPeople: (scores.D + scores.C) / (scores.I + scores.S),
    activeVsPassive: (scores.D + scores.I) / (scores.S + scores.C),
    extrovertVsIntrovert: (scores.D + scores.I) / (scores.S + scores.C)
  }

  const patterns = {
    decisionMaking: scores.D > 50 ? 'Rápido' : 'Cauteloso',
    communication: scores.I > 50 ? 'Expressivo' : 'Reservado',
    pacePreference: scores.S > 50 ? 'Estável' : 'Dinâmico',
    ruleOrientation: scores.C > 50 ? 'Preciso' : 'Flexível'
  }

  const radarData = [
    { subject: 'Dominância', value: scores.D },
    { subject: 'Influência', value: scores.I },
    { subject: 'Estabilidade', value: scores.S },
    { subject: 'Conformidade', value: scores.C }
  ]

  const indexData = [
    { name: 'Adaptabilidade', value: metrics.adaptability },
    { name: 'Liderança', value: metrics.leadership },
    { name: 'Análise', value: metrics.analytical },
    { name: 'Comunicação', value: metrics.communication },
    { name: 'Est. Emocional', value: metrics.emotionalStability }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Análise Radar DISC</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="DISC"
                dataKey="value"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Índices Avançados</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={indexData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4f46e5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Razões entre Perfis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Tarefa vs. Pessoas</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-600">
              {ratios.taskVsPeople.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {ratios.taskVsPeople > 1 ? 'Orientado a Tarefas' : 'Orientado a Pessoas'}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Ativo vs. Passivo</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-600">
              {ratios.activeVsPassive.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {ratios.activeVsPassive > 1 ? 'Mais Ativo' : 'Mais Reflexivo'}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Extrovertido vs. Introvertido</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-600">
              {ratios.extrovertVsIntrovert.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {ratios.extrovertVsIntrovert > 1 ? 'Mais Extrovertido' : 'Mais Introvertido'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Padrões de Comportamento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Tomada de Decisão</p>
            <p className="mt-1 text-lg font-medium text-indigo-600">{patterns.decisionMaking}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Comunicação</p>
            <p className="mt-1 text-lg font-medium text-indigo-600">{patterns.communication}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Ritmo</p>
            <p className="mt-1 text-lg font-medium text-indigo-600">{patterns.pacePreference}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Orientação a Regras</p>
            <p className="mt-1 text-lg font-medium text-indigo-600">{patterns.ruleOrientation}</p>
          </div>
        </div>
      </div>
    </div>
  )
}