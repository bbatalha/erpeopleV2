import React from 'react'
import { Sparkles, Network, Zap, MessageCircle } from 'lucide-react'

interface DISCSuperPowersProps {
  profile: string
}

export function DISCSuperPowers({ profile }: DISCSuperPowersProps) {
  const powers = getSuperPowers(profile)

  return (
    <div className="mb-8 super-powers">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <Sparkles className="w-6 h-6 text-yellow-500 mr-2" />
        Seus Superpoderes
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {powers.map((power, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-start space-x-3">
              {power.icon}
              <div>
                <h3 className="font-medium text-gray-900 mb-0.5">{power.title}</h3>
                <p className="text-gray-600">{power.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getSuperPowers(profile: string) {
  const powers = {
    D: [
      {
        icon: <Zap className="w-6 h-6 text-yellow-500" />,
        title: 'Tomada de Decisão Rápida',
        description: 'Você tem um dom natural para tomar decisões assertivas e eficientes'
      },
      {
        icon: <Network className="w-6 h-6 text-yellow-500" />,
        title: 'Liderança Natural',
        description: 'Sua capacidade de direcionamento inspira e motiva equipes'
      }
    ],
    I: [
      {
        icon: <MessageCircle className="w-6 h-6 text-yellow-500" />,
        title: 'Comunicação Envolvente',
        description: 'Você sabe como transmitir mensagens de forma impactante'
      },
      {
        icon: <Network className="w-6 h-6 text-yellow-500" />,
        title: 'Networking Efetivo',
        description: 'Construir conexões significativas é sua segunda natureza'
      }
    ],
    S: [
      {
        icon: <Network className="w-6 h-6 text-yellow-500" />,
        title: 'Construção de Harmonia',
        description: 'Você tem o dom de criar e manter ambientes estáveis e produtivos'
      },
      {
        icon: <MessageCircle className="w-6 h-6 text-yellow-500" />,
        title: 'Suporte Consistente',
        description: 'Sua capacidade de dar suporte fortalece toda a equipe'
      }
    ],
    C: [
      {
        icon: <Zap className="w-6 h-6 text-yellow-500" />,
        title: 'Análise Precisa',
        description: 'Você tem uma capacidade excepcional de análise e atenção aos detalhes'
      },
      {
        icon: <Network className="w-6 h-6 text-yellow-500" />,
        title: 'Qualidade Garantida',
        description: 'Sua busca por excelência eleva o padrão de qualidade'
      }
    ]
  }

  return powers[profile as keyof typeof powers] || []
}