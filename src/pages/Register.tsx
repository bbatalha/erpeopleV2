import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Brain, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

export function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [linkedinError, setLinkedinError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const validateLinkedinUrl = (url: string) => {
    if (!url) {
      setLinkedinError('LinkedIn URL é obrigatória')
      return false
    }
    
    // Ensure URL starts with https://www.linkedin.com/ or https://linkedin.com/
    if (!url.match(/^https:\/\/(www\.)?linkedin\.com\//)) {
      setLinkedinError('URL deve começar com https://www.linkedin.com/ ou https://linkedin.com/')
      return false
    }
    
    if (url.length > 255) {
      setLinkedinError('URL muito longa')
      return false
    }
    
    // Ensure URL doesn't end with / or whitespace
    if (url.match(/\/\s*$/)) {
      setLinkedinError('URL não deve terminar com / ou espaço')
      return false
    }
    
    setLinkedinError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')

      // Validate all required fields
      if (!email || !password || !fullName || !linkedinUrl) {
        setError('Todos os campos são obrigatórios')
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(email)) {
        setError('Formato de e-mail inválido')
        setLoading(false)
        return
      }

      // Validate password length
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        setLoading(false)
        return
      }

      if (!validateLinkedinUrl(linkedinUrl)) {
        setLoading(false)
        return
      }

      // Sanitize LinkedIn URL
      const sanitizedUrl = linkedinUrl.trim().replace(/\/+$/, '')

      try {
        await signUp(email, password, fullName, sanitizedUrl)
        setError('')
        
        // Show success message
        toast.success('Registro realizado com sucesso! Configurando seu perfil...')
        navigate('/dashboard')
      } catch (err: any) {
        console.error('Registration error:', err)
        
        if (err.message?.includes('Database error')) {
          setError('Erro ao criar usuário. Por favor, tente novamente.')
        } else if (err.message?.includes('User already registered')) {
          setError('Este e-mail já está registrado')
        } else {
          setError(`Falha ao criar conta: ${err.message || 'Erro desconhecido'}`)
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Erro inesperado. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600" />
        </div>
        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Crie sua conta
        </h2>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-6 sm:py-8 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-3 sm:p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
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
              />
            </div>

            <div>
              <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700">
                LinkedIn URL
              </label>
              <input
                id="linkedinUrl"
                type="url"
                required
                value={linkedinUrl}
                onChange={(e) => {
                  setLinkedinUrl(e.target.value)
                  validateLinkedinUrl(e.target.value)
                }}
                placeholder="https://www.linkedin.com/in/seu-perfil"
                className={`mt-1 block w-full rounded-md border ${linkedinError ? 'border-red-300' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
              />
              {linkedinError && (
                <p className="mt-1 text-sm text-red-600">{linkedinError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Exemplo: https://www.linkedin.com/in/seu-perfil
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
                <span className="text-xs text-gray-500 ml-1">(mínimo 6 caracteres)</span>
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Entre aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}