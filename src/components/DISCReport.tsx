import React, { useRef, useState, useMemo } from 'react'
import { Download } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { DISCBarChart } from './DISCBarChart'
import { DISCReportHeader } from './DISCReportHeader'
import { DISCExecutiveSummary } from './DISCExecutiveSummary'
import { DISCSuperPowers } from './DISCSuperPowers'
import { calculateDISCResults } from '../utils/discCalculator'

interface DISCReportProps {
  userName: string
  results: any
  answers?: Record<number, 'D' | 'I' | 'S' | 'C'>
  timeStats?: {
    completedAt: string
  }
}

export function DISCReport({ userName, results, answers, timeStats }: DISCReportProps) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  // Calculate scores from answers if results are not available
  const calculatedResults = useMemo(() => {
    if (answers) {
      return calculateDISCResults(answers)
    }
    return null
  }, [answers])

  // Use provided results or calculated results
  const finalResults = useMemo(() => {
    if (!results && !calculatedResults) {
      return {
        scores: { D: 25, I: 25, S: 25, C: 25 },
        primaryProfile: 'D',
        secondaryProfile: 'I'
      }
    }
    return results || calculatedResults
  }, [results, calculatedResults])

  // Extract primary and secondary profiles after validation
  const primaryProfile = finalResults?.primaryProfile || 'D'
  const secondaryProfile = finalResults?.secondaryProfile || 'I'

  // Ensure we have valid scores and normalize to 100%
  const scores = useMemo(() => {
    let normalized = { D: 0, I: 0, S: 0, C: 0 };
    
    // If finalResults already has proper scores object
    if (finalResults?.scores && typeof finalResults.scores === 'object') {
      normalized = {
        D: Number(finalResults.scores.D) || 0,
        I: Number(finalResults.scores.I) || 0,
        S: Number(finalResults.scores.S) || 0,
        C: Number(finalResults.scores.C) || 0
      }
    }
    // If finalResults directly has the D, I, S, C properties
    else if (finalResults && typeof finalResults === 'object' && 
        ('D' in finalResults || 'I' in finalResults || 'S' in finalResults || 'C' in finalResults)) {
      normalized = {
        D: Number(finalResults.D) || 0,
        I: Number(finalResults.I) || 0, 
        S: Number(finalResults.S) || 0,
        C: Number(finalResults.C) || 0
      }
    }
    
    // Normalize to ensure sum is 100%
    const sum = normalized.D + normalized.I + normalized.S + normalized.C;
    
    // If sum is close to zero or invalid, return equal distribution
    if (sum < 0.1) {
      return { D: 25, I: 25, S: 25, C: 25 };
    }
    
    // Normalize to 100%
    if (Math.abs(sum - 100) > 0.1) {
      const factor = 100 / sum;
      normalized.D = normalized.D * factor;
      normalized.I = normalized.I * factor;
      normalized.S = normalized.S * factor;
      normalized.C = normalized.C * factor;
    }
    
    return normalized;
  }, [finalResults]);

  // Debug information
  console.log('DISC Report Data:', {
    receivedResults: results,
    calculatedResults,
    finalResults,
    scores,
    sum: scores.D + scores.I + scores.S + scores.C
  })

  const handleDownload = async () => {
    if (!reportRef.current) return
    
    console.log('Starting PDF generation for DISC report')
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

      console.log('Canvas captured successfully')

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

        <div className="page-break keep-together">
          <DISCReportHeader userName={userName} />
        </div>

        <div className="keep-together">
          <DISCExecutiveSummary
            userName={userName}
            primaryProfile={primaryProfile}
            secondaryProfile={secondaryProfile}
            totalTime={timeStats?.completedAt ? 0 : 0}
          />
        </div>

        <div className="page-break keep-together">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Seu Perfil em Números
          </h2>
          <div className="h-80">
            <DISCBarChart scores={scores} />
          </div>
        </div>
      
        <div className="page-break keep-together">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Análise Detalhada do Perfil DISC
            </h2>
            
            <div className="space-y-8">
              {/* Primary Profile Analysis */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Perfil Primário: {primaryProfile === 'D' ? 'Dominância' :
                                  primaryProfile === 'I' ? 'Influência' :
                                  primaryProfile === 'S' ? 'Estabilidade' :
                                  'Conformidade'} ({scores[primaryProfile as keyof typeof scores].toFixed(1)}%)
                </h3>
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-indigo-900 mb-2">Manifestação Comportamental</h4>
                      <p className="text-indigo-800">
                        {primaryProfile === 'D' ? 
                          'Você demonstra uma forte orientação para resultados e tomada de decisão rápida. Sua abordagem é direta e focada em objetivos.' :
                        primaryProfile === 'I' ?
                          'Seu estilo é marcado por comunicação expressiva e habilidade natural para influenciar e motivar pessoas. Você traz entusiasmo e energia positiva.' :
                        primaryProfile === 'S' ?
                          'Você apresenta consistência e confiabilidade em suas ações. Seu foco está em manter harmonia e estabilidade no ambiente.' :
                          'Sua abordagem é analítica e estruturada. Você prioriza precisão e qualidade em tudo que faz.'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-indigo-900 mb-2">Pontos Fortes</h4>
                      <ul className="list-disc list-inside space-y-1 text-indigo-800">
                        {primaryProfile === 'D' ? (
                          <>
                            <li>Capacidade de tomar decisões rápidas</li>
                            <li>Foco em resultados e eficiência</li>
                            <li>Liderança natural em situações desafiadoras</li>
                          </>
                        ) : primaryProfile === 'I' ? (
                          <>
                            <li>Excelente comunicação e persuasão</li>
                            <li>Habilidade para motivar equipes</li>
                            <li>Criatividade e entusiasmo contagiante</li>
                          </>
                        ) : primaryProfile === 'S' ? (
                          <>
                            <li>Lealdade e comprometimento</li>
                            <li>Excelente trabalho em equipe</li>
                            <li>Consistência e confiabilidade</li>
                          </>
                        ) : (
                          <>
                            <li>Atenção aos detalhes e precisão</li>
                            <li>Pensamento analítico apurado</li>
                            <li>Foco em qualidade e processos</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Profile Analysis */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Perfil Secundário: {secondaryProfile === 'D' ? 'Dominância' :
                                    secondaryProfile === 'I' ? 'Influência' :
                                    secondaryProfile === 'S' ? 'Estabilidade' :
                                    'Conformidade'} ({scores[secondaryProfile as keyof typeof scores].toFixed(1)}%)
                </h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Influência no Perfil Principal</h4>
                      <p className="text-gray-800">
                        {primaryProfile === 'D' && secondaryProfile === 'I' ?
                          'A influência complementa sua dominância com habilidades sociais e capacidade de motivar pessoas.' :
                        primaryProfile === 'D' && secondaryProfile === 'C' ?
                          'A conformidade adiciona precisão e análise à sua capacidade de liderança.' :
                        primaryProfile === 'I' && secondaryProfile === 'D' ?
                          'A dominância fortalece sua capacidade de influência com assertividade e foco em resultados.' :
                        primaryProfile === 'I' && secondaryProfile === 'S' ?
                          'A estabilidade traz consistência ao seu estilo comunicativo e influente.' :
                        primaryProfile === 'S' && secondaryProfile === 'C' ?
                          'A conformidade reforça sua estabilidade com atenção aos detalhes e processos.' :
                        primaryProfile === 'S' && secondaryProfile === 'I' ?
                          'A influência adiciona dinamismo ao seu perfil estável e consistente.' :
                        primaryProfile === 'C' && secondaryProfile === 'S' ?
                          'A estabilidade complementa sua precisão com paciência e cooperação.' :
                          'A combinação destes perfis cria um equilíbrio único entre suas diferentes características.'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Impacto no Ambiente de Trabalho</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>
                          {secondaryProfile === 'D' ? 'Adiciona assertividade e foco em resultados' :
                           secondaryProfile === 'I' ? 'Contribui com habilidades sociais e entusiasmo' :
                           secondaryProfile === 'S' ? 'Traz estabilidade e cooperação à equipe' :
                           'Agrega precisão e pensamento analítico'}
                        </li>
                        <li>
                          {secondaryProfile === 'D' ? 'Fortalece a capacidade de tomada de decisão' :
                           secondaryProfile === 'I' ? 'Melhora a comunicação e engajamento' :
                           secondaryProfile === 'S' ? 'Promove harmonia e trabalho em equipe' :
                           'Aumenta a qualidade e atenção aos detalhes'}
                        </li>
                        <li>
                          {secondaryProfile === 'D' ? 'Impulsiona iniciativas e mudanças' :
                           secondaryProfile === 'I' ? 'Facilita networking e colaboração' :
                           secondaryProfile === 'S' ? 'Fortalece relacionamentos duradouros' :
                           'Aprimora processos e sistemas'}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-break keep-together">
          <DISCSuperPowers profile={primaryProfile} />
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