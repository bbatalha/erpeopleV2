import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Brain, Download } from 'lucide-react'
import { BehaviorTraitSlider } from '../components/BehaviorTraitSlider'
import { traitQuestions } from '../utils/behaviorQuestions'
import { Box, Paper, Typography, Button, Stack, Divider } from '@mui/material'

export function UserBehaviorReports() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function fetchReports() {
      try {
        // First verify admin status
        const { data: adminCheck, error: adminError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single()

        if (adminError || adminCheck?.role !== 'admin') {
          throw new Error('Unauthorized access')
        }

        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (userError) throw userError
        setUser(userData)

        // Fetch behavior reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('assessment_results')
          .select(`
            *,
            assessment_responses (
              responses,
              completed_at,
              assessments (
                type,
                title
              )
            )
          `)
          .eq('user_id', userId)
          .eq('assessment_responses.assessments.type', 'behavior')
          .order('created_at', { ascending: false })

        if (reportsError) throw reportsError
        setReports(reportsData || [])
      } catch (error) {
        console.error('Error fetching reports:', error)
        if (error.message === 'Unauthorized access') {
          navigate('/dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [userId, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Relatórios de Traços Comportamentais - {user?.full_name}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/admin')}
        >
          Voltar para Admin
        </Button>
      </Stack>

      {reports.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Nenhuma avaliação comportamental concluída ainda
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {reports.map((report) => (
            <Paper key={report.id} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6">
                    Avaliação de{' '}
                    {new Date(report.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                  <Button
                    startIcon={<Download />}
                    onClick={() => navigate(`/results/${report.id}?action=download`)}
                  >
                    Baixar Relatório
                  </Button>
                </Stack>

                <Divider />

                <Box sx={{ mt: 2 }}>
                  {traitQuestions.slice(0, 5).map((question) => (
                    <Box key={question.id} sx={{ mb: 3 }}>
                      <BehaviorTraitSlider
                        leftTrait={question.leftTrait!}
                        rightTrait={question.rightTrait!}
                        value={report.results?.traits?.[question.id] || 3}
                        readOnly
                      />
                    </Box>
                  ))}
                  {report.results?.traits && Object.keys(report.results.traits).length > 5 && (
                    <Button
                      onClick={() => navigate(`/results/${report.id}`)}
                      variant="text"
                    >
                      Ver Relatório Completo
                    </Button>
                  )}
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  )
}