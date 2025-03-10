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
 * Function to parse OpenAI response
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
 * Comprehensive example of a complete behavior analysis response for fallback
 */
export const exampleAnalysisResponse = {
  "summary": "O perfil comportamental analisado revela uma pessoa naturalmente colaborativa e orientada às pessoas, com tendência a ser metódica e analítica. Sua abordagem equilibrada entre assumir riscos e cautela demonstra maturidade em processos decisórios, enquanto sua forte inclinação para consistência sugere valorização de estabilidade e previsibilidade. Nota-se também sua predileção por harmonia e construção de relacionamentos, o que o torna particularmente valioso em ambientes que requerem trabalho em equipe e processos bem estabelecidos. Esse conjunto de características forma um profissional que provavelmente se destaca na implementação cuidadosa de projetos, mantendo bons relacionamentos interpessoais enquanto garante qualidade e eficiência.",
  
  "strengths": [
    "Capacidade excepcional de construir e manter relacionamentos profissionais positivos",
    "Confiabilidade e consistência na entrega de resultados",
    "Abordagem equilibrada e madura em relação à tomada de riscos",
    "Habilidade para trabalho metódico com alto padrão de qualidade",
    "Forte orientação para colaboração e trabalho em equipe"
  ],
  
  "developmentAreas": [
    "Encontrar oportunidades para aplicar pensamento criativo e inovador quando apropriado",
    "Desenvolver maior flexibilidade para se adaptar a ambientes de trabalho em constante mudança",
    "Cultivar assertividade em momentos que exigem posicionamento mais firme",
    "Balancear a orientação aos detalhes com visão mais estratégica em situações complexas"
  ],
  
  "workStyleInsights": "O estilo de trabalho apresentado caracteriza-se pela meticulosidade e atenção aos relacionamentos. A preferência por estabilidade indica valorização de ambientes previsíveis com processos claros. Sua tendência à consistência, combinada com abordagem colaborativa, o posiciona como alguém que busca qualidade e harmonia simultaneamente. Este é um perfil particularmente adequado para funções que exigem confiabilidade, precisão e manutenção de boas relações com stakeholders, como gerenciamento de processos, operações ou funções de suporte especializado.",
  
  "teamDynamicsInsights": "Em contextos de equipe, este perfil provavelmente se destaca como um colaborador confiável que contribui positivamente para o clima interpessoal e a qualidade das entregas. Sua natureza amigável facilita a comunicação, enquanto sua consistência permite que assuma responsabilidade por processos importantes. Em situações de conflito, tende a adotar uma abordagem conciliadora, buscando soluções que preservem relacionamentos. Sua estabilidade o torna um elemento importante em equipes, proporcionando continuidade e confiabilidade. Para maximizar seu potencial em dinâmicas de grupo, este perfil se beneficiaria de ambientes que valorizam tanto relacionamentos positivos quanto excelência técnica.",
  
  "traitDescriptions": {
    "1": "A tendência para ser amigável em vez de crítico se manifesta em uma abordagem primariamente orientada às pessoas. Isso sugere priorização de harmonia e relacionamentos positivos, possivelmente buscando consenso e mediação em situações de tensão. Este traço é particularmente valioso em funções que requerem colaboração e construção de relacionamentos, embora em algumas situações possa se beneficiar de uma abordagem mais direta quando necessário para impulsionar melhorias.",
    
    "5": "A forte tendência para consistência em vez de criatividade revela uma preferência significativa por ambientes estáveis e processos previsíveis. Este traço o torna extremamente confiável em termos de manutenção de padrões e procedimentos estabelecidos, sendo particularmente valioso em funções que exigem precisão e conformidade. Contudo, em situações que demandam inovação ou soluções não convencionais, pode se beneficiar do desenvolvimento deliberado de abordagens mais criativas.",
    
    "7": "O equilíbrio entre assumir riscos e ser cauteloso demonstra uma abordagem ponderada frente a situações de incerteza. Esta característica sugere maturidade decisória, permitindo avaliar oportunidades com otimismo realista. Em contextos profissionais, este traço se traduz em decisões que nem são excessivamente conservadoras nem imprudentemente arriscadas, representando um valioso ponto médio entre avanço e proteção.",
    
    "3": "A preferência moderada por trabalho em equipe em vez de autonomia indica valorização da colaboração e esforços coletivos. Este traço sugere capacidade de integração e contribuição em dinâmicas de grupo, sendo particularmente valioso em funções que requerem cooperação e alinhamento entre diferentes stakeholders. Esta orientação colaborativa fortalece a capacidade de construir relacionamentos profissionais produtivos.",
    
    "9": "A tendência para análise aprofundada em vez de rapidez indica uma preferência por abordagens meticulosas e bem fundamentadas. Esta característica o torna particularmente eficaz em ambientes que valorizam precisão e qualidade acima da velocidade. Em contextos profissionais, este traço permite identificação de detalhes importantes e consideração cuidadosa de implicações antes da tomada de decisões."
  }
};