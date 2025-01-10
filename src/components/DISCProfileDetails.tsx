import React from 'react'
import { getProfileDetails } from '../utils/discCalculator'

interface DISCProfileDetailsProps {
  profile: string
}

export function DISCProfileDetails({ profile }: DISCProfileDetailsProps) {
  const details = getProfileDetails(profile)

  if (!details) return null

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Comportamento sob Estresse</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          {details.stressResponse.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estilo de Comunicação</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          {details.communicationStyle.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contribuições para a Equipe</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          {details.teamContributions.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Medos e Inseguranças</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          {details.fearsAndInsecurities.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Comportamento em Diferentes Contextos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Em Reuniões</p>
            <p className="mt-1 text-gray-600">{details.meetingStyle}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Em Projetos</p>
            <p className="mt-1 text-gray-600">{details.projectStyle}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Em Conflitos</p>
            <p className="mt-1 text-gray-600">{details.conflictStyle}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Em Decisões</p>
            <p className="mt-1 text-gray-600">{details.decisionStyle}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Desenvolvimento Profissional</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-2">Carreiras Adequadas</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              {details.careers.map((career, index) => (
                <li key={index}>{career}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-2">Estratégias de Aprendizado</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              {details.learningStyle.map((style, index) => (
                <li key={index}>{style}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}