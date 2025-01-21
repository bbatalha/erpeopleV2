import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Users, FileText, Search, Download, Trash2, Edit, TrendingUp, TrendingDown, Minus, BarChart2, Brain, Shield, Settings, Activity } from 'lucide-react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Stack,
  Divider,
  Grid
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { UserEditDialog } from '../components/UserEditDialog'
import { UserRoleDialog } from '../components/UserRoleDialog'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { calculateDISCResults } from '../utils/discCalculator'

interface Stats {
  totalUsers: number;
  totalAssessments: number;
}

export function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: '' })
  const [userDetailsDialog, setUserDetailsDialog] = useState({ open: false, user: null })
  const [editDialog, setEditDialog] = useState({ open: false, userId: '' })
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null })
  const [fetchUsers, setFetchUsers] = useState(0)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAssessments: 0
  })

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        // Get total users and assessments in parallel
        const [usersResult, assessmentsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, role'),
          supabase
            .from('assessment_responses')
            .select(`
              id,
              status,
              user_id,
              assessments!inner (
                type
              )
            `)
            .eq('status', 'completed')
        ])

        if (usersResult.error) throw usersResult.error
        if (assessmentsResult.error) throw assessmentsResult.error

        setStats({
          totalUsers: usersResult.data?.length || 0,
          totalAssessments: assessmentsResult.data?.length || 0
        })

        console.log('Total assessments:', assessmentsResult.data?.length)
        console.log('Assessment data:', assessmentsResult.data)
      } catch (error) {
        console.error('Error fetching stats:', error)
        setStats({
          totalUsers: 0,
          totalAssessments: 0
        })
      }
    }

    fetchStats()
  }, [fetchUsers])

  useEffect(() => {
    async function fetchUsers() {
      if (!user) return
      
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            assessment_responses (
              id,
              status,
              created_at,
              assessments!inner (
                type,
                title
              )
            )
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        console.log('Users with assessments:', data)
        setUsers(data || [])
      } catch (err) {
        console.error('Error fetching users:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [user, fetchUsers])

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      setUsers(prev => prev.filter(u => u.id !== userId))
      showSnackbar('User deleted successfully', 'success')
    } catch (err) {
      console.error('Error deleting user:', err)
      showSnackbar('Error deleting user', 'error')
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    })
  }

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'full_name',
      headerName: 'Nome',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === 'admin' ? 'Admin' : 'User'}
          color={params.value === 'admin' ? 'error' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) => 
        new Date(params.value).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 380,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Stack 
          direction="row" 
          spacing={1} 
          alignItems="center"
          justifyContent="center"
          sx={{ width: '100%' }}
        >
          <Tooltip title="Edit User">
            <IconButton
              size="small"
              onClick={() => setEditDialog({ open: true, userId: params.row.id })}
            >
              <Edit className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Manage Admin Access">
            <IconButton
              size="small"
              aria-label="Gerenciar Acesso Admin"
              onClick={() => setRoleDialog({ open: true, user: params.row })}
            >
              <Shield className={params.row.role === 'admin' ? 'text-red-600' : 'text-gray-400'} />
            </IconButton>
          </Tooltip>
          <Tooltip title="DISC Reports">
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/users/${params.row.id}/disc-reports`)}
            >
              <Brain className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Behavior Reports">
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/users/${params.row.id}/behavior-reports`)}
            >
              <Activity className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="DISC Reports">
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/users/${params.row.id}/disc-reports`)}
            >
              <Brain className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Behavior Reports">
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/users/${params.row.id}/behavior-reports`)}
            >
              <Activity className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="DISC Reports">
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/users/${params.row.id}/disc-reports`)}
            >
              <Brain className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Behavior Reports">
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/users/${params.row.id}/behavior-reports`)}
            >
              <Activity className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete User">
            <IconButton
              size="small"
              onClick={() => setDeleteDialog({ open: true, userId: params.row.id })}
            >
              <Trash2 className="w-4 h-4" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [])

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
      </Stack>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Users className="w-8 h-8 text-indigo-600" />
                <Box>
                  <Typography variant="h6">{stats.totalUsers}</Typography>
                  <Typography color="text.secondary">Total Users</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Brain className="w-8 h-8 text-indigo-600" />
                <Box>
                  <Typography variant="h6">{stats.totalAssessments}</Typography>
                  <Typography color="text.secondary">Completed Assessments</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Users</Typography>
            <TextField
              size="small"
              placeholder="Search users..."
              InputProps={{
                startAdornment: <Search className="w-4 h-4 text-gray-400 mr-2" />
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Stack>
        </Box>
        <DataGrid
          rows={users}
          columns={columns}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 25]}
          checkboxSelection
          disableSelectionOnClick
          autoHeight
          loading={loading}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          onPageChange={(newPage) => setPage(newPage)}
          components={{
            Toolbar: () => null
          }}
        />
      </Paper>

      <UserEditDialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, userId: '' })}
        userId={editDialog.userId}
        onSuccess={() => {
          showSnackbar('User updated successfully')
          setFetchUsers(prev => prev + 1)
        }}
      />

      <UserRoleDialog
        open={roleDialog.open}
        onClose={() => setRoleDialog({ open: false, user: null })}
        user={roleDialog.user}
        onSuccess={() => {
          showSnackbar('Permissions updated successfully')
          setFetchUsers(prev => prev + 1)
        }}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, userId: '' })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this user?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, userId: '' })}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleDeleteUser(deleteDialog.userId)
              setDeleteDialog({ open: false, userId: '' })
            }}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity as 'success' | 'error'}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}