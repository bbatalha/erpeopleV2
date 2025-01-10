import React from 'react'
import { Link } from 'react-router-dom'
import { Brain, Activity } from 'lucide-react'

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">Bem-vindo ao seu Painel</h1>
      
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link
          to="/assessment/disc"
          className="relative block p-8 pb-16 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 hover:ring-2 hover:ring-indigo-500 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Avaliação DISC</h3>
          </div>
          <p className="mt-4 mb-8 text-gray-600">
            Compreenda seu estilo comportamental e como você responde a desafios, influencia outros,
            lida com regras e procedimentos, e gerencia mudanças.
          </p>
          <span className="absolute bottom-4 right-4 text-indigo-600">Iniciar avaliação →</span>
        </Link>

        <Link
          to="/assessment/behavior"
          className="relative block p-8 pb-16 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 hover:ring-2 hover:ring-indigo-500 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Activity className="w-8 h-8 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Traços Comportamentais</h3>
          </div>
          <p className="mt-4 mb-8 text-gray-600">
            Explore seus traços comportamentais e descubra como eles influenciam
            seu estilo de trabalho, tomada de decisão e relacionamentos profissionais.
          </p>
          <span className="absolute bottom-4 right-4 text-indigo-600">Iniciar avaliação →</span>
        </Link>
      </div>
    </div>
  )
}