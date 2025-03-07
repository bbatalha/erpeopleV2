// OpenAI status check function
// This Edge Function validates that the OpenAI integration is properly configured

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Check if OPENAI_API_KEY is set
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const assistantId = Deno.env.get("OPENAI_ASSISTANT_ID");
    
    const response = {
      available: Boolean(apiKey),
      assistantAvailable: Boolean(assistantId),
      message: apiKey 
        ? "OpenAI integration is properly configured" 
        : "OpenAI API key is not configured",
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking OpenAI status:", error);

    return new Response(
      JSON.stringify({ 
        available: false, 
        message: `Error checking OpenAI status: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});