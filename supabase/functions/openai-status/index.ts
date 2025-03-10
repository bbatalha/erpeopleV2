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
    // Check if OpenAI API key is available
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          available: false,
          error: 'OpenAI API key not configured',
          model: null
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey
    })

    // Try a simple models list request to verify connectivity
    const models = await openai.models.list()
    
    // Check if gpt-4o is available
    const hasGpt4o = models.data.some(model => model.id === 'gpt-4o')

    return new Response(
      JSON.stringify({ 
        available: true,
        model: 'gpt-4o',
        hasGpt4o,
        modelCount: models.data.length
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('OpenAI API status check error:', error)
    
    return new Response(
      JSON.stringify({ 
        available: false,
        error: error.message || 'Failed to connect to OpenAI API',
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