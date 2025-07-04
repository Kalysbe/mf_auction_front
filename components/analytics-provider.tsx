"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function AnalyticsProvider() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      // Отправка данных о просмотре страницы в Google Analytics
      if (typeof window.gtag === "function") {
        window.gtag("config", "G-VVN26ZBW3S", {
          page_path: pathname,
        })
      }

      // Отправка данных о просмотре страницы в Яндекс.Метрику
      if (typeof window.ym === "function") {
        window.ym(100834751, "hit", pathname)
      }

      // Отправка данных о просмотре страницы на сервер
      const trackPageView = async () => {
        try {
          const userAgent = navigator.userAgent
          const deviceType = /mobile|android|iphone|ipad|ipod/i.test(userAgent) ? "mobile" : "desktop"
          const referer = document.referrer
          const url = pathname

          const trackingData = {
            url,
            referer,
            userAgent,
            deviceType,
            timestamp: new Date().toISOString(),
          }

          // Отправка данных на сервер
          await fetch("/api/track", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(trackingData),
          })
        } catch (error) {
          console.error("Error tracking page view:", error)
        }
      }

      trackPageView()
    }
  }, [pathname, searchParams])

  return null
}

// Добавляем типы для глобальных объектов
declare global {
  interface Window {
    gtag: (command: string, target: string, config?: any) => void
    ym: (counterId: number, action: string, path: string) => void
  }
}
