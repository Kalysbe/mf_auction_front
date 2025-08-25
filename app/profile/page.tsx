"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth, type BankData, type BankDocument } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/protected-route"
import { FileText, Trash2, Upload } from "lucide-react"

export default function ProfilePage() {
  const { toast } = useToast()
  const { user, updateBankData, addDocument, removeDocument } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [bankData, setBankData] = useState<BankData>({
    name: "",
    inn: "",
    license: "",
    address: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    documents: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Загружаем данные банка из профиля пользователя
  useEffect(() => {
    if (user?.bankData) {
      setBankData({
        name: user.bankData.name || "",
        inn: user.bankData.inn || "",
        license: user.bankData.license || "",
        address: user.bankData.address || "",
        contactPerson: user.bankData.contactPerson || "",
        contactEmail: user.bankData.contactEmail || "",
        contactPhone: user.bankData.contactPhone || "",
        documents: user.bankData.documents || [],
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setBankData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Обновляем данные банка в профиле пользователя
      updateBankData(bankData)

      toast({
        title: "Профиль обновлен",
        description: "Данные банка успешно обновлены",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при обновлении профиля",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingFile(true)
      const file = e.target.files[0]

      // В реальном приложении здесь был бы загрузка файла на сервер
      // Имитируем задержку загрузки
      setTimeout(() => {
        addDocument({
          name: file.name,
          type: file.type,
          url: "#",
        })
        setUploadingFile(false)

        // Сбрасываем input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        toast({
          title: "Документ загружен",
          description: `Файл ${file.name} успешно загружен`,
        })
      }, 1500)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["bank"]}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/images/logo_KSE.png" alt="KSE Logo" width={50} height={50} />
          <h1 className="text-2xl font-bold">Профиль банка</h1>
        </div>

        <Card className="border-primary/20 mb-6">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle>Данные банка</CardTitle>
            <CardDescription>Обновите информацию о вашем банке</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название банка</Label>
                <Input id="name" value={bankData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inn">ИНН</Label>
                <Input id="inn" value={bankData.inn} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">Номер лицензии</Label>
              <Input id="license" value={bankData.license} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Юридический адрес</Label>
              <Input id="address" value={bankData.address} onChange={handleChange} />
            </div>

            <Separator />
            <h3 className="font-medium">Контактная информация</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Контактное лицо</Label>
                <Input id="contactPerson" value={bankData.contactPerson} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email для связи</Label>
                <Input id="contactEmail" type="email" value={bankData.contactEmail} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Телефон для связи</Label>
              <Input id="contactPhone" value={bankData.contactPhone} onChange={handleChange} />
            </div>
          </CardContent>
          <CardFooter className="bg-primary/5 border-t border-primary/10">
            <Button
              type="submit"
              disabled={isLoading}
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary-600"
            >
              {isLoading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle>Документы</CardTitle>
            <CardDescription>Загрузите необходимые документы для участия в аукционах</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="border-primary text-primary hover:bg-primary/10"
              >
                {uploadingFile ? "Загрузка..." : "Загрузить документ"}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
              <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
            </div>

            {bankData.documents && bankData.documents.length > 0 ? (
              <div className="border rounded-lg divide-y">
                {bankData.documents.map((doc: BankDocument) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline"
                        >
                          {doc.name}
                        </a>
                        <p className="text-xs text-gray-500">Загружен: {doc.uploadDate}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">У вас пока нет загруженных документов</p>
                <p className="text-sm text-gray-400">Загрузите документы для участия в аукционах</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
