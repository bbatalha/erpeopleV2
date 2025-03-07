// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocompletion, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.0";

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
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Get the assistant ID from environment variables
    const ASSISTANT_ID = Deno.env.get("OPENAI_ASSISTANT_ID");
    if (!ASSISTANT_ID) {
      throw new Error("OPENAI_ASSISTANT_ID is not set");
    }

    // Parse the request body
    const requestData = await req.json();
    const { action, threadId, runId, systemPrompt, userPrompt } = requestData;

    if (!action) {
      throw new Error("Missing required parameter: action");
    }

    console.log(`Processing action: ${action}`);
    let result = {};

    switch (action) {
      case "createThread": {
        if (!userPrompt) {
          throw new Error("Missing required parameter: userPrompt");
        }

        try {
          // Create a new thread
          const thread = await openai.beta.threads.create();
          console.log("Thread created:", thread.id);

          // Add a message to the thread
          await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: userPrompt,
          });
          console.log("Message added to thread");

          result = { threadId: thread.id };
        } catch (error) {
          console.error("Error in createThread:", error);
          throw new Error(`Failed to create thread: ${error.message}`);
        }
        break;
      }

      case "runAssistant": {
        if (!threadId) {
          throw new Error("Missing required parameter: threadId");
        }

        try {
          // Run the assistant on the thread
          console.log(`Running assistant ${ASSISTANT_ID} on thread ${threadId}`);
          const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: ASSISTANT_ID,
          });
          console.log("Run created:", run.id);

          result = { runId: run.id, status: run.status };
        } catch (error) {
          console.error("Error in runAssistant:", error);
          throw new Error(`Failed to run assistant: ${error.message}`);
        }
        break;
      }

      case "checkRunStatus": {
        if (!threadId || !runId) {
          throw new Error("Missing required parameters: threadId and/or runId");
        }

        try {
          // Get the run status
          console.log(`Checking run status for ${runId} on thread ${threadId}`);
          const run = await openai.beta.threads.runs.retrieve(threadId, runId);
          console.log("Run status:", run.status);

          result = { status: run.status };
        } catch (error) {
          console.error("Error in checkRunStatus:", error);
          throw new Error(`Failed to check run status: ${error.message}`);
        }
        break;
      }

      case "getMessages": {
        if (!threadId) {
          throw new Error("Missing required parameter: threadId");
        }

        try {
          // Get the messages from the thread
          console.log(`Getting messages from thread ${threadId}`);
          const messages = await openai.beta.threads.messages.list(threadId);
          console.log(`Retrieved ${messages.data.length} messages`);

          result = { messages: messages.data };
        } catch (error) {
          console.error("Error in getMessages:", error);
          throw new Error(`Failed to get messages: ${error.message}`);
        }
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