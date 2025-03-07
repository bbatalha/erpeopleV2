import { supabase } from './supabase'

interface LinkedInEducation {
  activities: string
  date_range: string
  degree: string
  end_month: string
  end_year: number
  field_of_study: string
  school: string
  school_id: string
  school_linkedin_url: string
  school_logo_url: string
  start_month: string
  start_year: number
}

interface LinkedInExperience {
  company: string
  company_id: string
  company_linkedin_url: string
  company_logo_url: string
  date_range: string
  description: string
  duration: string
  end_month: string
  end_year: string
  is_current: boolean
  job_type: string
  location: string
  skills: string
  start_month: number
  start_year: number
  title: string
}

interface LinkedInWebhookData {
  data: {
    about: string
    city: string
    company: string
    company_description: string
    company_domain: string
    company_employee_range: string
    company_industry: string
    company_linkedin_url: string
    company_logo_url: string
    company_website: string
    company_year_founded: number
    connection_count: number
    country: string
    current_company_join_month: number
    current_company_join_year: number
    current_job_duration: string
    educations: LinkedInEducation[]
    email: string
    experiences: LinkedInExperience[]
    first_name: string
    follower_count: number
    full_name: string
    headline: string
    hq_city: string
    hq_country: string
    hq_region: string
    job_title: string
    languages: string
    last_name: string
    linkedin_url: string
    location: string
    phone: string
    profile_id: string
    profile_image_url: string
    public_id: string
    school: string
    state: string
    urn: string
  }
}

export async function handleLinkedInWebhook(webhookData: LinkedInWebhookData) {
  try {
    const { data } = webhookData

    // 1. Update or create company record
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        name: data.company,
        domain: data.company_domain,
        industry: data.company_industry,
        employee_range: data.company_employee_range,
        linkedin_url: data.company_linkedin_url,
        logo_url: data.company_logo_url,
        website: data.company_website,
        year_founded: data.company_year_founded,
        description: data.company_description,
        hq_city: data.hq_city,
        hq_country: data.hq_country,
        hq_region: data.hq_region,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'domain'
      })
      .select()
      .single()

    if (companyError) {
      throw new Error(`Error upserting company: ${companyError.message}`)
    }

    // 2. Update user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: data.full_name,
        linkedin_url: data.linkedin_url,
        profile_image_url: data.profile_image_url,
        headline: data.headline,
        location: data.location,
        languages: data.languages,
        profile_id: data.profile_id,
        public_id: data.public_id,
        urn: data.urn,
        about: data.about,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (profileError) {
      throw new Error(`Error upserting profile: ${profileError.message}`)
    }

    // 3. Process education records
    const educationPromises = data.educations.map(edu => 
      supabase
        .from('education')
        .upsert({
          user_id: profile.id,
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          school: edu.school,
          school_linkedin_url: edu.school_linkedin_url,
          school_logo_url: edu.school_logo_url,
          date_range: edu.date_range,
          start_month: edu.start_month,
          start_year: edu.start_year,
          end_month: edu.end_month,
          end_year: edu.end_year,
          activities: edu.activities,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,school,degree'
        })
    )

    // 4. Process experience records
    const experiencePromises = data.experiences.map(exp =>
      supabase
        .from('experience')
        .upsert({
          user_id: profile.id,
          company_name: exp.company,
          company_logo_url: exp.company_logo_url,
          job_title: exp.title,
          start_month: exp.start_month,
          start_year: exp.start_year,
          end_month: exp.end_month,
          end_year: exp.end_year,
          is_current: exp.is_current,
          description: exp.description,
          location: exp.location,
          skills: exp.skills,
          job_type: exp.job_type,
          duration: exp.duration,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,company_name,job_title'
        })
    )

    // Wait for all promises to resolve
    await Promise.all([...educationPromises, ...experiencePromises])

    // 5. Create audit log entry
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_type: 'linkedin',
        user_id: profile.id,
        request_data: webhookData,
        status: 'success',
        created_at: new Date().toISOString()
      })

    return {
      success: true,
      profile_id: profile.id
    }

  } catch (error) {
    // Log error
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_type: 'linkedin',
        status: 'error',
        error_message: error.message,
        request_data: webhookData,
        created_at: new Date().toISOString()
      })

    throw error
  }
}