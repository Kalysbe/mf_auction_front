"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, FileText, X } from "lucide-react"

interface ReportData {
  generalInfo: {
    date: string
    totalVolume: number
    participantsCount: number
  }
  offersTable: Array<{
    bank: string
    lotId: string
    lotAsset: string
    lotPercent: number
    lotTermMonth: number | null
    offerPercent: string
    lotVolume: number | null
  }>
  dealsTable: Array<{
    bank: string
    lotId: string
    lotAsset: string
    lotPercent: number
    lotTermMonth: number | null
    offerPercent: string
    lotVolume: number | null
  }>
}

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportData: ReportData | null
  auctionId: string
}

export function ReportModal({ isOpen, onClose, reportData, auctionId }: ReportModalProps) {
  const [isExporting, setIsExporting] = useState(false)

  if (!reportData) return null

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("ru-RU", {
        style: "decimal",
        maximumFractionDigits: 0,
      }).format(amount) + " сом"
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU")
  }

  const exportToWord = async () => {
    setIsExporting(true)
    try {
      const htmlContent = generateReportHTML()
      const blob = new Blob([htmlContent], {
        type: "application/msword;charset=utf-8",
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Ведомость_${auctionId}_${formatDate(reportData.generalInfo.date)}.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Ошибка экспорта в Word:", error)
      alert("Ошибка при экспорте в Word")
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(generateReportHTML(true))
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    } catch (error) {
      console.error("Ошибка экспорта в PDF:", error)
      alert("Ошибка при экспорте в PDF")
    } finally {
      setIsExporting(false)
    }
  }

  const generateReportHTML = (forPrint = false) => {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 11px; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .header { text-align: center; margin-bottom: 20px; }
        .signature-line { margin-top: 30px; }
        .info-table td { padding: 8px; }
        ${forPrint ? "@media print { body { margin: 0; } }" : ""}
      </style>
    `

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ведомость аукциона</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h4>Приложение 2<br/>
          к Генеральному соглашению<br/>
          об организации аукциона на размещение средств из счета смягчения<br/>
          в депозиты коммерческих банков на торговой площадке<br/>
          ЗАО «Кыргызская фондовая биржа»<br/>
          от "_____" ________ 20__ г. No</h4>
          <h2>Ведомость</h2>
        </div>

        <h4>Общая информация по аукциону</h4>
        <table class="info-table">
          <tr><td><strong>Дата аукциона</strong></td><td>${formatDate(reportData.generalInfo.date)}</td></tr>
          <tr><td><strong>Объем предложения</strong></td><td>${formatCurrency(reportData.generalInfo.totalVolume)}</td></tr>
          <tr><td><strong>Количество участников</strong></td><td>${reportData.generalInfo.participantsCount}</td></tr>
        </table>

        <h4>Ведомость поступивших заявок:</h4>
        <table>
          <thead>
            <tr>
              <th>Коммерческий банк</th>
              <th>Наименование лота</th>
              <th>Регистрационный номер лота</th>
              <th>Объем лота (сом)</th>
              <th>Срок размещения депозита (месяц)</th>
              <th>Стартовый размер процентной ставки по депозиту (% годовых)</th>
              <th>Ставка ком банка (% годовых)</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.offersTable
              .map(
                (offer) => `
              <tr>
                <td>${offer.bank}</td>
                <td>${offer.lotAsset}</td>
                <td>${offer.lotId}</td>
                <td>${offer.lotVolume || "-"}</td>
                <td>${offer.lotTermMonth || "-"}</td>
                <td>${offer.lotPercent}%</td>
                <td>${offer.offerPercent}%</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <h4>Итоги размещения:</h4>
        <table>
          <thead>
            <tr>
              <th>Коммерческий банк</th>
              <th>Наименование лота</th>
              <th>Регистрационный номер лота</th>
              <th>Объем лота (сом)</th>
              <th>Срок размещения депозита (месяц)</th>
              <th>Стартовый размер процентной ставки по депозиту (% годовых)</th>
              <th>Ставка ком банка (% годовых)</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.dealsTable
              .map(
                (deal) => `
              <tr>
                <td>${deal.bank}</td>
                <td>${deal.lotAsset}</td>
                <td>${deal.lotId}</td>
                <td>${deal.lotVolume || "-"}</td>
                <td>${deal.lotTermMonth || "-"}</td>
                <td>${deal.lotPercent}%</td>
                <td>${deal.offerPercent}%</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="signature-line">
          <p><strong>Всего:</strong></p>
          <br/><br/>
          <p>Уполномоченный сотрудник Биржи _______________________________</p>
          <p style="margin-left: 400px;">(подпись) (Ф.И.О.)</p>
          <br/>
          <p>Руководитель Биржи ___________________________________</p>
          <p style="margin-left: 400px;">(подпись) (Ф.И.О.)</p>
        </div>
      </body>
      </html>
    `
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ведомость аукциона</span>
            <div className="flex gap-2">
              <Button onClick={exportToWord} disabled={isExporting} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Скачать Word
              </Button>
              <Button onClick={exportToPDF} disabled={isExporting} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Скачать PDF
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-sm font-medium mb-2">
              Приложение 2<br />к Генеральному соглашению
              <br />
              об организации аукциона на размещение средств из счета смягчения
              <br />в депозиты коммерческих банков на торговой площадке
              <br />
              ЗАО «Кыргызская фондовая биржа»
              <br />
              от "_____" ________ 20__ г. No
            </h4>
            <h2 className="text-lg font-bold">Ведомость</h2>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Общая информация по аукциону</h4>
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium bg-gray-50">Дата аукциона</td>
                  <td className="border border-gray-300 p-2">{formatDate(reportData.generalInfo.date)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium bg-gray-50">Объем предложения</td>
                  <td className="border border-gray-300 p-2">{formatCurrency(reportData.generalInfo.totalVolume)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-medium bg-gray-50">Количество участников</td>
                  <td className="border border-gray-300 p-2">{reportData.generalInfo.participantsCount}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Ведомость поступивших заявок:</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Коммерческий банк</th>
                    <th className="border border-gray-300 p-2 text-left">Наименование лота</th>
                    <th className="border border-gray-300 p-2 text-left">Регистрационный номер лота</th>
                    <th className="border border-gray-300 p-2 text-left">Объем лота (сом)</th>
                    <th className="border border-gray-300 p-2 text-left">Срок размещения депозита (месяц)</th>
                    <th className="border border-gray-300 p-2 text-left">
                      Стартовый размер процентной ставки по депозиту (% годовых)
                    </th>
                    <th className="border border-gray-300 p-2 text-left">Ставка ком банка (% годовых)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.offersTable.map((offer, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{offer.bank}</td>
                      <td className="border border-gray-300 p-2">{offer.lotAsset}</td>
                      <td className="border border-gray-300 p-2">{offer.lotId}</td>
                      <td className="border border-gray-300 p-2">{offer.lotVolume || "-"}</td>
                      <td className="border border-gray-300 p-2">{offer.lotTermMonth || "-"}</td>
                      <td className="border border-gray-300 p-2">{offer.lotPercent}%</td>
                      <td className="border border-gray-300 p-2">{offer.offerPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Итоги размещения:</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Коммерческий банк</th>
                    <th className="border border-gray-300 p-2 text-left">Наименование лота</th>
                    <th className="border border-gray-300 p-2 text-left">Регистрационный номер лота</th>
                    <th className="border border-gray-300 p-2 text-left">Объем лота (сом)</th>
                    <th className="border border-gray-300 p-2 text-left">Срок размещения депозита (месяц)</th>
                    <th className="border border-gray-300 p-2 text-left">
                      Стартовый размер процентной ставки по депозиту (% годовых)
                    </th>
                    <th className="border border-gray-300 p-2 text-left">Ставка ком банка (% годовых)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.dealsTable.map((deal, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{deal.bank}</td>
                      <td className="border border-gray-300 p-2">{deal.lotAsset}</td>
                      <td className="border border-gray-300 p-2">{deal.lotId}</td>
                      <td className="border border-gray-300 p-2">{deal.lotVolume || "-"}</td>
                      <td className="border border-gray-300 p-2">{deal.lotTermMonth || "-"}</td>
                      <td className="border border-gray-300 p-2">{deal.lotPercent}%</td>
                      <td className="border border-gray-300 p-2">{deal.offerPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <p>
              <strong>Всего:</strong>
            </p>
            <div className="space-y-2">
              <p>Уполномоченный сотрудник Биржи _______________________________</p>
              <p className="text-right mr-20">(подпись) (Ф.И.О.)</p>
              <p>Руководитель Биржи ___________________________________</p>
              <p className="text-right mr-20">(подпись) (Ф.И.О.)</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
