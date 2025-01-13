import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
        <p className="text-sm text-gray-900">{label}</p>
        <p className="text-sm font-medium text-indigo-600">
          {`Valor: ${payload[0].value.toFixed(1)}%`}
        </p>
      </div>
    )
  }
  return null
}

interface DISCBarChartProps {
  scores: {
    D: number
    I: number
    S: number
    C: number
  }
}

export function DISCBarChart({ scores }: DISCBarChartProps) {
  const data = [
    { name: 'Dominância', value: scores.D, label: `${scores.D.toFixed(1)}%` },
    { name: 'Influência', value: scores.I, label: `${scores.I.toFixed(1)}%` },
    { name: 'Estabilidade', value: scores.S, label: `${scores.S.toFixed(1)}%` },
    { name: 'Conformidade', value: scores.C, label: `${scores.C.toFixed(1)}%` }
  ]

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 30, right: 30, left: 20, bottom: 60 }}
          barSize={80}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-35}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 100]} 
            tickFormatter={(value) => `${value}%`}
            padding={{ top: 20 }}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            fill="#4f46e5"
            radius={[4, 4, 0, 0]}
            label={{
              position: 'top',
              content: ({ value }) => `${value.toFixed(1)}%`,
              fill: '#4f46e5',
              fontSize: 12,
              fontWeight: 500
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}