/**
 * This file contains the OpenAI prompt template for behavior trait analysis
 * and utility functions for communicating with the OpenAI API.
 */

/**
 * Generates a prompt for OpenAI to analyze behavior traits
 */
export function generateBehaviorAnalysisPrompt(
  traits: Record<number, number>,
  traitMetadata: Record<number, any>,
  frequencyTraits?: Record<string, number>,
  userName?: string
): string {
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

/**
 * Sample function to parse OpenAI response
 */
export function parseBehaviorAnalysisResponse(responseText: string): any {
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

/**
 * Example of testing the prompt generation
 */
function testPromptGeneration() {
  const sampleTraits = {
    1: 4,  // Amigável (vs Crítico)
    3: 2,  // Autônomo (vs Trabalho em equipe)
    5: 5,  // Consistente (vs Criativo)
    7: 3,  // Equilíbrio entre assumir riscos e ser cauteloso
    9: 1   // Rápido (vs Analítico)
  };
  
  const sampleMetadata: Record<number, any> = {
    1: { leftTrait: 'Crítico', rightTrait: 'Amigável', category: 'Communication' },
    3: { leftTrait: 'Autônomo', rightTrait: 'Trabalho em equipe', category: 'Collaboration' },
    5: { leftTrait: 'Criativo', rightTrait: 'Consistente', category: 'Adaptability' },
    7: { leftTrait: 'Assume riscos', rightTrait: 'Cauteloso', category: 'Risk-taking' },
    9: { leftTrait: 'Rápido', rightTrait: 'Analítico', category: 'Decision-making' }
  };
  
  const sampleFrequencyTraits = {
    'Confrontador': 2,
    'Competitivo': 4
  };
  
  const prompt = generateBehaviorAnalysisPrompt(
    sampleTraits,
    sampleMetadata,
    sampleFrequencyTraits,
    'João Silva'
  );
  
  console.log(prompt);
  return prompt;
}

/**
 * Comprehensive example of a complete behavior analysis response
 */
export const exampleAnalysisResponse = {
  "summary": "O perfil comportamental de João revela uma pessoa naturalmente colaborativa e orientada às pessoas, com tendência a ser metódica e analítica. Sua abordagem equilibrada entre assumir riscos e cautela demonstra maturidade em processos decisórios, enquanto sua forte inclinação para execução rápida sugere dinamismo e eficiência. Nota-se também sua predileção por consistência e previsibilidade em vez de experimentação constante, o que o torna particularmente valioso em ambientes que requerem confiabilidade e processos bem estabelecidos. Esse conjunto de características forma um profissional que provavelmente se destaca na implementação cuidadosa de projetos, mantendo bons relacionamentos interpessoais enquanto garante qualidade e eficiência.",
  
  "strengths": [
    "Capacidade excepcional de construir e manter relacionamentos profissionais positivos",
    "Habilidade para execução rápida e eficiente de tarefas sem comprometer a precisão",
    "Abordagem equilibrada e madura em relação à tomada de riscos",
    "Confiabilidade e consistência na entrega de resultados",
    "Capacidade de trabalhar independentemente com autonomia significativa"
  ],
  
  "developmentAreas": [
    "Encontrar oportunidades para aplicar pensamento criativo e inovador quando apropriado",
    "Desenvolver maior flexibilidade para se adaptar a ambientes de trabalho em constante mudança",
    "Cultivar habilidades de delegação para complementar sua tendência à independência",
    "Balancear a velocidade de execução com análise mais profunda em situações complexas"
  ],
  
  "workStyleInsights": "João apresenta um estilo de trabalho caracterizado pela eficiência e atenção aos relacionamentos. Sua preferência por autonomia indica que provavelmente trabalha bem com supervisão mínima, enquanto sua tendência à consistência sugere que valoriza ambientes previsíveis com processos claros. Sua abordagem rápida, combinada com competitividade moderada, o posiciona como alguém que busca resultados, mas não à custa da harmonia interpessoal. Este é um perfil particularmente adequado para funções que exigem confiabilidade, qualidade e manutenção de boas relações com stakeholders, como gerenciamento de projetos, operações ou funções de suporte ao cliente de alto nível.",
  
  "teamDynamicsInsights": "Em contextos de equipe, João provavelmente se destaca como um colaborador confiável que contribui positivamente para o clima interpessoal. Sua natureza amigável facilita a comunicação, enquanto sua autonomia permite que assuma responsabilidade por suas entregas sem necessidade de monitoramento constante. Em situações de conflito, tende a adotar uma abordagem pacificadora, embora sua competitividade moderada sugira que também pode defender suas posições quando necessário. Sua consistência o torna um elemento estabilizador em equipes, proporcionando continuidade e confiabilidade. Para maximizar seu potencial em dinâmicas de grupo, João se beneficiaria de ambientes que valorizam tanto relacionamentos positivos quanto entrega eficiente de resultados.",
  
  "traitDescriptions": {
    "1": "A tendência de João para ser amigável em vez de crítico se manifesta em sua abordagem primariamente orientada às pessoas. Isso sugere que ele prioriza harmonia e relacionamentos positivos, possivelmente buscando consenso e mediação em situações de tensão. Este traço é particularmente valioso em funções que requerem colaboração e construção de relacionamentos, embora em algumas situações possa se beneficiar de uma abordagem mais direta e crítica quando necessário para impulsionar melhorias.",
    
    "3": "João demonstra uma preferência moderada por autonomia em vez de trabalho em equipe, indicando que se sente confortável trabalhando independentemente e tomando decisões por conta própria. Este traço sugere capacidade de iniciativa e autogestão, sendo particularmente valioso em funções que requerem responsabilidade individual e decisões independentes. No entanto, em contextos altamente colaborativos, João pode precisar fazer um esforço consciente para integrar-se mais ativamente em dinâmicas de equipe.",
    
    "5": "A forte tendência de João para consistência em vez de criatividade revela uma preferência significativa por ambientes estáveis e processos previsíveis. Este traço o torna extremamente confiável em termos de manutenção de padrões e procedimentos estabelecidos, sendo particularmente valioso em funções que exigem precisão e conformidade. Contudo, em situações que demandam inovação ou soluções não convencionais, João pode se beneficiar do desenvolvimento deliberado de abordagens mais criativas.",
    
    "7": "O equilíbrio de João entre assumir riscos e ser cauteloso demonstra uma abordagem ponderada frente a situações de incerteza. Esta característica sugere maturidade decisória, permitindo-lhe avaliar oportunidades com otimismo realista. Em contextos profissionais, este traço se traduz em decisões que nem são excessivamente conservadoras nem imprudentemente arriscadas, representando um valioso ponto médio entre avanço e proteção.",
    
    "9": "A forte orientação de João para rapidez em vez de análise aprofundada indica uma preferência marcante por eficiência e resultados imediatos. Esta característica o torna particularmente eficaz em ambientes dinâmicos que valorizam respostas ágeis e conclusão eficiente de tarefas. No entanto, em situações de alta complexidade ou quando decisões têm implicações de longo prazo, João poderia se beneficiar de desacelerar deliberadamente para incorporar uma análise mais profunda em seu processo."
  }
};