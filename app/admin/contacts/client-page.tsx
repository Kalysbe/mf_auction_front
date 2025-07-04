"use client"

import { useState } from "react"
import { getAllContacts, type Contact } from "@/lib/contacts-service"
import ContactsTable from "@/components/contacts-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function ContactsClientPage({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchContacts = async () => {
    setIsLoading(true)
    try {
      const data = await getAllContacts()
      setContacts(data)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить контакты",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactDeleted = () => {
    fetchContacts()
  }

  const handleContactUpdated = () => {
    fetchContacts()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Заявки</h1>
        <p className="text-muted-foreground">Управление заявками, полученными через форму контактов</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Список заявок</CardTitle>
              <CardDescription>Просмотр, редактирование и удаление заявок от пользователей</CardDescription>
            </div>
            <button
              onClick={fetchContacts}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              {isLoading ? "Обновление..." : "Обновить"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <ContactsTable
            contacts={contacts}
            onContactDeleted={handleContactDeleted}
            onContactUpdated={handleContactUpdated}
          />
        </CardContent>
      </Card>
    </div>
  )
}
