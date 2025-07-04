"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface PageData {
  url: string
  visits: number
}

export default function TopPagesChart() {
  const [data, setData] = useState<PageData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopPages = async () => {
      try {
        setLoading(true)
        const response = await fetch("https://api.adb-solution.com/analytics/top-pages")
        if (!response.ok) {
          throw new Error("Failed to fetch top pages data")
        }
        const pagesData = await response.json()
        setData(pagesData)
      } catch (error) {
        console.error("Error fetching top pages:", error)
        // Используем моковые данные в случае ошибки
        setData([
          { url: "/", visits: 450 },
          { url: "/services", visits: 320 },
          { url: "/about", visits: 280 },
          { url: "/contacts", visits: 190 },
          { url: "/news", visits: 150 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTopPages()
  }, [])

  // Форматируем URL для отображения
  const formatUrl = (url: string) => {
    if (url === "/") return "Главная"
    return url
      .replace(/^\//, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Подготавливаем данные для графика
  const chartData = data.map((item) => ({
    name: formatUrl(item.url),
    visits: item.visits,
  }))

  if (loading) {
    return <div className="h-[300px] flex items-center justify-center">Загрузка данных...</div>
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="visits" fill="#cdb32f" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
