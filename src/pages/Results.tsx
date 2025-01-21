import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DISCReport } from '../components/DISCReport'
import { BehaviorReport } from '../components/BehaviorReport'
import { Brain } from 'lucide-react'

export function Results() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [userName, setUserName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [assessmentData, setAssessmentData] = useState<any>(null)

  useEffect(() => {
    async function fetchResult() {
      if (!user || !id) return

      try {
        // Fetch result with related data
        const { data, error } = await supabase
          .from('assessment_results')
          .select(`
            *,
            assessment_responses (
              responses,
              completed_at,
              assessments (
                type,
                title
              )
            ),
            profiles (
              full_name
            )
          `)
          .eq('id', id)
          .single()

        if (error) throw error

        if (!data) {
          setError('Result not found')
          return
        }

        // Process DISC results
        if (data.assessment_responses?.assessments?.type === 'disc') {
          const answers = data.assessment_responses.responses?.answers || {}
          const timeStats = data.assessment_responses.responses?.timeStats
          setAssessmentData({
            answers,
            timeStats,
            results: data.results
          })
        }
        setResult(data)
        setUserName(data.profiles?.full_name || '')

        // Handle download action from URL parameter
        if (searchParams.get('action') === 'download') {
          // Trigger download automatically
          const reportRef = document.querySelector('.download-button') as HTMLButtonElement
          if (reportRef) {
            reportRef.click()
          }
        }
      } catch (err) {
        console.error('Error fetching result:', err)
        setError('Error loading result')
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [user, id, searchParams])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">{error || 'Result not found'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-indigo-600 hover:text-indigo-700"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  const assessmentType = result.assessment_responses?.assessments?.type

  return (
    <div className="py-8">
      {assessmentType === 'disc' ? (
        <DISCReport
          userName={userName}
          results={assessmentData?.results}
          answers={assessmentData?.answers}
          timeStats={assessmentData?.timeStats}
        />
      ) : assessmentType === 'behavior' ? (
        <BehaviorReport
          userName={userName}
          results={result.results}
          timeStats={result.assessment_responses?.responses?.timeStats}
          questions={result.assessment_responses?.responses?.questions || []}
        />
      ) : (
        <div className="max-w-2xl mx-auto mt-8 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700">Unsupported assessment type</p>
        </div>
      )}
    </div>
  )
}