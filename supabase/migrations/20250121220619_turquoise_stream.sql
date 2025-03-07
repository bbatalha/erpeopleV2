/*
  # LinkedIn Webhook Integration Schema

  1. New Tables
    - `companies`
      - Company information from LinkedIn
      - Stores company details like name, industry, size
    - `education`
      - Educational background from LinkedIn
      - Links to user profiles
    - `experience`
      - Work experience from LinkedIn
      - Links to user profiles
    - `webhook_logs`
      - Audit trail for webhook requests
      - Tracks success/failure of data processing

  2. Security
    - RLS policies for all tables
    - Secure access patterns for webhook data

  3. Changes
    - Adds LinkedIn-specific fields to profiles
    - Creates audit logging structure
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    domain text UNIQUE NOT NULL,
    industry text,
    employee_range text,
    linkedin_url text,
    logo_url text,
    website text,
    year_founded integer,
    description text,
    hq_city text,
    hq_country text,
    hq_region text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT company_linkedin_url_check CHECK (linkedin_url ~ '^https://(www\.)?linkedin\.com/.*[^/\s]$'),
    CONSTRAINT company_website_check CHECK (website ~ '^https?://.*[^/\s]$')
);

-- Create education table
CREATE TABLE IF NOT EXISTS education (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    degree text NOT NULL,
    field_of_study text NOT NULL,
    school text NOT NULL,
    school_linkedin_url text,
    school_logo_url text,
    date_range text,
    start_month text,
    start_year integer,
    end_month text,
    end_year integer,
    activities text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, school, degree)
);

-- Create experience table
CREATE TABLE IF NOT EXISTS experience (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    company_name text NOT NULL,
    company_logo_url text,
    job_title text NOT NULL,
    start_month integer,
    start_year integer,
    end_month text,
    end_year text,
    is_current boolean DEFAULT false,
    description text,
    location text,
    skills text,
    job_type text,
    duration text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, company_name, job_title)
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_type text NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    request_data jsonb NOT NULL,
    status text NOT NULL,
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Public read access for companies"
    ON companies FOR SELECT
    USING (true);

CREATE POLICY "Admin insert/update for companies"
    ON companies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Education policies
CREATE POLICY "Users can view own education"
    ON education FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all education"
    ON education FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can manage education"
    ON education FOR ALL
    USING (true)
    WITH CHECK (true);

-- Experience policies
CREATE POLICY "Users can view own experience"
    ON experience FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all experience"
    ON experience FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can manage experience"
    ON experience FOR ALL
    USING (true)
    WITH CHECK (true);

-- Webhook logs policies
CREATE POLICY "Admin can view webhook logs"
    ON webhook_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert webhook logs"
    ON webhook_logs FOR INSERT
    WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_education_user_id ON education(user_id);
CREATE INDEX idx_experience_user_id ON experience(user_id);
CREATE INDEX idx_webhook_logs_user_id ON webhook_logs(user_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at
    BEFORE UPDATE ON education
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experience_updated_at
    BEFORE UPDATE ON experience
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();