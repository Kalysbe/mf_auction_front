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
import ProtectedRoute from "@/components/protected-route"

export default function CreateAuctionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("RUB")
  const [term, setTerm] = useState("")
  const [lotTermMonth, setLotTermMonth] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!name || !amount || !currency || !term || !lotTermMonth || !endDate) {
      toast({
        title: "Ошибка",
        description: "��ожалуйста, заполните все поля",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    console.log("[v0] Создание лота с данными:", {
      name,
      amount,
      currency,
      term,
      lotTermMonth: Number.parseInt(lotTermMonth),
      endDate,
    })

    setTimeout(() => {
      toast({
        title: "Аукцион создан",
        description: "Новый аукцион успешно создан",
      })
      setIsLoading(false)
      router.push("/admin")
    }, 1500)
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
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
              <div className="space-y-2">
                <Label htmlFor="name">Название аукциона</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Сумма</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Валюта</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Выберите валюту" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUB">Российский рубль (RUB)</SelectItem>
                      <SelectItem value="USD">Доллар США (USD)</SelectItem>
                      <SelectItem value="EUR">Евро (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="term">Срок размещения</Label>
                  <Input
                    id="term"
                    placeholder="например: 30 дней"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lotTermMonth">Срок размещения депозита (месяцы)</Label>
                  <Input
                    id="lotTermMonth"
                    type="number"
                    min="1"
                    max="60"
                    placeholder="например: 12"
                    value={lotTermMonth}
                    onChange={(e) => setLotTermMonth(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Дата окончания приема заявок</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-primary/5 border-t border-primary/10">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/admin")}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-600">
                {isLoading ? "Создание..." : "Создать аукцион"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </ProtectedRoute>
  )
}
