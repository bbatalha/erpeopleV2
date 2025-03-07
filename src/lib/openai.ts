/**
 * OpenAI API client setup
 * This file provides a configured OpenAI client and utilities for API interactions
 */
import { supabase } from './supabase';

// Default system message for behavior analysis
const DEFAULT_SYSTEM_MESSAGE = `You are an expert behavioral psychologist specializing in professional development.
Your task is to analyze professional behavior traits and provide insightful, personalized analysis.
You should write in Portuguese (Brazil) and maintain a professional, supportive tone.
Your analysis should be specific to the data provided, avoid generic statements, and provide actionable insights.
Structure your response in the exact JSON format requested in the user's prompt.`;

// Interfaces for OpenAI requests
interface ChatCompletionRequest {
  prompt: string; 
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AssistantRequest {
  threadId?: string;
  prompt: string;
  systemMessage?: string;
}

/**
 * Securely call OpenAI chat completions via Supabase Edge Function
 * This is the recommended approach for browser environments
 */
export async function callOpenAICompletion({
  prompt, 
  systemMessage = DEFAULT_SYSTEM_MESSAGE,
  temperature = 0.7,
  maxTokens = 2048
}: ChatCompletionRequest): Promise<string> {
  try {
    console.log('Calling OpenAI completion via Supabase Edge Function');
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(
      "openai-analysis", 
      {
        body: { 
          prompt,
          systemMessage,
          temperature,
          maxTokens
        }
      }
    );
    
    if (error) {
      console.error('Error calling OpenAI via Edge Function:', error);
      throw error;
    }
    
    return data.completion;
  } catch (error) {
    console.error('Error in callOpenAICompletion:', error);
    throw new Error(`Failed to get completion: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Call OpenAI Assistants API via Supabase Edge Function
 * This provides more contextual and potentially more accurate responses
 */
export async function callOpenAIAssistant({
  threadId,
  prompt,
  systemMessage = DEFAULT_SYSTEM_MESSAGE
}: AssistantRequest): Promise<string> {
  try {
    console.log('Calling OpenAI Assistant via Supabase Edge Function');
    
    // Step 1: Create thread if not provided
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const { data: threadData, error: threadError } = await supabase.functions.invoke(
        "openai-assistant", 
        {
          body: {
            action: "createThread",
            systemPrompt: systemMessage,
            userPrompt: prompt
          }
        }
      );
      
      if (threadError) {
        throw new Error(`Error creating thread: ${threadError.message}`);
      }
      
      currentThreadId = threadData.threadId;
    }
    
    // Step 2: Run the assistant on the thread
    const { data: runData, error: runError } = await supabase.functions.invoke(
      "openai-assistant", 
      {
        body: {
          action: "runAssistant",
          threadId: currentThreadId
        }
      }
    );
    
    if (runError) {
      throw new Error(`Error running assistant: ${runError.message}`);
    }
    
    // Step 3: Poll for completion
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
            threadId: currentThreadId,
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
    
    // Step 4: Get the assistant's response
    const { data: messagesData, error: messagesError } = await supabase.functions.invoke(
      "openai-assistant", 
      {
        body: {
          action: "getMessages",
          threadId: currentThreadId
        }
      }
    );
    
    if (messagesError) {
      throw new Error(`Error getting messages: ${messagesError.message}`);
    }
    
    // Return the assistant's response (should be the last message in the thread)
    if (messagesData.messages && messagesData.messages.length > 0 && 
        messagesData.messages[0].content && messagesData.messages[0].content.length > 0) {
      return messagesData.messages[0].content[0].text.value;
    } else {
      throw new Error("No response from assistant");
    }
    
  } catch (error) {
    console.error("Error in callOpenAIAssistant:", error);
    throw new Error(`Failed to get response from assistant: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if OpenAI integration is available 
 * Verifies if the necessary environment variables and endpoints are configured
 */
export async function checkOpenAIAvailability(): Promise<boolean> {
  try {
    // Try to ping the edge function to see if it's deployed
    const { data, error } = await supabase.functions.invoke(
      "openai-status", 
      { body: { check: true } }
    );
    
    if (error) {
      console.warn('OpenAI integration not available:', error);
      return false;
    }
    
    return data?.available === true;
  } catch (error) {
    console.warn('Error checking OpenAI availability:', error);
    return false;
  }
}