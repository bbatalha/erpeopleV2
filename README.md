# ERPeople Assessment Platform

A comprehensive assessment platform for personality and behavior analysis.

## Features

- DISC Assessment
- Behavior Traits Analysis
- PDF Report Generation
- Admin Dashboard
- User Management

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Supabase
- Vite

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update with your Supabase credentials
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

The following environment variables are required:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Deployment

This project is configured for deployment on Netlify. The `netlify.toml` file includes the necessary build settings and redirects for the SPA.