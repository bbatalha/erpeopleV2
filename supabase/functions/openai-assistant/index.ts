import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { OpenAI } from 'https://esm.sh/openai@4.24.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    const { action, threadId, runId, userPrompt, systemPrompt } = await req.json()

    // Get the assistant ID from environment variables
    const assistantId = Deno.env.get('OPENAI_ASSISTANT_ID')
    if (!assistantId) {
      throw new Error('OPENAI_ASSISTANT_ID is not set in environment variables')
    }

    switch (action) {
      case 'createThread': {
        if (!userPrompt) {
          throw new Error('User prompt is required')
        }

        // Create a new thread with the initial user message
        const thread = await openai.beta.threads.create({
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        })

        // Return the thread ID
        return new Response(
          JSON.stringify({ threadId: thread.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'runAssistant': {
        if (!threadId) {
          throw new Error('Thread ID is required')
        }

        // Start the assistant run
        const run = await openai.beta.threads.runs.create(
          threadId, 
          { 
            assistant_id: assistantId,
            // Using gpt-4o instead of gpt-4-turbo-preview
            model: 'gpt-4o' 
          }
        )

        return new Response(
          JSON.stringify({ runId: run.id, status: run.status }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'checkRunStatus': {
        if (!threadId || !runId) {
          throw new Error('Thread ID and Run ID are required')
        }

        // Check the status of the assistant run
        const run = await openai.beta.threads.runs.retrieve(threadId, runId)

        return new Response(
          JSON.stringify({ status: run.status }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'getMessages': {
        if (!threadId) {
          throw new Error('Thread ID is required')
        }

        // Retrieve messages from the thread
        const messages = await openai.beta.threads.messages.list(threadId)

        return new Response(
          JSON.stringify({ messages: messages.data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  } catch (error) {
    console.error('Error in OpenAI Assistant Edge Function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during the OpenAI request',
        status: 'error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})