import React, { useRef, useState } from 'react'
import { Download } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { DISCBarChart } from './DISCBarChart'
import { DISCReportHeader } from './DISCReportHeader'
import { DISCExecutiveSummary } from './DISCExecutiveSummary'
import { DISCSuperPowers } from './DISCSuperPowers'

interface DISCReportProps {
  userName: string
  results: any
  timeStats?: {
    completedAt: string
  }
}

export function DISCReport({ userName, results, timeStats }: DISCReportProps) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!reportRef.current) return
    
    setDownloading(true)
    setError(null)
    
    try {
      // Capture the report content
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 800,
        letterRendering: true,
        allowTaint: true,
        useCORS: true,
        onclone: (document) => {
          const element = document.querySelector('#disc-report-content')
          if (element) {
            element.classList.add('pdf-mode')
          }
        }
      })

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Add metadata header to each page
      const addHeader = () => {
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        const timestamp = timeStats?.completedAt
          ? new Date(timeStats.completedAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          : new Date().toLocaleString('pt-BR')
        pdf.text(`Análise DISC realizada em: ${timestamp}`, 10, 8)
      }

      // Calculate dimensions
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20 // 10mm margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 10 // Start with 10mm top margin

      // Add first page
      addHeader()
      pdf.addImage(canvas, 'PNG', 10, position, imgWidth, imgHeight, '', 'FAST')
      heightLeft -= pageHeight

      // Add subsequent pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        addHeader()
        pdf.addImage(canvas, 'PNG', 10, position, imgWidth, imgHeight, '', 'FAST')
        heightLeft -= pageHeight
      }

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0]
      const filename = `DISC_Report_${userName.replace(/\s+/g, '_')}_${date}.pdf`

      // Download PDF
      pdf.save(filename)
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Erro ao gerar PDF. Por favor, tente novamente.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div ref={reportRef} id="disc-report-content" className="max-w-[800px] mx-auto bg-white">
      <div className="bg-white shadow-sm rounded-lg p-8">
        <div className="flex justify-between items-center mb-8">
          {error && (
            <div className="flex items-center text-red-600 text-sm">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-600 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`download-button inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white
              ${downloading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>
        </div>

        <DISCReportHeader userName={userName} />

        <div className="keep-together">
          <DISCExecutiveSummary
            userName={userName}
            primaryProfile={results.primaryProfile}
            secondaryProfile={results.secondaryProfile}
          />
        </div>

        <div className="page-break keep-together">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Seu Perfil em Números
          </h2>
          <div className="h-80">
            <DISCBarChart scores={results.scores} />
          </div>
        </div>

        <div className="page-break keep-together">
          <DISCSuperPowers profile={results.primaryProfile} />
        </div>

        <div className="section-title keep-together">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Ambiente Ideal de Trabalho
          </h2>
          <div className="bg-gray-50 rounded-lg p-6 print-section">
            <h3 className="font-medium text-gray-900 mb-4">
              Você se destaca em ambientes que oferecem:
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="w-3 h-3 mr-3 bg-indigo-600 rounded-full flex-shrink-0" />
                <span className="text-gray-700">Oportunidades de interação social</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 mr-3 bg-indigo-600 rounded-full flex-shrink-0" />
                <span className="text-gray-700">Espaço para criatividade</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 mr-3 bg-indigo-600 rounded-full flex-shrink-0" />
                <span className="text-gray-700">Trabalho em equipe</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 mr-3 bg-indigo-600 rounded-full flex-shrink-0" />
                <span className="text-gray-700">Reconhecimento por ideias inovadoras</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}