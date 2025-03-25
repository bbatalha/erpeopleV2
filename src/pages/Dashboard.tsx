import React from 'react'
import { Link } from 'react-router-dom'
import { Brain, Activity, ArrowRight } from 'lucide-react'

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Bem-vindo ao seu Painel</h1>
      
      <div className="mt-4 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6">
        <Link
          to="/assessment/disc"
          className="relative block p-5 sm:p-8 pb-12 sm:pb-16 bg-white rounded-xl shadow-sm ring-1 ring-gray-200 hover:ring-2 hover:ring-indigo-500 transition-all active:bg-gray-50 touch-manipulation"
        >
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Avaliação DISC</h3>
          </div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
            Compreenda seu estilo comportamental e como você responde a desafios, influencia outros,
            lida com regras e procedimentos, e gerencia mudanças.
          </p>
          <div className="absolute bottom-3 sm:bottom-4 right-4 text-indigo-600 flex items-center text-sm sm:text-base">
            <span className="mr-1">Iniciar avaliação</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/assessment/behavior"
          className="relative block p-5 sm:p-8 pb-12 sm:pb-16 bg-white rounded-xl shadow-sm ring-1 ring-gray-200 hover:ring-2 hover:ring-indigo-500 transition-all active:bg-gray-50 touch-manipulation"
        >
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Traços Comportamentais</h3>
          </div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
            Explore seus traços comportamentais e descubra como eles influenciam
            seu estilo de trabalho, tomada de decisão e relacionamentos profissionais.
          </p>
          <div className="absolute bottom-3 sm:bottom-4 right-4 text-indigo-600 flex items-center text-sm sm:text-base">
            <span className="mr-1">Iniciar avaliação</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
      
      <div className="mt-6 sm:mt-10 bg-indigo-50 rounded-xl p-5 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-indigo-900 mb-2 sm:mb-3">Dica Rápida</h2>
        <p className="text-sm sm:text-base text-indigo-700">
          Complete avaliações regularmente para acompanhar sua evolução ao longo do tempo. 
          Você pode comparar resultados na página de histórico.
        </p>
      </div>
    </div>
  )
}