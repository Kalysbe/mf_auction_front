import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactsLoading() {
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="rounded-md border">
              <div className="h-[400px] relative">
                <Skeleton className="absolute inset-0" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
