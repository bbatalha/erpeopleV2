import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const redirectTo = `${window.location.origin}/reset-password`

    try {
      // Validate email format first
      if (!email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
        throw new Error('Formato de email inválido')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo
        }
      )

      if (error) {
        throw error
      }

      setMessage({
        type: 'success',
        text: 'Se existe uma conta com este e-mail, você receberá um link para redefinir sua senha em alguns minutos.'
      })
      setEmail('')
    } catch (error) {
      const errorMessage = 
        error.message === 'Email rate limit exceeded' ? 'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.' :
        error.message === 'Unable to validate email address: invalid format' ? 'Formato de email inválido' :
        error.message === 'For security purposes, you can only request this once every 60 seconds' ? 
          'Por segurança, você só pode solicitar isso uma vez a cada 60 segundos' :
        error.message === 'Error sending recovery email' ? 
          'Erro ao enviar email de recuperação. Por favor, verifique se o email está correto e tente novamente.' :
        'Erro ao processar sua solicitação. Por favor, tente novamente.'

      setMessage({
        type: 'error',
        text: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Brain className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Recuperar Senha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Digite seu e-mail para receber um link de recuperação de senha
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {message && (
              <div className={`rounded-md p-4 ${
                message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
                <span className="text-xs text-gray-500 ml-1">
                  (use o email cadastrado na sua conta)
                </span>
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Ou</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col space-y-2">
              <Link
                to="/login"
                className="text-sm text-center font-medium text-indigo-600 hover:text-indigo-500"
              >
                Voltar para o Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}