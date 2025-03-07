import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { traitQuestions, frequencyQuestions } from '../utils/behaviorQuestions'

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
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Load saved progress when component mounts
    async function loadProgress() {
      try {
        if (!user) return

        const assessmentId = await getAssessmentId()
        if (!assessmentId) return

        const { data, error } = await supabase
          .from('assessment_responses')
          .select('responses')
          .order('created_at', { ascending: false })
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .eq('assessment_id', assessmentId)
          .limit(1)
          .single()

        if (error) throw error
        
        if (data?.responses?.answers) {
          setAnswers(data.responses.answers)
          // Set current question to the first unanswered question
          const answeredQuestions = Object.keys(data.responses.answers).map(Number)
          if (answeredQuestions.length > 0) {
            const lastAnswered = Math.max(...answeredQuestions)
            setCurrentQuestion(Math.min(lastAnswered + 1, questions.length - 1))
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error)
      }
    }

    loadProgress()
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
    
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }))

    // Save progress automatically
    saveProgress(newAnswers)
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
      }
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const submitAssessment = async () => {
    if (!user) return

    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.id])
    if (unansweredQuestions.length > 0) {
      alert('Por favor, responda todas as questões antes de concluir.')
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
      
      console.log("Submitting behavior assessment results:", results);

      // First, create the completed response
      const { data: responseData, error: responseError } = await supabase
        .from('assessment_responses')
        .insert({
          user_id: user.id,
          assessment_id: assessmentId,
          status: 'completed',
          responses: {
            answers,
            questions, // Include the questions for reference
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
      // Show error message to user
      alert('Erro ao salvar avaliação. Por favor, tente novamente.')
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

  const question = questions[currentQuestion]

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h2 className="text-xl font-medium mb-8 text-gray-900">
            {question.type === 'trait' 
              ? 'Você tende a se comportar:'
              : 'Com que frequência você tende a ser:'}
          </h2>

          {question.type === 'trait' ? (
            <div className="space-y-8">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{question.leftTrait}</span>
                <span>{question.rightTrait}</span>
              </div>
              <div className="flex justify-between items-center px-4">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    onClick={() => handleAnswer(value)}
                    className={`w-4 h-4 rounded-full transition-all
                      ${answers[question.id] === value
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 hover:bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-medium mb-4 text-gray-900">{question.trait}</p>
              <div className="grid grid-cols-5 gap-2">
                {frequencyOptions.map((option, index) => {
                  const isSelected = answers[question.id] === index + 1
                  return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(index + 1)}
                    className={`px-1 py-2 rounded text-sm transition-all min-w-[80px] text-center
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

        <div className="mt-8">
          <p className="text-sm text-gray-500">
            Conclusão: {Math.round(progress)}%
          </p>
          <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Anterior</span>
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[questions[currentQuestion].id] || (isLastQuestion && !canSubmit) || loading}
            className={`flex items-center space-x-2 ${
              isLastQuestion
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'text-gray-600 hover:text-indigo-600'
            } px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>{buttonText}</span>
            {!isLastQuestion && (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}