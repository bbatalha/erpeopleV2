#!/usr/bin/env node

/**
 * This script updates existing behavior assessment results with AI analysis
 * Usage: node update-existing-results.js
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Supabase environment variables are not set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateExistingResults() {
  try {
    console.log('Fetching behavior assessment results without AI analysis...');
    
    // Get all behavior results without AI analysis
    const { data: results, error: resultsError } = await supabase
      .from('assessment_results')
      .select(`
        id,
        user_id,
        ai_analysis,
        assessment_responses!inner (
          assessments!inner (
            type
          )
        ),
        profiles!inner (
          full_name
        )
      `)
      .eq('assessment_responses.assessments.type', 'behavior')
      .is('ai_analysis', null);
    
    if (resultsError) {
      throw new Error(`Error fetching results: ${resultsError.message}`);
    }
    
    console.log(`Found ${results.length} behavior assessment results to update with AI analysis`);
    
    // Update each result with AI analysis
    let successCount = 0;
    let failureCount = 0;
    
    for (const result of results) {
      try {
        console.log(`Processing result ${result.id} for user ${result.profiles.full_name || result.user_id}...`);
        
        // Fetch the result details including trait data
        const { data: resultDetails, error: detailsError } = await supabase
          .from('assessment_results')
          .select(`
            id,
            results,
            assessment_responses (
              responses
            )
          `)
          .eq('id', result.id)
          .single();
        
        if (detailsError) {
          throw new Error(`Error fetching result details: ${detailsError.message}`);
        }
        
        // Extract traits and frequencies
        const traits = resultDetails.results?.traits || {};
        const frequencies = resultDetails.results?.frequencies || {};
        
        if (Object.keys(traits).length === 0) {
          console.warn(`No trait data found for result ${result.id}, skipping`);
          failureCount++;
          continue;
        }
        
        // Call the OpenAI analysis function through the Supabase Edge Function
        console.log(`Generating AI analysis for result ${result.id}...`);
        
        // Prepare the prompt
        const prompt = generateBehaviorAnalysisPrompt(
          traits,
          createTraitMetadata(traits),
          frequencies,
          result.profiles?.full_name
        );
        
        // Call the OpenAI API via Edge Function
        const { data: openaiResponse, error: openaiError } = await supabase.functions.invoke(
          'openai-analysis',
          {
            body: { prompt }
          }
        );
        
        if (openaiError) {
          throw new Error(`Error calling OpenAI API: ${openaiError.message}`);
        }
        
        if (!openaiResponse || !openaiResponse.completion) {
          throw new Error('Invalid response from OpenAI API');
        }
        
        // Parse the response
        const analysis = parseOpenAIResponse(openaiResponse.completion);
        
        if (!analysis || !analysis.summary) {
          throw new Error('Failed to parse OpenAI response');
        }
        
        // Update the result with AI analysis
        const { error: updateError } = await supabase
          .from('assessment_results')
          .update({
            ai_analysis: analysis,
            updated_at: new Date().toISOString()
          })
          .eq('id', result.id);
        
        if (updateError) {
          throw new Error(`Error updating result: ${updateError.message}`);
        }
        
        console.log(`Successfully updated result ${result.id} with AI analysis`);
        successCount++;
      } catch (error) {
        console.error(`Error processing result ${result.id}:`, error);
        failureCount++;
      }
    }
    
    console.log(`
      Update complete!
      Successfully updated: ${successCount} results
      Failed: ${failureCount} results
    `);
  } catch (error) {
    console.error('Error updating existing results:', error);
    process.exit(1);
  }
}

// Helper function to parse OpenAI response
function parseOpenAIResponse(responseText) {
  try {
    // Extract JSON content from response (handling potential markdown formatting)
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : responseText;
    
    // Parse the JSON content
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    return null;
  }
}

// Helper function to generate prompt
function generateBehaviorAnalysisPrompt(traits, traitMetadata, frequencyTraits, userName) {
  // Create introductory section
  const intro = `
# Behavior Analysis Request for Professional Development

## Profile Information
${userName ? `Nome: ${userName}` : 'Nome: [Nome do usuário não fornecido]'}
Data da avaliação: ${new Date().toLocaleDateString('pt-BR')}

## Background
Este é um relatório de análise comportamental profissional. O usuário respondeu a um questionário com ${Object.keys(traits).length} perguntas de traços comportamentais em uma escala de 1-5, onde cada extremo representa tendências opostas. ${frequencyTraits ? `Adicionalmente, foram avaliadas ${Object.keys(frequencyTraits).length} frequências de comportamentos específicos.` : ''}

## Instruções
Analise os dados fornecidos e gere um relatório detalhado em português do Brasil sobre o perfil comportamental profissional do usuário. O relatório deve ser escrito em um tom profissional, mas acessível, destacando insights práticos que possam ajudar no desenvolvimento profissional.

Por favor, evite frases genéricas. Base sua análise apenas nos dados fornecidos e enfatize a singularidade do perfil.
`;

  // Format trait data
  let traitsSection = '\n## Dados de Traços Comportamentais\nCada traço é medido em uma escala de 1-5, onde:\n- 1: Forte tendência para o traço da esquerda\n- 3: Equilíbrio entre os traços\n- 5: Forte tendência para o traço da direita\n\n';

  Object.entries(traitMetadata).forEach(([id, metadata]) => {
    const traitId = Number(id);
    const value = traits[traitId] || 3;
    
    traitsSection += `${metadata.leftTrait} (1) vs ${metadata.rightTrait} (5): ${value} [Categoria: ${metadata.category}]\n`;
  });

  // Format frequency data if available
  let frequencySection = '';
  if (frequencyTraits && Object.keys(frequencyTraits).length > 0) {
    frequencySection = '\n## Dados de Frequência de Comportamentos\nCada comportamento é medido em uma escala de 1-5, onde:\n- 1: Nunca\n- 2: Raramente\n- 3: Às vezes\n- 4: Frequentemente\n- 5: Sempre\n\n';
    
    Object.entries(frequencyTraits).forEach(([trait, value]) => {
      frequencySection += `${trait}: ${value}\n`;
    });
  }

  // Expected output format instructions
  const outputFormat = `
## Formato de Saída Esperado
Por favor, estruture sua resposta no seguinte formato JSON:

\`\`\`json
{
  "summary": "Um parágrafo detalhado resumindo o perfil comportamental do usuário",
  "strengths": ["Força 1", "Força 2", "Força 3", "Força 4"],
  "developmentAreas": ["Área de desenvolvimento 1", "Área de desenvolvimento 2", "Área de desenvolvimento 3"],
  "workStyleInsights": "Uma análise do estilo de trabalho baseada nos traços identificados",
  "teamDynamicsInsights": "Como este perfil provavelmente interage em equipes e ambientes colaborativos",
  "traitDescriptions": {
    "1": "Descrição personalizada do traço 1 para este usuário, incluindo como se manifesta e quando é benéfico ou desafiador",
    "2": "Descrição personalizada do traço 2",
    // Outras descrições de traços relevantes...
  }
}
\`\`\`

Observe que o campo 'traitDescriptions' deve conter apenas os 5-7 traços mais significativos ou definidores do perfil, não todos os traços medidos.
`;

  // Combine all sections
  return `${intro}${traitsSection}${frequencySection}${outputFormat}`;
}

// Helper function to create trait metadata
function createTraitMetadata(traits) {
  const traitMetadata = {};
  
  const traitDefinitions = {
    1: { leftTrait: 'Crítico', rightTrait: 'Amigável', category: 'Communication' },
    2: { leftTrait: 'Orientado à qualidade', rightTrait: 'Orientado à velocidade', category: 'Work Style' },
    3: { leftTrait: 'Autônomo', rightTrait: 'Trabalho em equipe', category: 'Collaboration' },
    4: { leftTrait: 'Diplomático', rightTrait: 'Honesto', category: 'Communication' },
    5: { leftTrait: 'Criativo', rightTrait: 'Consistente', category: 'Innovation' },
    6: { leftTrait: 'Leal', rightTrait: 'Pragmático', category: 'Values' },
    7: { leftTrait: 'Assume riscos', rightTrait: 'Cauteloso', category: 'Risk Taking' },
    8: { leftTrait: 'Assertivo', rightTrait: 'Modesto', category: 'Leadership' },
    9: { leftTrait: 'Rápido', rightTrait: 'Analítico', category: 'Decision Making' },
    10: { leftTrait: 'Emocional', rightTrait: 'Racional', category: 'Temperament' },
    // Add more trait definitions as needed
  };
  
  Object.keys(traits).forEach(id => {
    const numId = Number(id);
    traitMetadata[numId] = traitDefinitions[numId] || {
      leftTrait: `Traço ${numId} Esquerdo`,
      rightTrait: `Traço ${numId} Direito`,
      category: 'General'
    };
  });
  
  return traitMetadata;
}

updateExistingResults();