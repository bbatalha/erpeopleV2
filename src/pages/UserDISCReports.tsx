import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Brain, Download } from 'lucide-react'
import { DISCBarChart } from '../components/DISCBarChart'
import { calculateDISCResults } from '../utils/discCalculator'
import { Box, Paper, Typography, Button, Stack, Divider } from '@mui/material'

export function UserDISCReports() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

        // Fetch DISC reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('assessment_results')
          .select(`
            *,
            assessment_responses (
              responses,
              completed_at,
              assessments!inner (
                type
              ),
              status
            )
          `)
          .eq('user_id', userId)
          .eq('assessment_responses.assessments.type', 'disc')
          .eq('assessment_responses.status', 'completed')
          .order('created_at', { ascending: false })

        if (reportsError) throw reportsError

        // Filter out any results without valid DISC data
        const validReports = reportsData?.filter(report => 
          report.assessment_responses?.responses?.answers &&
          Object.keys(report.assessment_responses.responses.answers).length > 0
        ) || []

        setReports(validReports)
      } catch (error) {
        console.error('Error fetching reports:', error)
        setError(error.message)
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
          Relatórios DISC - {user?.full_name}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/admin')}
        >
          Back to Admin
        </Button>
      </Stack>

      {reports.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <Typography color="text.secondary">
            {error || 'Nenhuma avaliação DISC concluída encontrada para este usuário'}
          </Typography>
          <Button
            variant="text"
            sx={{ mt: 2 }}
            onClick={() => navigate('/admin')}
          >
            Voltar para o Painel Administrativo
          </Button>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {reports.map((report) => {
            const discResults = calculateDISCResults(
              report.assessment_responses?.responses?.answers || {}
            )
            
            return (
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
                      variant="contained"
                      color="primary"
                      disabled={downloadingId === report.id}
                      startIcon={<Download />}
                      onClick={() => {
                        setDownloadingId(report.id)
                        navigate(`/results/${report.id}?action=download`)
                      }}
                    >
                      {downloadingId === report.id ? 'Baixando...' : 'Baixar Relatório'}
                    </Button>
                  </Stack>

                  <Divider />

                  <Box sx={{ height: 300, mt: 2, width: '100%' }}>
                    <DISCBarChart scores={discResults.scores} />
                  </Box>

                  <Stack direction="row" spacing={2} mt={2}>
                    <Typography>
                      <strong>Perfil Primário:</strong>{' '}
                      {discResults.primaryProfile === 'D' ? 'Dominância' :
                       discResults.primaryProfile === 'I' ? 'Influência' :
                       discResults.primaryProfile === 'S' ? 'Estabilidade' :
                       'Conformidade'}
                    </Typography>
                    <Typography>
                      <strong>Perfil Secundário:</strong>{' '}
                      {discResults.secondaryProfile === 'D' ? 'Dominância' :
                       discResults.secondaryProfile === 'I' ? 'Influência' :
                       discResults.secondaryProfile === 'S' ? 'Estabilidade' :
                       'Conformidade'}
                    </Typography>
                  </Stack>
                  <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => {
                      // Ensure we're viewing a DISC report
                      if (report.assessment_responses?.assessments?.type === 'disc') {
                        navigate(`/results/${report.id}?type=disc`)
                      }
                    }}
                  >
                    Ver Relatório Completo
                  </Button>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}