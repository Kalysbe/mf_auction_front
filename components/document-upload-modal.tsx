"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { tokenManager } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://mfauction.adb-solution.com"

interface DocumentType {
  id: string
  title: string
}

interface UploadedDocument {
  id: string
  auction_id: string
  user_id: string
  file_type: string
  url: string
  createdAt: string
  updatedAt: string
}

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onDocumentsComplete: () => void
  auctionId: string
}

export function DocumentUploadModal({ isOpen, onClose, onDocumentsComplete, auctionId }: DocumentUploadModalProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  // Загрузка типов документов
  const fetchDocumentTypes = async () => {
    try {
      const token = tokenManager.getToken()
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/api/file/type/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const types = await response.json()
        console.log("[v0] Получены типы документов:", types)
        setDocumentTypes(types || [])
      }
    } catch (error) {
      console.error("[v0] Ошибка при получении типов документов:", error)
    }
  }

  // Загрузка загруженных документов пользователя
  const fetchUploadedDocuments = async () => {
    try {
      const token = tokenManager.getToken()
      if (!token) return

      console.log("[v0] Запрашиваем список документов пользователя...")

      const response = await fetch(`${API_BASE_URL}/api/file/my-list/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Статус ответа API my-list:", response.status)

      if (response.ok) {
        const auctionData = await response.json()
        console.log("[v0] Полный ответ API my-list:", JSON.stringify(auctionData, null, 2))

        let allFiles: UploadedDocument[] = []
        if (Array.isArray(auctionData)) {
          auctionData.forEach((auction) => {
            if (auction.files && Array.isArray(auction.files)) {
              allFiles = [...allFiles, ...auction.files]
            }
          })
        }

        console.log("[v0] Извлеченные файлы:", allFiles)
        setUploadedDocuments(allFiles)
      } else {
        const errorText = await response.text()
        console.error("[v0] Ошибка API my-list:", response.status, errorText)
      }
    } catch (error) {
      console.error("[v0] Исключение при получении загруженных документов:", error)
    }
  }

  // Загрузка файла
  const handleFileUpload = async (typeId: string, file: File) => {
    if (!file) return

    // Проверка типа файла
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      alert("Разрешены только файлы PDF и Word (.doc, .docx)")
      return
    }

    // Проверка размера файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Размер файла не должен превышать 10MB")
      return
    }

    setUploading(typeId)

    try {
      const token = tokenManager.getToken()
      if (!token) {
        alert("Необходима авторизация")
        return
      }

      const documentType = documentTypes.find((type) => type.id === typeId)
      const fileTypeName = documentType?.title || ""

      const formData = new FormData()
      formData.append("file", file)
      formData.append("file_type", fileTypeName)
      formData.append("auction_id", auctionId)

      console.log("[v0] Загружаем файл:", file.name, "для типа:", typeId)
      console.log("[v0] Название типа документа:", fileTypeName)
      console.log("[v0] ID аукциона:", auctionId)
      console.log("[v0] Размер файла:", file.size, "байт")
      console.log("[v0] Тип файла:", file.type)
      console.log("[v0] Отправляемые данные FormData:")
      console.log("[v0] - file:", file.name)
      console.log("[v0] - file_type:", fileTypeName)
      console.log("[v0] - auction_id:", auctionId)

      const response = await fetch(`${API_BASE_URL}/api/file/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Не добавляем Content-Type для FormData - браузер сам установит правильный заголовок
        },
        body: formData,
      })

      console.log("[v0] Статус ответа загрузки:", response.status)
      console.log("[v0] Заголовки ответа:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Файл успешно загружен:", result)

        // Обновляем список загруженных документов
        await fetchUploadedDocuments()

        // Проверяем, все ли документы загружены
        checkDocumentsComplete()
      } else {
        const errorText = await response.text()
        console.error("[v0] Ошибка загрузки файла:", response.status, errorText)
        alert(`Ошибка при загрузке файла: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error("[v0] Исключение при загрузке файла:", error)
      alert(`Ошибка при загрузке файла: ${error}`)
    } finally {
      setUploading(null)
    }
  }

  // Проверка завершенности загрузки всех документов
  const checkDocumentsComplete = () => {
    const requiredTypes = documentTypes
    const uploadedFileTypes = uploadedDocuments.map((doc) => doc.file_type)
    const uploadedTypeIds = documentTypes
      .filter((type) => uploadedFileTypes.includes(type.title))
      .map((type) => type.id)

    const allRequiredUploaded = requiredTypes.every((type) => uploadedTypeIds.includes(type.id))

    console.log("[v0] Проверка документов:")
    console.log("[v0] Обязательные типы:", requiredTypes.length)
    console.log("[v0] Загруженные типы файлов:", uploadedFileTypes)
    console.log("[v0] Сопоставленные ID типов:", uploadedTypeIds)
    console.log("[v0] Все обязательные загружены:", allRequiredUploaded)

    if (allRequiredUploaded && requiredTypes.length > 0) {
      console.log("[v0] Все обязательные документы загружены, закрываем модальное окно")
      onDocumentsComplete()
    } else {
      console.log("[v0] Не все документы загружены, модальное окно остается открытым")
    }
  }

  // Получение статуса документа по типу
  const getDocumentStatus = (typeId: string) => {
    const documentType = documentTypes.find((type) => type.id === typeId)
    if (!documentType) return null

    const doc = uploadedDocuments.find((d) => d.file_type === documentType.title)
    return doc ? "approved" : null // Все загруженные документы считаем одобренными
  }

  const getDocumentFilename = (typeId: string) => {
    const documentType = documentTypes.find((type) => type.id === typeId)
    if (!documentType) return null

    const doc = uploadedDocuments.find((d) => d.file_type === documentType.title)
    if (!doc) return null

    // Извлекаем имя файла из URL
    const urlParts = doc.url.split("/")
    return urlParts[urlParts.length - 1] || "Загруженный файл"
  }

  const getUploadDate = (typeId: string) => {
    const documentType = documentTypes.find((type) => type.id === typeId)
    if (!documentType) return null

    const doc = uploadedDocuments.find((d) => d.file_type === documentType.title)
    if (!doc) return null

    return new Date(doc.createdAt).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      Promise.all([fetchDocumentTypes(), fetchUploadedDocuments()]).finally(() => setLoading(false))
    }
  }, [isOpen])

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            Одобрен
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Отклонен</Badge>
      case "pending":
        return <Badge variant="secondary">На проверке</Badge>
      default:
        return <Badge variant="outline">Не загружен</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Загрузка документов для участия в аукционе</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Загрузка...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Для участия в аукционе необходимо загрузить все обязательные документы. Документы должны быть в формате
              PDF или Word (.doc, .docx).
            </div>

            <div className="grid gap-4">
              {documentTypes.map((type) => {
                const status = getDocumentStatus(type.id)
                const filename = getDocumentFilename(type.id)
                const isUploading = uploading === type.id

                return (
                  <Card key={type.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(status)}
                          <div>
                            <CardTitle className="text-base">
                              {type.title}
                              <span className="text-red-500 ml-1">*</span>
                            </CardTitle>
                          </div>
                        </div>
                        {getStatusBadge(status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {filename && (
                            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                              <p className="text-sm font-medium text-green-800 mb-1">Загруженный файл:</p>
                              <p className="text-sm text-green-700">{filename}</p>
                              {getUploadDate(type.id) && (
                                <p className="text-xs text-green-600 mt-1">Загружен: {getUploadDate(type.id)}</p>
                              )}
                            </div>
                          )}

                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleFileUpload(type.id, file)
                              }
                            }}
                            disabled={isUploading}
                            className="hidden"
                            id={`file-${type.id}`}
                          />

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            onClick={() => document.getElementById(`file-${type.id}`)?.click()}
                            className="w-full sm:w-auto"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Загрузка...
                              </>
                            ) : status === "approved" ? (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Заменить файл
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Выбрать файл
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
