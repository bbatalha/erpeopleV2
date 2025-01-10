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
  const reportRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({
    loading: true,
    results: null as any,
    userName: '',
    error: false
  })

  useEffect(() => {
    async function fetchResults() {
      if (!id || id === 'placeholder-id') {
        navigate('/dashboard');
        return;
      }

      const { data: resultData, error: resultError } = await supabase
        .from('assessment_results')
        .select(`
          *,
          assessment_responses(*, assessments(*)),
          user:profiles!assessment_results_user_id_fkey (
            full_name
          )
        `)
        .eq('id', id)
        .single()

      if (resultError) {
        navigate('/dashboard')
        return
      }

      let updatedResults = resultData

      if (resultData.assessment_responses.assessments.type === 'disc') {
        const discResults = calculateDISCResults(resultData.assessment_responses.responses.answers)
        updatedResults = { ...resultData, discResults }
      }

      setState({
        loading: false,
        results: updatedResults,
        userName: resultData.user?.full_name || '',
        error: false
      })
    }

    fetchResults()
  }, [id, navigate])

  useEffect(() => {
    // Check if we should trigger download
    if (!state.loading && searchParams.get('action') === 'download' && reportRef.current) {
      const downloadButton = reportRef.current.querySelector('.download-button') as HTMLButtonElement
      if (downloadButton) {
        downloadButton.click()
        // Remove the download parameter from URL
        navigate(`/results/${id}`, { replace: true })
      }
    }
  }, [searchParams, id, navigate, state.loading])

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    )
  }

  if (state.results?.assessment_responses?.assessments?.type === 'behavior') {
    return (
      <BehaviorReport
        userName={state.userName}
        results={state.results.results}
        questions={[...traitQuestions, ...frequencyQuestions]}
      />
    )
  }

  if (!state.results?.discResults) {
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