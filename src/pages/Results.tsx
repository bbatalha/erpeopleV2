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
  const [behaviorData, setBehaviorData] = useState<any>(null)

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

        console.log("Fetched result data:", data);

        // Process DISC results
        if (data.assessment_responses?.assessments?.type === 'disc') {
          const answers = data.assessment_responses.responses?.answers || {}
          const timeStats = data.assessment_responses.responses?.timeStats
          
          // Ensure results data is properly formatted
          let formattedResults = data.results;
          
          // Check if results is directly an object with D,I,S,C properties
          if (data.results && typeof data.results === 'object') {
            // If results has a scores property, use that
            if (data.results.scores) {
              formattedResults = data.results;
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
              };
            }
          }
          
          // Normalize scores to ensure they sum to 100%
          if (formattedResults && formattedResults.scores) {
            const scores = formattedResults.scores;
            const sum = scores.D + scores.I + scores.S + scores.C;
            
            if (sum > 0 && Math.abs(sum - 100) > 0.1) {
              const factor = 100 / sum;
              scores.D = scores.D * factor;
              scores.I = scores.I * factor;
              scores.S = scores.S * factor;
              scores.C = scores.C * factor;
              
              console.log(`Normalized scores: D=${scores.D.toFixed(1)}, I=${scores.I.toFixed(1)}, S=${scores.S.toFixed(1)}, C=${scores.C.toFixed(1)}, Sum=${(scores.D + scores.I + scores.S + scores.C).toFixed(1)}`);
            }
          }
          
          setAssessmentData({
            answers,
            timeStats,
            results: formattedResults
          })
          
          // Log the data for debugging
          console.log("DISC Assessment Data:", {
            answers,
            results: formattedResults,
            rawResults: data.results,
            timeStats
          });
        }
        // Process Behavior results
        else if (data.assessment_responses?.assessments?.type === 'behavior') {
          const timeStats = data.assessment_responses.responses?.timeStats
          
          // Log the behavior data for debugging
          console.log("Behavior Results:", {
            results: data.results,
            responses: data.assessment_responses.responses,
            timeStats
          });
          
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
          // Trigger download automatically
          setTimeout(() => {
            const reportRef = document.querySelector('.download-button') as HTMLButtonElement
            if (reportRef) {
              reportRef.click()
            }
          }, 1000);
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
          resultId={result.id} // Pass result ID to enable saving
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