import React from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts'

interface DISCRadarChartProps {
  firstResults: {
    scores: {
      D: number
      I: number
      S: number
      C: number
    }
    date: string
  }
  secondResults: {
    scores: {
      D: number
      I: number
      S: number
      C: number
    }
    date: string
  }
}

export function DISCRadarChart({ firstResults, secondResults }: DISCRadarChartProps) {
  const data = [
    { subject: 'Dominância', first: firstResults.scores.D, second: secondResults.scores.D },
    { subject: 'Influência', first: firstResults.scores.I, second: secondResults.scores.I },
    { subject: 'Estabilidade', first: firstResults.scores.S, second: secondResults.scores.S },
    { subject: 'Conformidade', first: firstResults.scores.C, second: secondResults.scores.C }
  ]

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#4B5563', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#4B5563', fontSize: 10 }}
          />
          <Radar
            name={formatDate(firstResults.date)}
            dataKey="first"
            stroke="#4F46E5"
            fill="#4F46E5"
            fillOpacity={0.3}
          />
          <Radar
            name={formatDate(secondResults.date)}
            dataKey="second"
            stroke="#EC4899"
            fill="#EC4899"
            fillOpacity={0.3}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900 mb-2">{payload[0].payload.subject}</p>
                    {payload.map((entry: any, index: number) => (
                      <p
                        key={index}
                        className="text-sm"
                        style={{ color: entry.color }}
                      >
                        {entry.name}: {entry.value.toFixed(1)}%
                      </p>
                    ))}
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}