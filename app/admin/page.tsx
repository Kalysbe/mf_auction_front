import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AnalyticsOverview from "@/components/analytics-overview"
import TopPagesChart from "@/components/top-pages-chart"
import DeviceDistribution from "@/components/device-distribution"

export const metadata = {
  title: "Админ-панель | ADB Solution",
  description: "Административная панель управления сайтом ADB Solution",
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Панель управления</h1>
        <p className="text-muted-foreground">Обзор статистики и управление контентом сайта ADB Solution</p>
      </div>

      <Suspense fallback={<div>Загрузка статистики...</div>}>
        <AnalyticsOverview />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Популярные страницы</CardTitle>
            <CardDescription>Наиболее посещаемые страницы за последние 30 дней</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Загрузка данных...</div>}>
              <TopPagesChart />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Распределение устройств</CardTitle>
            <CardDescription>Типы устройств посетителей сайта</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Загрузка данных...</div>}>
              <DeviceDistribution />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
