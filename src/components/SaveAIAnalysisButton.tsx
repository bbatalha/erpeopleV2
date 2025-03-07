import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { updateBehaviorResultWithAI } from '../lib/updateResultsWithAI';

interface SaveAIAnalysisButtonProps {
  resultId: string;
  userName?: string;
  onSuccess?: () => void;
}

export function SaveAIAnalysisButton({ resultId, userName, onSuccess }: SaveAIAnalysisButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAnalysis = async () => {
    if (!resultId) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const success = await updateBehaviorResultWithAI(resultId, userName);
      
      if (success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError('Failed to generate analysis. Please try again.');
      }
    } catch (err) {
      console.error('Error generating AI analysis:', err);
      setError('An error occurred while generating the analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handleGenerateAnalysis}
        disabled={loading}
        className={`inline-flex items-center px-4 py-2 rounded-md border border-transparent
          ${loading
            ? 'bg-indigo-300 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'}
          text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {loading ? 'Generating Analysis...' : 'Generate AI Analysis'}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {success && (
        <p className="mt-2 text-sm text-green-600">Analysis successfully generated!</p>
      )}
    </div>
  );
}