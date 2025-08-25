"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/protected-route"

export default function TestAuctionPage() {
  const { toast } = useToast()
  const { createAuction, isConnected } = useWebSocket()
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)

  const createTestAuction = async () => {
    if (!isConnected) {
      toast({
        title: "Ошибка",
        description: "Нет соединения с сервером",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      // Создаем тестовый аукцион с точными параметрами
      const testAuctionData = {
        type: "sell" as const,
        asset: "test 1",
        volume: 400,
        currency: "KGS",
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1 час от текущего времени
      }

      console.log("Creating test auction:", testAuctionData)

      createAuction(testAuctionData)

      toast({
        title: "Тестовый аукцион создан",
        description: "Аукцион успешно отправлен на сервер",
      })
    } catch (error) {
      console.error("Error creating test auction:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать тестовый аукцион",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "initiator"]}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/images/logo_KSE.png" alt="KSE Logo" width={50} height={50} />
          <h1 className="text-2xl font-bold">Тестирование создания аукциона</h1>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle>Тестовый аукцион</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-gray-50 border rounded-md p-4">
              <h4 className="font-medium mb-2">Параметры тестового аукциона:</h4>
              <pre className="text-sm text-gray-600">
                {JSON.stringify(
                  {
                    type: "sell",
                    asset: "test 1",
                    volume: 400,
                    currency: "KGS",
                    end_time: "через 1 час от текущего времени",
                  },
                  null,
                  2,
                )}
              </pre>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
              <span className="text-sm">{isConnected ? "Подключено к серверу" : "Нет соединения с сервером"}</span>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                <strong>Пользователь:</strong> {user?.email}
              </p>
              <p>
                <strong>Роль:</strong> {user?.role}
              </p>
            </div>

            <Button
              onClick={createTestAuction}
              disabled={isCreating || !isConnected}
              className="w-full bg-primary hover:bg-primary-600"
            >
              {isCreating ? "Создание..." : "Создать тестовый аукцион"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
