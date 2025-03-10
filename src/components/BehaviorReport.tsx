import React, { useState, useEffect, useRef } from 'react'
import { Download, Brain, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { traitQuestions, frequencyQuestions } from '../utils/behaviorQuestions'
import { getMainTraits, getTraitsSummary, getTraitTendency, getTraitDescription, getOpenAIBehaviorAnalysis } from '../utils/behaviorUtils'
import { RatingSelector } from './RatingSelector'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

interface Trait {
  id: number
  value: number
  description: string
  category?: string
  intensity?: string
}

interface BehaviorReportProps {
  userName?: string
  resultId?: string // Added to support saving AI analysis
  results: {
    traits: Record<number, number>
    frequencies: Record<string, number>,
    timeStats?: {
      completedAt: string
    }
    aiAnalysis?: {
      summary: string
      strengths: string[]
      developmentAreas: string[]
      workStyleInsights: string
      teamDynamicsInsights: string
      traitDescriptions: Record<number, string>
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

export function BehaviorReport({ results, questions, userName, resultId }: BehaviorReportProps) {
  // Import questions from behaviorQuestions if not provided
  const allQuestions = questions || [...traitQuestions, ...frequencyQuestions]

  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState(results.aiAnalysis)
  const [loadingAi, setLoadingAi] = useState(false)
  const [savingAi, setSavingAi] = useState(false)
  const [aiSaved, setAiSaved] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const frequencyLabels = ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre']
  const { user } = useAuth()
  const [generatingNewAnalysis, setGeneratingNewAnalysis] = useState(false)
  const [loadingAttempts, setLoadingAttempts] = useState(0)

  // Debug logging to help identify issues
  console.log("BehaviorReport received:", { resultId, results, questions });

  // Fetch AI analysis if not already available
  useEffect(() => {
    const fetchAiAnalysis = async () => {
      if (!results.traits || Object.keys(results.traits).length === 0) {
        return;
      }
      
      // Skip if we already have AI analysis
      if (results.aiAnalysis) {
        console.log("Using existing AI analysis from results");
        setAiAnalysis(results.aiAnalysis);
        return;
      }
      
      // Skip API call if we don't have resultId (can't cache)
      if (!resultId) {
        console.log("No resultId provided, skipping AI analysis");
        return;
      }
      
      try {
        setLoadingAi(true);
        setLoadingAttempts(prev => prev + 1);
        
        // Use the optimized function that checks database first
        const analysis = await getOpenAIBehaviorAnalysis(
          results.traits,
          results.frequencies,
          userName,
          resultId // Pass resultId to enable database lookup and storage
        );
        
        if (analysis) {
          setAiAnalysis(analysis);
          setAiSaved(true); // Since it's either from cache or was cached during fetch
          toast.success("Análise comportamental carregada com sucesso!");
          console.log("AI analysis loaded successfully");
        }
      } catch (err) {
        console.error("Error fetching AI analysis:", err);
        setError("Falha ao carregar análise comportamental. " + 
                 (loadingAttempts < 2 ? "Tentando novamente..." : "Por favor, tente mais tarde."));
                 
        // Retry once after 2 seconds if first attempt failed
        if (loadingAttempts < 2) {
          setTimeout(() => {
            fetchAiAnalysis();
          }, 2000);
        }
      } finally {
        setLoadingAi(false);
      }
    };
    
    fetchAiAnalysis();
  }, [results.traits, results.frequencies, results.aiAnalysis, userName, resultId]);

  // Generate new analysis function (when user explicitly requests a new analysis)
  const generateNewAnalysis = async () => {
    if (!user || !resultId || !results.traits) return;
    
    try {
      setGeneratingNewAnalysis(true);
      setLoadingAi(true);
      setError(null);
      
      // Force a new API call by passing forceRefresh=true
      const analysis = await getOpenAIBehaviorAnalysis(
        results.traits,
        results.frequencies,
        userName,
        resultId,
        true // Force refresh
      );
      
      if (analysis) {
        setAiAnalysis(analysis);
        setAiSaved(true); // New analysis is automatically saved in the service
        toast.success("Nova análise comportamental gerada com sucesso!");
      } else {
        throw new Error("Falha ao gerar nova análise");
      }
    } catch (err) {
      console.error("Error generating new AI analysis:", err);
      setError("Falha ao gerar nova análise. Por favor, tente novamente.");
      toast.error("Erro ao gerar nova análise comportamental");
    } finally {
      setLoadingAi(false);
      setGeneratingNewAnalysis(false);
    }
  };

  // Guard against undefined results
  if (!results) {
    console.error("No behavior results data available");
    return (
      <div className="max-w-[800px] mx-auto bg-white p-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">Error: No behavior results data available</p>
        </div>
      </div>
    )
  }

  // Ensure we have valid traits and frequencies
  const traits = results.traits || {}
  const frequencies = results.frequencies || {}
  
  console.log("Behavior traits:", traits);
  console.log("Behavior frequencies:", frequencies);
  
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
      toast.success("Relatório PDF baixado com sucesso!");
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Erro ao gerar PDF. Por favor, tente novamente.')
      toast.error("Erro ao gerar PDF do relatório");
    } finally {
      setDownloading(false)
    }
  }
  
  return (
    <div ref={reportRef} id="report-content" className="max-w-[800px] mx-auto bg-white p-8">
      <div className="bg-white shadow-sm rounded-lg p-8 space-y-12">
        <div className="flex justify-between items-center mb-6">
          {error && (
            <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
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
            
            {loadingAi ? (
              <div className="py-4 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-600">Analisando comportamento...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {aiAnalysis.summary}
                </p>
                
                {/* Controls for regenerating analysis */}
                {resultId && (
                  <div className="flex flex-wrap justify-center space-x-2 pt-2">
                     {/* Generate new analysis button */}
                     <button
                      onClick={generateNewAnalysis}
                      disabled={generatingNewAnalysis || loadingAi}
                      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                        generatingNewAnalysis || loadingAi
                          ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      {generatingNewAnalysis || loadingAi ? (
                        <>
                          <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1.5" />
                          Gerar nova análise
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {Object.keys(traits).length > 0 ? (
                  <>
                    Com base na análise realizada, seus principais traços comportamentais incluem tendências para
                    {getMainTraits(traits).map((trait, i, arr) => (
                      <span key={trait.id}>
                        {i === arr.length - 1 ? ' e ' : i > 0 ? ', ' : ' '}
                        <span className="font-semibold text-indigo-900">{trait.description}</span>
                      </span>
                    ))}.
                    {' '}Estes traços indicam uma orientação natural para {getTraitsSummary(traits)}.
                  </>
                ) : (
                  <span className="text-gray-500">Dados insuficientes para análise detalhada.</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* AI Analysis Section */}
        {aiAnalysis && (
          <div className="mb-8 bg-white rounded shadow-sm border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Análise Comportamental Detalhada
            </h2>
            
            {/* Strengths Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-6 bg-green-500 mr-3 rounded-sm"></span>
                Pontos Fortes
              </h3>
              <ul className="space-y-2 ml-5">
                {aiAnalysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 p-1 mr-3 mt-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                      </svg>
                    </span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Development Areas Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-6 bg-amber-500 mr-3 rounded-sm"></span>
                Áreas de Desenvolvimento
              </h3>
              <ul className="space-y-2 ml-5">
                {aiAnalysis.developmentAreas.map((area, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-800 p-1 mr-3 mt-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-gray-700">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Work Style Insights */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-6 bg-indigo-500 mr-3 rounded-sm"></span>
                Estilo de Trabalho
              </h3>
              <div className="bg-indigo-50 p-5 rounded-lg">
                <p className="text-gray-700 leading-relaxed">{aiAnalysis.workStyleInsights}</p>
              </div>
            </div>
            
            {/* Team Dynamics */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-6 bg-purple-500 mr-3 rounded-sm"></span>
                Dinâmica em Equipe
              </h3>
              <div className="bg-purple-50 p-5 rounded-lg">
                <p className="text-gray-700 leading-relaxed">{aiAnalysis.teamDynamicsInsights}</p>
              </div>
            </div>
          </div>
        )}

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
            {Object.keys(traits).length > 0 ? (
              allQuestions
                ?.filter(q => q.type === 'trait')
                .slice(0, Math.ceil(allQuestions.filter(q => q.type === 'trait').length / 2))
                .map(question => {
                  const value = traits[question.id] || 3
                  const position = ((value - 1) / 4) * 100

                  const tendency = getTraitTendency(question.id, value)
                  // Try to get the AI description if available, otherwise use the standard one
                  const description = aiAnalysis?.traitDescriptions?.[question.id] || 
                                     getTraitDescription(question.id, value)

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
                })
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500">Não há dados de traços comportamentais disponíveis para exibição.</p>
              </div>
            )}
          </div>
        </div>

        <div className="page-break keep-together">
          <div className="grid grid-cols-1 gap-8">
            {Object.keys(traits).length > 0 ? (
              allQuestions
                ?.filter(q => q.type === 'trait')
                .slice(Math.ceil(allQuestions.filter(q => q.type === 'trait').length / 2))
                .map(question => {
                  const value = traits[question.id] || 3
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
                })
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500">Não há dados adicionais de traços comportamentais disponíveis.</p>
              </div>
            )}
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
            {Object.keys(frequencies).length > 0 ? (
              allQuestions
                ?.filter(q => q.type === 'frequency')
                .map(question => {
                  const value = frequencies[question.trait!] || 3
                  const frequencyLabel = frequencyLabels[Math.min(value - 1, 4)]
                  
                  return (
                    <div key={question.id} className="flex flex-col mb-8">
                      <h3 className="text-lg font-medium text-gray-900">{question.trait}</h3>
                      <p className="text-base text-gray-700 mb-4">Frequência atual: {frequencyLabel}</p>
                      
                      <RatingSelector 
                        value={value} 
                        readOnly={true}
                        labels={frequencyLabels}
                      />
                      
                      <div className="flex justify-between mt-2 text-sm text-gray-600">
                        {/* Removing the 'Nunca confrontador' label as requested */}
                      </div>
                    </div>
                  )
                })
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500">Não há dados de frequência de traços comportamentais disponíveis para exibição.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple refresh icon component for the "Generate new analysis" button
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
      />
    </svg>
  );
}