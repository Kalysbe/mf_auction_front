"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useWebSocket } from "@/hooks/useWebSocket"
import ProtectedRoute from "@/components/protected-route"

export default function CreateAuctionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { createAuction, isConnected } = useWebSocket()

  const [type, setType] = useState<"sell" | "buy">("sell")
  const [asset, setAsset] = useState("") // Теперь это "Название аукциона"
  // const [volume, setVolume] = useState("") // Удалено по запросу
  const [currency, setCurrency] = useState("KGS") // Валюта по умолчанию - KGS
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [closeType, setCloseType] = useState<"auto" | "manual">("auto") // Добавлено для типа закрытия
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validation
    if (!asset || !currency || !endDate || !endTime || !closeType) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Удалена валидация для volume, так как поле удалено из формы
    // const volumeNumber = Number.parseFloat(volume)
    // if (isNaN(volumeNumber) || volumeNumber <= 0) {
    //   toast({
    //     title: "Ошибка",
    //     description: "Введите корректный объем",
    //     variant: "destructive",
    //   })
    //   setIsLoading(false)
    //   return
    // }

    if (!isConnected) {
      toast({
        title: "Ошибка",
        description: "Нет соединения с сервером",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Combine date and time into ISO string
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString()

      const auctionData = {
        type,
        asset, // Теперь это название аукциона
        // volume: volumeNumber, // Удалено из отправляемых данных
        currency,
        end_time: endDateTime,
        closing_type: closeType, // Добавлено
      }

      console.log("Creating auction with data:", auctionData)

      createAuction(auctionData)

      toast({
        title: "Аукцион создан",
        description: "Новый аукцион успешно создан",
      })

      // Redirect to home page
      router.push("/")
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать аукцион",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get current date and time for default values
  const now = new Date()
  const currentDate = now.toISOString().split("T")[0]
  const currentTime = now.toTimeString().slice(0, 5)

  return (
    <ProtectedRoute allowedRoles={["admin", "initiator"]}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/images/logo_KSE.png" alt="KSE Logo" width={50} height={50} />
          <h1 className="text-2xl font-bold">Создание нового аукциона</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle>Параметры аукциона</CardTitle>
              <CardDescription>Заполните информацию о новом аукционе</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Тип аукциона</Label>
                  <Select value={type} onValueChange={(value: "sell" | "buy") => setType(value)}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sell">Продажа</SelectItem>
                      <SelectItem value="buy">Покупка</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Валюта</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Выберите валюту" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KGS">Кыргызский сом (KGS)</SelectItem>
                      <SelectItem value="USD">Доллар США (USD)</SelectItem>
                      <SelectItem value="EUR">Евро (EUR)</SelectItem>
                      <SelectItem value="RUB">Российский рубль (RUB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset">Название аукциона</Label> {/* Изменено с "Актив" */}
                <Input
                  id="asset"
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  placeholder="Например: Аукцион по размещению депозитов"
                  required
                />
              </div>

              {/* Заменено поле "Объем" на "Тип закрытия" */}
              <div className="space-y-2">
                <Label htmlFor="closeType">Тип закрытия</Label>
                <Select value={closeType} onValueChange={(value: "auto" | "manual") => setCloseType(value)}>
                  <SelectTrigger id="closeType">
                    <SelectValue placeholder="Выберите тип закрытия" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Автоматическое</SelectItem>
                    <SelectItem value="manual">Ручное</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">Дата окончания</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={currentDate}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Время окончания</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {!isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
                  <p className="text-sm">Нет соединения с сервером. Проверьте подключение к интернету.</p>
                </div>
              )}

              {/* Preview of the data that will be sent */}
              <div className="bg-gray-50 border rounded-md p-4">
                <h4 className="font-medium mb-2">Предварительный просмотр данных:</h4>
                <pre className="text-sm text-gray-600">
                  {JSON.stringify(
                    {
                      type,
                      asset: asset || "Название аукциона",
                      // volume: volume ? Number.parseFloat(volume) : "удалено", // Удалено из превью
                      currency,
                      end_time:
                        endDate && endTime ? new Date(`${endDate}T${endTime}`).toISOString() : "дата с временем",
                      closing_type: closeType, // Добавлено в превью
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-primary/5 border-t border-primary/10">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/")}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading || !isConnected} className="bg-primary hover:bg-primary-600">
                {isLoading ? "Создание..." : "Создать аукцион"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </ProtectedRoute>
  )
}
