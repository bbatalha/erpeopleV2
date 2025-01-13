import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Stack,
  CircularProgress,
  Box,
  Typography
} from '@mui/material'
import { supabase } from '../lib/supabase'

interface UserEditDialogProps {
  open: boolean
  onClose: () => void
  userId: string
  onSuccess: () => void
}

export function UserEditDialog({ open, onClose, userId, onSuccess }: UserEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    linkedinUrl: ''
  })
  const [formErrors, setFormErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    linkedinUrl: ''
  })

  useEffect(() => {
    async function fetchUserData() {
      if (!userId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, linkedin_url')
          .eq('id', userId)
          .single()

        if (error) throw error

        setFormData({
          fullName: data.full_name || '',
          email: data.email || '',
          password: '',
          linkedinUrl: data.linkedin_url || ''
        })
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Erro ao carregar dados do usuário')
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchUserData()
    }
  }, [userId, open])

  const validateForm = () => {
    const errors = {
      fullName: '',
      email: '',
      password: '',
      linkedinUrl: ''
    }
    let isValid = true

    // Validate full name
    if (formData.fullName.length < 3) {
      errors.fullName = 'Nome deve ter pelo menos 3 caracteres'
      isValid = false
    }

    // Validate email
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Email inválido'
      isValid = false
    }

    // Validate password if provided
    if (formData.password && formData.password.length > 0) {
      if (formData.password.length < 8) {
        errors.password = 'Senha deve ter pelo menos 8 caracteres'
        isValid = false
      } else if (!/(?=.*[0-9])(?=.*[!@#$%^&*])/.test(formData.password)) {
        errors.password = 'Senha deve conter números e caracteres especiais'
        isValid = false
      }
    }

    // Validate LinkedIn URL
    if (formData.linkedinUrl) {
      if (!formData.linkedinUrl.startsWith('https://www.linkedin.com/')) {
        errors.linkedinUrl = 'URL deve começar com https://www.linkedin.com/'
        isValid = false
      }
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    // If nothing has changed, just close the dialog
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('full_name, email, linkedin_url')
      .eq('id', userId)
      .single()

    if (
      currentUser &&
      currentUser.full_name === formData.fullName &&
      currentUser.email === formData.email &&
      currentUser.linkedin_url === formData.linkedinUrl &&
      !formData.password
    ) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Only check for email existence if it was changed
      if (currentUser && currentUser.email !== formData.email) {
        const { data: existingUser, error: emailCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.email)
          .neq('id', userId)
          .maybeSingle()

        if (emailCheckError) throw emailCheckError
        
        if (existingUser) {
          setError('Este email já está em uso por outro usuário')
          setSaving(false)
          return
        }

        // Update auth email first
        const { error: emailUpdateError } = await supabase.auth
          .updateUser({ email: formData.email })

        if (emailUpdateError) {
          if (emailUpdateError.message.includes('email_exists')) {
            setError('Este email já está em uso por outro usuário')
            setSaving(false)
            return
          }
          throw emailUpdateError
        }
      }

      // Update profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          email: formData.email,
          linkedin_url: formData.linkedinUrl.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) throw updateError

      // Update password if provided
      if (formData.password) {
        const { error: passwordError } = await supabase.auth
          .updateUser({ password: formData.password })

        if (passwordError) throw passwordError
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error updating user:', err.message)
      setError(
        err.message === 'Email change requires re-authentication'
          ? 'Alteração de email requer re-autenticação'
          : err.message === 'email_exists'
          ? 'Este email já está em uso por outro usuário'
          : 'Erro ao atualizar usuário. Por favor, tente novamente.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Usuário</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Nome Completo"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            error={!!formErrors.fullName}
            helperText={formErrors.fullName}
            required
            fullWidth
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!formErrors.email}
            helperText={formErrors.email}
            required
            fullWidth
          />

          <TextField
            label="Nova Senha (opcional)"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={!!formErrors.password}
            helperText={
              formErrors.password || 
              'Deixe em branco para manter a senha atual. Mínimo 8 caracteres, incluindo números e caracteres especiais.'
            }
            fullWidth
          />

          <TextField
            label="LinkedIn URL"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            error={!!formErrors.linkedinUrl}
            helperText={formErrors.linkedinUrl || 'Ex: https://www.linkedin.com/in/seu-perfil'}
            required
            fullWidth
          />

          <Typography variant="caption" color="text.secondary">
            * Campos obrigatórios
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving && <CircularProgress size={20} />}
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}