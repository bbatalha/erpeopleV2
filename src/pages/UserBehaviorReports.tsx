import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Download, Brain, Search } from 'lucide-react'
import { BehaviorReport } from '../components/BehaviorReport'

export function UserBehaviorReports() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchReports() {
      if (!userId) return
      
      setLoading(true)
      try {
        // Fetch user profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single()

        if (profileError) throw profileError
        setUserName(profile?.full_name || '')

        // Fetch behavior reports
        const { data, error } = await supabase
          .from('assessment_results')
          .select(`
            *,
            assessment_responses!inner (
              responses,
              completed_at,
              assessments!inner (
                type,
                title
              )
            )
          `)
          .eq('user_id', userId)
          .eq('assessment_responses.assessments.type', 'behavior')
          .order('created_at', { ascending: false })

        if (error) throw error
        setReports(data || [])
      } catch (err) {
        console.error('Error fetching behavior reports:', err)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
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
              
              return (
                <div key={report.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-900 font-medium">
                        Submitted on {date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
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
                      results={report.results}
                      timeStats={report.assessment_responses?.responses?.timeStats}
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