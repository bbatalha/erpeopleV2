import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, FileText, Download, LineChart, Brain, Activity, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { DISCBarChart } from '../components/DISCBarChart'
import { calculateDISCResults } from '../utils/discCalculator'
import { ComparisonModal } from '../components/ComparisonModal'
import { fetchUserAssessmentHistory } from '../lib/api'
import { checkInternetConnectivity, getOfflineErrorMessage } from '../lib/api'

function getProfileName(profile: string): string {
  switch (profile) {
    case 'D': return 'Dominância'
    case 'I': return 'Influência'
    case 'S': return 'Estabilidade'
    case 'C': return 'Conformidade'
    default: return profile
  }
}

interface Assessment {
  id: string
  type: string
  title: string
  created_at: string
  results: any
  assessment_responses: {
    responses: any
    completed_at: string
  }
}

export function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([])
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState<'disc' | 'behavior'>('disc')
  const [currentPage, setCurrentPage] = useState(1)
  const reportsPerPage = 5

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Check for internet connectivity first
      if (!checkInternetConnectivity()) {
        setError(getOfflineErrorMessage())
        setLoading(false)
        return
      }

      // Use the utility function with retry logic
      const data = await fetchUserAssessmentHistory(user.id)
      setAssessments(data as Assessment[])
    } catch (err) {
      console.error('Error fetching assessments:', err)
      setError(
        err instanceof Error 
          ? `Error: ${err.message}` 
          : 'An unexpected error occurred while loading your assessment history.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [user])

  const handleRetry = () => {
    setRetrying(true)
    fetchData().finally(() => setRetrying(false))
  }

  const filteredAssessments = assessments.filter(assessment => {
    // Filter by tab type first
    if (activeTab === 'disc' && assessment.assessments?.type !== 'disc') return false
    if (activeTab === 'behavior' && assessment.assessments?.type !== 'behavior') return false
    
    if (selectedPeriod !== 'all') {
      const date = new Date(assessment.created_at)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = diff / (1000 * 60 * 60 * 24)
      
      switch (selectedPeriod) {
        case '30days': return days <= 30
        case '90days': return days <= 90
        case '180days': return days <= 180
        default: return true
      }
    }
    
    return true
  })

  const assessmentCount = {
    disc: assessments.filter(a => a.assessments?.type === 'disc').length,
    behavior: assessments.filter(a => a.assessments?.type === 'behavior').length
  }

  // Pagination
  const totalPages = Math.ceil(filteredAssessments.length / reportsPerPage)
  const indexOfLastReport = currentPage * reportsPerPage
  const indexOfFirstReport = indexOfLastReport - reportsPerPage
  const currentReports = filteredAssessments.slice(indexOfFirstReport, indexOfLastReport)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo(0, 0)
  }

  const handleCompare = () => {
    if (selectedAssessments.length !== 2) return
    setShowComparisonModal(true)
  }

  const handleExport = async (assessmentId: string) => {
    setDownloading(true)
    try {
      navigate(`/results/${assessmentId}?action=download`)
    } catch (error) {
      console.error('Error exporting assessment:', error)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 rounded-lg">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h3 className="font-medium text-lg">Error Loading Assessment History</h3>
        </div>
        <p className="text-red-600 mb-4 whitespace-pre-line">{error}</p>
        <div className="flex space-x-4">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {retrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Histórico de Avaliações</h1>
        <p className="text-sm text-gray-500">
          Acompanhe seu desenvolvimento e compare diferentes momentos da sua jornada
        </p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            <button
              onClick={() => {
                setActiveTab('disc')
                setCurrentPage(1)
              }}
              className={`${
                activeTab === 'disc'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              DISC
              <span className="ml-1 sm:ml-2 bg-gray-100 text-gray-600 py-0.5 px-1.5 rounded-full text-xs">
                {assessmentCount.disc}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('behavior')
                setCurrentPage(1)
              }}
              className={`${
                activeTab === 'behavior'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Traços Comportamentais
              <span className="ml-1 sm:ml-2 bg-gray-100 text-gray-600 py-0.5 px-1.5 rounded-full text-xs">
                {assessmentCount.behavior}
              </span>
            </button>
          </nav>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-6">
        <div className="relative">
          <select
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full sm:w-auto bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Todos os períodos</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="90days">Últimos 90 dias</option>
            <option value="180days">Últimos 180 dias</option>
          </select>
          <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {selectedAssessments.length > 0 && (
          <button
            onClick={handleCompare}
            disabled={selectedAssessments.length !== 2}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <LineChart className="w-4 h-4 mr-2" />
            {selectedAssessments.length === 2 ? 'Comparar Selecionados' : `${selectedAssessments.length}/2 Selecionados`}
          </button>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {filteredAssessments.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Nenhuma avaliação encontrada para o período selecionado.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {currentReports.map((assessment) => {
              const date = new Date(assessment.created_at)
              
              // For DISC assessments, process the data consistently 
              let scores = { D: 0, I: 0, S: 0, C: 0 };
              if (assessment.assessments?.type === 'disc') {
                // First check if results already has scores object
                if (assessment.results?.scores) {
                  scores = {
                    D: Number(assessment.results.scores.D) || 0,
                    I: Number(assessment.results.scores.I) || 0,
                    S: Number(assessment.results.scores.S) || 0,
                    C: Number(assessment.results.scores.C) || 0
                  };
                } 
                // Next check if results has direct DISC properties
                else if (assessment.results && ('D' in assessment.results || 'I' in assessment.results || 'S' in assessment.results || 'C' in assessment.results)) {
                  scores = {
                    D: Number(assessment.results.D) || 0,
                    I: Number(assessment.results.I) || 0,
                    S: Number(assessment.results.S) || 0,
                    C: Number(assessment.results.C) || 0
                  };
                } 
                // Finally calculate from answers if available
                else if (assessment.assessment_responses?.responses?.answers) {
                  scores = calculateDISCResults(assessment.assessment_responses.responses.answers).scores;
                }
                
                // Normalize scores to ensure they sum to 100%
                const sum = scores.D + scores.I + scores.S + scores.C;
                if (sum > 0 && Math.abs(sum - 100) > 0.1) {
                  const factor = 100 / sum;
                  scores.D *= factor;
                  scores.I *= factor;
                  scores.S *= factor;
                  scores.C *= factor;
                }
              }
              
              return (
                <li key={assessment.id} className={`px-4 py-4 sm:px-6 ${
                  assessment.assessments?.type === 'behavior' 
                    ? 'border-b border-gray-100 hover:bg-gray-50 transition-colors' 
                    : ''
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center mb-3 sm:mb-0">
                      <input
                        type="checkbox"
                        checked={selectedAssessments.includes(assessment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssessments(prev => 
                              prev.length < 2 ? [...prev, assessment.id] : prev
                            )
                          } else {
                            setSelectedAssessments(prev => 
                              prev.filter(id => id !== assessment.id)
                            )
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                      />
                      <div>
                        <h3 className="text-base font-medium text-gray-900">
                          {assessment.assessments?.title}
                        </h3>
                        <div className="mt-1 flex items-center text-xs sm:text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                          {date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/results/${assessment.id}`)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Ver Detalhes</span>
                        <span className="xs:hidden">Ver</span>
                      </button>
                      
                      <button
                        onClick={() => handleExport(assessment.id)}
                        disabled={downloading}
                        className={`inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          downloading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">{downloading ? 'Exportando...' : 'Exportar'}</span>
                        <span className="xs:hidden">PDF</span>
                      </button>
                    </div>
                  </div>

                  {assessment.assessments?.type === 'disc' && (
                    <div className="mt-4 sm:mt-6 bg-gray-50 p-2 sm:p-4 rounded-lg">
                      <div className="h-48 sm:h-64">
                        <DISCBarChart scores={scores} />
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{indexOfFirstReport + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastReport, filteredAssessments.length)}
                  </span>{' '}
                  de <span className="font-medium">{filteredAssessments.length}</span> resultados
                </p>
              </div>
              <div>
                <div className="flex items-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile pagination */}
            <div className="flex items-center justify-between w-full sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </nav>
        )}
      </div>

      {showComparisonModal && (
        <ComparisonModal
          assessments={assessments.filter(a => selectedAssessments.includes(a.id))}
          onClose={() => setShowComparisonModal(false)}
        />
      )}
    </div>
  )
}