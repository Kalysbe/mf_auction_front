"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { Auction, Lot, Offer } from "@/lib/api"

interface AuctionReportDialogProps {
  isOpen: boolean
  onClose: () => void
  auction: Auction
  lots: Lot[] // Этот массив содержит ВСЕ лоты для данного аукциона
}

// Format number with currency
function formatCurrency(amount: number, currency = "KGS") {
  const numericAmount = Number(amount)
  if (isNaN(numericAmount)) {
    return `Некорректная сумма ${currency}`
  }
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numericAmount)
}

// Format percentage
function formatPercent(percent: number | undefined | null) {
  if (percent == null || isNaN(Number(percent))) {
    return "0%"
  }
  return `${Number(percent)}%`
}

export default function AuctionReportDialog({ isOpen, onClose, auction, lots }: AuctionReportDialogProps) {
  // Собираем ВСЕ предложения со ВСЕХ лотов, переданных в пропсе 'lots'
  const allOffers: (Offer & { lotAsset: string; lotPercent: number })[] = lots.flatMap((lot) =>
    (lot.offers || []).map((offer) => ({
      ...offer,
      lotAsset: lot.asset,
      lotPercent: lot.percent,
    })),
  )

  // Сортируем предложения по проценту (по убыванию) для "Ведомость поступивших заявок"
  const sortedAllOffers = [...allOffers].sort((a, b) => b.percent - a.percent)

  // Фильтруем и сортируем принятые предложения для "Итоги размещения"
  const acceptedOffers = allOffers.filter((offer) => offer.status === "accepted")
  const sortedAcceptedOffers = [...acceptedOffers].sort((a, b) => b.percent - a.percent)

  // Вычисляем общий объем для "Итоги размещения"
  const totalAcceptedVolume = sortedAcceptedOffers.reduce((sum, offer) => sum + offer.volume, 0)

  // Вычисляем общий объем предложения аукциона (суммируем объемы всех лотов)
  const totalAuctionOfferVolume = lots.reduce((sum, lot) => sum + lot.volume, 0)

  // Считаем уникальных участников
  const uniqueParticipants = new Set(allOffers.map((offer) => offer.user_id)).size

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold mb-4">Ведомость</DialogTitle>
        </DialogHeader>

        <div className="space-y-8 print:text-black">
        
          <h2 className="text-xl font-semibold mb-4">Общая информация по аукциону</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Дата аукциона:</p>
              <p className="font-medium">{new Date(auction.end_time).toLocaleDateString("ru-RU")}</p>
            </div>
            <div>
              <p className="text-gray-600">Объем предложения:</p>
              <p className="font-medium">{formatCurrency(totalAuctionOfferVolume, auction.currency)}</p>
            </div>
            <div>
              <p className="text-gray-600">Количество участников:</p>
              <p className="font-medium">{uniqueParticipants}</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Ведомость поступивших заявок:</h2>
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Коммерческий банк</TableHead>
                <TableHead>Регистрационный номер лота</TableHead>
                <TableHead>Объем лота ({auction.currency})</TableHead>
                <TableHead>Сумма депозита ({auction.currency})</TableHead>
                <TableHead>Срок размещения депозита (месяц)</TableHead>
                <TableHead>Стартовый размер процентной ставки по депозиту (% годовых)</TableHead>
                <TableHead>Ставка комбанка (% годовых)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAllOffers.length > 0 ? (
                sortedAllOffers.map((offer) => {
                  const correspondingLot = lots.find((lot) => lot.asset === offer.lotAsset)
                  return (
                    <TableRow key={offer.id}>
                      <TableCell>
                        {offer.user?.name || offer.user?.email || `Пользователь ${offer.user_id.substring(0, 8)}...`}
                      </TableCell>
                      <TableCell>{offer.lotAsset}</TableCell>
                      <TableCell>{formatCurrency(correspondingLot?.volume || 0, auction.currency)}</TableCell>
                      <TableCell>{formatCurrency(offer.volume, auction.currency)}</TableCell>
                      <TableCell>{auction.term || "Не указан"}</TableCell>
                      <TableCell>{formatPercent(offer.lotPercent)}</TableCell>
                      <TableCell>{formatPercent(offer.percent)}</TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                    Нет поступивших заявок.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <h2 className="text-xl font-semibold mb-4 mt-8">Итоги размещения:</h2>
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Коммерческий банк</TableHead>
                <TableHead>Регистрационный номер лота</TableHead>
                <TableHead>Объем лота ({auction.currency})</TableHead>
                <TableHead>Сумма депозита ({auction.currency})</TableHead>
                <TableHead>Срок размещения депозита (месяц)</TableHead>
                <TableHead>Стартовый размер процентной ставки по депозиту (% годовых)</TableHead>
                <TableHead>Ставка комбанка (% годовых)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAcceptedOffers.length > 0 ? (
                sortedAcceptedOffers.map((offer) => {
                  const correspondingLot = lots.find((lot) => lot.asset === offer.lotAsset)
                  return (
                    <TableRow key={offer.id}>
                      <TableCell>
                        {offer.user?.name || offer.user?.email || `Пользователь ${offer.user_id.substring(0, 8)}...`}
                      </TableCell>
                      <TableCell>{offer.lotAsset}</TableCell>
                      <TableCell>{formatCurrency(correspondingLot?.volume || 0, auction.currency)}</TableCell>
                      <TableCell>{formatCurrency(offer.volume, auction.currency)}</TableCell>
                      <TableCell>{auction.term || "Не указан"}</TableCell>
                      <TableCell>{formatPercent(offer.lotPercent)}</TableCell>
                      <TableCell>{formatPercent(offer.percent)}</TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                    Нет принятых заявок.
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="font-bold bg-gray-100">
                <TableCell colSpan={3}>Всего:</TableCell>
                <TableCell>{formatCurrency(totalAcceptedVolume, auction.currency)}</TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="mt-12 space-y-8">
            <div className="flex justify-between items-center">
              <p className="font-medium">Уполномоченный сотрудник Биржи</p>
              <div className="flex flex-col items-center">
                <p>___________</p>
                <p className="text-sm">(подпись)</p>
              </div>
              <div className="flex flex-col items-center">
                <p>____________________</p>
                <p className="text-sm">(Ф.И.О.)</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-medium">Руководитель Биржи</p>
              <div className="flex flex-col items-center">
                <p>______________</p>
                <p className="text-sm">(подпись)</p>
              </div>
              <div className="flex flex-col items-center">
                <p>_____________________</p>
                <p className="text-sm">(Ф.И.О.)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8 print:hidden">
          <Button onClick={() => window.print()} className="bg-primary hover:bg-primary-600">
            <Download className="h-4 w-4 mr-2" />
            Распечатать ведомость
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
