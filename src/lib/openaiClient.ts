/**
 * Client library for interacting with OpenAI API
 */
import { createBrowserClient } from '@supabase/ssr'

// Default system message for behavior analysis
const SYSTEM_MESSAGE = `You are an expert behavioral psychologist specializing in professional development.
Your task is to analyze professional behavior traits and provide insightful, personalized analysis.
You should write in Portuguese (Brazil) and maintain a professional, supportive tone.
Your analysis should be specific to the data provided, avoid generic statements, and provide actionable insights.
Structure your response in the exact JSON format requested in the user's prompt.`;

/**
 * Create an OpenAI API client using environment variables
 */
export async function callOpenAIAssistant(
  userPrompt: string, 
  systemPrompt: string = SYSTEM_MESSAGE
) {
  try {
    // Get OpenAI assistant ID from Supabase
    const supabase = createBrowserClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
    
    // Create thread with the system and user prompts
    const { data: threadData, error: threadError } = await supabase.functions.invoke(
      "openai-assistant", 
      {
        body: {
          action: "createThread",
          systemPrompt: systemPrompt,
          userPrompt: userPrompt
        }
      }
    );
    
    if (threadError) {
      throw new Error(`Error creating thread: ${threadError.message}`);
    }
    
    const { threadId } = threadData;
    
    // Run the assistant on the thread
    const { data: runData, error: runError } = await supabase.functions.invoke(
      "openai-assistant", 
      {
        body: {
          action: "runAssistant",
          threadId: threadId
        }
      }
    );
    
    if (runError) {
      throw new Error(`Error running assistant: ${runError.message}`);
    }
    
    // Wait for the run to complete and get the messages
    let status = runData.status;
    let attempts = 0;
    const maxAttempts = 30; // Max 5 minutes (10 seconds * 30 attempts)
    
    while (status !== "completed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const { data: checkData, error: checkError } = await supabase.functions.invoke(
        "openai-assistant", 
        {
          body: {
            action: "checkRunStatus",
            threadId: threadId,
            runId: runData.runId
          }
        }
      );
      
      if (checkError) {
        throw new Error(`Error checking run status: ${checkError.message}`);
      }
      
      status = checkData.status;
      attempts++;
      
      if (status === "failed" || status === "expired" || status === "cancelled") {
        throw new Error(`Run ended with status: ${status}`);
      }
    }
    
    if (status !== "completed") {
      throw new Error("Run timed out");
    }
    
    // Get the assistant's response
    const { data: messagesData, error: messagesError } = await supabase.functions.invoke(
      "openai-assistant", 
      {
        body: {
          action: "getMessages",
          threadId: threadId
        }
      }
    );
    
    if (messagesError) {
      throw new Error(`Error getting messages: ${messagesError.message}`);
    }
    
    // Return the assistant's response (should be the last message in the thread)
    return messagesData.messages[0].content[0].text.value;
    
  } catch (error) {
    console.error("Error calling OpenAI Assistant:", error);
    throw error;
  }
}

/**
 * Alternative implementation using direct OpenAI API
 * This is kept as a backup if the assistant approach doesn't work
 */
export async function callOpenAIDirectAPI(prompt: string) {
  try {
    // Get API key from environment or Supabase
    const supabase = createBrowserClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(
      "openai-analysis", 
      {
        body: { prompt }
      }
    );
    
    if (error) {
      throw error;
    }
    
    return data.completion;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}