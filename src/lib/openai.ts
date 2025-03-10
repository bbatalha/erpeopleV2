/**
 * OpenAI API client setup
 * This file provides a configured OpenAI client and utilities for API interactions
 */
import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

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
  prompt: { prompt: string };
  systemMessage?: string;
}

// Rate limiting state
const rateLimitState = {
  isRateLimited: false,
  resetTime: 0,
  retryAfter: 0
};

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
    // Check if we're currently rate limited
    if (rateLimitState.isRateLimited) {
      const now = Date.now();
      if (now < rateLimitState.resetTime) {
        const waitingSeconds = Math.ceil((rateLimitState.resetTime - now) / 1000);
        console.log(`OpenAI is currently rate limited. Retry available in ${waitingSeconds}s`);
        
        throw new Error(`Rate limit in effect. Please try again in ${waitingSeconds} seconds.`);
      } else {
        // Reset rate limit state if we've passed the reset time
        rateLimitState.isRateLimited = false;
      }
    }
    
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
  } catch (error: any) {
    console.error('Error in callOpenAICompletion:', error);
    
    // Check for rate limit errors in the response
    if (error?.message?.includes('Rate limit') || 
        (error?.context?.body && JSON.parse(error.context.body)?.error?.includes('Rate limit'))) {
      
      // Set rate limit state
      const retryAfter = extractRetryAfter(error) || 60; // Default to 60s if we can't extract
      rateLimitState.isRateLimited = true;
      rateLimitState.retryAfter = retryAfter;
      rateLimitState.resetTime = Date.now() + (retryAfter * 1000);
      
      // Show a toast with the rate limit message
      toast.error(`OpenAI rate limit reached. Please try again in ${Math.ceil(retryAfter)} seconds.`);
      
      throw new Error(`Rate limit reached. Please try again in ${Math.ceil(retryAfter)} seconds.`);
    }
    
    throw new Error(`Failed to get completion: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Attempt to extract retry-after time from various error formats
 */
function extractRetryAfter(error: any): number | null {
  try {
    // Check direct error.retryAfter property
    if (typeof error.retryAfter === 'number') {
      return error.retryAfter;
    }
    
    // Check for seconds in the error message
    const secondsMatch = error.message?.match(/try again in (\d+\.?\d*)s/i);
    if (secondsMatch && secondsMatch[1]) {
      return parseFloat(secondsMatch[1]);
    }
    
    // Try to parse the error body if it's a Supabase functions error
    if (error.context?.body) {
      try {
        const bodyObj = JSON.parse(error.context.body);
        if (bodyObj.error && bodyObj.error.includes('try again in')) {
          const timeMatch = bodyObj.error.match(/try again in (\d+\.?\d*)s/i);
          if (timeMatch && timeMatch[1]) {
            return parseFloat(timeMatch[1]);
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse error body:', parseError);
      }
    }
    
    return null;
  } catch (e) {
    console.warn('Error extracting retry time:', e);
    return null;
  }
}

/**
 * Call OpenAI Assistants API via Supabase Edge Function
 * This provides more contextual and potentially more accurate responses
 */
export async function callOpenAIAssistant({
  prompt,
  systemMessage = DEFAULT_SYSTEM_MESSAGE
}: AssistantRequest): Promise<string> {
  try {
    // Check if we're currently rate limited (same as completion function)
    if (rateLimitState.isRateLimited) {
      const now = Date.now();
      if (now < rateLimitState.resetTime) {
        const waitingSeconds = Math.ceil((rateLimitState.resetTime - now) / 1000);
        console.log(`OpenAI is currently rate limited. Retry available in ${waitingSeconds}s`);
        
        throw new Error(`Rate limit in effect. Please try again in ${waitingSeconds} seconds.`);
      } else {
        // Reset rate limit state if we've passed the reset time
        rateLimitState.isRateLimited = false;
      }
    }
    
    console.log('Calling OpenAI Assistant via Supabase Edge Function');
    
    // Step 1: Create thread with the user prompt
    const { data: threadData, error: threadError } = await supabase.functions.invoke(
      "openai-assistant", 
      {
        body: {
          action: "createThread",
          systemPrompt: systemMessage,
          userPrompt: prompt.prompt
        }
      }
    );
    
    if (threadError) {
      console.error("Error creating thread:", threadError);
      throw new Error(`Error creating thread: ${threadError.message}`);
    }
    
    if (!threadData || !threadData.threadId) {
      throw new Error("No threadId returned from createThread");
    }
    
    const threadId = threadData.threadId;
    console.log("Thread created:", threadId);
    
    // Step 2: Run the assistant on the thread
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
      console.error("Error running assistant:", runError);
      throw new Error(`Error running assistant: ${runError.message}`);
    }
    
    if (!runData || !runData.runId) {
      throw new Error("No runId returned from runAssistant");
    }
    
    console.log("Run created:", runData.runId);
    
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
            threadId: threadId,
            runId: runData.runId
          }
        }
      );
      
      if (checkError) {
        console.error("Error checking run status:", checkError);
        throw new Error(`Error checking run status: ${checkError.message}`);
      }
      
      if (!checkData) {
        throw new Error("No data returned from checkRunStatus");
      }
      
      status = checkData.status;
      console.log("Run status:", status);
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
          threadId: threadId
        }
      }
    );
    
    if (messagesError) {
      console.error("Error getting messages:", messagesError);
      throw new Error(`Error getting messages: ${messagesError.message}`);
    }
    
    if (!messagesData || !messagesData.messages || messagesData.messages.length === 0) {
      throw new Error("No messages returned from getMessages");
    }
    
    // Return the assistant's response (should be the last message in the thread)
    if (messagesData.messages[0].content && messagesData.messages[0].content.length > 0) {
      return messagesData.messages[0].content[0].text.value;
    } else {
      throw new Error("No content in assistant's message");
    }
    
  } catch (error: any) {
    console.error("Error in callOpenAIAssistant:", error);
    
    // Check for rate limit errors in the response (same as completion function)
    if (error?.message?.includes('Rate limit') || 
        (error?.context?.body && JSON.parse(error.context.body)?.error?.includes('Rate limit'))) {
      
      // Set rate limit state
      const retryAfter = extractRetryAfter(error) || 60; // Default to 60s if we can't extract
      rateLimitState.isRateLimited = true;
      rateLimitState.retryAfter = retryAfter;
      rateLimitState.resetTime = Date.now() + (retryAfter * 1000);
      
      // Show a toast with the rate limit message
      toast.error(`OpenAI rate limit reached. Please try again in ${Math.ceil(retryAfter)} seconds.`);
      
      throw new Error(`Rate limit reached. Please try again in ${Math.ceil(retryAfter)} seconds.`);
    }
    
    throw error;
  }
}

/**
 * Check if OpenAI integration is available 
 * Verifies if the necessary environment variables and endpoints are configured
 */
export async function checkOpenAIAvailability(): Promise<boolean> {
  try {
    // First check if we're rate limited
    if (rateLimitState.isRateLimited) {
      const now = Date.now();
      if (now < rateLimitState.resetTime) {
        // Still rate limited
        return false;
      }
      // Reset rate limit if time has passed
      rateLimitState.isRateLimited = false;
    }
    
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