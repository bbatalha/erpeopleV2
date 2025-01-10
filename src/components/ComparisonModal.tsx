import React from 'react'
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { DISCBarChart } from './DISCBarChart'
import { DISCRadarChart } from './DISCRadarChart'
import { calculateDISCResults } from '../utils/discCalculator'
import { BehaviorComparison } from './BehaviorComparison'
import { traitQuestions } from '../utils/behaviorQuestions'

interface ComparisonModalProps {
  assessments: any[]
  onClose: () => void
}

export function ComparisonModal({ assessments, onClose }: ComparisonModalProps) {
  const [first, second] = assessments
  const assessmentType = first.assessments?.type
  const firstAnswers = first.assessment_responses?.responses?.answers
  const secondAnswers = second.assessment_responses?.responses?.answers
  
  const getDefaultScores = () => ({ D: 0, I: 0, S: 0, C: 0 })
  
  const firstResults = assessmentType === 'disc'
    ? {
        ...calculateDISCResults(firstAnswers || {}),
        scores: firstAnswers ? calculateDISCResults(firstAnswers).scores : getDefaultScores()
      }
    : first.results || {}
    
  const secondResults = assessmentType === 'disc'
    ? {
        ...calculateDISCResults(secondAnswers || {}),
        scores: secondAnswers ? calculateDISCResults(secondAnswers).scores : getDefaultScores()
      }
    : second.results || {}
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProfileName = (profile: string) => {
    switch (profile) {
      case 'D': return 'Dominância'
      case 'I': return 'Influência'
      case 'S': return 'Estabilidade'
      case 'C': return 'Conformidade'
      default: return profile
    }
  }

  const getProfileDescription = (profile: string) => {
    switch (profile) {
      case 'D': return 'Focado em resultados, assertivo e direto'
      case 'I': return 'Comunicativo, entusiasta e sociável'
      case 'S': return 'Paciente, cooperativo e confiável'
      case 'C': return 'Preciso, analítico e organizado'
      default: return ''
    }
  }

  const calculateChange = (profile: 'D' | 'I' | 'S' | 'C') => {
    const firstScore = firstResults.scores?.[profile] || 0
    const secondScore = secondResults.scores?.[profile] || 0
    const change = secondScore - firstScore
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'aumento' : change < 0 ? 'redução' : 'manteve'
    }
  }

  const changes = assessmentType === 'disc' ? {
    D: calculateChange('D'),
    I: calculateChange('I'),
    S: calculateChange('S'),
    C: calculateChange('C')
  } : null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {assessmentType === 'disc' ? 'Análise Comparativa DISC' : 'Análise Comparativa de Traços'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Comparando avaliações de: {formatDate(second.created_at)} vs {formatDate(first.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {assessmentType === 'disc' ? (
          <>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {formatDate(first.created_at)}
                </h3>
                <div className="space-y-4 mb-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium text-indigo-900">Perfil Predominante</h4>
                      <p className="text-sm text-indigo-800 mt-1">
                        {getProfileName(firstResults.primaryProfile)}
                      </p>
                      <p className="text-sm text-indigo-600 mt-1">
                        {getProfileDescription(firstResults.primaryProfile)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-indigo-900">Perfil Secundário</h4>
                      <p className="text-sm text-indigo-800 mt-1">
                        {getProfileName(firstResults.secondaryProfile)}
                      </p>
                      <p className="text-sm text-indigo-600 mt-1">
                        {getProfileDescription(firstResults.secondaryProfile)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <DISCBarChart scores={firstResults.scores} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {formatDate(second.created_at)}
                </h3>
                <div className="space-y-4 mb-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium text-indigo-900">Perfil Predominante</h4>
                      <p className="text-sm text-indigo-800 mt-1">
                        {getProfileName(secondResults.primaryProfile)}
                      </p>
                      <p className="text-sm text-indigo-600 mt-1">
                        {getProfileDescription(secondResults.primaryProfile)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-indigo-900">Perfil Secundário</h4>
                      <p className="text-sm text-indigo-800 mt-1">
                        {getProfileName(secondResults.secondaryProfile)}
                      </p>
                      <p className="text-sm text-indigo-600 mt-1">
                        {getProfileDescription(secondResults.secondaryProfile)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <DISCBarChart scores={secondResults.scores} />
                </div>
              </div>
            </div>


            <div className="mt-12">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Análise Comparativa em Radar</h3>
              <DISCRadarChart
                firstResults={{
                  scores: firstResults.scores,
                  date: first.created_at
                }}
                secondResults={{
                  scores: secondResults.scores,
                  date: second.created_at
                }}
              />
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Análise de Mudanças</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {changes && Object.entries(changes).map(([profile, change]) => {
                  const Icon = change.direction === 'aumento' ? TrendingUp :
                             change.direction === 'redução' ? TrendingDown : Minus
                  
                  return (
                    <div key={profile} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {profile === 'D' && 'Dominância'}
                          {profile === 'I' && 'Influência'}
                          {profile === 'S' && 'Estabilidade'}
                          {profile === 'C' && 'Conformidade'}
                        </h4>
                        <Icon className={`w-5 h-5 ${
                          change.direction === 'aumento' ? 'text-green-600' :
                          change.direction === 'redução' ? 'text-red-600' :
                          'text-gray-400'
                        }`} />
                      </div>
                      <p className={`text-sm ${
                        change.direction === 'aumento' ? 'text-green-600' :
                        change.direction === 'redução' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {change.direction === 'manteve' ? 
                          'Manteve-se estável' : 
                          `${change.direction === 'aumento' ? '+' : '-'}${change.value}%`
                        }
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Insights Práticos</h3>
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Em Reuniões</h4>
                    <p className="text-blue-800">
                      {getContextualAdvice('meetings', firstResults.primaryProfile, secondResults.primaryProfile)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Em Projetos</h4>
                    <p className="text-blue-800">
                      {getContextualAdvice('projects', firstResults.primaryProfile, secondResults.primaryProfile)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Em Decisões</h4>
                    <p className="text-blue-800">
                      {getContextualAdvice('decisions', firstResults.primaryProfile, secondResults.primaryProfile)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <BehaviorComparison
            currentTraits={secondResults.traits}
            targetTraits={firstResults.traits}
            currentDate={second.created_at}
            targetDate={first.created_at}
            questions={traitQuestions}
          />
        )}
      </div>
    </div>
  )
}

function getContextualAdvice(context: 'meetings' | 'projects' | 'decisions', oldProfile: string, newProfile: string): string {
  if (oldProfile === newProfile) {
    return {
      meetings: {
        D: 'Continue liderando discussões, mas considere dar mais espaço para outros se expressarem.',
        I: 'Mantenha seu entusiasmo natural, focando em manter as discussões produtivas.',
        S: 'Continue apoiando a equipe, mas não hesite em expressar suas opiniões.',
        C: 'Mantenha sua atenção aos detalhes, buscando equilibrar com participação ativa.'
      },
      projects: {
        D: 'Seu foco em resultados é valioso; busque incluir mais feedback da equipe.',
        I: 'Continue motivando a equipe, adicionando mais estrutura ao processo.',
        S: 'Sua consistência é fundamental; considere liderar mais iniciativas.',
        C: 'Mantenha os altos padrões, buscando mais flexibilidade quando necessário.'
      },
      decisions: {
        D: 'Balance velocidade com consideração pelos impactos nas pessoas.',
        I: 'Combine seu entusiasmo com análise mais detalhada dos fatos.',
        S: 'Mantenha sua abordagem cuidadosa, sendo mais decisivo quando necessário.',
        C: 'Continue com análises profundas, mas evite paralisia por análise.'
      }
    }[context][oldProfile]
  }

  return {
    meetings: `Aproveite sua nova tendência ${
      newProfile === 'D' ? 'mais assertiva para liderar discussões' :
      newProfile === 'I' ? 'mais comunicativa para engajar a equipe' :
      newProfile === 'S' ? 'mais colaborativa para construir consenso' :
      'mais analítica para aprofundar discussões'
    }`,
    projects: `Use sua evolução ${
      newProfile === 'D' ? 'para impulsionar resultados com mais força' :
      newProfile === 'I' ? 'para inspirar e motivar ainda mais a equipe' :
      newProfile === 'S' ? 'para criar processos mais estáveis' :
      'para garantir maior qualidade e precisão'
    }`,
    decisions: `Aplique seu novo perfil ${
      newProfile === 'D' ? 'mais decisivo para acelerar processos' :
      newProfile === 'I' ? 'mais influente para construir consenso' :
      newProfile === 'S' ? 'mais estável para garantir decisões consistentes' :
      'mais analítico para decisões mais fundamentadas'
    }`
  }[context]
}