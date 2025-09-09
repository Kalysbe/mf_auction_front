"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useWebSocket } from "@/hooks/useWebSocket"
import {
  normalizeAuctionStatus,
  getStatusDisplayText,
  getStatusBadgeVariant,
  normalizeLotStatus,
  getLotStatusDisplayText,
  formatOfferDate,
  getOfferStatusDisplayText,
  getOfferStatusBadgeVariant,
  tokenManager,
} from "@/lib/api"
import ProtectedRoute from "@/components/protected-route"
import { Clock, Package, TrendingUp, Plus, User, FileText, XCircle, AlertCircle } from "lucide-react"
import AuctionReportDialog from "@/components/auction-report-dialog"

const API_BASE_URL = "https://mfauction.adb-solution.com/api"

// Format number with currency
function formatAmount(amount: number, currency = "KGS") {
  // Ensure amount is a valid number before formatting
  const numericAmount = Number(amount)
  if (isNaN(numericAmount)) {
    return `Некорректный объем ${currency}` // Fallback for invalid numbers
  }
  return (
    new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      maximumFractionDigits: 2,
    }).format(numericAmount) + ` ${currency}`
  )
}

// Format percentage
function formatPercent(percent: number | undefined | null) {
  if (percent == null || isNaN(Number(percent))) {
    return "0%"
  }
  return `${Number(percent)}%`
}

// Format time remaining
function formatTimeRemaining(endTime: string) {
  const now = new Date().getTime()
  const end = new Date(endTime).getTime()
  const diff = end - now

  if (diff <= 0) {
    return {
      text: "Время истекло",
      isExpired: true,
      className: "text-red-600",
    }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  let timeString = ""
  let className = "text-green-600"

  if (days > 0) {
    timeString = `${days}д ${hours}ч ${minutes}м`
  } else if (hours > 0) {
    timeString = `${hours}ч ${minutes}м ${seconds}с`
    if (hours < 1) className = "text-orange-600"
  } else if (minutes > 0) {
    timeString = `${minutes}м ${seconds}с`
    className = "text-orange-600"
    if (minutes < 10) className = "text-red-600"
  } else {
    timeString = `${seconds}с`
    className = "text-red-600"
  }

  return {
    text: `Осталось: ${timeString}`,
    isExpired: false,
    className,
  }
}

const fetchAuctionReport = async (auctionId: string) => {
  try {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("No authentication token")
    }

    const response = await fetch(`https://mfa.kse.kg/api/auction/${auctionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Report API error:", errorText)
      throw new Error(`Failed to fetch report: ${response.status}`)
    }

    const reportData = await response.json()
    return reportData
  } catch (error) {
    console.error("[v0] Error fetching auction report:", error)
    throw error
  }
}

export default function AuctionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const {
    auctions,
    currentAuction,
    lots,
    onlineUsers,
    joinAuction,
    createLot,
    closeAuction,
    getAuctionLots,
    getOnlineUsers,
    isConnected,
    cancelOffer,
    closeLot,
    createOffer,
  } = useWebSocket()

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null)
  const [offerPercent, setOfferPercent] = useState("")
  const [offerVolume, setOfferVolume] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [isClosingAuction, setIsClosingAuction] = useState(false)
  const [userDocumentsVerified, setUserDocumentsVerified] = useState<boolean>(true) // Updated to true
  const [showCreateLot, setShowCreateLot] = useState(false)
  const [lotAsset, setLotAsset] = useState("")
  const [lotVolume, setLotVolume] = useState("")
  const [lotPercent, setLotPercent] = useState("")
  const [term_month, setLotTermMonth] = useState("")
  const [canGenerateReport, setCanGenerateReport] = useState(false)
  const [canForceCloseAuction, setCanForceCloseAuction] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState({ text: "", isExpired: false, className: "" })
  const [auctionTitle, setAuctionTitle] = useState("")
  const [auctionDescription, setAuctionDescription] = useState("")

  const auction = auctions.find((a) => a.id === params.id) || currentAuction
  const selectedLot = lots.find((lot) => lot.id === selectedLotId)
  const canEditOfferVolume = user?.role === "admin" || user?.role === "initiator"
  const canViewAuction = auction?.status === "open" || auction?.status === "closed" || auction?.status === "active"
  const normalizedStatus = normalizeAuctionStatus(auction?.status)
  const statusText = getStatusDisplayText(auction?.status)
  const badgeVariant = getStatusBadgeVariant(auction?.status)

  const checkUserDocumentsForAuction = useCallback(async () => {
    if (!user || !params.id) return false

    if (user.role === "admin" || user.role === "initiator") {
      setUserDocumentsVerified(true)
      return true
    }

    try {
      const token = tokenManager.getToken()
      if (!token) return false

      const response = await fetch(`${API_BASE_URL}/file/auction/${params.id}/files/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const documents = await response.json()
        const hasDocuments = documents && documents.length > 0
        setUserDocumentsVerified(hasDocuments)
        return hasDocuments
      }
    } catch (error) {
      console.error("[v0] Ошибка проверки документов:", error)
    }

    setUserDocumentsVerified(false)
    return false
  }, [user, params.id])

  const handleJoinAuction = useCallback(() => {
    if (isConnected && params.id && !hasJoined) {
      joinAuction(params.id)
      setHasJoined(true)

      if (user?.role === "admin" || user?.role === "initiator" || (auction && auction.user_id === user?.id)) {
        getOnlineUsers(params.id)
      }
    }
  }, [isConnected, params.id, hasJoined, joinAuction, getOnlineUsers, user?.role, user?.id, auction?.user_id, auction])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    handleJoinAuction()
  }, [handleJoinAuction])

  useEffect(() => {
    setHasJoined(false)
    setSelectedLotId(null)
  }, [params.id])

  useEffect(() => {
    checkUserDocumentsForAuction()
  }, [checkUserDocumentsForAuction])

  useEffect(() => {
    if (auction) {
      setCanGenerateReport(user?.role === "admin" || user?.role === "initiator")
      setCanForceCloseAuction((user?.role === "admin" || user?.role === "initiator") && normalizedStatus === "active")
      setTimeRemaining(formatTimeRemaining(auction.end_time))
      setAuctionTitle(auction.title || `${auction.type === "sell" ? "Продажа" : "Покупка"} ${auction.asset}`)
      setAuctionDescription(`${auction.asset} - ${auction.currency}`)
    }
  }, [auction, user?.role, normalizedStatus])

  if (!auction) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Аукцион не найден</h2>
          <p className="text-gray-600 mb-4">
            {isConnected ? "Аукцион с таким ID не существует или еще загружается" : "Подключение к серверу..."}
          </p>
          <Button asChild className="bg-primary hover:bg-primary-600">
            <Link href="/">Вернуться к списку аукционов</Link>
          </Button>
        </div>
      </ProtectedRoute>
    )
  }

  if (!canViewAuction) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Аукцион недоступен</h2>
          <p className="text-gray-600 mb-4">Этот аукцион недоступен для просмотра</p>
          <Button asChild className="bg-primary hover:bg-primary-600">
            <Link href="/">Вернуться к списку аукционов</Link>
          </Button>
        </div>
      </ProtectedRoute>
    )
  }

  const formatVolumeInput = (value: string) => {
    // Удаляем все пробелы и нечисловые символы кроме точки
    const cleanValue = value.replace(/[^\d.]/g, "")

    // Разделяем на целую и дробную части
    const parts = cleanValue.split(".")
    const integerPart = parts[0]
    const decimalPart = parts[1]

    // Форматируем целую часть с пробелами как разделителями тысяч
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ")

    // Возвращаем отформатированное значение
    return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger
  }

  const getNumericValue = (formattedValue: string) => {
    return formattedValue.replace(/\s/g, "")
  }

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auction || !lotAsset || !lotVolume || !lotPercent || !term_month) return

    const volume = Number.parseFloat(getNumericValue(lotVolume))
    const percent = Number.parseFloat(lotPercent)
    const termMonth = Number.parseInt(term_month)

    if (isNaN(volume) || volume <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректный объем",
        variant: "destructive",
      })
      return
    }

    if (isNaN(percent) || percent <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректную минимальную ставку",
        variant: "destructive",
      })
      return
    }

    if (isNaN(termMonth) || termMonth <= 0 || termMonth > 60) {
      toast({
        title: "Ошибка",
        description: "Введите корректный срок размещения (1-60 месяцев)",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const lotData = {
        auction_id: auction.id,
        asset: lotAsset,
        volume: getNumericValue(lotVolume), // Отправляем числовое значение без пробелов
        percent: lotPercent,
        term_month: termMonth, // Добавлено поле term_month в данные лота
      }

      console.log("📦 Creating lot with data:", lotData)
      createLot(lotData)

      setLotAsset("")
      setLotVolume("")
      setLotPercent("")
      setLotTermMonth("") // Очистка поля срока размещения
      setShowCreateLot(false)

      toast({
        title: "Лот создан",
        description: `Лот "${lotAsset}" успешно создан`,
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать лот",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLot || !offerPercent) return // offerVolume is no longer a direct dependency for all roles

    const percent = Number.parseFloat(offerPercent)
    if (isNaN(percent) || percent <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректную процентную ставку",
        variant: "destructive",
      })
      return
    }

    let finalVolume: number
    if (canEditOfferVolume) {
      // For admin/initiator, use the input value
      const volume = Number.parseFloat(offerVolume)
      if (isNaN(volume) || volume <= 0) {
        toast({
          title: "Ошибка",
          description: "Введите корректный объем",
          variant: "destructive",
        })
        return
      }
      if (selectedLot.volume && volume > selectedLot.volume) {
        toast({
          title: "Ошибка",
          description: `Объем не может превышать ${formatAmount(selectedLot.volume, auction?.currency || "KGS")}`,
          variant: "destructive",
        })
        return
      }
      finalVolume = volume
    } else {
      // For bank users, use the full lot volume
      finalVolume = selectedLot.volume
    }

    setIsSubmitting(true)
    try {
      console.log("💰 Submitting offer for lot:", selectedLot.id)

      createOffer(selectedLot.id, percent, finalVolume)
      setOfferPercent("")
      if (canEditOfferVolume) {
        setOfferVolume("") // Only clear if it was an input field
      }

      toast({
        title: "Предложение отправлено",
        description: `Ваше предложение: ${formatPercent(percent)} на сумму ${formatAmount(finalVolume, auction?.currency || "KGS")}`,
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить предложение",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseAuction = async () => {
    if (!auction) return

    setIsClosingAuction(true)
    try {
      // Собрать все принятые предложения со всех лотов
      const allAcceptedOffers = lots.flatMap((lot) => (lot.offers || []).filter((offer) => offer.status === "accepted"))

      // Найти лучшее принятое предложение (например, с наибольшим процентом)
      const bestAcceptedOffer = allAcceptedOffers.sort((a, b) => b.percent - a.percent)[0]

      // Определить offerId для закрытия аукциона
      const offerIdToClose = bestAcceptedOffer ? bestAcceptedOffer.id : "" // Передаем ID лучшего предложения или пустую строку

      console.log(`Attempting to close auction ${auction.id} with offer ID: ${offerIdToClose}`)
      closeAuction(auction.id, offerIdToClose)

      toast({
        title: "Аукцион закрыт",
        description: "Аукцион успешно принудительно завершен.",
      })
    } catch (error) {
      console.error("Error closing auction:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось принудительно завершить аукцион.",
        variant: "destructive",
      })
    } finally {
      setIsClosingAuction(false)
    }
  }

  const handleCloseLot = async (lotId: string) => {
    if (!auction) return

    try {
      console.log("[v0] Starting lot closure process")
      console.log("[v0] Lot ID to close:", lotId)
      console.log("[v0] Auction ID:", auction.id)

      closeLot(lotId, auction.id)

      setTimeout(() => {
        console.log("[v0] Refreshing auction data after lot closure")
        getAuctionLots(auction.id)
      }, 1000)

      toast({
        title: "Лот закрыт",
        description: "Лот успешно закрыт",
      })
    } catch (error) {
      console.error("[v0] Error closing lot:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось закрыть лот",
        variant: "destructive",
      })
    }
  }

  const handleCancelOffer = async (offerId: string, offerUserId: string) => {
    try {
      // Добавлено детальное логирование для отладки
      cancelOffer(offerId)

      toast({
        title: "Заявка отменена",
        description: "Заявка успешно отменена",
      })
    } catch (error) {
      console.error("[v0] Error cancelling offer:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось отменить заявку",
        variant: "destructive",
      })
    }
  }

  const canCancelOffer = (offer: any) => {
    // Добавлено логирование проверки прав
    console.log("[v0] Checking cancel permissions for offer:", offer.id)
    console.log("[v0] Offer user_id:", offer.user_id)
    console.log("[v0] Current user_id:", user?.id)
    console.log("[v0] Current user role:", user?.role)

    // Пользователь может отменить свою заявку
    if (offer.user_id === user?.id) {
      console.log("[v0] User can cancel own offer")
      return true
    }

    // Инициатор может отменить любую заявку
    if (user?.role === "initiator") {
      console.log("[v0] Initiator can cancel any offer")
      return true
    }

    // Админ может отменить любую заявку
    if (user?.role === "admin" || user?.role === "initiator") {
      console.log("[v0] Admin can cancel any offer")
      return true
    }

    console.log("[v0] User cannot cancel this offer")
    return false
  }

  const canCloseLot = (lot: any) => {
    console.log("[v0] Checking canCloseLot for lot:", lot.id)
    console.log("[v0] User role:", user?.role)
    console.log("[v0] Lot status:", lot.status)
    console.log("[v0] Auction status:", auction?.status)

    const canClose =
      (user?.role === "initiator" || user?.role === "admin") && lot.status === "open" && auction?.status === "open"
    console.log("[v0] Can close lot result:", canClose)

    // Инициатор и админ могут закрывать лоты
    return canClose
  }

  const canCreateLot = user?.role === "admin" || user?.role === "initiator"
  const canMakeOffer =
    normalizedStatus === "active" && user?.role !== "admin" && user?.role !== "initiator" && userDocumentsVerified
  const canViewParticipants =
    user?.role === "admin" || user?.role === "initiator" || (auction && auction.user_id === user?.id)

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/images/logo_KSE.png" alt="KSE Logo" width={50} height={50} />
          <div>
            <h1 className="text-2xl font-bold">{auctionTitle}</h1>
            <p className="text-gray-600">{auctionDescription}</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
          <span
            className="font-medium"
            style={{
              color: isConnected ? "#166534 !important" : "#991b1b !important",
              fontWeight: "500",
            }}
          >
            {isConnected ? "Подключено к серверу" : "Подключение к серверу..."}
          </span>
          {hasJoined && (
            <span
              className="font-medium ml-2"
              style={{
                color: "#1e40af !important",
                fontWeight: "500",
              }}
            >
              • Присоединился к аукциону
            </span>
          )}
        </div>

        {/* Time Warning */}
        {timeRemaining.isExpired && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <p className="text-orange-800 font-medium">
                ⏰ Время аукциона истекло, но аукцион остается доступным для ручного управления лотами.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Informational Message for Closed Auction */}
        {normalizedStatus === "closed" && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Аукцион завершен</p>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Этот аукцион завершен и доступен только для просмотра результатов
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Auction Type & Status */}
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Тип и статус
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Тип аукциона</p>
                  <Badge variant={auction.type === "sell" ? "default" : "secondary"} className="text-lg px-3 py-1">
                    {auction.type === "sell" ? "Продажа" : "Покупка"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Статус</p>
                  <Badge
                    variant={badgeVariant}
                    className={normalizedStatus === "active" ? "bg-green-500 text-lg px-3 py-1" : "text-lg px-3 py-1"}
                  >
                    {statusText}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currency & Closing Type */}
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Валюта и тип
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Валюта</p>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {auction.currency}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Тип закрытия</p>
                  <Badge
                    variant={auction.closing_type === "auto" ? "default" : "secondary"}
                    className="text-sm px-2 py-1"
                  >
                    {auction.closing_type === "auto" ? "Автоматическое" : "Ручное"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lots Count */}
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Количество лотов
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-600">{lots.length}</p>
            </CardContent>
          </Card>

          {/* Creator Info */}
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Создатель
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">ID пользователя</p>
                <p className="text-sm font-mono bg-gray-100 p-1 rounded">
                  {auction.user_id ? `${auction.user_id.substring(0, 8)}...` : "Неизвестно"}
                </p>
                <p className="text-xs text-gray-400">
                  Создан: {auction.createdAt ? new Date(auction.createdAt).toLocaleDateString("ru-RU") : "Неизвестно"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Remaining */}
        <Card className={`border-primary/20 ${timeRemaining.isExpired ? "border-red-300 bg-red-50" : ""}`}>
          <CardHeader
            className={`${timeRemaining.isExpired ? "bg-red-100" : "bg-primary/5"} border-b border-primary/10 flex-row justify-between items-center`}
          >
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Время окончания
            </CardTitle>
            <div className="flex gap-2">
              {canGenerateReport && (
                <Button
                  onClick={async () => {
                    try {
                      console.log("[v0] Generating report for auction:", auction.id)
                      const reportData = await fetchAuctionReport(auction.id)

                      // Показываем диалог с данными ведомости
                      setShowReportDialog(true)

                      toast({
                        title: "Ведомость сформирована",
                        description: "Ведомость аукциона успешно получена",
                      })
                    } catch (error) {
                      console.error("[v0] Error generating report:", error)
                      toast({
                        title: "Ошибка",
                        description: "Не удалось сформировать ведомость",
                        variant: "destructive",
                      })
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Сформировать ведомость
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Дата и время окончания</p>
                <p className="text-lg font-medium">{new Date(auction.end_time).toLocaleString("ru-RU")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Осталось времени</p>
                <div className={`text-lg font-bold ${timeRemaining.className}`}>{timeRemaining.text}</div>
                {timeRemaining.isExpired && <p className="text-sm text-red-600 mt-1">Аукцион завершен</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Lot Form (for admin) */}
        {canCreateLot && (
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center justify-between">
                <span>Управление лотами</span>
                <Button
                  onClick={() => setShowCreateLot(!showCreateLot)}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {showCreateLot ? "Скрыть форму" : "Создать лот"}
                </Button>
              </CardTitle>
            </CardHeader>
            {showCreateLot && (
              <form onSubmit={handleCreateLot}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lotAsset">Название лота</Label>
                      <Input
                        id="lotAsset"
                        value={lotAsset}
                        onChange={(e) => setLotAsset(e.target.value)}
                        placeholder="Например: Auction 2 lot 2"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lotVolume">Объем</Label>
                      <Input
                        id="lotVolume"
                        type="text"
                        value={lotVolume}
                        onChange={(e) => setLotVolume(formatVolumeInput(e.target.value))}
                        placeholder="300 000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lotPercent">Минимальная ставка (%)</Label>
                      <Input
                        id="lotPercent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={lotPercent}
                        onChange={(e) => setLotPercent(e.target.value)}
                        placeholder="12.5"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="term_month">Срок размещения (мес.)</Label>
                      <Input
                        id="term_month"
                        type="number"
                        min="1"
                        max="60"
                        value={term_month}
                        onChange={(e) => setLotTermMonth(e.target.value)}
                        placeholder="12"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-primary/5 border-t border-primary/10">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isConnected}
                    className="bg-primary hover:bg-primary-600"
                  >
                    {isSubmitting ? "Создание..." : "Создать лот"}
                  </Button>
                </CardFooter>
              </form>
            )}
          </Card>
        )}

        {/* Lots List */}
        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Лоты аукциона ({lots.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Объем</TableHead>
                  <TableHead>Процентная ставка</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead>Предложения</TableHead>
                  {/* Добавлен столбец для действий */}
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lots.map((lot) => {
                  const lotStatus = normalizeLotStatus(lot.status)
                  const lotStatusText = getLotStatusDisplayText(lot.status)
                  const offerCount = lot.offers?.length || 0 // ИСПОЛЬЗУЕМ offers из объекта lot

                  return (
                    <TableRow key={lot.id} className={selectedLotId === lot.id ? "bg-primary/10" : ""}>
                      <TableCell className="font-medium">{lot.asset}</TableCell>
                      <TableCell>{formatAmount(lot.volume, auction.currency)}</TableCell>
                      <TableCell>{formatPercent(lot.percent)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={lotStatus === "active" ? "default" : "secondary"}
                          className={lotStatus === "active" ? "bg-green-500" : ""}
                        >
                          {lotStatusText}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(lot.createdAt).toLocaleString("ru-RU")}</TableCell>
                      <TableCell className="text-center">
                        {offerCount > 0 ? (
                          <Badge variant="outline" className="text-primary border-primary">
                            {offerCount} {offerCount === 1 ? "предложение" : "предложения"}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant={selectedLotId === lot.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedLotId(lot.id)}
                            className={
                              selectedLotId === lot.id
                                ? "bg-primary"
                                : "border-primary text-primary hover:bg-primary/10"
                            }
                          >
                            {selectedLotId === lot.id ? "Выбран" : "Выбрать"}
                          </Button>
                          {canCloseLot(lot) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCloseLot(lot.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Закрыть лот
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {lots.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {hasJoined ? "В этом аукционе пока нет лотов" : "Подключение к аукциону..."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Make Offer Form (when lot is selected) */}
        {canMakeOffer && selectedLot && (
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle>Сделать предложение на лот: {selectedLot.asset}</CardTitle>
              <CardDescription>
                Введите процентную ставку {canEditOfferVolume ? "и объем" : ""} вашего предложения для выбранного лота
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitOffer}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="offerPercent">Процентная ставка (%)</Label>
                    <Input
                      id="offerPercent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={offerPercent}
                      onChange={(e) => setOfferPercent(e.target.value)}
                      placeholder="Например: 7.5"
                      required
                    />
                  </div>
                  {canEditOfferVolume ? (
                    <div className="space-y-2">
                      <Label htmlFor="offerVolume">Объем ({auction.currency})</Label>
                      <Input
                        id="offerVolume"
                        type="number"
                        step="0.01"
                        min="0"
                        max={selectedLot.volume}
                        value={offerVolume}
                        onChange={(e) => setOfferVolume(e.target.value)}
                        placeholder={`Максимум: ${selectedLot.volume || 0}`}
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Объем ({auction.currency})</Label>
                      <p className="text-lg font-medium">
                        {formatAmount(selectedLot.volume, auction.currency)} (полный объем лота)
                      </p>
                    </div>
                  )}
                </div>
                {!canEditOfferVolume && <p className="text-sm text-gray-500 mt-2">Вы предлагаете полный объем лота.</p>}
              </CardContent>
              <CardFooter className="bg-primary/5 border-t border-primary/10">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isConnected || !hasJoined}
                  className="bg-primary hover:bg-primary-600"
                >
                  {isSubmitting ? "Отправка..." : !hasJoined ? "Подключение..." : "Сделать предложение"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Offers for Selected Lot */}
        {selectedLot && (
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center justify-between">
                <span>
                  Предложения по лоту: {selectedLot.asset} ({selectedLot.offers?.length || 0})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    {user?.role === "admin" || (user?.role === "initiator" && <TableHead>Участник</TableHead>)}
                    <TableHead>Процентная ставка</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Время</TableHead>
                    {/* Добавлен столбец для действий */}
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedLot.offers || [])
                    .sort((a, b) => (b.percent || 0) - (a.percent || 0))
                    .map((offer, index) => (
                      <TableRow
                        key={offer.id}
                        className={index === 0 && (selectedLot.offers?.length || 0) > 1 ? "bg-green-50" : ""}
                      >
                        {user?.role === "admin" ||
                          (user?.role === "initiator" && (
                            <TableCell>
                              {offer.user?.name || offer.user?.email || `Пользователь ${offer.user_id}`}
                              {index === 0 && (selectedLot.offers?.length || 0) > 1 && (
                                <Badge className="ml-2 bg-green-500">Лидер</Badge>
                              )}
                            </TableCell>
                          ))}
                        <TableCell className="font-medium">{formatPercent(offer.percent)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getOfferStatusBadgeVariant(offer.status)}
                            className={offer.status === "accepted" ? "bg-green-500" : ""}
                          >
                            {getOfferStatusDisplayText(offer.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            console.log("[v0] Offer time data:", {
                              id: offer.id,
                              created_at: offer.created_at,
                              type: typeof offer.created_at,
                            })

                            if (!offer.created_at) {
                              return <span className="text-gray-400 italic">Время не указано</span>
                            }

                            const formattedTime = formatOfferDate(offer.created_at)
                            console.log("[v0] Formatted time:", formattedTime)

                            return <span className="text-sm">{formattedTime}</span>
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          {canCancelOffer(offer) && offer.status === "pending" && normalizedStatus === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelOffer(offer.id, offer.user_id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Отменить
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  {(!selectedLot.offers || selectedLot.offers.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={user?.role === "admin" || user?.role === "initiator" ? 5 : 4}
                        className="text-center py-8 text-gray-500"
                      >
                        По этому лоту пока нет предложений
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Auction Report Dialog */}
        {auction && lots && (
          <AuctionReportDialog
            isOpen={showReportDialog}
            onClose={() => setShowReportDialog(false)}
            auction={auction}
            lots={lots}
          />
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Auction ID: {auction.id || "Unknown"}</p>
                <p>User ID (Creator): {auction.user_id || "Unknown"}</p>
                <p>
                  Status: {auction.status || "Unknown"} → {normalizedStatus}
                </p>
                <p>Closing Type: {auction.closing_type || "Unknown"}</p>
                <p>Currency: {auction.currency || "Unknown"}</p>
                <p>Connected: {isConnected ? "Yes" : "No"}</p>
                <p>Has Joined: {hasJoined ? "Yes" : "No"}</p>
                <p>Lots Count: {lots.length}</p>
                <p>Selected Lot ID: {selectedLotId || "None"}</p>
                <p>Offers Count (selected lot): {selectedLot?.offers?.length || 0}</p>
                <p>User Role: {user?.role}</p>
                <p>Can Create Lot: {canCreateLot ? "Yes" : "No"}</p>
                <p>Can Make Offer: {canMakeOffer ? "Yes" : "No"}</p>
                <p>Can Edit Offer Volume: {canEditOfferVolume ? "Yes" : "No"}</p>
                <p>Created At: {auction.createdAt ? new Date(auction.createdAt).toLocaleString() : "Unknown"}</p>
                <p>Updated At: {auction.updatedAt ? new Date(auction.updatedAt).toLocaleString() : "Unknown"}</p>

                <div className="mt-4 space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log("🔄 Manual lots request triggered")
                      getAuctionLots(auction.id)
                    }}
                    disabled={!isConnected}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                  >
                    🔄 Загрузить лоты
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log("🔄 Manual join triggered")
                      joinAuction(auction.id)
                    }}
                    disabled={!isConnected}
                  >
                    🚪 Переподключиться
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log("🧹 Clearing lots state manually")
                      window.location.reload()
                    }}
                  >
                    🧹 Очистить лоты
                  </Button>
                </div>

                {lots.length > 0 && (
                  <div className="mt-4">
                    <p>
                      <strong>Lots Data:</strong>
                    </p>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(lots, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
