import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Eye, EyeOff, CheckCircle, XCircle, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    hasLetter: false,
    hasNumber: false,
    hasSpecial: false
  })
  const [resetSuccess, setResetSuccess] = useState(false)
  const navigate = useNavigate()

  // Check for hash param in the URL coming from Supabase auth link
  useEffect(() => {
    const handleHashChange = async () => {
      // Handle the hash from the URL - Supabase auth puts the token here
      const hash = window.location.hash
      if (hash && hash.includes('type=recovery')) {
        console.log('Recovery hash detected')
        // We don't need to do anything specific here as Supabase handles the token
      }
    }

    handleHashChange()
    
    // Listen for hash changes (though not typically needed for password reset flow)
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  // Validate password as user types
  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }, [password])

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return false
    }
    
    if (!passwordValidation.length || !passwordValidation.hasLetter || 
        !passwordValidation.hasNumber || !passwordValidation.hasSpecial) {
      setError('A senha não atende aos requisitos mínimos de segurança.')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswords()) {
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password
      })
      
      if (error) throw error
      
      // Show success state
      setResetSuccess(true)
      toast.success('Senha atualizada com sucesso!')
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      console.error('Error resetting password:', err)
      setError(
        err.message === 'Invalid login credentials'
          ? 'O link de recuperação expirou ou é inválido. Por favor, solicite um novo link.'
          : 'Ocorreu um erro ao redefinir sua senha. Por favor, tente novamente.'
      )
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
          {resetSuccess ? 'Senha redefinida!' : 'Criar nova senha'}
        </h2>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-6 sm:py-8 shadow sm:rounded-lg sm:px-10">
          {resetSuccess ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-700">
                Sua senha foi redefinida com sucesso! Você será redirecionado para a página de login em instantes.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Ir para o login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Nova senha
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirme a nova senha
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Requisitos de senha</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc space-y-1 pl-5">
                        <li className={passwordValidation.length ? 'text-green-600' : ''}>
                          Mínimo de 8 caracteres
                          {passwordValidation.length && <CheckCircle className="inline-block w-4 h-4 ml-1" />}
                        </li>
                        <li className={passwordValidation.hasLetter ? 'text-green-600' : ''}>
                          Pelo menos uma letra
                          {passwordValidation.hasLetter && <CheckCircle className="inline-block w-4 h-4 ml-1" />}
                        </li>
                        <li className={passwordValidation.hasNumber ? 'text-green-600' : ''}>
                          Pelo menos um número
                          {passwordValidation.hasNumber && <CheckCircle className="inline-block w-4 h-4 ml-1" />}
                        </li>
                        <li className={passwordValidation.hasSpecial ? 'text-green-600' : ''}>
                          Pelo menos um caractere especial
                          {passwordValidation.hasSpecial && <CheckCircle className="inline-block w-4 h-4 ml-1" />}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Erro</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Redefinindo...' : 'Redefinir senha'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}