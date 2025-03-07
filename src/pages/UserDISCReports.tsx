import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Brain, Download, ArrowLeft, Search } from 'lucide-react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Pagination
} from '@mui/material'
import { DISCBarChart } from '../components/DISCBarChart'
import { calculateDISCResults } from '../utils/discCalculator'

export function UserDISCReports() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const reportsPerPage = 5

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

        // Fetch DISC reports
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
          .eq('assessment_responses.assessments.type', 'disc')
          .order('created_at', { ascending: false })

        if (error) throw error
        setReports(data || [])
        setTotalPages(Math.ceil((data?.length || 0) / reportsPerPage))
      } catch (err) {
        console.error('Error fetching DISC reports:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [userId])

  const filteredReports = reports.filter(report => {
    const date = new Date(report.created_at).toLocaleDateString()
    const scores = calculateDISCResults(report.assessment_responses?.responses?.answers || {})
    const searchString = `${date} ${scores.primaryProfile} ${scores.secondaryProfile}`.toLowerCase()
    return searchString.includes(searchTerm.toLowerCase())
  })

  const paginatedReports = filteredReports.slice(
    (page - 1) * reportsPerPage,
    page * reportsPerPage
  )

  const handleExport = (reportId: string) => {
    navigate(`/results/${reportId}?action=download`)
  }

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-[60vh]">
        <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <IconButton onClick={() => navigate('/admin')} color="inherit">
          <ArrowLeft />
        </IconButton>
        <Typography variant="h4">
          DISC Reports: {userName}
        </Typography>
      </Stack>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Total Reports: {reports.length}
          </Typography>
          <TextField
            size="small"
            placeholder="Search reports..."
            InputProps={{
              startAdornment: <Search className="w-4 h-4 text-gray-400 mr-2" />
            }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Stack>

        {paginatedReports.length === 0 ? (
          <Alert severity="info">No DISC reports found</Alert>
        ) : (
          <Stack spacing={3}>
            {paginatedReports.map((report) => {
              const scores = calculateDISCResults(report.assessment_responses?.responses?.answers || {})
              const date = new Date(report.created_at)
              
              return (
                <Paper key={report.id} elevation={0} sx={{ p: 3, bgcolor: 'rgb(235, 244, 255)' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                    <div>
                      <Typography variant="subtitle1" gutterBottom>
                        Submitted on {date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                      <Stack direction="row" spacing={1} mb={2}>
                        <Chip
                          label={`Primary: ${scores.primaryProfile}`}
                          color="primary"
                          size="small"
                        />
                        <Chip
                          label={`Secondary: ${scores.secondaryProfile}`}
                          color="secondary"
                          size="small"
                        />
                      </Stack>
                    </div>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => navigate(`/results/${report.id}`)}
                      >
                        View Details
                      </Button>
                      <Tooltip title="Download Report">
                        <IconButton
                          size="small"
                          onClick={() => handleExport(report.id)}
                        >
                          <Download className="w-4 h-4" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <Box sx={{ height: 300, bgcolor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <DISCBarChart scores={scores.scores} />
                  </Box>
                </Paper>
              )
            })}
          </Stack>
        )}

        {totalPages > 1 && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Box>
  )
}