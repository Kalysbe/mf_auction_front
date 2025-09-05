"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { MixedContentWarning } from "@/components/mixed-content-warning"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()

  const [login_field, setLoginField] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showMixedContentWarning, setShowMixedContentWarning] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(login_field, password)

      if (success) {
        toast({
          title: "Успешный вход",
          description: "Вы успешно вошли в систему",
        })
        router.push("/")
      } else {
        toast({
          title: "Ошибка входа",
          description: "Неверный логин или пароль",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)

      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes("Mixed Content Error") || errorMessage.includes("Failed to fetch")) {
        setShowMixedContentWarning(true)
      }

      toast({
        title: "Ошибка",
        description: "Произошла ошибка при входе в систему",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <Image src="/images/logo_KSE.png" alt="KSE Logo" width={80} height={80} className="mx-auto mb-4" />
        {/* Название "Система аукционов КФБ" убрано */}
      </div>

      {showMixedContentWarning && <MixedContentWarning onDismiss={() => setShowMixedContentWarning(false)} />}

      <Card className="border-primary/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Вход в систему</CardTitle>
          <CardDescription>Введите свои данные для входа</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Логин</Label>
              <Input
                id="login"
                type="text"
                placeholder="Введите логин"
                value={login_field}
                onChange={(e) => setLoginField(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary-600" disabled={isLoading}>
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {process.env.NODE_ENV === "development" && (
        <Card className="mt-4 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                API URL: {process.env.NEXT_PUBLIC_API_BASE_URL || "https://mfauction.adb-solution.com"}/api/auth/login
              </p>
              <p>Проверьте консоль браузера для подробных логов</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
