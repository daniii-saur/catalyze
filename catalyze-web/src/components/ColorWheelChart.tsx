'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface Props {
  brown: number
  orange: number
  green: number
  red: number
}

const COLORS = ['#7B3B00', '#EE7B00', '#5CB11A', '#B52E2E']

export function ColorWheelChart({ brown, orange, green, red }: Props) {
  const total = brown + orange + green + red
  const data = [
    { name: 'Brown',  value: brown  || 0 },
    { name: 'Orange', value: orange || 0 },
    { name: 'Green',  value: green  || 0 },
    { name: 'Red',    value: red    || 0 },
  ]

  const hasData = total > 0
  const displayData   = hasData ? data : [{ name: 'Empty', value: 1 }]
  const displayColors = hasData ? COLORS : ['#D9D9D9']
  const centerLabel   = hasData ? `${Math.round((brown / total) * 100)}%` : '0%'

  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius={28}
            outerRadius={38}
            paddingAngle={hasData ? 2 : 0}
            dataKey="value"
            stroke="none"
          >
            {displayData.map((_, i) => (
              <Cell key={i} fill={displayColors[i % displayColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-lg font-semibold" style={{ color: '#404040' }}>
          {centerLabel}
        </span>
      </div>
    </div>
  )
}
