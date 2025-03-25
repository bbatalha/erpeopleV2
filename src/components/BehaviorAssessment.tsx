import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Save, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { traitQuestions, frequencyQuestions } from '../utils/behaviorQuestions'
import { toast } from 'react-hot-toast'

interface Question {
  id: number
  type: 'trait' | 'frequency'
  leftTrait?: string
  rightTrait?: string
  trait?: string
}

const questions = [...traitQuestions, ...frequencyQuestions]

const frequencyOptions = [
  'Nunca',
  'Raramente',
  'Às vezes',
  'Frequentemente',
  'Sempre'
]

export function BehaviorAssessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [startTime] = useState<number>(Date.now())
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Load saved progress when component mounts
    async function loadProgress() {
      try {
        if (!user) return

        const assessmentId = await getAssessmentId()
        if (!assessmentId) return

        // Changed to get array and take first item instead of using .single()
        const { data, error } = await supabase
          .from('assessment_responses')
          .select('responses, created_at')
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .eq('assessment_id', assessmentId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error
        
        // Check if we have any data and use the first item
        if (data && data.length > 0) {
          const response = data[0]
          if (response.responses?.answers) {
            setAnswers(response.responses.answers)
            setLastSaved(new Date(response.created_at))
            
            // Set current question to the first unanswered question
            const answeredQuestions = Object.keys(response.responses.answers).map(Number)
            if (answeredQuestions.length > 0) {
              const lastAnswered = Math.max(...answeredQuestions)
              setCurrentQuestion(Math.min(lastAnswered + 1, questions.length - 1))
            }
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error)
        toast.error('Erro ao carregar progresso. Por favor, tente novamente.')
      }
    }

    loadProgress()
    
    // Setup auto-save interval
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        saveProgress(answers)
      }
    }, 30000) // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveInterval)
  }, [user])

  async function getAssessmentId() {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('id')
        .eq('type', 'behavior')
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data?.id
    } catch (error) {
      console.error('Error getting assessment ID:', error)
      return null
    }
  }

  const handleAnswer = (value: number) => {
    const newAnswers = {
      ...answers,
      [questions[currentQuestion].id]: value
    }
    
    setAnswers(newAnswers)

    // Save progress automatically
    saveProgress(newAnswers)
    
    // Automatically move to next question after selection on mobile
    if (window.innerWidth < 768 && currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1)
      }, 500)
    }
  }

  const saveProgress = async (currentAnswers: Record<number, number>) => {
    if (!user) return

    try {
      const assessmentId = await getAssessmentId()
      if (!assessmentId) return

      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          user_id: user.id,
          assessment_id: assessmentId,
          status: 'in_progress',
          responses: { answers: currentAnswers },
          started_at: new Date(startTime).toISOString()
        })
        
      if (error) {
        console.error('Error saving progress:', error)
        return
      }
      
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const submitAssessment = async () => {
    if (!user) return

    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.id])
    if (unansweredQuestions.length > 0) {
      toast.error('Por favor, responda todas as questões antes de concluir.')
      return
    }

    setLoading(true)
    try {
      const assessmentId = await getAssessmentId()
      if (!assessmentId) throw new Error('Assessment ID not found')

      // Process the answers into separate traits and frequencies collections
      const traits: Record<number, number> = {}
      const frequencies: Record<string, number> = {}
      
      // Process trait questions (1-35)
      for (const q of traitQuestions) {
        if (answers[q.id]) {
          traits[q.id] = answers[q.id]
        }
      }
      
      // Process frequency questions (36-40)
      for (const q of frequencyQuestions) {
        if (answers[q.id] && q.trait) {
          frequencies[q.trait] = answers[q.id]
        }
      }
      
      // Calculate results
      const results = {
        traits,
        frequencies,
        timeStats: {
          totalTime: Date.now() - startTime,
          completedAt: new Date().toISOString()
        }
      }

      // First, create the completed response
      const { data: responseData, error: responseError } = await supabase
        .from('assessment_responses')
        .insert({
          user_id: user.id,
          assessment_id: assessmentId,
          status: 'completed',
          responses: {
            answers,
            questions,
            timeStats: {
              totalTime: Date.now() - startTime,
              completedAt: new Date().toISOString()
            }
          },
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (responseError) throw responseError

      // Then store results
      const { data: resultData, error: resultError } = await supabase
        .from('assessment_results')
        .insert({
          response_id: responseData.id,
          user_id: user.id,
          assessment_id: assessmentId,
          results
        })
        .select()
        .single()

      if (resultError) throw resultError

      // Finally, navigate to results page
      navigate(`/results/${resultData.id}`, { replace: true })
    } catch (error) {
      console.error('Error submitting assessment:', error)
      toast.error('Erro ao salvar avaliação. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isLastQuestion = currentQuestion === questions.length - 1
  const canSubmit = isLastQuestion && Object.keys(answers).length === questions.length
  const buttonText = loading 
    ? 'Processando...' 
    : isLastQuestion 
      ? 'Concluir' 
      : 'Próxima'

  const progress = (Object.keys(answers).length / questions.length) * 100

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else if (Object.keys(answers).length === questions.length) {
      submitAssessment()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s atrás`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}min atrás`
    const hours = Math.floor(minutes / 60)
    return `${hours}h atrás`
  }

  const question = questions[currentQuestion]

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl font-medium mb-6 sm:mb-8 text-gray-900">
            {question.type === 'trait' 
              ? 'Você tende a se comportar:'
              : 'Com que frequência você tende a ser:'}
          </h2>

          {/* Progress indicator with question count */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs sm:text-sm text-gray-500">
                Questão {currentQuestion + 1} de {questions.length}
              </p>
              {lastSaved && (
                <p className="text-xs text-gray-400 flex items-center">
                  <Save className="w-3 h-3 mr-1" /> 
                  Salvo {formatTimeSince(lastSaved)}
                </p>
              )}
            </div>
          </div>

          {question.type === 'trait' ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{question.leftTrait}</span>
                <span>{question.rightTrait}</span>
              </div>
              <div className="flex justify-between items-center px-4">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    onClick={() => handleAnswer(value)}
                    className={`w-6 h-6 sm:w-4 sm:h-4 rounded-full transition-all 
                      ${answers[question.id] === value
                        ? 'bg-indigo-600 transform scale-125 sm:scale-100'
                        : 'bg-gray-200 hover:bg-gray-300'}`}
                    aria-label={`Option ${value}`}
                  />
                ))}
              </div>
              {/* Added labels for mobile */}
              <div className="flex justify-between text-xs text-gray-400 px-2 sm:hidden">
                <span>{question.leftTrait}</span>
                <span>{question.rightTrait}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-medium mb-4 text-gray-900">{question.trait}</p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {frequencyOptions.map((option, index) => {
                  const isSelected = answers[question.id] === index + 1
                  return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(index + 1)}
                    className={`px-3 py-3 sm:py-2 rounded text-sm transition-all sm:min-w-[80px] text-center
                      ${isSelected
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-600'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 ring-1 ring-gray-200'}`}
                  >
                    {option}
                  </button>
                )})}
              </div>
            </div>
          )}
        </div>

        {/* Session time indicator */}
        <div className="mt-4 text-xs text-gray-500 flex items-center justify-center">
          <Clock className="w-3 h-3 mr-1" />
          <span>Tempo ativo: {Math.floor((Date.now() - startTime) / 60000)} min</span>
        </div>

        <div className="flex justify-between mt-6 sm:mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 sm:p-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[questions[currentQuestion].id] || (isLastQuestion && !canSubmit) || loading}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed
              ${isLastQuestion
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'text-gray-600 hover:text-indigo-600'}`}
          >
            <span>{buttonText}</span>
            {!isLastQuestion && (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}