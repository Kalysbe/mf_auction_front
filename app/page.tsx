"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useWebSocket } from "@/hooks/useWebSocket"
import { normalizeAuctionStatus, getStatusDisplayText, getStatusBadgeVariant, tokenManager } from "@/lib/api"
import { Wifi, WifiOff, FileText } from "lucide-react"
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

export const API_BASE_URL = "https://mfauction.adb-solution.com"

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
    const handleAuthChange = () => {
      window.location.reload()
    }

    window.addEventListener("auth-changed", handleAuthChange)
    return () => window.removeEventListener("auth-changed", handleAuthChange)
  }, [])

  const handleGetReport = async (auctionId: string) => {
    if (!user) return

    setLoadingReport(auctionId)
    console.log("[v0] Получение ведомости для аукциона:", auctionId)

    try {
      const token = tokenManager.getToken()
      if (!token) {
        console.log("[v0] Токен не найден")
        alert("Ошибка авторизации. Войдите в систему заново.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/auction/${auctionId}`, {
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

    if (user.role === "admin" || user.role === "initiator") {
      console.log("[v0] Пропускаем проверку документов для роли:", user.role)
      return true
    }

    try {
      const token = tokenManager.getToken()
      if (!token) return false

      console.log("[v0] Проверяем документы пользователя для аукциона:", auctionId)

      const typesResponse = await fetch(`${API_BASE_URL}/api/file/type/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const docsResponse = await fetch(`${API_BASE_URL}/api/file/my-list/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Статус ответа типов документов:", typesResponse.status)
      console.log("[v0] Статус ответа списка документов:", docsResponse.status)

      if (typesResponse.ok && docsResponse.ok) {
        const types = await typesResponse.json()
        const documents = await docsResponse.json()

        console.log("[v0] Получены типы документов:", JSON.stringify(types, null, 2))
        console.log("[v0] Получены документы пользователя:", JSON.stringify(documents, null, 2))

        const requiredTypes = types || []

        // Извлекаем файлы из структуры аукционов
        const allFiles = documents.flatMap((auction: any) => auction.files || [])

        // Фильтруем файлы для текущего аукциона
        const auctionFiles = allFiles.filter((file: any) => file.auction_id === auctionId)

        // Получаем типы загруженных документов
        const uploadedFileTypes = auctionFiles.map((file: any) => file.file_type)

        // Проверяем, что все обязательные типы загружены
        const allRequiredUploaded =
          requiredTypes.length > 0 && requiredTypes.every((type: any) => uploadedFileTypes.includes(type.title))

        console.log("[v0] Проверка документов для аукциона:", auctionId)
        console.log(
          "[v0] Обязательные типы:",
          requiredTypes.length,
          requiredTypes.map((t: any) => t.title),
        )
        console.log("[v0] Загруженные типы для аукциона:", uploadedFileTypes)
        console.log("[v0] Все обязательные документы загружены:", allRequiredUploaded)

        setDocumentsComplete((prev) => ({ ...prev, [auctionId]: allRequiredUploaded }))
        return allRequiredUploaded
      } else {
        console.error("[v0] Ошибка при получении данных о документах")
        console.error("[v0] Типы документов - статус:", typesResponse.status)
        console.error("[v0] Список документов - статус:", docsResponse.status)

        if (!typesResponse.ok) {
          const errorText = await typesResponse.text()
          console.error("[v0] Ошибка типов документов:", errorText)
        }
        if (!docsResponse.ok) {
          const errorText = await docsResponse.text()
          console.error("[v0] Ошибка списка документов:", errorText)
        }
      }
    } catch (error) {
      console.error("[v0] Исключение при проверке документов:", error)
    }

    return false
  }

  const handleParticipateClick = async (auctionId: string) => {
    console.log("[v0] Попытка участия в аукционе:", auctionId)

    const hasDocuments = await checkUserDocuments(auctionId)

    if (hasDocuments) {
      console.log("[v0] Документы загружены, присоединяемся к аукциону")
      joinAuction(auctionId)
      router.push(`/auction/${auctionId}`)
    } else {
      console.log("[v0] Документы не загружены, показываем модальное окно")
      setSelectedAuctionId(auctionId)
      setDocumentModalOpen(true)
    }
  }

  const handleDocumentsComplete = () => {
    console.log("[v0] Все документы загружены, присоединяемся к аукциону")
    setDocumentModalOpen(false)

    if (selectedAuctionId) {
      joinAuction(selectedAuctionId)
      router.push(`/auction/${selectedAuctionId}`)
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
                <span className="text-sm text-green-600">Подключено к серверу</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-600">
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
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
