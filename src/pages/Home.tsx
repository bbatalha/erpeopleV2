import React from 'react'
import { Link } from 'react-router-dom'
import { Brain, LineChart, Users } from 'lucide-react'

export function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Libere o Potencial da sua Equipe
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Descubra insights sobre traços de personalidade e dinâmica de equipe com nossa plataforma completa de avaliação.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/register"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Começar agora
          </Link>
          <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900">
            Entrar <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-gray-900">Insights de Personalidade</h3>
          <p className="mt-2 text-gray-600">
            Obtenha insights profundos sobre traços de personalidade usando avaliações DISC e HEXACO.
          </p>
        </div>

        <div className="relative p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-lg">
            <LineChart className="w-8 h-8 text-white" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-gray-900">Análises Detalhadas</h3>
          <p className="mt-2 text-gray-600">
            Relatórios completos com insights acionáveis e recomendações de desenvolvimento.
          </p>
        </div>

        <div className="relative p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-gray-900">Desenvolvimento de Equipe</h3>
          <p className="mt-2 text-gray-600">
            Construa equipes mais fortes entendendo as forças e dinâmicas individuais.
          </p>
        </div>
      </div>
    </div>
  )
}