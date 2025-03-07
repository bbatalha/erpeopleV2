// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocompletion, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.0.0";

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
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    // Get the assistant ID from environment variables
    const ASSISTANT_ID = Deno.env.get("OPENAI_ASSISTANT_ID");
    if (!ASSISTANT_ID) {
      throw new Error("OPENAI_ASSISTANT_ID is not set");
    }

    // Parse the request body
    const { action, threadId, runId, systemPrompt, userPrompt } = await req.json();

    if (!action) {
      throw new Error("Missing required parameter: action");
    }

    let result = {};

    switch (action) {
      case "createThread": {
        if (!userPrompt) {
          throw new Error("Missing required parameter: userPrompt");
        }

        // Create a new thread
        const thread = await openai.beta.threads.create();

        // Add a message to the thread
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: userPrompt,
        });

        result = { threadId: thread.id };
        break;
      }

      case "runAssistant": {
        if (!threadId) {
          throw new Error("Missing required parameter: threadId");
        }

        // Run the assistant on the thread
        const run = await openai.beta.threads.runs.create(threadId, {
          assistant_id: ASSISTANT_ID,
        });

        result = { runId: run.id, status: run.status };
        break;
      }

      case "checkRunStatus": {
        if (!threadId || !runId) {
          throw new Error("Missing required parameters: threadId and/or runId");
        }

        // Get the run status
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);

        result = { status: run.status };
        break;
      }

      case "getMessages": {
        if (!threadId) {
          throw new Error("Missing required parameter: threadId");
        }

        // Get the messages from the thread
        const messages = await openai.beta.threads.messages.list(threadId);

        result = { messages: messages.data };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});