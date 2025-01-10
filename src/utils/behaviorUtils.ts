interface Trait {
  id: number
  value: number
  description: string,
  category?: string,
  intensity?: string
}

interface ProfilePattern {
  primary: string
  variations: string[]
  context?: string[]
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

export function getTraitsSummary(traits: Record<number, number>): string {
  const mainTraits = getMainTraits(traits)
  const dominantCategory = getDominantCategory(mainTraits)
  const pattern = profilePatterns[dominantCategory]
  
  if (!pattern) return mainTraits.map(trait => getTraitTendency(trait.id, trait.value)).join(', ')
  
  return `${pattern.primary} ${pattern.variations[Math.floor(Math.random() * pattern.variations.length)]}`
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