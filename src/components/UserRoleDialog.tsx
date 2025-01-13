import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  Box,
  CircularProgress
} from '@mui/material'
import { supabase } from '../lib/supabase'

interface UserRoleDialogProps {
  open: boolean
  onClose: () => void
  user: {
    id: string
    full_name: string
    email: string
    role: string
  } | null
  onSuccess: () => void
}

export function UserRoleDialog({ open, onClose, user, onSuccess }: UserRoleDialogProps) {
  const [isAdmin, setIsAdmin] = useState(user?.role === 'admin')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRoleChange = async () => {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      // First verify current user is admin
      const { data: currentUser, error: currentUserError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (currentUserError) throw currentUserError
      if (currentUser.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can modify roles')
      }

      // Prevent removing admin role if it's the last admin
      if (isAdmin && !isAdmin) {
        const { data: adminCount, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'admin')

        if (countError) throw countError
        if (adminCount === 1) {
          throw new Error('Cannot remove last admin user')
        }
      }

      // Update user role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: !isAdmin ? 'admin' : 'user',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setIsAdmin(!isAdmin)
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error updating user role:', err)
      setError(
        err.message === 'Cannot remove last admin user'
          ? 'Não é possível remover o último usuário administrador'
          : 'Erro ao atualizar permissões do usuário'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gerenciar Permissões de Administrador</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="subtitle1" gutterBottom>
            {user.full_name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {user.email}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={!isAdmin}
                onChange={handleRoleChange}
                disabled={saving}
              />
            }
            label={
              <Typography>
                Acesso de Administrador
                <Typography variant="caption" display="block" color="text.secondary">
                  {!isAdmin
                    ? 'Conceder acesso total ao painel administrativo'
                    : 'Remover acesso administrativo'}
                </Typography>
              </Typography>
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleRoleChange}
          variant="contained"
          disabled={saving}
          startIcon={saving && <CircularProgress size={20} />}
        >
          {saving ? 'Salvando...' : 'Confirmar Alteração'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}