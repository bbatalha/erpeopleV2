import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Brain, AlertCircle } from 'lucide-react'
import { DISCReport } from '../components/DISCReport'
import { BehaviorReport } from '../components/BehaviorReport'
import { calculateDISCResults, getProfileDescription, getProfileRecommendations } from '../utils/discCalculator'
import { traitQuestions, frequencyQuestions } from '../utils/behaviorQuestions'

export function Results() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reportType = searchParams.get('type')
  const reportRef = useRef<HTMLDivElement>(null)
  const [downloadTriggered, setDownloadTriggered] = useState(false)
  const [state, setState] = useState({
    loading: true,
    results: null as any,
    userName: '',
    error: false,
    assessmentType: null as string | null
  })

  useEffect(() => {
    async function fetchResults() {
      if (!id || id === 'placeholder-id') {
        navigate('/dashboard')
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: false }))

      const { data: resultData, error: resultError } = await supabase
        .from('assessment_results')
        .select(`
          *,
          assessment_responses(
            *,
            assessments(*)
          ),
          user:profiles!assessment_results_user_id_fkey (
            full_name
          )
        `)
        .eq('id', id)
        .single()

      console.log('Result data:', resultData)

      if (resultError) {
        console.error('Error fetching result:', resultError)
        setState(prev => ({ ...prev, error: true, loading: false }))
        return
      }

      if (!resultData) {
        console.error('Assessment data not found')
        setState(prev => ({ ...prev, error: true, loading: false }))
        return
      }

      let updatedResults = resultData
      const assessmentType = resultData.assessment_responses?.assessments?.type

      // Override assessment type if specified in URL
      const finalAssessmentType = reportType || assessmentType
      console.log('Assessment type:', finalAssessmentType)

      if (finalAssessmentType === 'disc') {
        const discResults = calculateDISCResults(resultData.assessment_responses.responses.answers)
        updatedResults = { ...resultData, discResults }
      }

      setState({
        loading: false,
        results: updatedResults,
        userName: resultData.user?.full_name || '',
        error: false,
        assessmentType: finalAssessmentType
      })
    }

    fetchResults()
  }, [id, navigate, reportType])

  useEffect(() => {
    // Check if we should trigger download
    if (!state.loading && searchParams.get('action') === 'download' && reportRef.current) {
      if (downloadTriggered) return
      setDownloadTriggered(true)
      const downloadButton = reportRef.current.querySelector('.download-button') as HTMLButtonElement
      if (downloadButton) {
        downloadButton.click()
        // Remove the download parameter from URL
        navigate(`/results/${id}`, { replace: true })
      }
    }
  }, [searchParams, id, navigate, state.loading, downloadTriggered])

  // Early return for loading state
  if (state.error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Results
            </h3>
          </div>
          <p className="mt-2 text-sm text-red-700">
            Unable to load assessment results. The assessment may have been deleted or you may not have permission to view it.
          </p>
          <div className="mt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    )
  }

  // Early return for error state
  // Render appropriate report based on assessment type
  if (state.assessmentType === 'behavior') {
    return (
      <BehaviorReport
        userName={state.userName}
        results={state.results.results}
        questions={[...traitQuestions, ...frequencyQuestions]}
      />
    )
  }

  if (state.assessmentType === 'disc' && !state.results?.discResults) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Resultados não disponíveis
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                Não foi possível carregar os resultados da avaliação.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default to DISC report
  // Only render DISC report if it's a DISC assessment
  if (state.assessmentType === 'disc') {
    const { discResults } = state.results
    return (
      <div ref={reportRef}>
        <DISCReport
          userName={state.userName || 'Profissional'}
          results={discResults}
          timeStats={state.results.assessment_responses?.timeStats}
        />
      </div>
    )
  }

  // Fallback for unknown assessment types
  return <div>Unsupported assessment type</div>
}