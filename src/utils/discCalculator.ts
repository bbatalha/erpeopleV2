interface DISCResults {
  scores: {
    D: number;
    I: number;
    S: number;
    C: number;
  };
  primaryProfile: string;
  secondaryProfile: string;
  intensity: {
    D: string;
    I: string;
    S: string;
    C: string;
  };
}

export function calculateDISCResults(responses: Record<number, 'D' | 'I' | 'S' | 'C'>): DISCResults {
  if (!responses) {
    return {
      scores: { D: 0, I: 0, S: 0, C: 0 },
      primaryProfile: 'D',
      secondaryProfile: 'I',
      intensity: { D: 'Baixa', I: 'Baixa', S: 'Baixa', C: 'Baixa' }
    }
  }

  // Count responses for each profile
  const counts = { D: 0, I: 0, S: 0, C: 0 }
  Object.values(responses).forEach(profile => {
    counts[profile]++
  })

  // Calculate percentages
  const totalQuestions = Object.keys(responses).length
  const totalResponses = counts.D + counts.I + counts.S + counts.C
  
  // Ensure we're not dividing by zero
  if (totalResponses === 0) {
    return {
      scores: { D: 25, I: 25, S: 25, C: 25 },
      primaryProfile: 'D',
      secondaryProfile: 'I',
      intensity: { D: 'Moderada', I: 'Moderada', S: 'Moderada', C: 'Moderada' }
    }
  }
  
  // Normalize to ensure the values sum to 100%
  const scores = {
    D: (counts.D / totalResponses) * 100,
    I: (counts.I / totalResponses) * 100,
    S: (counts.S / totalResponses) * 100,
    C: (counts.C / totalResponses) * 100
  }
  
  // Verify the sum is 100% (with floating point tolerance)
  const sum = scores.D + scores.I + scores.S + scores.C
  if (Math.abs(sum - 100) > 0.1) {
    console.warn(`DISC scores sum (${sum.toFixed(2)}) is not 100%. Normalizing values.`);
    const factor = 100 / sum;
    scores.D *= factor;
    scores.I *= factor;
    scores.S *= factor;
    scores.C *= factor;
  }

  // Determine primary and secondary profiles
  const sortedProfiles = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([profile]) => profile)

  // Determine intensity levels
  const getIntensity = (percentage: number): string => {
    if (percentage <= 25) return 'Baixa'
    if (percentage <= 50) return 'Moderada'
    if (percentage <= 75) return 'Alta'
    return 'Muito Alta'
  }

  return {
    scores,
    primaryProfile: sortedProfiles[0],
    secondaryProfile: sortedProfiles[1],
    intensity: {
      D: getIntensity(scores.D),
      I: getIntensity(scores.I),
      S: getIntensity(scores.S),
      C: getIntensity(scores.C)
    }
  }
}

interface ProfileDetails {
  stressResponse: string[];
  communicationStyle: string[];
  teamContributions: string[];
  fearsAndInsecurities: string[];
  meetingStyle: string;
  projectStyle: string;
  conflictStyle: string;
  decisionStyle: string;
  careers: string[];
  learningStyle: string[];
}

const profileDetails: Record<string, ProfileDetails> = {
  D: {
    stressResponse: [
      'Torna-se mais autoritário',
      'Aumenta a impaciência',
      'Pode tomar decisões precipitadas',
      'Tendência a ignorar opiniões contrárias',
      'Intensifica a competitividade'
    ],
    communicationStyle: [
      'Direto e objetivo',
      'Foca em resultados e metas',
      'Preferência por mensagens curtas',
      'Tom de voz firme e decisivo',
      'Linguagem corporal dominante'
    ],
    teamContributions: [
      'Estabelece direção clara',
      'Impulsiona mudanças',
      'Toma decisões difíceis',
      'Mantém foco em resultados',
      'Assume responsabilidades'
    ],
    fearsAndInsecurities: [
      'Medo de perder controle',
      'Receio de ser visto como fraco',
      'Temor de falhar publicamente',
      'Insegurança com dependência de outros',
      'Medo de perder autoridade'
    ],
    meetingStyle: 'Quer chegar ao ponto rapidamente',
    projectStyle: 'Foca em resultados e prazos',
    conflictStyle: 'Enfrenta diretamente',
    decisionStyle: 'Decide rapidamente',
    careers: [
      'Empreendedorismo',
      'Gestão executiva',
      'Vendas corporativas',
      'Consultoria estratégica',
      'Gestão de projetos'
    ],
    learningStyle: [
      'Aprendizado prático',
      'Desafios competitivos',
      'Resultados mensuráveis',
      'Autonomia na execução',
      'Feedback direto'
    ]
  },
  I: {
    stressResponse: [
      'Torna-se mais emotivo',
      'Aumenta a dispersão',
      'Pode dramatizar situações',
      'Tendência a falar excessivamente',
      'Busca mais aprovação social'
    ],
    communicationStyle: [
      'Expressivo e animado',
      'Rico em histórias e exemplos',
      'Uso de gestos e expressões faciais',
      'Tom de voz variado e entusiástico',
      'Comunicação informal e pessoal'
    ],
    teamContributions: [
      'Gera entusiasmo',
      'Promove colaboração',
      'Resolve conflitos interpessoais',
      'Traz energia positiva',
      'Facilita networking'
    ],
    fearsAndInsecurities: [
      'Medo de rejeição social',
      'Receio de não ser apreciado',
      'Temor de ambientes muito formais',
      'Insegurança com isolamento',
      'Medo de perder popularidade'
    ],
    meetingStyle: 'Participa ativamente e socializa',
    projectStyle: 'Motiva a equipe e gera ideias',
    conflictStyle: 'Busca harmonizar com humor',
    decisionStyle: 'Considera impacto nas pessoas',
    careers: [
      'Marketing e Publicidade',
      'Relações Públicas',
      'Vendas consultivas',
      'Treinamento e desenvolvimento',
      'Gestão de eventos'
    ],
    learningStyle: [
      'Aprendizado em grupo',
      'Discussões interativas',
      'Apresentações criativas',
      'Networking',
      'Reconhecimento público'
    ]
  },
  S: {
    stressResponse: [
      'Torna-se mais passivo',
      'Aumenta a necessidade de segurança',
      'Pode resistir mais a mudanças',
      'Tendência ao silêncio',
      'Busca mais apoio de outros'
    ],
    communicationStyle: [
      'Calmo e ponderado',
      'Preferência por diálogos um-a-um',
      'Escuta atenta e empática',
      'Tom de voz suave e estável',
      'Comunicação não-confrontacional'
    ],
    teamContributions: [
      'Mantém harmonia',
      'Oferece suporte constante',
      'Garante consistência',
      'Fortalece relacionamentos',
      'Promove cooperação'
    ],
    fearsAndInsecurities: [
      'Medo de mudanças bruscas',
      'Receio de conflitos',
      'Temor de decepcionar outros',
      'Insegurança com pressão',
      'Medo de instabilidade'
    ],
    meetingStyle: 'Ouve atentamente e toma notas',
    projectStyle: 'Mantém organização e consistência',
    conflictStyle: 'Tenta mediar pacificamente',
    decisionStyle: 'Busca consenso',
    careers: [
      'Recursos Humanos',
      'Serviço ao cliente',
      'Gestão operacional',
      'Educação',
      'Suporte técnico'
    ],
    learningStyle: [
      'Aprendizado estruturado',
      'Passo a passo',
      'Prática supervisionada',
      'Ambiente seguro',
      'Feedback construtivo'
    ]
  },
  C: {
    stressResponse: [
      'Torna-se mais analítico',
      'Aumenta o perfeccionismo',
      'Pode paralisar por análise',
      'Tendência ao isolamento',
      'Busca mais informações'
    ],
    communicationStyle: [
      'Preciso e detalhado',
      'Foco em fatos e dados',
      'Preferência por comunicação escrita',
      'Tom de voz moderado',
      'Comunicação formal e estruturada'
    ],
    teamContributions: [
      'Garante qualidade',
      'Previne erros',
      'Desenvolve sistemas',
      'Analisa riscos',
      'Mantém padrões elevados'
    ],
    fearsAndInsecurities: [
      'Medo de estar errado',
      'Receio de críticas à qualidade',
      'Temor de situações ambíguas',
      'Insegurança com improviso',
      'Medo de falhas técnicas'
    ],
    meetingStyle: 'Analisa dados e faz perguntas técnicas',
    projectStyle: 'Cuida de detalhes e qualidade',
    conflictStyle: 'Analisa causas e busca fatos',
    decisionStyle: 'Analisa todas as opções',
    careers: [
      'Finanças e Contabilidade',
      'Tecnologia da Informação',
      'Pesquisa e Desenvolvimento',
      'Controle de Qualidade',
      'Planejamento estratégico'
    ],
    learningStyle: [
      'Aprendizado técnico',
      'Análise detalhada',
      'Documentação completa',
      'Tempo para domínio',
      'Validação de conhecimento'
    ]
  }
}

function getProfileDetails(profile: string): ProfileDetails | null {
  return profileDetails[profile] || null
}

export function getProfileDescription(profile: string): string {
  const descriptions = {
    D: 'Perfil Dominante: Focado em resultados, assertivo e direto. Toma decisões rápidas e enfrenta desafios de frente.',
    I: 'Perfil Influente: Comunicativo, entusiasta e sociável. Motiva pessoas e gera ideias criativas.',
    S: 'Perfil Estável: Paciente, cooperativo e confiável. Mantém a harmonia e oferece suporte consistente.',
    C: 'Perfil Conforme: Preciso, analítico e organizado. Foca em qualidade e atenção aos detalhes.'
  }

  return descriptions[profile as keyof typeof descriptions] || ''
}

function getProfileRecommendations(primary: string, secondary: string): string[] {
  const recommendations: Record<string, string[]> = {
    D: [
      'Pratique escuta ativa e seja mais paciente com outros',
      'Desenvolva empatia e considere o impacto de suas decisões',
      'Equilibre velocidade com precisão'
    ],
    I: [
      'Mantenha o foco em detalhes e prazos',
      'Estruture melhor suas ideias antes de compartilhar',
      'Desenvolva habilidades de organização'
    ],
    S: [
      'Seja mais assertivo ao expressar opiniões',
      'Adapte-se mais rapidamente a mudanças',
      'Tome mais iniciativa em situações desafiadoras'
    ],
    C: [
      'Desenvolva flexibilidade em processos',
      'Pratique comunicação mais expressiva',
      'Tome decisões com menos análise quando necessário'
    ]
  }

  return [
    ...recommendations[primary],
    ...recommendations[secondary].slice(0, 2)
  ]
}