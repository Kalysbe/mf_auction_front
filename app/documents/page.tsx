"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Trash2, CheckCircle, XCircle, Clock } from "lucide-react"
import { tokenManager } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://mfauction.adb-solution.com"

interface UserDocument {
  id: string
  file_type_id: string
  file_name: string
  file_path: string
  status: "pending" | "approved" | "rejected"
  uploaded_at: string
  file_type: {
    id: string
    name: string
  }
}

export default function DocumentsPage() {
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    fetchUserDocuments()
  }, [])

  const fetchUserDocuments = async () => {
    try {
      console.log("[v0] Fetching user documents...")
      const response = await fetch(`${API_BASE_URL}/file/my-list/`, {
        headers: {
          Authorization: `Bearer ${tokenManager.getToken()}`,
        },
      })

      console.log("[v0] User documents response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] User documents data:", data)
        setUserDocuments(data)
      } else {
        console.error("[v0] Failed to fetch user documents:", response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error fetching user documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (fileTypeId: string, file: File) => {
    setUploading(fileTypeId)

    try {
      console.log("[v0] Uploading file:", file.name, "for type:", fileTypeId)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("file_type_id", fileTypeId)

      const response = await fetch(`${API_BASE_URL}/file/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenManager.getToken()}`,
        },
        body: formData,
      })

      console.log("[v0] Upload response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Upload result:", result)

        // Refresh user documents
        await fetchUserDocuments()

        alert("Файл успешно загружен!")
      } else {
        const errorText = await response.text()
        console.error("[v0] Upload failed:", errorText)
        alert("Ошибка при загрузке файла")
      }
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert("Ошибка при загрузке файла")
    } finally {
      setUploading(null)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот документ?")) return

    try {
      console.log("[v0] Deleting document:", documentId)

      const response = await fetch(`${API_BASE_URL}/file/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokenManager.getToken()}`,
        },
      })

      if (response.ok) {
        console.log("[v0] Document deleted successfully")
        await fetchUserDocuments()
        alert("Документ удален")
      } else {
        console.error("[v0] Failed to delete document")
        alert("Ошибка при удалении документа")
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
      alert("Ошибка при удалении документа")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Одобрен"
      case "rejected":
        return "Отклонен"
      default:
        return "На рассмотрении"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Управление документами</h1>
        <p className="text-gray-600 mt-2">Просмотр загруженных документов</p>
      </div>

      {/* Загруженные документы */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Мои документы</CardTitle>
          <CardDescription>Список загруженных документов и их статус</CardDescription>
        </CardHeader>
        <CardContent>
          {userDocuments.length === 0 ? (
            <p className="text-gray-500">У вас нет загруженных документов</p>
          ) : (
            <div className="space-y-4">
              {userDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{doc.file_type.name}</p>
                      <p className="text-sm text-gray-500">{doc.file_name}</p>
                      <p className="text-xs text-gray-400">
                        Загружен: {new Date(doc.uploaded_at).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(doc.status)}
                      <Badge className={getStatusColor(doc.status)}>{getStatusText(doc.status)}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`${API_BASE_URL}${doc.file_path}`, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Загрузка новых документов */}
      <Card>
        <CardHeader>
          <CardTitle>Загрузка документов</CardTitle>
          <CardDescription>Для загрузки новых документов обратитесь к администратору</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Загрузка документов временно недоступна. Обратитесь к администратору для загрузки необходимых документов.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
