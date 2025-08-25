"use client"

import { useState } from "react"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download } from "lucide-react"
import ProtectedRoute from "@/components/protected-route"

// Mock data for auctions
const auctions = [
  { id: "1", name: "Аукцион №1-2025" },
  { id: "2", name: "Аукцион №2-2025" },
  { id: "3", name: "Аукцион №3-2025" },
]

// Mock data for applications
const applications = [
  {
    id: 1,
    auctionId: "1",
    bankName: "Сбербанк",
    inn: "7707083893",
    amount: 50000000,
    rate: 7.5,
    status: "pending",
    documents: ["Лицензия.pdf", "Выписка.pdf", "Гарантия.pdf"],
  },
  {
    id: 2,
    auctionId: "1",
    bankName: "ВТБ",
    inn: "7702070139",
    amount: 75000000,
    rate: 7.2,
    status: "pending",
    documents: ["Лицензия.pdf", "Выписка.pdf"],
  },
  {
    id: 3,
    auctionId: "1",
    bankName: "Газпромбанк",
    inn: "7744001497",
    amount: 100000000,
    rate: 7.0,
    status: "pending",
    documents: ["Лицензия.pdf", "Выписка.pdf", "Гарантия.pdf"],
  },
  {
    id: 4,
    auctionId: "2",
    bankName: "Альфа-Банк",
    inn: "7728168971",
    amount: 30000000,
    rate: 7.8,
    status: "pending",
    documents: ["Лицензия.pdf", "Выписка.pdf"],
  },
]

export default function AdminPage() {
  const [selectedAuction, setSelectedAuction] = useState<string>("1")
  const [applicationStatus, setApplicationStatus] = useState<Record<number, string>>({})
  const [showProtocol, setShowProtocol] = useState(false)

  // Filter applications by selected auction
  const filteredApplications = applications.filter((app) => app.auctionId === selectedAuction)

  // Update application status
  const updateStatus = (id: number, status: string) => {
    setApplicationStatus((prev) => ({ ...prev, [id]: status }))
  }

  // Get current status of an application
  const getStatus = (id: number, defaultStatus: string) => {
    return applicationStatus[id] || defaultStatus
  }

  // Sort applications by rate for protocol
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    // First by status (accepted first)
    const statusA = getStatus(a.id, a.status)
    const statusB = getStatus(b.id, b.status)

    if (statusA === "accepted" && statusB !== "accepted") return -1
    if (statusA !== "accepted" && statusB === "accepted") return 1

    // Then by rate (highest first)
    return b.rate - a.rate
  })

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/images/logo_KSE.png" alt="KSE Logo" width={50} height={50} />
          <h1 className="text-2xl font-bold">Панель администратора</h1>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
            <CardTitle>Заявки на участие в аукционе</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-[250px]">
                <Select value={selectedAuction} onValueChange={setSelectedAuction}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue placeholder="Выберите аукцион" />
                  </SelectTrigger>
                  <SelectContent>
                    {auctions.map((auction) => (
                      <SelectItem key={auction.id} value={auction.id}>
                        {auction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setShowProtocol(true)} className="bg-primary hover:bg-primary-600">
                Сформировать протокол
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Банк</TableHead>
                  <TableHead>ИНН</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Ставка (%)</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Документы</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => {
                  const currentStatus = getStatus(application.id, application.status)

                  return (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.bankName}</TableCell>
                      <TableCell>{application.inn}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                          maximumFractionDigits: 0,
                        }).format(application.amount)}
                      </TableCell>
                      <TableCell>{application.rate.toFixed(2)}%</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            currentStatus === "accepted"
                              ? "success"
                              : currentStatus === "rejected"
                                ? "destructive"
                                : "default"
                          }
                          className={currentStatus === "accepted" ? "bg-green-500" : ""}
                        >
                          {currentStatus === "accepted"
                            ? "Принята"
                            : currentStatus === "rejected"
                              ? "Отклонена"
                              : "На рассмотрении"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary-600 hover:bg-primary/10"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {application.documents?.length || 0}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Документы</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                              {application.documents?.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                  <span className="text-sm flex items-center">
                                    <FileText className="h-4 w-4 mr-2 text-primary" />
                                    {doc}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-primary text-primary hover:bg-primary/10"
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Скачать
                                  </Button>
                                </div>
                              ))}
                              {(!application.documents || application.documents.length === 0) && (
                                <p className="text-center py-4 text-gray-500">Нет прикрепленных документов</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(application.id, "accepted")}
                            disabled={currentStatus !== "pending"}
                            className="border-green-500 text-green-600 hover:bg-green-50"
                          >
                            Принять
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(application.id, "rejected")}
                            disabled={currentStatus !== "pending"}
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            Отклонить
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Нет заявок для выбранного аукциона
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Protocol Dialog */}
        <Dialog open={showProtocol} onOpenChange={setShowProtocol}>
          <DialogContent className="max-w-3xl">
            <DialogHeader className="flex flex-row items-center gap-2">
              <Image src="/images/logo_KSE.png" alt="KSE Logo" width={30} height={30} />
              <DialogTitle>Протокол результатов аукциона</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="font-semibold">{auctions.find((a) => a.id === selectedAuction)?.name}</h3>
                <p className="text-sm text-gray-500">Дата формирования: {new Date().toLocaleDateString("ru-RU")}</p>
              </div>

              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead>№</TableHead>
                    <TableHead>Банк</TableHead>
                    <TableHead>ИНН</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Ставка (%)</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedApplications.map((application, index) => {
                    const currentStatus = getStatus(application.id, application.status)

                    return (
                      <TableRow key={application.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{application.bankName}</TableCell>
                        <TableCell>{application.inn}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("ru-RU", {
                            style: "currency",
                            currency: "RUB",
                            maximumFractionDigits: 0,
                          }).format(application.amount)}
                        </TableCell>
                        <TableCell>{application.rate.toFixed(2)}%</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              currentStatus === "accepted"
                                ? "success"
                                : currentStatus === "rejected"
                                  ? "destructive"
                                  : "default"
                            }
                            className={currentStatus === "accepted" ? "bg-green-500" : ""}
                          >
                            {currentStatus === "accepted"
                              ? "Принята"
                              : currentStatus === "rejected"
                                ? "Отклонена"
                                : "На рассмотрении"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button className="bg-primary hover:bg-primary-600">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать протокол
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
