# OpenAI Integration Setup Guide

This guide explains how to set up the OpenAI integration for the ERPeople Assessment Platform to enable AI-powered behavior analysis.

## Prerequisites

- OpenAI API key
- Supabase project with Edge Functions enabled
- Node.js (v18+) and npm installed

## Step 1: Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to "API Keys" in the dashboard
4. Create a new API key
5. Copy the API key to use in the next steps

## Step 2: Deploy Supabase Edge Functions

The application uses three Edge Functions that need to be deployed to Supabase:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Navigate to your project directory
cd your-project-directory

# Deploy the Edge Functions
supabase functions deploy openai-analysis --project-ref your-project-ref
supabase functions deploy openai-assistant --project-ref your-project-ref
supabase functions deploy openai-status --project-ref your-project-ref
```

Replace `your-project-ref` with your Supabase project reference ID.

## Step 3: Set Environment Variables

Set the OpenAI API key as a secret in your Supabase project:

```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key --project-ref your-project-ref
```

## Step 4: Create OpenAI Assistant (Optional)

For enhanced analysis using the OpenAI Assistants API, you can create a specialized assistant:

```bash
# Create the assistant
node scripts/create-openai-assistant.js
```

This script will output an Assistant ID. Set it as a secret in your Supabase project:

```bash
supabase secrets set OPENAI_ASSISTANT_ID=your-assistant-id --project-ref your-project-ref
```

## Step 5: Apply Database Migrations

Apply the database migration to add the AI analysis column:

```bash
# Push the migration to your Supabase project
supabase db push
```

## Step 6: Update Existing Results (Optional)

To generate AI analysis for existing behavior assessment results:

```bash
# Run the script to update existing results
node scripts/update-existing-results.js
```

## Step 7: Testing the Integration

1. Navigate to the Settings page in the application
2. Click the "Test Connection" button under the OpenAI integration section
3. If connected successfully, you'll see a "Connected" indicator

## Model Configuration

This application uses `gpt-4o` as the OpenAI model for behavior analysis. This is the latest model from OpenAI that offers:

- Better context understanding
- Improved behavior analysis capabilities
- More consistent responses
- Comparable pricing to previous models

If you need to change the model, modify the model parameter in the following files:
- `supabase/functions/openai-analysis/index.ts`
- `supabase/functions/openai-assistant/index.ts`

## Troubleshooting

- **Edge Function Deployment Failures**: Ensure your Supabase CLI is updated and you have the correct permissions
- **API Key Issues**: Verify the API key is correctly set as a secret
- **Connection Test Failures**: Check the browser console for detailed error messages
- **Missing AI Analysis**: Ensure your OpenAI account has sufficient credits
- **Rate Limiting**: If you're experiencing rate limits, consider reducing the number of concurrent requests or using a model with higher rate limits

## Usage Notes

- AI analysis is generated when viewing a behavior assessment result
- Users can choose to save the analysis to the database
- AI generation may take 5-15 seconds depending on OpenAI API load
- The system falls back to basic analysis if OpenAI is unavailable

## Security Considerations

- Never expose your OpenAI API key in client-side code
- The Edge Functions proxy requests to OpenAI, keeping your API key secure
- User assessment data is only sent to OpenAI when explicitly generating an analysis