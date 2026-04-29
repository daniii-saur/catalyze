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
    { name: 'Brown', value: brown || 0 },
    { name: 'Orange', value: orange || 0 },
    { name: 'Green', value: green || 0 },
    { name: 'Red', value: red || 0 },
  ]

  const hasData = total > 0
  const displayData = hasData ? data : [{ name: 'Empty', value: 1 }]
  const displayColors = hasData ? COLORS : ['#D9D9D9']

  return (
    <div className="relative w-[78px] h-[78px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius={22}
            outerRadius={39}
            dataKey="value"
            strokeWidth={0}
          >
            {displayData.map((_, i) => (
              <Cell key={i} fill={displayColors[i % displayColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {hasData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* percentage labels are shown in the legend below */}
        </div>
      )}
    </div>
  )
}
