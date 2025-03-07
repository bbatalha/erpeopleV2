import { supabase } from './supabase'

interface LinkedInProfile {
  full_name: string
  profile_image_url: string | null
  headline: string | null
  location: string | null
  about: string | null
  experiences: Array<{
    title: string
    company: string
    company_logo_url: string | null
    date_range: string
    description: string | null
  }>
  education: Array<{
    degree: string
    school: string
    field_of_study: string
    date_range: string
  }>
  skills: string[]
}

export async function fetchLinkedInProfile(linkedinUrl: string): Promise<LinkedInProfile | null> {
  try {
    if (!linkedinUrl) {
      console.warn('LinkedIn URL is required', { linkedinUrl })
      return null
    }

    // Validate URL format
    if (!linkedinUrl.match(/^https:\/\/(www\.)?linkedin\.com\/.+/)) {
      console.warn('Invalid LinkedIn URL format', { linkedinUrl })
      return null
    }

    // Add timeout to fetch request
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000) // Increase timeout to 60s

    try {
      // Show loading state
      const loadingMessage = document.createElement('div')
      loadingMessage.className = 'fixed bottom-4 right-4 bg-blue-50 text-blue-800 p-4 rounded-lg shadow-lg z-50'
      loadingMessage.innerHTML = 'Fetching LinkedIn profile data...'
      document.body.appendChild(loadingMessage)

      console.info('Fetching LinkedIn data for URL:', linkedinUrl)

      const response = await fetch('https://hook.us2.make.com/co07l2dmk5hr92mw7nhm8cz3s02xeew0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ 
          linkedin_url: linkedinUrl.trim() 
        }),
        signal: controller.signal
      })

      clearTimeout(timeout)
      loadingMessage.remove()

      if (!response.ok) {
        console.warn('Failed to fetch LinkedIn profile:', { status: response.status, statusText: response.statusText })
        return null
      }

      const data = await response.json()
      console.info('LinkedIn API response received')
      
      // Strict validation of response data
      if (!data || typeof data !== 'object') {
        console.warn('LinkedIn API error: Invalid response data format', { data })
        return null
      }

      // Handle nested data structure
      const profileData = data.data?.data || data

      // Extract data with fallbacks for all fields
      const profile: LinkedInProfile = {
        full_name: profileData.full_name?.trim() || '',
        profile_image_url: profileData.profile_image_url || null,
        headline: profileData.headline || null,
        location: profileData.location || null,
        about: profileData.about || null,
        experiences: Array.isArray(profileData.experiences) ? profileData.experiences.map(exp => ({
          title: exp.title?.trim() || '',
          company: exp.company?.trim() || '',
          company_logo_url: exp.company_logo_url || null,
          date_range: exp.date_range?.trim() || '',
          description: exp.description || null
        })) : [],
        education: Array.isArray(profileData.educations) ? profileData.educations.map(edu => ({
          degree: edu.degree?.trim() || '',
          school: edu.school?.trim() || '',
          field_of_study: edu.field_of_study?.trim() || '',
          date_range: edu.date_range?.trim() || ''
        })) : [],
        skills: Array.isArray(profileData.skills) ? profileData.skills.filter(skill => typeof skill === 'string' && skill.trim()) : []
      }

      // Validate required fields
      if (!profile.full_name.trim()) {
        console.warn('Failed to fetch profile: Missing required data', { profile })
        return null
      }

      return profile
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.warn('LinkedIn API request timed out', { error: fetchError })
        return null
      }
      console.warn('LinkedIn API error:', { error: fetchError })
      return null
    }
  } catch (error) {
    console.warn('Error fetching LinkedIn profile:', { error })
    return null
  }
}

export async function updateUserProfile(userId: string, profile: LinkedInProfile) {
  try {
    if (!userId) {
      console.warn('Invalid user ID', { userId })
      return false
    }

    if (!profile || !profile.full_name) {
      console.warn('Invalid profile data', { profile })
      return false
    }

    // First, fetch existing profile data
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.warn('Error fetching existing profile:', { error: fetchError })
      return false
    }

    // Merge existing data with new data, preferring existing values for critical fields
    const mergedData = {
      ...existingProfile,
      full_name: profile.full_name?.trim() || existingProfile?.full_name,
      headline: profile.headline,
      location: profile.location,
      about: profile.about,
      profile_image_url: profile.profile_image_url,
      experiences: profile.experiences || [],
      education: profile.education || [],
      skills: profile.skills || [],
      updated_at: new Date().toISOString()
    }

    // Remove any undefined, null, or empty values
    const cleanedData = Object.fromEntries(
      Object.entries(mergedData).filter(([_, v]) => {
        if (Array.isArray(v)) return v.length > 0
        if (typeof v === 'string') return v.trim().length > 0
        return v != null
      })
    )

    const { error: updateError } = await supabase
      .from('profiles')
      .update(cleanedData)
      .match({ id: userId })

    if (updateError) {
      console.warn('Failed to update profile:', { error: updateError, userId })
      return false
    }

    return true
  } catch (error) {
    console.warn('Error updating user profile:', { error })
    return false
  }
}