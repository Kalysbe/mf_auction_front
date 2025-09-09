"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useWebSocket } from "@/hooks/useWebSocket"
import {
  normalizeAuctionStatus,
  getStatusDisplayText,
  getStatusBadgeVariant,
  tokenManager,
  API_BASE_URL,
} from "@/lib/api"
import { Wifi, WifiOff, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ReportModal } from "@/components/report-modal"
import { DocumentUploadModal } from "@/components/document-upload-modal"

// Format number as currency
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format amount with currency
function formatAmount(amount: number, currency = "KGS") {
  return (
    new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      maximumFractionDigits: 2,
    }).format(amount) + ` ${currency}`
  )
}

console.log("[v0] ПРИНУДИТЕЛЬНАЯ ОТЛАДКА - Переменные окружения:")
console.log("[v0] process.env.NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL)
console.log("[v0] API_BASE_URL из lib/api:", API_BASE_URL)
console.log(
  "[v0] Все переменные окружения NEXT_PUBLIC:",
  Object.keys(process.env).filter((key) => key.startsWith("NEXT_PUBLIC")),
)

export default function Home() {
  const { user } = useAuth()
  const { auctions, isConnected, joinAuction } = useWebSocket()
  const router = useRouter()
  const [loadingReport, setLoadingReport] = useState<string | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [currentAuctionId, setCurrentAuctionId] = useState<string>("")
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>("")
  const [documentsComplete, setDocumentsComplete] = useState<Record<string, boolean>>({})

  useEffect(() => {
    console.log("[v0] Компонент Home загружен, API_BASE_URL:", API_BASE_URL)
    console.log("[v0] Переменная окружения NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL)

    const handleAuthChange = () => {
      window.location.reload()
    }

    window.addEventListener("auth-changed", handleAuthChange)
    return () => window.removeEventListener("auth-changed", handleAuthChange)
  }, [])

  useEffect(() => {
    const checkDocumentsForAllAuctions = async () => {
      if (!user || auctions.length === 0) return

      console.log("[v0] Проверяем документы для всех активных аукционов")

      for (const auction of auctions) {
        const normalizedStatus = normalizeAuctionStatus(auction?.status)
        if (normalizedStatus === "active") {
          await checkUserDocuments(auction.id)
        }
      }
    }

    checkDocumentsForAllAuctions()
  }, [auctions, user])

  const handleGetReport = async (auctionId: string) => {
    if (!user) return

    setLoadingReport(auctionId)
    console.log("[v0] Получение ведомости для аукциона:", auctionId)
    console.log("[v0] ОТЛАДКА URL - API_BASE_URL:", API_BASE_URL)
    console.log("[v0] ОТЛАДКА URL - Полный URL запроса:", `${API_BASE_URL}/auction/${auctionId}`)

    try {
      const token = tokenManager.getToken()
      if (!token) {
        console.log("[v0] Токен не найден")
        alert("Ошибка авторизации. Войдите в систему заново.")
        return
      }

      const fullUrl = `${API_BASE_URL}/auction/${auctionId}`
      console.log("[v0] ФИНАЛЬНЫЙ URL ЗАПРОСА:", fullUrl)

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Статус ответа:", response.status)
      console.log("[v0] Content-Type:", response.headers.get("content-type"))

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Ошибка сервера:", errorText)

        if (response.status === 404) {
          alert("API эндпоинт не найден. Функция ведомости пока недоступна.")
        } else if (response.status === 401) {
          alert("Ошибка авторизации. Войдите в систему заново.")
        } else {
          alert(`Ошибка сервера: ${response.status}`)
        }
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.log("[v0] Ответ не является JSON, получен HTML")
        alert("Сервер вернул неожиданный формат данных. API эндпоинт может быть недоступен.")
        return
      }

      const reportData = await response.json()
      console.log("[v0] Ведомость получена:", reportData)

      setReportData(reportData)
      setCurrentAuctionId(auctionId)
      setReportModalOpen(true)
    } catch (error) {
      console.error("[v0] Ошибка при получении ведомости:", error)

      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        alert("Ошибка сети. Проверьте подключение к интернету.")
      } else if (error instanceof SyntaxError && error.message.includes("Unexpected token")) {
        alert("Сервер вернул некорректные данные. API эндпоинт может быть недоступен.")
      } else {
        alert("Произошла неожиданная ошибка при получении ведомости.")
      }
    } finally {
      setLoadingReport(null)
    }
  }

  const checkUserDocuments = async (auctionId: string) => {
    if (!user) return false

    // Пропускаем проверку документов для роли: admin или initiator
    if (user.role === "admin" || user.role === "initiator") {
      console.log("[v0] Пропускаем проверку документов для роли:", user.role)
      return true
    }

    try {
      const token = tokenManager.getToken()
      if (!token) {
        console.log("[v0] Токен не найден для проверки документов")
        return false
      }

      console.log("[v0] Проверяем документы пользователя для аукциона:", auctionId)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const docsResponse = await fetch(`${API_BASE_URL}/file/auction/${auctionId}/files/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log("[v0] Статус ответа документов аукциона:", docsResponse.status)

      if (!docsResponse.ok) {
        console.error("[v0] Ошибка API при получении документов аукциона:", docsResponse.status)
        return false
      }

      const auctionDocuments = await docsResponse.json()
      console.log("[v0] Получены документы для аукциона (полная структура):", auctionDocuments)

      const uploadedDocumentTypes = new Set<string>()

      if (Array.isArray(auctionDocuments) && auctionDocuments.length > 0) {
        // Находим аукцион с нужным ID
        const auctionData = auctionDocuments.find((auction) => auction.id === auctionId)

        if (auctionData && auctionData.files && Array.isArray(auctionData.files)) {
          // Извлекаем все типы документов из групп
          auctionData.files.forEach((group: any) => {
            if (group.file_type && group.files && Array.isArray(group.files) && group.files.length > 0) {
              uploadedDocumentTypes.add(group.file_type)
            }
          })
        }
      }

      console.log("[v0] Загруженные типы документов:", Array.from(uploadedDocumentTypes))

      const typesResponse = await fetch(`${API_BASE_URL}/file/type/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      let requiredDocumentTypes = []
      if (typesResponse.ok) {
        const types = await typesResponse.json()
        // Используем названия типов документов, а не ID
        requiredDocumentTypes = types.map((type: any) => type.title || type.name)
        console.log("[v0] Обязательные типы документов:", requiredDocumentTypes)
      } else {
        console.log("[v0] Не удалось получить типы документов, используем fallback")
        return false
      }

      const hasAllRequiredDocuments = requiredDocumentTypes.every((type: string) => uploadedDocumentTypes.has(type))

      console.log("[v0] Все обязательные документы загружены:", hasAllRequiredDocuments)
      console.log("[v0] Требуется:", requiredDocumentTypes)
      console.log("[v0] Загружено:", Array.from(uploadedDocumentTypes))

      setDocumentsComplete((prev) => ({ ...prev, [auctionId]: hasAllRequiredDocuments }))
      return hasAllRequiredDocuments
    } catch (error) {
      console.error("[v0] Исключение при проверке документов:", error)
      return false
    }
  }

  const handleParticipateClick = async (auctionId: string) => {
    console.log("[v0] Попытка участия в аукционе:", auctionId)

    const hasDocuments = await checkUserDocuments(auctionId)

    if (!hasDocuments && user?.role !== "admin" && user?.role !== "initiator") {
      console.log("[v0] Документы не загружены, блокируем участие")
      setSelectedAuctionId(auctionId)
      setDocumentModalOpen(true)
      return
    }

    console.log("[v0] Документы проверены, присоединяемся к аукциону")
    joinAuction(auctionId)
    router.push(`/auction/${auctionId}`)
  }

  const handleDocumentsComplete = () => {
    console.log("[v0] Все документы загружены, присоединяемся к аукциону")
    setDocumentModalOpen(false)

    if (selectedAuctionId) {
      joinAuction(selectedAuctionId)
      router.push(`/auction/${selectedAuctionId}`)
    }
  }

  const getDocumentStatusIcon = (auctionId: string) => {
    if (!user) return null

    // Админы и инициаторы не нуждаются в документах
    if (user.role === "admin" || user.role === "initiator") {
      return (
        <div className="flex items-center gap-1 text-blue-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs">Админ</span>
        </div>
      )
    }

    const hasDocuments = documentsComplete[auctionId]

    if (hasDocuments === true) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs">Готов</span>
        </div>
      )
    } else if (hasDocuments === false) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-xs">Нет документов</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1 text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">Проверка...</span>
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary/10 rounded-lg p-6 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Система аукционов по размещению средств из счета смягчения в депозиты коммерческих банков
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Электронная платформа Кыргызской фондовой биржи для проведения аукционов по размещению средств из счета
            смягчения в депозиты коммерческих банков
          </p>

          <div className="flex items-center justify-center gap-2 mb-4">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium" style={{ color: "#166534" }}>
                  Подключено к серверу
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium" style={{ color: "#991b1b" }}>
                  {user ? "Подключение к серверу..." : "Войдите для подключения к серверу"}
                </span>
              </>
            )}
          </div>

          {!user && (
            <Button asChild size="lg" className="bg-primary hover:bg-primary-600">
              <Link href="/auth/login">Войти для участия</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Активные аукционы</h2>
        {user?.role === "admin" || user?.role === "initiator" ? (
          <Button asChild className="bg-primary hover:bg-primary-600">
            <Link href="/create-auction">Создать аукцион</Link>
          </Button>
        ) : null}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Актив</TableHead>
                <TableHead>Валюта</TableHead>
                <TableHead>Время окончания</TableHead>
                <TableHead>Тип закрытия</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-center">Документы</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auctions.map((auction) => {
                const normalizedStatus = normalizeAuctionStatus(auction?.status)
                const statusText = getStatusDisplayText(auction?.status)
                const badgeVariant = getStatusBadgeVariant(auction?.status)

                return (
                  <TableRow key={auction.id}>
                    <TableCell className="font-medium">
                      {auction.title || `${auction.type === "sell" ? "Продажа" : "Покупка"} ${auction.asset}`}
                    </TableCell>
                    <TableCell>{auction.asset}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{auction.currency}</Badge>
                    </TableCell>
                    <TableCell>{new Date(auction.end_time).toLocaleString("ru-RU")}</TableCell>
                    <TableCell>
                      <Badge variant={auction.closing_type === "auto" ? "default" : "secondary"}>
                        {auction.closing_type === "auto" ? "Автоматическое" : "Ручное"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant} className={normalizedStatus === "active" ? "bg-green-500" : ""}>
                        {statusText}
                      </Badge>
                      {process.env.NODE_ENV === "development" && (
                        <div className="text-xs text-gray-400 mt-1">Raw: {auction?.status || "undefined"}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {normalizedStatus === "active" ? (
                        getDocumentStatusIcon(auction.id)
                      ) : (
                        <span className="text-xs text-gray-400">Не требуется</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {user ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={normalizedStatus !== "active"}
                            className="hover:text-primary hover:border-primary bg-transparent"
                            onClick={() => {
                              if (normalizedStatus === "active") {
                                handleParticipateClick(auction.id)
                              } else {
                                router.push(`/auction/${auction.id}`)
                              }
                            }}
                          >
                            {normalizedStatus === "active"
                              ? documentsComplete[auction.id] === false
                                ? "Загрузить документы"
                                : "Участвовать"
                              : "Просмотр"}
                          </Button>

                          {normalizedStatus !== "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loadingReport === auction.id}
                              className="hover:text-primary hover:border-primary bg-transparent"
                              onClick={() => handleGetReport(auction.id)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {loadingReport === auction.id ? "Загрузка..." : "Ведомость"}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="hover:text-primary hover:border-primary bg-transparent"
                        >
                          <Link href="/auth/login">Войти для участия</Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {auctions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {user
                      ? isConnected
                        ? "Нет активных аукционов"
                        : "Подключение к серверу..."
                      : "Войдите для просмотра аукционов"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportData={reportData}
        auctionId={currentAuctionId}
      />

      <DocumentUploadModal
        isOpen={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        onDocumentsComplete={handleDocumentsComplete}
        auctionId={selectedAuctionId}
      />

      {process.env.NODE_ENV === "development" && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Debug Info:</strong>
              </p>
              <p>Connected: {isConnected ? "Yes" : "No"}</p>
              <p>Auctions Count: {auctions.length}</p>
              <p>User Role: {user?.role || "Not logged in"}</p>
              {auctions.length > 0 && (
                <div className="mt-2">
                  <p>
                    <strong>First Auction Structure:</strong>
                  </p>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                    {JSON.stringify(auctions[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
