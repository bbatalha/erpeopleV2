import React, { useState, useEffect } from 'react'
import { Briefcase, MapPin, Mail, Linkedin, Building, Users, Calendar, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchLinkedInProfile, updateUserProfile } from '../lib/linkedinProfileFetcher'

export function Profile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    }

    fetchProfile()
  }, [user])

  const handleUpdateLinkedIn = async () => {
    if (!user || !profile?.linkedin_url) return
    
    setLoading(true)
    setError('')
    setUpdateSuccess(false)

    try {
      // Show loading message
      const loadingMessage = document.createElement('div')
      loadingMessage.className = 'fixed bottom-4 right-4 bg-blue-50 text-blue-800 p-4 rounded-lg shadow-lg'
      loadingMessage.innerHTML = 'Updating profile with LinkedIn data...'
      document.body.appendChild(loadingMessage)

      const linkedInData = await fetchLinkedInProfile(profile.linkedin_url)
      if (!linkedInData) {
        setError('Failed to fetch LinkedIn data. Please try again.')
        return
      }

      // Remove loading message
      loadingMessage.remove()

      const success = await updateUserProfile(user.id, {
        ...linkedInData,
        linkedin_url: profile.linkedin_url // Preserve existing LinkedIn URL
      })

      if (!success) {
        setError('Failed to update profile. Please try again.')
        return
      }

      // Fetch updated profile data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      if (updatedProfile) {
        setProfile(updatedProfile)
        setUpdateSuccess(true)
        
        // Show success message
        const successMessage = document.createElement('div')
        successMessage.className = 'fixed bottom-4 right-4 bg-green-50 text-green-800 p-4 rounded-lg shadow-lg'
        successMessage.innerHTML = `
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Profile updated successfully!</span>
          </div>
        `
        document.body.appendChild(successMessage)
        setTimeout(() => successMessage.remove(), 3000)

        // Trigger a re-render of profile sections
        const event = new CustomEvent('profileUpdated', { detail: updatedProfile })
        window.dispatchEvent(event)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent<any>) => {
      setProfile(event.detail)
    }

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener)
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener)
    }
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <img
            src={profile?.profile_image_url || 'https://via.placeholder.com/128'}
            alt={profile?.full_name}
            className="w-32 h-32 rounded-full object-cover"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile?.full_name}</h1>
            <h2 className="text-xl text-gray-700 mb-4">{profile?.headline}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{profile?.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Building className="w-5 h-5 mr-2" />
              <span>{profile?.experiences?.[0]?.company}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 min-w-[200px]">
            <a
              href={profile?.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              Connect on LinkedIn
            </a>
            <button
              onClick={handleUpdateLinkedIn}
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors
                ${loading
                  ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                  : updateSuccess
                    ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
            >
              <RefreshCw 
                className={`w-4 h-4 mr-2 transition-all
                  ${loading ? 'animate-spin' : ''}
                  ${updateSuccess ? 'text-green-600' : ''}`}
              />
              {loading ? 'Updating...' : 'Update LinkedIn'}
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
          {profile?.about}
        </p>
      </div>

      {/* Skills Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {(profile?.skills || []).map((skill: string) => (
            <span
              key={skill}
              className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Company Overview */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Overview</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <Building className="w-5 h-5 text-gray-400 mt-1 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">{profile?.experiences?.[0]?.company}</h3>
              <p className="text-gray-600">IT Services and IT Consulting</p>
            </div>
          </div>
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-400 mr-3" />
            <span className="text-gray-600">201-500 employees</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-3" />
            <span className="text-gray-600">Founded in 2007</span>
          </div>
          <div className="mt-4">
            <a
              href={profile?.experiences?.[0]?.company_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Visit website →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}