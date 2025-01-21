import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Alert
} from '@mui/material'
import { supabase } from '../lib/supabase'

interface UserRoleDialogProps {
  open: boolean
  onClose: () => void
  user: any
  onSuccess: () => void
}

export function UserRoleDialog({ open, onClose, user, onSuccess }: UserRoleDialogProps) {
  const [role, setRole] = useState(user?.role || 'user')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error updating user role:', err)
      setError('Error updating user role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Manage Admin Access</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            User: {user.full_name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Email: {user.email}
          </Typography>

          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <RadioGroup
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <FormControlLabel
                value="user"
                control={<Radio />}
                label="Regular User"
              />
              <FormControlLabel
                value="admin"
                control={<Radio />}
                label="Admin"
              />
            </RadioGroup>
          </FormControl>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color={role === 'admin' ? 'error' : 'primary'}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}