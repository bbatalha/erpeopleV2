import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Brain, ArrowRight, ArrowLeft, Clock } from 'lucide-react'
import { BehaviorAssessment } from '../components/BehaviorAssessment'
import { useAuth } from '../contexts/AuthContext'
import { Database } from '../lib/database.types'

type Question = Database['public']['Tables']['disc_questions']['Row']

interface QuestionTime {
  questionNumber: number
  startTime: number
  endTime: number | null
}

export function Assessment() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [assessment, setAssessment] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<number, 'D' | 'I' | 'S' | 'C'>>({})
  const [startTime, setStartTime] = useState<number | null>(null)
  const [questionTimes, setQuestionTimes] = useState<QuestionTime[]>([])
  const { user } = useAuth()

  // Check if there's an in-progress assessment
  useEffect(() => {
    async function checkAssessmentStatus() {
      if (!user) return

      try {
        const assessmentId = await getAssessmentId()
        if (!assessmentId) return

        const { data: existingResponse } = await supabase
          .from('assessment_responses')
          .select('*')
          .eq('user_id', user.id)
          .eq('assessment_id', assessmentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (existingResponse) {
          if (existingResponse.status === 'completed') {
            // Start a new assessment
            const { error } = await supabase
              .from('assessment_responses')
              .insert({
                user_id: user.id,
                assessment_id: assessmentId,
                status: 'in_progress',
                responses: { answers: {} },
                started_at: new Date().toISOString()
              })

            if (error) throw error
            setResponses({})
            setCurrentQuestion(0)
          } else {
            // Resume in-progress assessment
            setResponses(existingResponse.responses?.answers || {})
            const answeredQuestions = Object.keys(existingResponse.responses?.answers || {}).length
            setCurrentQuestion(Math.min(answeredQuestions, questions.length - 1))
          }
        }
      } catch (error) {
        console.error('Error checking assessment status:', error)
      }
    }

    checkAssessmentStatus()
  }, [user, questions.length])

  async function getAssessmentId() {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('id')
        .eq('type', type)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data?.id
    } catch (error) {
      console.error('Error getting assessment ID:', error)
      return null
    }
  }

  useEffect(() => {
    async function fetchAssessment() {
      const [assessmentResult, questionsResult] = await Promise.all([
        supabase
        .from('assessments')
        .select('*')
        .eq('type', type)
        .eq('is_active', true),
        supabase
          .from('disc_questions')
          .select('*')
          .order('question_number')
      ])

      if (assessmentResult.error || !assessmentResult.data?.length) {
        console.error('Error fetching assessment:', assessmentResult.error)
        navigate('/dashboard')
        return
      }

      if (questionsResult.error) {
        console.error('Error fetching questions:', questionsResult.error)
        navigate('/dashboard')
        return
      }

      setAssessment(assessmentResult.data[0])
      setQuestions(questionsResult.data || [])
      setLoading(false)
      setStartTime(Date.now())
      setQuestionTimes([{ questionNumber: 0, startTime: Date.now(), endTime: null }])
    }

    fetchAssessment()
  }, [type, navigate])

  const recordQuestionTime = (questionNumber: number) => {
    const now = Date.now()
    setQuestionTimes(prev => {
      // Update end time for current question
      const updated = prev.map(qt => 
        qt.questionNumber === questionNumber ? { ...qt, endTime: now } : qt
      )
      // Add start time for next question if not last
      if (questionNumber < questions.length - 1) {
        updated.push({
          questionNumber: questionNumber + 1,
          startTime: now,
          endTime: null
        })
      }
      return updated
    })
  }

  const calculateTimeStats = () => {
    const completedTimes = questionTimes.filter(qt => qt.endTime !== null)
    const durations = completedTimes.map(qt => qt.endTime! - qt.startTime)
    
    return {
      totalTime: startTime ? Date.now() - startTime : 0,
      averageTime: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      questionTimes: completedTimes.map(qt => ({
        questionNumber: qt.questionNumber,
        duration: qt.endTime! - qt.startTime
      }))
    }
  }

  const handleAnswer = async (profile: 'D' | 'I' | 'S' | 'C') => {
    setResponses(prev => ({
      ...prev,
      [questions[currentQuestion].question_number]: profile
    }))

    recordQuestionTime(currentQuestion)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      const timeStats = calculateTimeStats()
      await submitAssessment(responses, timeStats)
    }
  }

  const submitAssessment = async (
    answers: Record<number, 'D' | 'I' | 'S' | 'C'>,
    timeStats: any
  ) => {
    if (!user) return

    try {
      // Create assessment response
      const { data: responseData, error: responseError } = await supabase
        .from('assessment_responses')
        .insert({
          user_id: user.id,
          assessment_id: assessment.id,
          status: 'completed',
          responses: { answers, timeStats },
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (responseError) throw responseError

      // Calculate and store results
      const results = calculateResults(answers)
      const { data: resultData, error: resultError } = await supabase
        .from('assessment_results')
        .insert({
          response_id: responseData.id,
          user_id: user.id,
          assessment_id: assessment.id,
          results
        })
        .select()
        .single()

      if (resultError) throw resultError

      // Navigate to results page
      navigate(`/results/${resultData.id}`)
    } catch (error) {
      console.error('Error submitting assessment:', error)
      // Handle error appropriately
    }
  }

  const calculateResults = (answers: Record<number, 'D' | 'I' | 'S' | 'C'>) => {
    const counts = { D: 0, I: 0, S: 0, C: 0 }
    Object.values(answers).forEach(profile => {
      counts[profile]++
    })
    return counts
  }

  const currentProgress = ((currentQuestion + 1) / questions.length) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    )
  }

  const question = questions[currentQuestion]
  if (!question) return null

  if (type === 'behavior') {
    return <BehaviorAssessment />
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {assessment?.title} 
          {startTime && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              <Clock className="inline-block w-4 h-4 mr-1" />
              {Math.floor((Date.now() - startTime) / 1000 / 60)}min
              {Math.floor((Date.now() - startTime) / 1000 % 60)}s
            </span>
          )}
        </h1>
        
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{
                width: `${currentProgress}%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Questão {currentQuestion + 1} de {questions.length}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-gray-900 font-medium">{question.question_text}</p>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleAnswer('D')}
              className="w-full px-4 py-3 text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {question.option_d}
            </button>
            <button
              onClick={() => handleAnswer('I')}
              className="w-full px-4 py-3 text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {question.option_i}
            </button>
            <button
              onClick={() => handleAnswer('S')}
              className="w-full px-4 py-3 text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {question.option_s}
            </button>
            <button
              onClick={() => handleAnswer('C')}
              className="w-full px-4 py-3 text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {question.option_c}
            </button>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
          <div className="text-sm text-gray-500">
            {currentQuestion + 1} de {questions.length}
          </div>
          {currentQuestion < questions.length - 1 && (
            <button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600"
            >
              <span>Próxima</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}