"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, Loader2, Upload, FileText, X } from "lucide-react"
import { tokenManager } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://mfauction.adb-solution.com"

interface DocumentType {
  id: string
  name: string
  required: boolean
}

interface UploadedDocument {
  id: string
  auction_id: string
  user_id: string
  file_type: string
  url: string
  createdAt: string
  updatedAt: string
  file_name?: string
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
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false)
  const [documentsByType, setDocumentsByType] = useState<Record<string, UploadedDocument[]>>({})

  const fetchDocumentTypes = async () => {
    try {
      console.log("[v0] Загружаем типы документов с API...")
      const response = await fetch(`${API_BASE_URL}/file/type/list`, {
        headers: {
          Authorization: `Bearer ${tokenManager.getToken()}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const types = await response.json()
        console.log("[v0] Получены типы документов:", types)

        const mappedTypes = types.map((type: any) => ({
          id: type.id,
          name: type.title,
          required: true,
        }))

        console.log("[v0] Обработанные типы документов:", mappedTypes)
        setDocumentTypes(mappedTypes || [])
      } else {
        console.error("[v0] Ошибка при получении типов документов:", response.status)
        setDocumentTypes([
          { id: "passport", name: "Паспорт", required: true },
          { id: "income_certificate", name: "Справка о доходах", required: true },
          { id: "bank_statement", name: "Банковская выписка", required: true },
        ])
      }
    } catch (error) {
      console.error("[v0] Исключение при получении типов документов:", error)
      setDocumentTypes([
        { id: "passport", name: "Паспорт", required: true },
        { id: "income_certificate", name: "Справка о доходах", required: true },
        { id: "bank_statement", name: "Банковская выписка", required: true },
      ])
    }
  }

  const fetchUserDocuments = async () => {
    try {
      console.log("[v0] Fetching user documents for auction:", auctionId)
      const response = await fetch(`${API_BASE_URL}/file/auction/${auctionId}/files/`, {
        headers: {
          Authorization: `Bearer ${tokenManager.getToken()}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const documents = await response.json()
        console.log("[v0] Получены документы пользователя для аукциона:", documents)
        setUploadedDocuments(documents || [])

        const grouped = (documents || []).reduce((acc: Record<string, UploadedDocument[]>, doc: UploadedDocument) => {
          if (!acc[doc.file_type]) {
            acc[doc.file_type] = []
          }
          acc[doc.file_type].push(doc)
          return acc
        }, {})
        setDocumentsByType(grouped)
      } else {
        console.error("[v0] Ошибка при получении документов пользователя:", response.status)
      }
    } catch (error) {
      console.error("[v0] Исключение при получении документов пользователя:", error)
    }
  }

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!file) return

    const maxSize = 10 * 1024 * 1024 // 10MB в байтах
    if (file.size > maxSize) {
      alert(
        `Файл слишком большой. Максимальный размер: 10MB. Размер вашего файла: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
      )
      return
    }

    // Проверяем формат файла
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      alert("Разрешены только файлы форматов PDF и Word (.doc, .docx)")
      return
    }

    setUploading(documentType)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("file_type", documentType)
    formData.append("auction_id", auctionId)

    try {
      console.log("[v0] Загружаем файл:", {
        documentType,
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
        auctionId,
      })

      const response = await fetch(`${API_BASE_URL}/api/file/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenManager.getToken()}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Файл успешно загружен:", result)
        await fetchUserDocuments()
      } else {
        if (response.status === 413) {
          alert("Файл слишком большой для загрузки на сервер. Пожалуйста, уменьшите размер файла до 10MB или меньше.")
        } else {
          console.error("[v0] Ошибка загрузки файла:", response.status)
          alert(`Ошибка при загрузке файла (код: ${response.status}). Попробуйте еще раз.`)
        }
      }
    } catch (error) {
      console.error("[v0] Исключение при загрузке файла:", error)
      alert("Ошибка сети при загрузке файла. Проверьте подключение к интернету.")
    } finally {
      setUploading(null)
    }
  }

  const isDocumentUploaded = (documentType: string) => {
    return documentsByType[documentType] && documentsByType[documentType].length > 0
  }

  const checkDocumentsComplete = () => {
    const requiredTypes = documentTypes.filter((type) => type.required).map((type) => type.id)
    const uploadedTypes = Object.keys(documentsByType).filter((type) => documentsByType[type].length > 0)
    const allRequiredUploaded = requiredTypes.every((type) => uploadedTypes.includes(type))

    console.log("[v0] Проверка документов:")
    console.log("[v0] Обязательные типы:", requiredTypes)
    console.log("[v0] Загруженные типы:", uploadedTypes)
    console.log("[v0] Все обязательные загружены:", allRequiredUploaded)
    console.log("[v0] Ответственность принята:", responsibilityAccepted)

    return allRequiredUploaded
  }

  const handleParticipateClick = () => {
    console.log("[v0] Пользователь принял ответственность и готов участвовать в аукционе")
    onDocumentsComplete()
  }

  const isReadyToParticipate = () => {
    return checkDocumentsComplete() && responsibilityAccepted
  }

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setResponsibilityAccepted(false)
      Promise.all([fetchDocumentTypes(), fetchUserDocuments()]).finally(() => setLoading(false))
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-card">
        <DialogHeader className="pb-6 border-b border-border">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            Загрузка документов для участия в аукционе
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground text-lg">Загружаем информацию о документах...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6 p-1">
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Загрузите необходимые документы для участия в аукционе. Принимаются только файлы форматов{" "}
                  <span className="font-semibold text-primary">PDF</span> и{" "}
                  <span className="font-semibold text-primary">Word (.doc, .docx)</span>. Вы можете загрузить несколько
                  файлов для каждого типа документа.
                </p>
              </div>

              <div className="space-y-4">
                {documentTypes.map((docType) => (
                  <div
                    key={docType.id}
                    className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isDocumentUploaded(docType.id) ? "bg-green-100" : "bg-muted"}`}
                        >
                          {isDocumentUploaded(docType.id) ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {docType.name}
                            {docType.required && <span className="text-destructive ml-1">*</span>}
                          </h3>
                          {isDocumentUploaded(docType.id) && (
                            <p className="text-sm text-green-600 font-medium">
                              Загружено файлов: {documentsByType[docType.id]?.length || 0}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {documentsByType[docType.id] && documentsByType[docType.id].length > 0 && (
                      <div className="mb-4 space-y-2">
                        {documentsByType[docType.id].map((doc, index) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-green-800 truncate">
                              {doc.file_name || `Документ ${index + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileUpload(file, docType.id)
                          }
                        }}
                        disabled={uploading === docType.id}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        id={`file-${docType.id}`}
                      />
                      <label
                        htmlFor={`file-${docType.id}`}
                        className={`
                          flex items-center justify-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all
                          ${
                            uploading === docType.id
                              ? "border-muted-foreground bg-muted cursor-not-allowed"
                              : "border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10"
                          }
                        `}
                      >
                        {uploading === docType.id ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="text-muted-foreground font-medium">Загружается...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-primary" />
                            <span className="text-primary font-medium">
                              {isDocumentUploaded(docType.id)
                                ? "Добавить еще файл"
                                : "Выберите файл или перетащите сюда"}
                            </span>
                          </>
                        )}
                      </label>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Поддерживаемые форматы: PDF, DOC, DOCX • Максимальный размер: 10MB
                    </p>
                  </div>
                ))}
              </div>

              {checkDocumentsComplete() && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">Все документы загружены!</h3>
                      <p className="text-sm text-green-600">Подтвердите ответственность для продолжения</p>
                    </div>
                  </div>

                  <div className="bg-white/70 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="responsibility"
                        checked={responsibilityAccepted}
                        onCheckedChange={(checked) => setResponsibilityAccepted(checked === true)}
                        className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <label htmlFor="responsibility" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                        Я подтверждаю, что все загруженные документы являются подлинными и актуальными. Я беру на себя
                        полную ответственность за достоверность предоставленной информации и понимаю, что предоставление
                        ложных сведений может повлечь за собой правовые последствия.
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={handleParticipateClick}
                    disabled={!responsibilityAccepted}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Участвовать в аукционе
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Button variant="outline" onClick={onClose} className="px-6 bg-transparent">
            <X className="h-4 w-4 mr-2" />
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
