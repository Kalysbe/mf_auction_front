"use client"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ProtectedRoute from "@/components/protected-route"
import { FileText, ArrowLeft, Download, Calendar, Clock, CreditCard, Percent } from "lucide-react"

// Моковые данные для детальной информации о заявке
const getApplicationById = (id: string) => {
  const applications = [
    {
      id: 1,
      auctionId: 1,
      auctionName: "Аукцион №1-2025",
      auctionDetails: {
        amount: 100000000,
        term: "30 дней",
        endDate: "2025-06-15",
        currency: "RUB",
      },
      bankName: "Сбербанк",
      inn: "7707083893",
      amount: 50000000,
      rate: 7.5,
      submittedDate: "2025-06-01",
      status: "accepted",
      result: "winner",
      resultDetails: "Ваша заявка выиграла аукцион с наивысшей ставкой.",
      documents: [
        { name: "Лицензия.pdf", type: "application/pdf", url: "#" },
        { name: "Выписка.pdf", type: "application/pdf", url: "#" },
        { name: "Гарантия.pdf", type: "application/pdf", url: "#" },
      ],
    },
    {
      id: 2,
      auctionId: 2,
      auctionName: "Аукцион №2-2025",
      auctionDetails: {
        amount: 50000000,
        term: "60 дней",
        endDate: "2025-06-20",
        currency: "RUB",
      },
      bankName: "Сбербанк",
      inn: "7707083893",
      amount: 30000000,
      rate: 7.2,
      submittedDate: "2025-06-05",
      status: "rejected",
      result: "lost",
      resultDetails: "Ваша заявка была отклонена. Причина: недостаточная ставка.",
      documents: [
        { name: "Лицензия.pdf", type: "application/pdf", url: "#" },
        { name: "Выписка.pdf", type: "application/pdf", url: "#" },
      ],
    },
    {
      id: 3,
      auctionId: 3,
      auctionName: "Аукцион №3-2025",
      auctionDetails: {
        amount: 5000000,
        term: "90 дней",
        endDate: "2025-07-25",
        currency: "USD",
      },
      bankName: "Сбербанк",
      inn: "7707083893",
      amount: 40000000,
      rate: 7.8,
      submittedDate: "2025-06-10",
      status: "pending",
      result: null,
      resultDetails: null,
      documents: [
        { name: "Лицензия.pdf", type: "application/pdf", url: "#" },
        { name: "Выписка.pdf", type: "application/pdf", url: "#" },
        { name: "Гарантия.pdf", type: "application/pdf", url: "#" },
      ],
    },
  ]

  return applications.find((app) => app.id === Number(id)) || null
}

// Функция для форматирования суммы
function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ApplicationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const application = getApplicationById(params.id)

  if (!application) {
    return (
      <ProtectedRoute allowedRoles={["bank"]}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Заявка не найдена</h2>
          <Button asChild className="bg-primary hover:bg-primary-600">
            <Link href="/my-applications">Вернуться к списку заявок</Link>
          </Button>
        </div>
      </ProtectedRoute>
    )
  }

  // Получение статуса заявки для отображения
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <Badge variant="success" className="bg-green-500">
            Принята
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Отклонена</Badge>
      case "pending":
        return <Badge>На рассмотрении</Badge>
      default:
        return <Badge variant="outline">Неизвестно</Badge>
    }
  }

  // Получение результата аукциона для отображения
  const getResultBadge = (result: string | null) => {
    if (!result) return null

    switch (result) {
      case "winner":
        return <Badge className="bg-primary">Победитель</Badge>
      case "lost":
        return (
          <Badge variant="outline" className="text-gray-500">
            Проиграл
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <ProtectedRoute allowedRoles={["bank"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Image src="/images/logo_KSE.png" alt="KSE Logo" width={50} height={50} />
            <h1 className="text-2xl font-bold">Детали заявки #{application.id}</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/my-applications")}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle>Информация об аукционе</CardTitle>
              <CardDescription>{application.auctionName}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Общая сумма аукциона</p>
                    <p className="font-medium">
                      {formatCurrency(application.auctionDetails.amount, application.auctionDetails.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Срок размещения</p>
                    <p className="font-medium">{application.auctionDetails.term}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Дата окончания приема заявок</p>
                    <p className="font-medium">
                      {new Date(application.auctionDetails.endDate).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle>Информация о заявке</CardTitle>
              <div className="flex gap-2 mt-1">
                {getStatusBadge(application.status)}
                {getResultBadge(application.result)}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Сумма заявки</p>
                    <p className="font-medium">
                      {formatCurrency(application.amount, application.auctionDetails.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Предложенная ставка</p>
                    <p className="font-medium">{application.rate.toFixed(2)}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Дата подачи заявки</p>
                    <p className="font-medium">{new Date(application.submittedDate).toLocaleDateString("ru-RU")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {application.resultDetails && (
          <Card className={`border-primary/20 ${application.result === "winner" ? "bg-green-50" : ""}`}>
            <CardHeader
              className={`${application.result === "winner" ? "bg-green-100/50" : "bg-primary/5"} border-b border-primary/10`}
            >
              <CardTitle>Результат рассмотрения</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p>{application.resultDetails}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle>Прикрепленные документы</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {application.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>{doc.name}</span>
                  </div>
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                    <Download className="h-4 w-4 mr-1" />
                    Скачать
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
