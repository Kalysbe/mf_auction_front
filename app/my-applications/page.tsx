"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/protected-route"
import { FileText, Eye, Filter } from "lucide-react"

// Моковые данные для заявок банка
const mockApplications = [
  {
    id: 1,
    auctionId: 1,
    auctionName: "Аукцион №1-2025",
    amount: 50000000,
    rate: 7.5,
    submittedDate: "2025-06-01",
    status: "accepted",
    result: "winner",
    documents: ["Лицензия.pdf", "Выписка.pdf", "Гарантия.pdf"],
  },
  {
    id: 2,
    auctionId: 2,
    auctionName: "Аукцион №2-2025",
    amount: 30000000,
    rate: 7.2,
    submittedDate: "2025-06-05",
    status: "rejected",
    result: "lost",
    documents: ["Лицензия.pdf", "Выписка.pdf"],
  },
  {
    id: 3,
    auctionId: 3,
    auctionName: "Аукцион №3-2025",
    amount: 40000000,
    rate: 7.8,
    submittedDate: "2025-06-10",
    status: "pending",
    result: null,
    documents: ["Лицензия.pdf", "Выписка.pdf", "Гарантия.pdf"],
  },
]

// Функция для форматирования суммы
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function MyApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Фильтрация заявок по статусу
  const filteredApplications =
    statusFilter === "all" ? mockApplications : mockApplications.filter((app) => app.status === statusFilter)

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
    if (!result) return <span className="text-gray-500">-</span>

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
        return <span className="text-gray-500">-</span>
    }
  }

  return (
    <ProtectedRoute allowedRoles={["bank"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/images/logo_KSE.png" alt="KSE Logo" width={50} height={50} />
          <h1 className="text-2xl font-bold">Мои заявки</h1>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <p className="text-gray-600">
              Всего ваших заявок: <strong>{mockApplications.length}</strong>
            </p>
            <p className="text-sm text-gray-500">Здесь отображаются только ваши заявки на участие в аукционах</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] border-primary/20">
                <SelectValue placeholder="Фильтр по статусу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все заявки</SelectItem>
                <SelectItem value="pending">На рассмотрении</SelectItem>
                <SelectItem value="accepted">Принятые</SelectItem>
                <SelectItem value="rejected">Отклоненные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle>История заявок</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Аукцион</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Ставка (%)</TableHead>
                  <TableHead>Дата подачи</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Результат</TableHead>
                  <TableHead>Документы</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>{application.id}</TableCell>
                    <TableCell className="font-medium">{application.auctionName}</TableCell>
                    <TableCell>{formatCurrency(application.amount)}</TableCell>
                    <TableCell>{application.rate.toFixed(2)}%</TableCell>
                    <TableCell>{new Date(application.submittedDate).toLocaleDateString("ru-RU")}</TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>{getResultBadge(application.result)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary-600 hover:bg-primary/10"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        {application.documents.length}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={() => router.push(`/my-applications/${application.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Детали
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {statusFilter === "all" ? "У вас пока нет поданных заявок" : "Нет заявок с выбранным статусом"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredApplications.length === 0 && statusFilter === "all" && (
          <div className="text-center mt-8">
            <Button asChild className="bg-primary hover:bg-primary-600">
              <Link href="/">Перейти к списку аукционов</Link>
            </Button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
