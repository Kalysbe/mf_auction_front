"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface DeviceData {
  name: string
  value: number
}

const COLORS = ["#cdb32f", "#36A2EB", "#FFCE56", "#4BC0C0"]

export default function DeviceDistribution() {
  const [data, setData] = useState<DeviceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        setLoading(true)
        const response = await fetch("https://api.adb-solution.com/analytics/devices")
        if (!response.ok) {
          throw new Error("Failed to fetch device data")
        }
        const deviceData = await response.json()
        setData(deviceData)
      } catch (error) {
        console.error("Error fetching device data:", error)
        // Используем моковые данные в случае ошибки
        setData([
          { name: "Десктоп", value: 65 },
          { name: "Мобильный", value: 30 },
          { name: "Планшет", value: 5 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchDeviceData()
  }, [])

  if (loading) {
    return <div className="h-[300px] flex items-center justify-center">Загрузка данных...</div>
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
