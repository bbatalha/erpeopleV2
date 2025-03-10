import { callOpenAIAssistant, callOpenAICompletion } from '../lib/openai';

interface Trait {
  id: number
  value: number
  description: string
  category?: string
  intensity?: string
}

interface ProfilePattern {
  primary: string
  variations: string[]
  context?: string[]
}

// Define an interface for our OpenAI request
interface BehaviorAnalysisRequest {
  traits: Record<number, number>;
  profileName?: string;
  traitMetadata: Record<number, {
    id: number;
    leftTrait: string;
    rightTrait: string;
    category: string;
  }>;
  frequencyTraits?: Record<string, number>;
  assessmentDate: string;
}

// Define an interface for OpenAI response
interface BehaviorAnalysisResponse {
  summary: string;
  strengths: string[];
  developmentAreas: string[];
  workStyleInsights: string;
  teamDynamicsInsights: string;
  traitDescriptions: Record<number, string>;
}

const profilePatterns: Record<string, ProfilePattern> = {
  collaborative: {
    primary: "Com base na análise realizada, seus principais traços comportamentais incluem uma forte tendência para colaboração em equipe",
    variations: [
      "demonstrando particular facilidade para trabalho em grupo e construção de relacionamentos profissionais",
      "com ênfase especial na capacidade de integrar e fortalecer equipes",
      "destacando-se na habilidade de promover cooperação e sinergia no ambiente profissional"
    ],
    context: [
      "ambientes que valorizam trabalho em equipe",
      "projetos que demandam forte integração",
      "situações que requerem construção de consenso"
    ]
  },
  analytical: {
    primary: "Sua análise demonstra uma orientação predominantemente analítica",
    variations: [
      "com forte inclinação para abordagens estruturadas e baseadas em dados",
      "evidenciando capacidade superior de análise e pensamento sistemático",
      "demonstrando particular aptidão para avaliação detalhada e tomada de decisão fundamentada"
    ],
    context: [
      "contextos que exigem análise aprofundada",
      "situações que demandam precisão e atenção aos detalhes",
      "ambientes que valorizam decisões baseadas em dados"
    ]
  },
  strategic: {
    primary: "Seu perfil indica uma forte orientação estratégica",
    variations: [
      "com notável capacidade de planejamento e visão de longo prazo",
      "demonstrando habilidade natural para pensar sistematicamente",
      "evidenciando aptidão para análise e planejamento estratégico"
    ],
    context: [
      "ambientes que requerem visão estratégica",
      "projetos de longo prazo e alta complexidade",
      "situações que demandam pensamento sistêmico"
    ]
  },
  innovative: {
    primary: "Sua análise revela um perfil marcadamente inovador",
    variations: [
      "com forte capacidade de gerar novas ideias e soluções criativas",
      "demonstrando natural aptidão para inovação e pensamento original",
      "evidenciando habilidade especial para abordagens não convencionais"
    ],
    context: [
      "ambientes que valorizam inovação",
      "projetos que demandam soluções criativas",
      "situações que requerem pensamento disruptivo"
    ]
  }
}

interface TraitInteraction {
  strength: number
  type: 'reinforcing' | 'complementary' | 'conflicting'
  description: string
}

function calculateTraitInteraction(trait1: Trait, trait2: Trait): TraitInteraction {
  const strengthDiff = Math.abs(trait1.value - trait2.value)
  const avgStrength = (trait1.value + trait2.value) / 2
  
  if (strengthDiff < 0.5) {
    return {
      strength: 1 - strengthDiff,
      type: 'reinforcing',
      description: 'Traços que se reforçam mutuamente'
    }
  }
  
  if (avgStrength > 3.5 || avgStrength < 2.5) {
    return {
      strength: strengthDiff / 5,
      type: 'complementary',
      description: 'Traços que se complementam'
    }
  }
  
  return {
    strength: strengthDiff / 3,
    type: 'conflicting',
    description: 'Traços que podem gerar tensão'
  }
}

export function getMainTraits(traits: Record<number, number>): Trait[] {
  const traitArray = Object.entries(traits).map(([id, value]) => ({
    id: Number(id),
    value,
    description: getTraitTendency(Number(id), value),
    category: getTraitCategory(Number(id)),
    intensity: getTraitIntensity(value)
  }))

  return traitArray
    .sort((a, b) => Math.abs(b.value - 3) - Math.abs(a.value - 3))
    .slice(0, 3)
}

// This function will be enhanced to use OpenAI when available
export function getTraitsSummary(traits: Record<number, number>, userName?: string): string {
  const mainTraits = getMainTraits(traits)
  const dominantCategory = getDominantCategory(mainTraits)
  const pattern = profilePatterns[dominantCategory]
  
  if (!pattern) return mainTraits.map(trait => getTraitTendency(trait.id, trait.value)).join(', ')
  
  return `${pattern.primary} ${pattern.variations[Math.floor(Math.random() * pattern.variations.length)]}`
}

/**
 * Prepares data to send to OpenAI for behavior analysis
 * This function organizes trait data with metadata for OpenAI to analyze
 */
function prepareOpenAIRequest(
  traits: Record<number, number>, 
  frequencyTraits?: Record<string, number>,
  userName?: string
): BehaviorAnalysisRequest {
  // Create trait metadata mapping for context
  const traitMetadata: Record<number, any> = {};
  
  // Add metadata for each trait (what the low and high values mean)
  Object.keys(traits).forEach(idStr => {
    const id = Number(idStr);
    const traitData = getTraitMetadata(id);
    traitMetadata[id] = {
      id,
      leftTrait: traitData.leftTrait,
      rightTrait: traitData.rightTrait,
      category: getTraitCategory(id),
      value: traits[id]
    };
  });
  
  return {
    traits,
    profileName: userName,
    traitMetadata,
    frequencyTraits,
    assessmentDate: new Date().toISOString()
  };
}

/**
 * Check if a behavior analysis result already exists in the database for a user
 * 
 * @param resultId - The ID of the assessment result
 * @returns Promise resolving to the analysis data if found, or null if not found
 */
async function checkExistingAnalysis(resultId: string): Promise<BehaviorAnalysisResponse | null> {
  try {
    // Import supabase client dynamically to avoid circular dependencies
    const { supabase } = await import('../lib/supabase');
    
    // Query database for existing analysis
    const { data, error } = await supabase
      .from('assessment_results')
      .select('ai_analysis')
      .eq('id', resultId)
      .single();
    
    if (error) {
      console.warn('Error checking for existing analysis:', error);
      return null;
    }
    
    // If we found valid analysis data, return it
    if (data?.ai_analysis) {
      console.log('Found existing behavior analysis in database');
      return data.ai_analysis as BehaviorAnalysisResponse;
    }
    
    // No existing analysis found
    return null;
  } catch (error) {
    console.error('Error in checkExistingAnalysis:', error);
    return null;
  }
}

/**
 * Save behavior analysis results to the database
 * 
 * @param resultId - The ID of the assessment result
 * @param analysis - The analysis data to save
 * @returns Promise resolving to boolean indicating success
 */
async function saveAnalysisToDatabase(
  resultId: string, 
  analysis: BehaviorAnalysisResponse
): Promise<boolean> {
  try {
    // Import supabase client dynamically to avoid circular dependencies
    const { supabase } = await import('../lib/supabase');
    
    // Update the assessment result with AI analysis
    const { error } = await supabase
      .from('assessment_results')
      .update({
        ai_analysis: analysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId);
    
    if (error) {
      console.error('Error saving analysis to database:', error);
      return false;
    }
    
    console.log('Successfully saved behavior analysis to database');
    return true;
  } catch (error) {
    console.error('Error in saveAnalysisToDatabase:', error);
    return false;
  }
}

/**
 * Function that calls OpenAI API for behavior analysis
 * 
 * This uses the OpenAI client to generate a detailed behavior analysis
 * based on the user's trait scores
 */
export async function getOpenAIBehaviorAnalysis(
  traits: Record<number, number>,
  frequencyTraits?: Record<string, number>,
  userName?: string,
  resultId?: string // Optional - if provided, will check for existing results first
): Promise<BehaviorAnalysisResponse | null> {
  try {
    // Check if there are enough traits to analyze
    if (!traits || Object.keys(traits).length === 0) {
      console.warn('Not enough traits to analyze');
      return null;
    }
    
    // If resultId is provided, check for existing analysis in database
    if (resultId) {
      console.log('Checking for existing analysis for result ID:', resultId);
      const existingAnalysis = await checkExistingAnalysis(resultId);
      
      if (existingAnalysis) {
        console.log('Using existing analysis from database');
        return existingAnalysis;
      }
      
      console.log('No existing analysis found, generating new one');
    }
    
    // Import dynamic modules
    const { generateBehaviorAnalysisPrompt, parseBehaviorAnalysisResponse, exampleAnalysisResponse } = await import('./openaiPrompt');
    
    // Prepare the request data and generate prompt
    const requestData = prepareOpenAIRequest(traits, frequencyTraits, userName);
    const prompt = generateBehaviorAnalysisPrompt(
      traits,
      requestData.traitMetadata,
      frequencyTraits,
      userName
    );
    
    console.log('Sending behavior traits to OpenAI for analysis');
    
    // Try using the direct API first, as it's more reliable
    try {
      const responseText = await callOpenAICompletion({
        prompt: prompt
      });
      
      // Parse the response text into structured data
      const parsedResponse = parseBehaviorAnalysisResponse(responseText);
      
      // Validate the response structure
      if (!parsedResponse || !parsedResponse.summary) {
        console.error('Invalid response structure from OpenAI direct API:', parsedResponse);
        return exampleAnalysisResponse;
      }
      
      console.log('Received valid behavior analysis from OpenAI direct API');
      
      // If resultId is provided, save the analysis to the database
      if (resultId) {
        await saveAnalysisToDatabase(resultId, parsedResponse);
      }
      
      return parsedResponse;
    } catch (directApiError) {
      console.warn('Direct API failed, falling back to assistant API:', directApiError);
      
      // Fall back to assistant API
      try {
        const responseText = await callOpenAIAssistant({
          prompt: { prompt }
        });
        
        // Parse the response text into structured data
        const parsedResponse = parseBehaviorAnalysisResponse(responseText);
        
        // Validate the response structure
        if (!parsedResponse || !parsedResponse.summary) {
          console.error('Invalid response structure from OpenAI Assistant:', parsedResponse);
          return exampleAnalysisResponse;
        }
        
        console.log('Received valid behavior analysis from OpenAI Assistant');
        
        // If resultId is provided, save the analysis to the database
        if (resultId) {
          await saveAnalysisToDatabase(resultId, parsedResponse);
        }
        
        return parsedResponse;
      } catch (assistantError) {
        console.error('Assistant API also failed:', assistantError);
        return exampleAnalysisResponse;
      }
    }
  } catch (error) {
    console.error('Error calling OpenAI for behavior analysis:', error);
    
    // For production, use example data as fallback
    if (import.meta.env.PROD) {
      const { exampleAnalysisResponse } = await import('./openaiPrompt');
      return exampleAnalysisResponse;
    }
    
    return null;
  }
}

function getDominantCategory(traits: Trait[]): string {
  const categoryCount: Record<string, number> = {}
  traits.forEach(trait => {
    if (trait.category) {
      categoryCount[trait.category] = (categoryCount[trait.category] || 0) + 1
    }
  })
  
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    [0]?.[0] || 'general'
}

function getTraitCategory(id: number): string {
  const categories: Record<number, string> = {
    1: 'analytical',
    2: 'strategic',
    3: 'collaboration',
    4: 'communication',
    5: 'innovation',
    29: 'adaptability',
    6: 'execution',
    7: 'risk',
    8: 'leadership',
    9: 'decision',
    10: 'emotional'
  }
  return categories[id] || 'general'
}

function getTraitIntensity(value: number): string {
  if (value <= 1.5) return 'very_high'
  if (value <= 2.5) return 'high'
  if (value >= 4.5) return 'very_high'
  if (value >= 3.5) return 'high'
  return 'balanced'
}

export function getTraitTendency(id: number, value: number): string {
  const tendencies: Record<number, [string, string]> = {
    1: ['análise crítica e objetividade', 'construção de relacionamentos e empatia'],
    2: ['busca por excelência e qualidade', 'foco em agilidade e eficiência'],
    3: ['autonomia e independência', 'colaboração e trabalho em equipe'],
    4: ['diplomacia e abordagem tática', 'comunicação direta e assertiva'],
    5: ['inovação e pensamento criativo', 'estabilidade e consistência'],
    6: ['lealdade e compromisso', 'pragmatismo e praticidade'],
    7: ['disposição para assumir riscos', 'cautela e prudência'],
    8: ['assertividade e expressão direta', 'modéstia e discrição'],
    9: ['rapidez na execução', 'profundidade analítica'],
    10: ['sensibilidade e intuição emocional', 'racionalidade e lógica'],
    11: ['capacidade de seguir diretrizes', 'habilidade de liderança'],
    12: ['flexibilidade e adaptabilidade', 'foco em estabilidade e consistência'],
    13: ['abordagem metódica e estruturada', 'espontaneidade e flexibilidade'],
    14: ['aderência a regras e processos', 'inovação e criatividade'],
    15: ['visão de futuro e planejamento', 'foco no presente e ação imediata'],
    16: ['foco em impacto e transformação', 'orientação para resultados financeiros'],
    17: ['otimismo e positividade', 'realismo e pragmatismo'],
    18: ['valorização do processo', 'foco no objetivo final'],
    19: ['escuta ativa e receptividade', 'expressão e comunicação ativa'],
    20: ['ambição e busca por crescimento', 'tranquilidade e satisfação'],
    21: ['discrição e introspecção', 'transparência e abertura'],
    22: ['tolerância e compreensão', 'exigência e rigor'],
    23: ['aprendizado independente', 'aprendizado estruturado'],
    24: ['foco no cliente e suas necessidades', 'foco nos objetivos organizacionais'],
    25: ['proatividade e iniciativa', 'reatividade e resposta a demandas'],
    26: ['orientação para resultados', 'orientação para processos'],
    27: ['extroversão e sociabilidade', 'introversão e reflexão'],
    28: ['informalidade e descontração', 'atenção e formalidade'],
    29: ['inovação e mudança', 'tradição e estabilidade'],
    30: ['dedicação intensa ao trabalho', 'equilíbrio e relaxamento'],
    31: ['flexibilidade e despreocupação', 'precisão e atenção aos detalhes'],
    32: ['criatividade e fluidez', 'ordem e perfeição'],
    33: ['organização e estrutura', 'flexibilidade e adaptabilidade'],
    34: ['ação rápida e instintiva', 'ponderação e análise'],
    35: ['rigor e disciplina', 'leveza e descontração']
  }

  const [left, right] = tendencies[id] || ['', '']
  
  const intensity = value <= 1.5 ? 'forte tendência para ' :
                   value <= 2.5 ? 'tendência moderada para ' :
                   value >= 4.5 ? 'forte tendência para ' :
                   value >= 3.5 ? 'tendência moderada para ' :
                   'equilíbrio entre '
  
  return intensity + (value <= 3 ? left : right)
}

/**
 * Get detailed metadata about a specific trait 
 * This is used to provide context to the OpenAI model
 */
function getTraitMetadata(id: number): {leftTrait: string, rightTrait: string} {
  const traitMetadata: Record<number, {leftTrait: string, rightTrait: string}> = {
    1: {leftTrait: 'Crítico', rightTrait: 'Amigável'},
    2: {leftTrait: 'Orientado à qualidade', rightTrait: 'Orientado à velocidade'},
    3: {leftTrait: 'Autônomo', rightTrait: 'Trabalho em equipe'},
    4: {leftTrait: 'Diplomático', rightTrait: 'Honesto'},
    5: {leftTrait: 'Criativo', rightTrait: 'Consistente'},
    6: {leftTrait: 'Leal', rightTrait: 'Pragmático'},
    7: {leftTrait: 'Assume riscos', rightTrait: 'Cauteloso'},
    8: {leftTrait: 'Assertivo', rightTrait: 'Modesto'},
    9: {leftTrait: 'Rápido', rightTrait: 'Analítico'},
    10: {leftTrait: 'Emocional', rightTrait: 'Racional'},
    11: {leftTrait: 'Seguidor', rightTrait: 'Líder'},
    12: {leftTrait: 'Adaptável', rightTrait: 'Estável'},
    13: {leftTrait: 'Metódico', rightTrait: 'Espontâneo'},
    14: {leftTrait: 'Orientado a regras', rightTrait: 'Inovador'},
    15: {leftTrait: 'Focado no futuro', rightTrait: 'Focado no presente'},
    16: {leftTrait: 'Focado em impacto', rightTrait: 'Focado em lucro'},
    17: {leftTrait: 'Otimista', rightTrait: 'Realista'},
    18: {leftTrait: 'Focado na jornada', rightTrait: 'Focado no destino'},
    19: {leftTrait: 'Ouvinte', rightTrait: 'Comunicativo'},
    20: {leftTrait: 'Ambicioso', rightTrait: 'Tranquilo'},
    21: {leftTrait: 'Reservado', rightTrait: 'Transparente'},
    22: {leftTrait: 'Tolerante', rightTrait: 'Exigente'},
    23: {leftTrait: 'Autodidata', rightTrait: 'Adepto do aprendizado formal'},
    24: {leftTrait: 'Focado no cliente', rightTrait: 'Focado na empresa'},
    25: {leftTrait: 'Proativo', rightTrait: 'Reativo'},
    26: {leftTrait: 'Orientado a resultados', rightTrait: 'Orientado a regras'},
    27: {leftTrait: 'Extrovertido', rightTrait: 'Introvertido'},
    28: {leftTrait: 'Casual', rightTrait: 'Atento'},
    29: {leftTrait: 'Inovador', rightTrait: 'Tradicional'},
    30: {leftTrait: 'Trabalhador', rightTrait: 'Relaxado'},
    31: {leftTrait: 'Despreocupado', rightTrait: 'Preciso'},
    32: {leftTrait: 'Caótico', rightTrait: 'Perfeccionista'},
    33: {leftTrait: 'Organizado', rightTrait: 'Desestruturado'},
    34: {leftTrait: 'Impulsivo', rightTrait: 'Deliberado'},
    35: {leftTrait: 'Rigoroso', rightTrait: 'Descontraído'}
  };
  
  return traitMetadata[id] || {leftTrait: 'Unknown', rightTrait: 'Unknown'};
}

export function getTraitDescription(id: number, value: number): string {
  const descriptions: Record<number, [string, string]> = {
    1: ['abordagem analítica e objetiva', 'foco em relacionamentos e pessoas'],
    2: ['priorização da qualidade e precisão', 'ênfase em velocidade e resultados rápidos'],
    3: ['autonomia e trabalho independente', 'colaboração e sinergia em equipe'],
    4: ['tato diplomático e cautela', 'comunicação direta e assertiva'],
    5: ['estabilidade e previsibilidade', 'inovação e mudança'],
    6: ['demonstra forte lealdade e comprometimento', 'prioriza abordagens práticas e resultados'],
    7: ['disposição para explorar novas possibilidades', 'preferência por decisões seguras'],
    8: ['comunicação direta e assertiva', 'abordagem modesta e colaborativa'],
    9: ['foco em execução rápida', 'ênfase em análise detalhada'],
    10: ['decisões baseadas em intuição e emoção', 'abordagem racional e analítica'],
    11: ['habilidade de seguir e implementar', 'capacidade de liderar e direcionar'],
    12: ['capacidade de adaptação a mudanças', 'preferência por estabilidade'],
    13: ['abordagem sistemática e organizada', 'flexibilidade e adaptabilidade'],
    14: ['valorização de estruturas e regras', 'busca por inovação e mudança'],
    15: ['planejamento e visão de longo prazo', 'foco em ações e resultados imediatos'],
    16: ['priorização de impacto social', 'foco em resultados financeiros'],
    17: ['visão positiva e otimista', 'abordagem realista e prática'],
    18: ['valorização do processo de desenvolvimento', 'foco em objetivos finais'],
    19: ['habilidade de escuta e compreensão', 'capacidade de comunicação e expressão'],
    20: ['busca constante por crescimento', 'satisfação com o estado atual'],
    21: ['preferência por discrição', 'abertura e transparência'],
    22: ['abordagem compreensiva e tolerante', 'postura exigente e rigorosa'],
    23: ['preferência por autoaprendizagem', 'valorização de estruturas formais'],
    24: ['priorização das necessidades do cliente', 'foco em objetivos organizacionais'],
    25: ['iniciativa e antecipação', 'resposta a demandas estabelecidas'],
    26: ['foco em alcançar objetivos', 'aderência a processos estabelecidos'],
    27: ['facilidade com interações sociais', 'preferência por reflexão individual'],
    28: ['abordagem casual e relaxada', 'atenção e formalidade'],
    29: ['busca por inovação e mudança', 'valorização de métodos estabelecidos'],
    30: ['alta dedicação e comprometimento', 'busca por equilíbrio trabalho-vida'],
    31: ['flexibilidade com detalhes', 'atenção minuciosa à precisão'],
    32: ['aceitação de fluidez e mudança', 'busca por ordem e perfeição'],
    33: ['preferência por estrutura e organização', 'adaptabilidade a ambientes dinâmicos'],
    34: ['tomada de decisão rápida e intuitiva', 'análise cuidadosa antes da ação'],
    35: ['disciplina e rigor metodológico', 'abordagem leve e flexível']
  }

  const [left, right] = descriptions[id] || ['', '']
  
  const intensity = value <= 1.5 ? 'Demonstra forte ' :
                   value <= 2.5 ? 'Apresenta tendência para ' :
                   value >= 4.5 ? 'Demonstra forte ' :
                   value >= 3.5 ? 'Apresenta tendência para ' :
                   'Mantém equilíbrio entre '
  
  return intensity + (value <= 3 ? left : right)
}