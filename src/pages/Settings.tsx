import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Save, AlertTriangle, CheckCircle, KeyRound, GitMerge } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { checkOpenAIAvailability } from '../lib/openai'

export function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('pt-BR')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [openAIAvailable, setOpenAIAvailable] = useState<boolean | null>(null)
  const [checkingApi, setCheckingApi] = useState(false)

  // Check if OpenAI is already configured
  useEffect(() => {
    const checkAPIStatus = async () => {
      setCheckingApi(true);
      try {
        const available = await checkOpenAIAvailability();
        setOpenAIAvailable(available);
      } catch (err) {
        console.error('Error checking OpenAI availability:', err);
        setOpenAIAvailable(false);
      } finally {
        setCheckingApi(false);
      }
    };

    checkAPIStatus();
  }, []);

  // Load user settings from database
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        // First check if settings exist for this user
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        // If settings exist, use them
        if (data && data.length > 0) {
          setEmailNotifications(data[0].email_notifications ?? true);
          setDarkMode(data[0].dark_mode ?? false);
          setLanguage(data[0].language ?? 'pt-BR');
        }
        // Otherwise use defaults (already set in state)
      } catch (err) {
        console.error('Error loading settings:', err);
        // Continue with default settings
      }
    };

    loadSettings();
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Save user preferences to database
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_notifications: emailNotifications,
          dark_mode: darkMode,
          language: language,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
      
      setSuccess(true)
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Erro ao salvar configurações. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleTestOpenAI = async () => {
    setCheckingApi(true);
    try {
      const available = await checkOpenAIAvailability();
      setOpenAIAvailable(available);
      
      if (available) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('OpenAI API is not properly configured. Please check with your administrator.');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error testing OpenAI:', err);
      setError('Error testing OpenAI API connection');
      setTimeout(() => setError(null), 5000);
    } finally {
      setCheckingApi(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>
        
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>Configurações salvas com sucesso!</p>
          </div>
        )}
        
        <form onSubmit={handleSaveSettings}>
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Preferências de Notificação</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="email-notifications"
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-notifications" className="ml-3 text-sm text-gray-700">
                    Receber notificações por e-mail
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-7">
                  Receba atualizações sobre novos recursos, relatórios disponíveis e outras informações importantes.
                </p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Aparência</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="dark-mode"
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="dark-mode" className="ml-3 text-sm text-gray-700">
                    Modo escuro (em breve)
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Idioma</h2>
              <div className="space-y-3">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Integrações</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <GitMerge className="w-5 h-5 text-indigo-600 mr-2" />
                    <h3 className="font-medium text-gray-900">OpenAI API</h3>
                  </div>
                  
                  <div className="flex items-center">
                    {openAIAvailable === true && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="w-2 h-2 mr-1 bg-green-400 rounded-full"></span>
                        Connected
                      </span>
                    )}
                    
                    {openAIAvailable === false && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <span className="w-2 h-2 mr-1 bg-red-400 rounded-full"></span>
                        Not Connected
                      </span>
                    )}
                    
                    {openAIAvailable === null && !checkingApi && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Unknown
                      </span>
                    )}
                    
                    {checkingApi && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="animate-spin h-3 w-3 mr-1 text-blue-600" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Checking...
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  OpenAI integration enables enhanced behavioral analysis and personalized insights.
                </p>
                
                <button
                  type="button"
                  onClick={handleTestOpenAI}
                  disabled={checkingApi}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {checkingApi ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-10">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}