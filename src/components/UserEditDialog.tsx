import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack
} from '@mui/material'
import { supabase } from '../lib/supabase'

interface UserEditDialogProps {
  open: boolean
  onClose: () => void
  userId: string
  onSuccess: () => void
}

export function UserEditDialog({ open, onClose, userId, onSuccess }: UserEditDialogProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && userId) {
      fetchUser()
    }
  }, [open, userId])

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setFullName(data.full_name || '')
        setEmail(data.email || '')
        setLinkedinUrl(data.linkedin_url || '')
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email,
          linkedin_url: linkedinUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error updating user:', err)
      setError('Error updating user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="LinkedIn URL"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              fullWidth
              required
              placeholder="https://www.linkedin.com/in/username"
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}