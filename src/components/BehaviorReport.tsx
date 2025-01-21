import React, { useState, useRef } from 'react'
import { Download, Brain } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { traitQuestions, frequencyQuestions } from '../utils/behaviorQuestions'
import { getMainTraits, getTraitsSummary, getTraitTendency, getTraitDescription } from '../utils/behaviorUtils'

interface Trait {
  name: string
  value: number
  category: string
  description: string
}

interface BehaviorReportProps {
  userName?: string
  results: {
    traits: Record<number, number>
    frequencies: Record<string, number>,
    timeStats?: {
      completedAt: string
    }
  }
  questions?: Array<{
    id: number
    type: 'trait' | 'frequency'
    leftTrait?: string
    rightTrait?: string
    trait?: string
  }>
}

export function BehaviorReport({ results, questions, userName }: BehaviorReportProps) {
  // Import questions from behaviorQuestions if not provided
  const allQuestions = questions || [...traitQuestions, ...frequencyQuestions]

  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)
  const frequencyLabels = ['Nunca', 'Às vezes', 'Frequentemente', 'Sempre']

  // Guard against undefined results
  if (!results) {
    return (
      <div className="max-w-[800px] mx-auto bg-white p-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">Error: No results data available</p>
        </div>
      </div>
    )
  }

  // Ensure we have valid traits and frequencies
  const traits = results.traits || {}
  const frequencies = results.frequencies || {}
  const handleDownload = async () => {
    if (!reportRef.current) return
    
    setDownloading(true)
    setError(null)
    
    try {
      // Capture the report content
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        letterRendering: true,
        onclone: (document) => {
          const element = document.querySelector('#report-content')
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

      // Set PDF properties for better text handling
      pdf.setProperties({
        title: 'Relatório de Traços Comportamentais',
        subject: 'Análise de Traços Comportamentais',
        creator: 'ERPeople',
        author: userName || 'Usuário'
      })

      // Add metadata header to each page
      const addHeader = () => {
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        const timestamp = results.timeStats?.completedAt
          ? new Date(results.timeStats.completedAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          : new Date().toLocaleString('pt-BR')
        pdf.text(`Análise realizada em: ${timestamp}`, 10, 8)
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
      pdf.addImage(canvas, 'PNG', 10, position, imgWidth, imgHeight, undefined, 'FAST', 0)
      heightLeft -= pageHeight

      // Add subsequent pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        addHeader()
        pdf.addImage(canvas, 'PNG', 10, position, imgWidth, imgHeight, undefined, 'FAST', 0)
        heightLeft -= pageHeight
      }

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0]
      const filename = `tracos-comportamentais_${(userName || 'usuario').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${date}.pdf`

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
    <div ref={reportRef} id="report-content" className="max-w-[800px] mx-auto bg-white p-8">
      <div className="bg-white shadow-sm rounded-lg p-8 space-y-12">
        <div className="flex justify-between items-center mb-6">
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

        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Brain className="w-16 h-16 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Traços Comportamentais
          </h1>
          <p className="text-xl font-medium text-gray-700 mb-2">
            de {userName || '[Nome da Pessoa]'}
          </p>
          <p className="text-base text-gray-600 mb-8">
            Análise realizada em {new Date(results.timeStats?.completedAt || new Date()).toLocaleDateString('pt-BR')}
          </p>
          <div className="max-w-2xl mx-auto bg-[#F8F9FA] p-8 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Resumo da Análise</h2>
            <p className="text-gray-700 leading-relaxed">
              Com base na análise realizada, seus principais traços comportamentais incluem tendências para
              {getMainTraits(results.traits).map((trait, i, arr) => (
                <span key={trait.id}>
                  {i === arr.length - 1 ? ' e ' : i > 0 ? ', ' : ' '}
                  <span className="font-semibold text-indigo-900">{trait.description}</span>
                </span>
              ))}.
              {' '}Estes traços indicam uma orientação natural para {getTraitsSummary(results.traits)}.
            </p>
          </div>
        </div>

        <div className="mb-8 keep-together">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Traços Comportamentais Identificados
          </h2>
          <p className="text-gray-600 mb-6">
            Esta seção apresenta os traços comportamentais predominantes identificados na análise,
            fornecendo uma visão detalhada das suas tendências e preferências em diferentes contextos
            profissionais.
          </p>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
              {allQuestions
                ?.filter(q => q.type === 'trait')
                .slice(0, Math.ceil(allQuestions.filter(q => q.type === 'trait').length / 2))
                .map(question => {
                  const value = results.traits[question.id]
                  const position = ((value - 1) / 4) * 100

                  const tendency = getTraitTendency(question.id, value)
                  const description = getTraitDescription(question.id, value)

                  return (
                    <div key={question.id} className="relative p-2 bg-gray-50 rounded-lg keep-together mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>{question.leftTrait}</span>
                        <span>{question.rightTrait}</span>
                      </div>
                      <div className="relative h-2 flex items-center">
                        <div className="w-full h-[8px] bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 rounded-full" />
                        <div
                          className="absolute w-[20px] h-[20px] bg-indigo-600 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 shadow-md"
                          style={{ left: `${position}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        {description}
                      </div>
                    </div>
                  )
                })}
          </div>
        </div>

        <div className="page-break mt-12">
          <div className="grid grid-cols-1 gap-8">
              {allQuestions
                ?.filter(q => q.type === 'trait')
                .slice(Math.ceil(allQuestions.filter(q => q.type === 'trait').length / 2))
                .map(question => {
                  const value = results.traits[question.id]
                  const position = ((value - 1) / 4) * 100

                  const tendency = getTraitTendency(question.id, value)
                  const description = getTraitDescription(question.id, value)

                  return (
                    <div key={question.id} className="relative p-2 bg-gray-50 rounded-lg keep-together mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>{question.leftTrait}</span>
                        <span>{question.rightTrait}</span>
                      </div>
                      <div className="relative h-2 flex items-center">
                        <div className="w-full h-[8px] bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 rounded-full" />
                        <div
                          className="absolute w-[20px] h-[20px] bg-indigo-600 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 shadow-md"
                          style={{ left: `${position}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        {description}
                      </div>
                    </div>
                  )
                })}
          </div>
        </div>

        <div className="section-title keep-together">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Frequência dos Traços Comportamentais Identificados
          </h2>
          <p className="text-gray-600 mb-6">
            Esta análise mostra a frequência com que você demonstra determinados comportamentos
            em seu ambiente profissional, desde comportamentos raramente manifestados até aqueles
            que são parte constante do seu estilo de trabalho.
          </p>
          <div className="grid grid-cols-1 gap-8">
            {allQuestions
              ?.filter(q => q.type === 'frequency')
              .map(question => {
                const value = results.frequencies[question.trait!]
                const position = ((value - 1) / 4) * 100
                
                const frequencyLabel = frequencyLabels[Math.min(value - 1, 3)]
                
                return (
                  <div key={question.id} className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{question.trait}</h3>
                    <p className="text-gray-600 mb-4">Frequência atual: {frequencyLabel}</p>
                    
                    <div className="relative">
                      <div className="h-1 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 rounded-full" />
                      <div
                        className="absolute w-4 h-4 bg-indigo-600 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                        style={{ left: `${position}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                      <span>Nunca {question.trait.toLowerCase()}</span>
                      <span>Sempre {question.trait.toLowerCase()}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}