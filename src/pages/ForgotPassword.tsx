import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, ArrowLeft, Mail, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Email validation
    if (!email || !email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
      setError('Por favor, insira um endereço de e-mail válido.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await resetPassword(email)
      setEmailSent(true)
      toast.success('Email de recuperação enviado com sucesso!', {
        duration: 5000,
      })
    } catch (err: any) {
      console.error('Error sending reset password email:', err)
      
      // Use a generic error message for security
      setError(
        'Não foi possível enviar o email de recuperação. Por favor, verifique o endereço de email e tente novamente mais tarde.'
      )
      
      // Show more detailed toast for debugging
      toast.error('Erro ao enviar email de recuperação', {
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600" />
        </div>
        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          {emailSent ? 'Email enviado!' : 'Recuperar senha'}
        </h2>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-6 sm:py-8 shadow sm:rounded-lg sm:px-10">
          {emailSent ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-3">
                <p className="text-gray-700">
                  Enviamos um email com instruções para redefinir sua senha para:
                </p>
                <p className="font-medium text-gray-900">{email}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Se você não receber o email em alguns minutos, verifique sua pasta de spam ou tente novamente.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Insira seu endereço de e-mail abaixo e enviaremos um link para redefinir sua senha.
                </p>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="seu@email.com"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:justify-between items-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Voltar para o login
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar email de recuperação'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}