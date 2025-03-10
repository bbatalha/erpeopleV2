import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Brain, Search, Sparkles, AlertCircle } from 'lucide-react'
import { BehaviorReport } from '../components/BehaviorReport'
import { toast } from 'react-hot-toast'
import { getUserBehaviorReports } from '../services/reportService'

export function UserBehaviorReports() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    async function fetchReports() {
      if (!userId) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Use the service function to get cached reports
        const reportData = await getUserBehaviorReports(userId);
        
        // Log success
        console.log(`Retrieved ${reportData.length} behavior reports from database`);
        
        // Extract user profile name
        if (reportData.length > 0 && reportData[0].assessment_responses) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();
            
          if (profile) {
            setUserName(profile.full_name || '');
          }
        }
        
        setReports(reportData);
      } catch (err) {
        console.error('Error fetching behavior reports:', err);
        setError('Failed to load behavior reports. Please try again.');
        
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchReports(), 1500); // Retry after 1.5s
        }
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [userId])

  const filteredReports = reports.filter(report => {
    const date = new Date(report.created_at).toLocaleDateString()
    const searchString = `${date}`.toLowerCase()
    return searchString.includes(searchTerm.toLowerCase())
  })

  const handleExport = (reportId: string) => {
    navigate(`/results/${reportId}?action=download`)
  }

  const handleRetry = () => {
    setRetryCount(0);
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 rounded-lg">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h3 className="font-medium text-lg">Error Loading Reports</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex space-x-4">
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Admin Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={() => navigate('/admin')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">
          Behavior Reports: {userName}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">Total Reports: {reports.length}</h2>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reports..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
              No behavior reports found
            </div>
        ) : (
          <div className="space-y-6">
            {filteredReports.map((report) => {
              const date = new Date(report.created_at)
              const hasAiAnalysis = !!report.ai_analysis;
              
              return (
                <div key={report.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-900 font-medium">
                          Submitted on {date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {hasAiAnalysis && (
                          <span className="inline-flex items-center bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Analysis
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => navigate(`/results/${report.id}`)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleExport(report.id)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <BehaviorReport
                      userName={userName}
                      resultId={report.id}
                      results={{
                        traits: report.results?.traits || {},
                        frequencies: report.results?.frequencies || {},
                        timeStats: report.results?.timeStats,
                        aiAnalysis: report.ai_analysis
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

// Import needed at the end to prevent circular dependencies
import { supabase } from '../lib/supabase';