import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Label
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
  console.log("DISCBarChart received scores:", scores);
  
  // Ensure scores are normalized to 100%
  const ensureNormalized = (inputScores: {D: number, I: number, S: number, C: number}) => {
    const sum = inputScores.D + inputScores.I + inputScores.S + inputScores.C;
    
    // If sum is very close to zero, return equal distribution
    if (sum < 0.1) {
      return { D: 25, I: 25, S: 25, C: 25 };
    }
    
    // If sum is already 100% (with small floating point tolerance), return as is
    if (Math.abs(sum - 100) <= 0.1) {
      return inputScores;
    }
    
    // Otherwise normalize to 100%
    const factor = 100 / sum;
    return {
      D: inputScores.D * factor,
      I: inputScores.I * factor,
      S: inputScores.S * factor,
      C: inputScores.C * factor
    };
  };
  
  const normalizedScores = ensureNormalized(scores);
  console.log("Normalized scores for chart:", normalizedScores, "Sum:", 
    normalizedScores.D + normalizedScores.I + normalizedScores.S + normalizedScores.C);
  
  const data = [
    { name: 'Dominância', value: normalizedScores.D, label: `${normalizedScores.D.toFixed(1)}%` },
    { name: 'Influência', value: normalizedScores.I, label: `${normalizedScores.I.toFixed(1)}%` },
    { name: 'Estabilidade', value: normalizedScores.S, label: `${normalizedScores.S.toFixed(1)}%` },
    { name: 'Conformidade', value: normalizedScores.C, label: `${normalizedScores.C.toFixed(1)}%` }
  ]

  return (
    <div className="w-full h-full min-h-[300px] bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 30, right: 30, left: 20, bottom: 60 }}
          barSize={60}
          style={{ background: 'white' }}
        >
          <defs>
            <linearGradient id="chartBackground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EBF4FF" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#F9FAFB" stopOpacity={0.5}/>
            </linearGradient>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#chartBackground)" />
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            angle={-35}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 12, fill: "#4b5563" }}
          />
          <YAxis 
            domain={[0, 100]} 
            tickFormatter={(value) => `${value}%`}
            padding={{ top: 20 }}
            tick={{ fill: "#4b5563" }}
          >
            <Label
              value="Percentual (%)"
              position="insideLeft"
              angle={-90}
              style={{ textAnchor: 'middle', fill: '#4b5563' }}
            />
          </YAxis>
          <RechartsTooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            fill="#4f46e5"
            radius={[4, 4, 0, 0]}
            label={{
              position: 'top',
              content: ({ x, y, width, value }) => (
                <text
                  x={x + width / 2}
                  y={y - 10}
                  fill="#4f46e5"
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={500}
                >
                  {`${value.toFixed(1)}%`}
                </text>
              ),
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}