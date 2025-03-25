import React from 'react'
import { Link } from 'react-router-dom'
import { Brain, LineChart, Users, ArrowRight } from 'lucide-react'

export function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-4 sm:mb-6">
          Libere o Potencial da sua Equipe
        </h1>
        <p className="mt-4 text-base sm:text-lg leading-7 text-gray-600 max-w-3xl mx-auto">
          Descubra insights sobre traços de personalidade e dinâmica de equipe com nossa plataforma completa de avaliação.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            to="/register"
            className="w-full sm:w-auto rounded-md bg-indigo-600 px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Começar agora
          </Link>
          <Link to="/login" className="w-full sm:w-auto text-sm sm:text-base font-semibold leading-6 text-gray-900 flex items-center justify-center">
            <span>Entrar</span> 
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative p-6 sm:p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-lg mb-4 sm:mb-6">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Insights de Personalidade</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Obtenha insights profundos sobre traços de personalidade usando avaliações DISC e HEXACO.
          </p>
        </div>

        <div className="relative p-6 sm:p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-lg mb-4 sm:mb-6">
            <LineChart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Análises Detalhadas</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Relatórios completos com insights acionáveis e recomendações de desenvolvimento.
          </p>
        </div>

        <div className="relative p-6 sm:p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-lg mb-4 sm:mb-6">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Desenvolvimento de Equipe</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Construa equipes mais fortes entendendo as forças e dinâmicas individuais.
          </p>
        </div>
      </div>

      {/* Call to action for mobile */}
      <div className="mt-10 sm:hidden text-center">
        <Link 
          to="/register"
          className="inline-block w-full rounded-md bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Começar agora
        </Link>
      </div>
    </div>
  )
}