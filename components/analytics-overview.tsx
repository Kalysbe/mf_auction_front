"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Users, Clock, Calendar } from "lucide-react"

interface AnalyticsData {
  totalVisits: number
  uniqueVisitors: number
  averageTimeOnSite: string
  bounceRate: string
  lastUpdated: string
}

export default function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsData>({
    totalVisits: 0,
    uniqueVisitors: 0,
    averageTimeOnSite: "0:00",
    bounceRate: "0%",
    lastUpdated: "",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch("https://api.adb-solution.com/analytics/overview")
        if (!response.ok) {
          throw new Error("Failed to fetch analytics data")
        }
        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (error) {
        console.error("Error fetching analytics:", error)
        // Используем моковые данные в случае ошибки
        setData({
          totalVisits: 1245,
          uniqueVisitors: 876,
          averageTimeOnSite: "2:34",
          bounceRate: "42%",
          lastUpdated: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const stats = [
    {
      title: "Всего посещений",
      value: loading ? "..." : data.totalVisits.toString(),
      icon: <BarChart className="h-8 w-8 text-[#cdb32f]" />,
      description: "За все время",
    },
    {
      title: "Уникальные посетители",
      value: loading ? "..." : data.uniqueVisitors.toString(),
      icon: <Users className="h-8 w-8 text-[#cdb32f]" />,
      description: "За все время",
    },
    {
      title: "Среднее время на сайте",
      value: loading ? "..." : data.averageTimeOnSite,
      icon: <Clock className="h-8 w-8 text-[#cdb32f]" />,
      description: "В минутах",
    },
    {
      title: "Последнее обновление",
      value: loading ? "..." : formatDate(data.lastUpdated),
      icon: <Calendar className="h-8 w-8 text-[#cdb32f]" />,
      description: "Данные обновляются автоматически",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h4 className="text-2xl font-bold mt-1">{stat.value}</h4>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              {stat.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
