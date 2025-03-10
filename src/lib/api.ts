import { supabase } from './supabase';

/**
 * Utility function to handle Supabase API calls with retry logic
 * This provides better error handling for network connectivity issues
 * 
 * @param apiCall - Function that makes the Supabase API call
 * @param maxRetries - Maximum number of retry attempts
 * @param retryDelay - Delay in ms between retries
 */
async function withRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait between retries
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
      
      return await apiCall();
    } catch (error) {
      console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a network connectivity error that might be resolved with a retry
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // Continue to next retry attempt
        continue;
      } else {
        // Non-connectivity error, don't retry
        throw error;
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('API call failed after retries');
}

/**
 * Fetch a single assessment result with full details
 */
export async function fetchAssessmentResult(resultId: string) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('assessment_results')
      .select(`
        *,
        assessment_responses (
          responses,
          completed_at,
          assessments (
            type,
            title
          )
        ),
        profiles (
          full_name
        )
      `)
      .eq('id', resultId)
      .single();
    
    if (error) {
      console.error('Error fetching assessment result:', error);
      throw error;
    }
    
    return data;
  });
}

/**
 * Fetch a user's assessment history
 */
export async function fetchUserAssessmentHistory(userId: string) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('assessment_results')
      .select(`
        id,
        created_at,
        results,
        ai_analysis,
        assessment_responses (
          responses,
          completed_at
        ),
        assessments (
          type,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching assessment history:', error);
      throw error;
    }
    
    return data || [];
  });
}

/**
 * Check if the user has internet connectivity
 */
export function checkInternetConnectivity(): boolean {
  return navigator.onLine;
}

/**
 * Get offline error message with troubleshooting steps
 */
export function getOfflineErrorMessage(): string {
  return `
    Unable to connect to the server. Please check your internet connection and try again.
    
    Troubleshooting steps:
    1. Verify your internet connection
    2. Check if you can access other websites
    3. If you're behind a firewall or VPN, ensure it's not blocking API calls
    4. Try refreshing the page or returning to the dashboard
  `;
}