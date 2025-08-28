"use client"

import { AlertTriangle, Shield, Globe } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface MixedContentWarningProps {
  onDismiss?: () => void
}

export function MixedContentWarning({ onDismiss }: MixedContentWarningProps) {
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:"

  if (!isHttps) return null

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-4">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Проблема безопасности браузера</AlertTitle>
      <AlertDescription className="text-orange-700 space-y-3">
        <p>
          Браузер блокирует подключение к серверу из-за Mixed Content Policy (HTTPS страница пытается обратиться к HTTP
          серверу).
        </p>

        <div className="space-y-2">
          <p className="font-medium">Решения:</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 text-orange-600" />
              <div>
                <strong>Chrome/Edge:</strong> Нажмите на иконку щита в адресной строке → "Загрузить небезопасные
                скрипты"
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-orange-600" />
              <div>
                <strong>Firefox:</strong> Нажмите на иконку щита → "Отключить защиту на этой странице"
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-orange-600" />
              <div>
                <strong>Альтернатива:</strong> Используйте HTTP версию сайта (если доступна)
              </div>
            </div>
          </div>
        </div>

        {onDismiss && (
          <Button variant="outline" size="sm" onClick={onDismiss} className="mt-2 bg-transparent">
            Понятно
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
