/**
 * Functions to update existing assessment results with AI analysis
 */
import { supabase } from './supabase';
import { getOpenAIBehaviorAnalysis } from '../utils/behaviorUtils';

/**
 * Updates a behavior assessment result with AI analysis
 * 
 * @param resultId The ID of the assessment result to update
 * @param userName Optional user name for personalized analysis
 * @returns Promise resolving to success status
 */
export async function updateBehaviorResultWithAI(resultId: string, userName?: string): Promise<boolean> {
  try {
    console.log(`Starting AI analysis update for result ID: ${resultId}`);
    
    // 1. Fetch the assessment result
    const { data: result, error: resultError } = await supabase
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
        )
      `)
      .eq('id', resultId)
      .single();
    
    if (resultError) {
      console.error('Error fetching assessment result:', resultError);
      return false;
    }
    
    if (!result) {
      console.error('Assessment result not found');
      return false;
    }
    
    // Verify this is a behavior assessment
    const assessmentType = result.assessment_responses?.assessments?.type;
    if (assessmentType !== 'behavior') {
      console.error('Not a behavior assessment:', assessmentType);
      return false;
    }
    
    // 2. Extract traits and frequencies from result data
    const traits = result.results?.traits || {};
    const frequencies = result.results?.frequencies || {};
    
    if (Object.keys(traits).length === 0) {
      console.error('No trait data found in result');
      return false;
    }
    
    // 3. Generate AI analysis
    const analysis = await getOpenAIBehaviorAnalysis(traits, frequencies, userName);
    if (!analysis) {
      console.error('Failed to generate AI analysis');
      return false;
    }
    
    // 4. Update the assessment result with AI analysis
    const { error: updateError } = await supabase
      .from('assessment_results')
      .update({
        ai_analysis: analysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId);
    
    if (updateError) {
      console.error('Error updating assessment result with AI analysis:', updateError);
      return false;
    }
    
    console.log('Successfully updated assessment result with AI analysis');
    return true;
  } catch (error) {
    console.error('Error in updateBehaviorResultWithAI:', error);
    return false;
  }
}

/**
 * Updates all behavior assessment results for a user with AI analysis
 * 
 * @param userId The user ID
 * @param userName Optional user name for personalized analysis
 * @returns Promise resolving to number of successfully updated results
 */
export async function updateAllBehaviorResultsWithAI(userId: string, userName?: string): Promise<number> {
  try {
    console.log(`Starting AI analysis update for all behavior results of user: ${userId}`);
    
    // 1. Fetch all behavior assessment results for the user
    const { data: results, error: resultsError } = await supabase
      .from('assessment_results')
      .select(`
        id,
        assessment_responses!inner (
          assessments!inner (
            type
          )
        )
      `)
      .eq('user_id', userId)
      .eq('assessment_responses.assessments.type', 'behavior');
    
    if (resultsError) {
      console.error('Error fetching behavior assessment results:', resultsError);
      return 0;
    }
    
    console.log(`Found ${results?.length || 0} behavior assessment results to update`);
    
    // 2. Update each result with AI analysis
    let successCount = 0;
    
    if (results && results.length > 0) {
      for (const result of results) {
        const success = await updateBehaviorResultWithAI(result.id, userName);
        if (success) {
          successCount++;
        }
      }
    }
    
    console.log(`Successfully updated ${successCount} of ${results?.length || 0} behavior assessment results`);
    return successCount;
  } catch (error) {
    console.error('Error in updateAllBehaviorResultsWithAI:', error);
    return 0;
  }
}