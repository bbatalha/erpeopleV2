import { supabase } from '../lib/supabase';
import { callOpenAICompletion } from '../lib/openai';
import { generateBehaviorAnalysisPrompt, parseBehaviorAnalysisResponse, exampleAnalysisResponse } from '../utils/openaiPrompt';
import { toast } from 'react-hot-toast';

interface BehaviorAnalysisResponse {
  summary: string;
  strengths: string[];
  developmentAreas: string[];
  workStyleInsights: string;
  teamDynamicsInsights: string;
  traitDescriptions: Record<number, string>;
}

// Local in-memory cache to prevent duplicate API calls in same session
const analysisCache = new Map<string, BehaviorAnalysisResponse>();

/**
 * Retrieves behavior analysis from the database if it exists
 * @param resultId The assessment result ID
 */
export async function getCachedAnalysis(resultId: string): Promise<BehaviorAnalysisResponse | null> {
  try {
    // First check in-memory cache for faster retrieval
    if (analysisCache.has(resultId)) {
      console.log('Retrieved analysis from in-memory cache');
      return analysisCache.get(resultId) as BehaviorAnalysisResponse;
    }
    
    // Then check database
    const { data, error } = await supabase
      .from('assessment_results')
      .select('ai_analysis')
      .eq('id', resultId)
      .single();
    
    if (error) {
      console.warn('Error retrieving cached analysis:', error);
      return null;
    }
    
    // Return cached analysis if available
    if (data?.ai_analysis) {
      console.log('Retrieved cached behavior analysis for result:', resultId);
      
      // Update in-memory cache for future use
      analysisCache.set(resultId, data.ai_analysis as BehaviorAnalysisResponse);
      
      return data.ai_analysis as BehaviorAnalysisResponse;
    }
    
    return null;
  } catch (error) {
    console.error('Error in getCachedAnalysis:', error);
    return null;
  }
}

/**
 * Saves behavior analysis to the database
 * @param resultId The assessment result ID
 * @param analysis The analysis data to cache
 */
export async function cacheAnalysis(
  resultId: string, 
  analysis: BehaviorAnalysisResponse
): Promise<boolean> {
  try {
    console.log('Caching behavior analysis for result:', resultId);
    
    // First update in-memory cache
    analysisCache.set(resultId, analysis);
    
    // Then update database with explicit stringify to ensure proper JSON format
    const { error } = await supabase
      .from('assessment_results')
      .update({
        ai_analysis: analysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId);
    
    if (error) {
      console.error('Error caching analysis:', error);
      return false;
    }
    
    console.log('Successfully cached behavior analysis');
    return true;
  } catch (error) {
    console.error('Error in cacheAnalysis:', error);
    return false;
  }
}

/**
 * Retrieves trait metadata for a given trait ID
 */
function getTraitMetadata(id: number): {leftTrait: string, rightTrait: string, category: string} {
  const traitMetadata: Record<number, {leftTrait: string, rightTrait: string, category: string}> = {
    1: {leftTrait: 'Crítico', rightTrait: 'Amigável', category: 'communication'},
    2: {leftTrait: 'Orientado à qualidade', rightTrait: 'Orientado à velocidade', category: 'execution'},
    3: {leftTrait: 'Autônomo', rightTrait: 'Trabalho em equipe', category: 'collaboration'},
    4: {leftTrait: 'Diplomático', rightTrait: 'Honesto', category: 'communication'},
    5: {leftTrait: 'Criativo', rightTrait: 'Consistente', category: 'innovation'},
    6: {leftTrait: 'Leal', rightTrait: 'Pragmático', category: 'values'},
    7: {leftTrait: 'Assume riscos', rightTrait: 'Cauteloso', category: 'risk-taking'},
    8: {leftTrait: 'Assertivo', rightTrait: 'Modesto', category: 'communication'},
    9: {leftTrait: 'Rápido', rightTrait: 'Analítico', category: 'decision-making'},
    10: {leftTrait: 'Emocional', rightTrait: 'Racional', category: 'thinking-style'}
  };
  
  // Add more trait metadata for completeness
  for (let i = 11; i <= 35; i++) {
    if (!traitMetadata[i]) {
      traitMetadata[i] = {
        leftTrait: `Trait${i}A`, 
        rightTrait: `Trait${i}B`, 
        category: 'general'
      };
    }
  }
  
  return traitMetadata[id] || {leftTrait: 'Unknown', rightTrait: 'Unknown', category: 'general'};
}

/**
 * Prepares trait data for OpenAI analysis
 */
function prepareTraitMetadata(traits: Record<number, number>): Record<number, any> {
  const metadata: Record<number, any> = {};
  
  Object.keys(traits).forEach(idStr => {
    const id = Number(idStr);
    const traitData = getTraitMetadata(id);
    metadata[id] = {
      id,
      leftTrait: traitData.leftTrait,
      rightTrait: traitData.rightTrait,
      category: traitData.category,
      value: traits[id]
    };
  });
  
  return metadata;
}

// Queue system for API calls to prevent duplicate/parallel requests
let processingQueue = false;
const pendingAnalysisRequests: Array<{
  resolve: (value: BehaviorAnalysisResponse | null) => void;
  reject: (reason: any) => void;
  request: {
    resultId: string;
    traits: Record<number, number>;
    frequencyTraits?: Record<string, number>;
    userName?: string;
    forceRefresh: boolean;
  };
}> = [];

/**
 * Process the next analysis request in the queue
 */
async function processNextInQueue() {
  if (processingQueue || pendingAnalysisRequests.length === 0) {
    return;
  }
  
  processingQueue = true;
  
  try {
    const next = pendingAnalysisRequests.shift();
    if (!next) {
      processingQueue = false;
      return;
    }
    
    const { resolve, reject, request } = next;
    
    try {
      // Process the request without the queue to avoid recursion
      const result = await processAnalysisRequest(
        request.resultId,
        request.traits,
        request.frequencyTraits,
        request.userName,
        request.forceRefresh
      );
      
      resolve(result);
    } catch (error) {
      reject(error);
    }
  } finally {
    processingQueue = false;
    
    // Process next in queue if any
    if (pendingAnalysisRequests.length > 0) {
      setTimeout(processNextInQueue, 500); // Small delay to prevent tight loop
    }
  }
}

/**
 * Actual processing logic for behavior analysis
 */
async function processAnalysisRequest(
  resultId: string,
  traits: Record<number, number>,
  frequencyTraits?: Record<string, number>,
  userName?: string,
  forceRefresh: boolean = false
): Promise<BehaviorAnalysisResponse | null> {
  console.log(`Processing analysis request for result ${resultId}${forceRefresh ? ' (forced refresh)' : ''}`);
  
  // Skip cache if force refresh requested
  if (!forceRefresh) {
    // Check cache first
    const cachedAnalysis = await getCachedAnalysis(resultId);
    if (cachedAnalysis) {
      console.log('Using cached analysis');
      return cachedAnalysis;
    }
    console.log('No cached analysis found, generating new one');
  } else {
    console.log('Bypassing cache as refresh was requested');
  }
  
  // Prepare data for API call
  const traitMetadata = prepareTraitMetadata(traits);
  
  // Generate the prompt for OpenAI
  const prompt = generateBehaviorAnalysisPrompt(
    traits,
    traitMetadata,
    frequencyTraits,
    userName
  );
  
  // Implement retry logic
  const maxRetries = 2;
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`API call attempt ${attempt + 1}/${maxRetries}`);
      
      // Call OpenAI API
      const responseText = await callOpenAICompletion({
        prompt: prompt
      });
      
      // Parse the response
      const parsedResponse = parseBehaviorAnalysisResponse(responseText);
      
      // Validate response structure
      if (!parsedResponse || !parsedResponse.summary) {
        console.error('Invalid response structure from OpenAI:', parsedResponse);
        continue; // Try again
      }
      
      console.log('Received valid behavior analysis from OpenAI');
      
      try {
        // Cache the successful result - log the data for debug
        console.log('Analysis structure before caching:', 
          Object.keys(parsedResponse), 
          typeof parsedResponse.summary, 
          Array.isArray(parsedResponse.strengths)
        );
        
        // Ensure data types match expected format
        const validatedResponse: BehaviorAnalysisResponse = {
          summary: String(parsedResponse.summary || ''),
          strengths: Array.isArray(parsedResponse.strengths) ? 
            parsedResponse.strengths.map(s => String(s)) : [],
          developmentAreas: Array.isArray(parsedResponse.developmentAreas) ? 
            parsedResponse.developmentAreas.map(d => String(d)) : [],
          workStyleInsights: String(parsedResponse.workStyleInsights || ''),
          teamDynamicsInsights: String(parsedResponse.teamDynamicsInsights || ''),
          traitDescriptions: typeof parsedResponse.traitDescriptions === 'object' ? 
            parsedResponse.traitDescriptions : {}
        };
        
        const cacheResult = await cacheAnalysis(resultId, validatedResponse);
        if (!cacheResult) {
          console.warn('Failed to cache analysis in database, but returning result anyway');
        }
      } catch (cacheError) {
        console.error('Error when caching analysis:', cacheError);
        // Continue even if caching fails
      }
      
      return parsedResponse;
    } catch (error: any) {
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // If it's a rate limit error, no point in immediate retry
      if (error?.message?.includes('Rate limit')) {
        throw error; // Propagate rate limit error
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  console.error('All API call attempts failed:', lastError);
  
  // Fall back to example data
  console.log('Using fallback example analysis');
  toast.error('Não foi possível gerar análise personalizada. Usando análise de exemplo.');
  
  try {
    // Cache the example response so we don't try again
    const cacheResult = await cacheAnalysis(resultId, exampleAnalysisResponse);
    if (!cacheResult) {
      console.warn('Failed to cache example analysis');
    }
  } catch (cacheError) {
    console.error('Error when caching example analysis:', cacheError);
  }
  
  return exampleAnalysisResponse;
}

/**
 * Primary function to get behavior analysis - first checks cache, then generates if needed
 * Implements retry logic for API calls and proper caching
 */
export async function getBehaviorAnalysis(
  resultId: string,
  traits: Record<number, number>,
  frequencyTraits?: Record<string, number>,
  userName?: string,
  forceRefresh: boolean = false
): Promise<BehaviorAnalysisResponse | null> {
  try {
    console.log(`Getting behavior analysis for result ${resultId}${forceRefresh ? ' (forced refresh)' : ''}`);
    
    // Check if we have enough traits to analyze
    if (!traits || Object.keys(traits).length === 0) {
      console.warn('Not enough traits to analyze');
      return null;
    }
    
    // Use the queue system to prevent parallel API calls
    return new Promise((resolve, reject) => {
      // Add to queue
      pendingAnalysisRequests.push({
        resolve,
        reject,
        request: {
          resultId,
          traits,
          frequencyTraits,
          userName,
          forceRefresh
        }
      });
      
      // Start processing if not already
      if (!processingQueue) {
        processNextInQueue();
      }
    });
  } catch (error) {
    console.error('Error in getBehaviorAnalysis:', error);
    return null;
  }
}

/**
 * Directly update the AI analysis for a result
 * This function bypasses the OpenAI call and just updates the database
 */
export async function updateAnalysisDirectly(resultId: string, analysis: BehaviorAnalysisResponse): Promise<boolean> {
  try {
    // Verify resultId exists
    const { data, error: checkError } = await supabase
      .from('assessment_results')
      .select('id')
      .eq('id', resultId)
      .single();
    
    if (checkError || !data) {
      console.error('Result ID not found in database:', resultId);
      return false;
    }
    
    // Direct database update with stringified JSON
    const { error } = await supabase
      .from('assessment_results')
      .update({
        ai_analysis: analysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId);
    
    if (error) {
      console.error('Error updating analysis directly:', error);
      return false;
    }
    
    // Also update in-memory cache
    analysisCache.set(resultId, analysis);
    
    console.log('Successfully updated analysis directly in database for result:', resultId);
    return true;
  } catch (error) {
    console.error('Error in updateAnalysisDirectly:', error);
    return false;
  }
}

/**
 * For admin access - retrieves all cached analyses for a user
 */
export async function getUserBehaviorReports(userId: string) {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select(`
        id,
        created_at,
        results,
        ai_analysis,
        assessment_responses!inner (
          responses,
          completed_at,
          assessments!inner (
            type,
            title
          )
        )
      `)
      .eq('user_id', userId)
      .eq('assessment_responses.assessments.type', 'behavior')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user behavior reports:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserBehaviorReports:', error);
    throw error;
  }
}

/**
 * Repair broken analysis data in the database
 * This function scans for results with invalid AI analysis and fixes them
 */
export async function repairBrokenAnalysisData(): Promise<{fixed: number, total: number}> {
  try {
    // Get all behavior results with potential AI analysis
    const { data, error } = await supabase
      .from('assessment_results')
      .select(`
        id,
        ai_analysis,
        assessment_responses!inner (
          assessments!inner (
            type
          )
        )
      `)
      .eq('assessment_responses.assessments.type', 'behavior');
    
    if (error) {
      console.error('Error fetching results to repair:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return { fixed: 0, total: 0 };
    }
    
    let fixedCount = 0;
    
    // Check each result for broken analysis
    for (const result of data) {
      try {
        // Skip if no analysis
        if (!result.ai_analysis) continue;
        
        // Check for key properties
        const analysis = result.ai_analysis;
        const needsRepair = !analysis.summary || 
                           !Array.isArray(analysis.strengths) ||
                           !analysis.workStyleInsights;
        
        if (needsRepair) {
          console.log(`Found broken analysis for result ${result.id}, attempting repair`);
          
          // Use example data as repair
          const repairResult = await updateAnalysisDirectly(result.id, exampleAnalysisResponse);
          
          if (repairResult) {
            fixedCount++;
            console.log(`Successfully repaired analysis for result ${result.id}`);
          }
        }
      } catch (itemError) {
        console.error(`Error processing result ${result.id}:`, itemError);
      }
    }
    
    return { fixed: fixedCount, total: data.length };
  } catch (error) {
    console.error('Error in repairBrokenAnalysisData:', error);
    throw error;
  }
}