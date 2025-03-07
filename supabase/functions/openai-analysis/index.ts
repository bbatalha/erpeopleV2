// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocompletion, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.0.0";

// CORS headers for browser requests
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
    // Get API key from environment variable
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set");
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Parse the request
    const { 
      prompt, 
      systemMessage = `You are an expert behavioral psychologist specializing in professional development.
      Your task is to analyze professional behavior traits and provide insightful, personalized analysis.
      You should write in Portuguese (Brazil) and maintain a professional, supportive tone.
      Your analysis should be specific to the data provided, avoid generic statements, and provide actionable insights.
      Structure your response in the exact JSON format requested in the user's prompt.`,
      temperature = 0.7,
      maxTokens = 2048
    } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      response_format: { type: "text" },
    });

    return new Response(
      JSON.stringify({ 
        completion: completion.choices[0].message.content,
        usage: completion.usage,
        model: completion.model,
        status: "success"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: "error",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});