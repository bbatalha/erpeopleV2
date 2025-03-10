import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Brain, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { DISCReport } from '../components/DISCReport'
import { BehaviorReport } from '../components/BehaviorReport'
import { fetchAssessmentResult } from '../lib/api'
import { checkInternetConnectivity, getOfflineErrorMessage } from '../lib/api'
import { toast } from 'react-hot-toast'

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
  const [behaviorData, setBehaviorData] = useState<any>(null)
  const [retrying, setRetrying] = useState(false)
  const [resultId, setResultId] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user || !id) return

    setLoading(true)
    setError(null)
    
    // Set resultId for component use
    setResultId(id)

    try {
      // Check for internet connectivity first
      if (!checkInternetConnectivity()) {
        setError(getOfflineErrorMessage())
        setLoading(false)
        return
      }

      // Use the utility function with retry logic
      const data = await fetchAssessmentResult(id)

      if (!data) {
        setError('Result not found')
        setLoading(false)
        return
      }

      console.log("Fetched result data:", data)

      // Process DISC results
      if (data.assessment_responses?.assessments?.type === 'disc') {
        const answers = data.assessment_responses.responses?.answers || {}
        const timeStats = data.assessment_responses.responses?.timeStats
        
        // Ensure results data is properly formatted
        let formattedResults = data.results
        
        // Check if results is directly an object with D,I,S,C properties
        if (data.results && typeof data.results === 'object') {
          // If results has a scores property, use that
          if (data.results.scores) {
            formattedResults = data.results
          } 
          // If results has D,I,S,C properties directly, wrap them in a scores object
          else if ('D' in data.results || 'I' in data.results || 'S' in data.results || 'C' in data.results) {
            formattedResults = {
              scores: {
                D: data.results.D || 0,
                I: data.results.I || 0,
                S: data.results.S || 0,
                C: data.results.C || 0
              },
              primaryProfile: data.results.primaryProfile || 'D',
              secondaryProfile: data.results.secondaryProfile || 'I'
            }
          }
        }
        
        // Normalize scores to ensure they sum to 100%
        if (formattedResults && formattedResults.scores) {
          const scores = formattedResults.scores
          const sum = scores.D + scores.I + scores.S + scores.C
          
          if (sum > 0 && Math.abs(sum - 100) > 0.1) {
            const factor = 100 / sum
            scores.D = scores.D * factor
            scores.I = scores.I * factor
            scores.S = scores.S * factor
            scores.C = scores.C * factor
          }
        }
        
        setAssessmentData({
          answers,
          timeStats,
          results: formattedResults
        })
      }
      // Process Behavior results
      else if (data.assessment_responses?.assessments?.type === 'behavior') {
        const timeStats = data.assessment_responses.responses?.timeStats
        
        setBehaviorData({
          results: data.results,
          timeStats,
          aiAnalysis: data.ai_analysis // Include AI analysis if available
        })
      }
      
      setResult(data)
      setUserName(data.profiles?.full_name || '')

      // Handle download action from URL parameter
      if (searchParams.get('action') === 'download') {
        // Trigger download automatically after a delay to ensure rendering
        setTimeout(() => {
          const reportRef = document.querySelector('.download-button') as HTMLButtonElement
          if (reportRef) {
            reportRef.click()
          }
        }, 1000)
      }
    } catch (err) {
      console.error('Error fetching result:', err)
      setError(
        err instanceof Error 
          ? `Error: ${err.message}` 
          : 'An unexpected error occurred while loading the results.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [user, id, searchParams])

  const handleRetry = () => {
    setRetrying(true)
    fetchData().finally(() => setRetrying(false))
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
          <h3 className="font-medium text-lg">Error Loading Results</h3>
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

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-4 bg-yellow-50 rounded-lg">
        <p className="text-yellow-700">Result not found. Please return to the dashboard and try again.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
          resultId={resultId} // Pass result ID to enable saving
          userName={userName}
          results={behaviorData?.results || result.results}
          timeStats={result.assessment_responses?.responses?.timeStats}
          questions={result.assessment_responses?.responses?.questions}
        />
      ) : (
        <div className="max-w-2xl mx-auto mt-8 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700">Unsupported assessment type</p>
        </div>
      )}
    </div>
  )
}