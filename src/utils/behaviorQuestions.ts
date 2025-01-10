interface Question {
  id: number
  type: 'trait' | 'frequency'
  leftTrait?: string
  rightTrait?: string
  trait?: string
}

export const traitQuestions: Question[] = [
  { id: 1, type: 'trait', leftTrait: 'Sempre crítico', rightTrait: 'Sempre amigável' },
  { id: 2, type: 'trait', leftTrait: 'Sempre orientado à qualidade', rightTrait: 'Sempre orientado à velocidade' },
  { id: 3, type: 'trait', leftTrait: 'Sempre autônomo', rightTrait: 'Sempre colaborativo' },
  { id: 4, type: 'trait', leftTrait: 'Sempre diplomático', rightTrait: 'Sempre honesto' },
  { id: 5, type: 'trait', leftTrait: 'Sempre criativo', rightTrait: 'Sempre consistente' },
  { id: 6, type: 'trait', leftTrait: 'Sempre leal', rightTrait: 'Sempre pragmático' },
  { id: 7, type: 'trait', leftTrait: 'Sempre assumindo riscos', rightTrait: 'Sempre cauteloso' },
  { id: 8, type: 'trait', leftTrait: 'Sempre assertivo', rightTrait: 'Sempre modesto' },
  { id: 9, type: 'trait', leftTrait: 'Sempre rápido', rightTrait: 'Sempre analítico' },
  { id: 10, type: 'trait', leftTrait: 'Sempre emocional', rightTrait: 'Sempre racional' },
  { id: 11, type: 'trait', leftTrait: 'Sempre seguindo', rightTrait: 'Sempre liderando' },
  { id: 12, type: 'trait', leftTrait: 'Sempre adaptável', rightTrait: 'Sempre focado em estabilidade' },
  { id: 13, type: 'trait', leftTrait: 'Sempre metódico', rightTrait: 'Sempre espontâneo' },
  { id: 14, type: 'trait', leftTrait: 'Sempre orientado a regras', rightTrait: 'Sempre inovador' },
  { id: 15, type: 'trait', leftTrait: 'Sempre focado no futuro', rightTrait: 'Sempre focado no presente' },
  { id: 16, type: 'trait', leftTrait: 'Sempre focado em impacto', rightTrait: 'Sempre focado em lucro' },
  { id: 17, type: 'trait', leftTrait: 'Sempre otimista', rightTrait: 'Sempre realista' },
  { id: 18, type: 'trait', leftTrait: 'Sempre focado na jornada', rightTrait: 'Sempre focado no destino' },
  { id: 19, type: 'trait', leftTrait: 'Sempre ouvinte', rightTrait: 'Sempre comunicativo' },
  { id: 20, type: 'trait', leftTrait: 'Sempre ambicioso', rightTrait: 'Sempre tranquilo' },
  { id: 21, type: 'trait', leftTrait: 'Sempre reservado', rightTrait: 'Sempre transparente' },
  { id: 22, type: 'trait', leftTrait: 'Sempre tolerante', rightTrait: 'Sempre exigente' },
  { id: 23, type: 'trait', leftTrait: 'Sempre autodidata', rightTrait: 'Sempre adepto do aprendizado formal' },
  { id: 24, type: 'trait', leftTrait: 'Sempre focado no cliente', rightTrait: 'Sempre focado na empresa' },
  { id: 25, type: 'trait', leftTrait: 'Sempre proativo', rightTrait: 'Sempre reativo' },
  { id: 26, type: 'trait', leftTrait: 'Sempre orientado a resultados', rightTrait: 'Sempre orientado a regras' },
  { id: 27, type: 'trait', leftTrait: 'Sempre extrovertido', rightTrait: 'Sempre introvertido' },
  { id: 28, type: 'trait', leftTrait: 'Sempre casual', rightTrait: 'Sempre atento' },
  { id: 29, type: 'trait', leftTrait: 'Sempre inovador', rightTrait: 'Sempre tradicional' },
  { id: 30, type: 'trait', leftTrait: 'Sempre trabalhador', rightTrait: 'Sempre relaxado' },
  { id: 31, type: 'trait', leftTrait: 'Sempre despreocupado', rightTrait: 'Sempre preciso' },
  { id: 32, type: 'trait', leftTrait: 'Sempre caótico', rightTrait: 'Sempre perfeccionista' },
  { id: 33, type: 'trait', leftTrait: 'Sempre organizado', rightTrait: 'Sempre desestruturado' },
  { id: 34, type: 'trait', leftTrait: 'Sempre impulsivo', rightTrait: 'Sempre deliberado' },
  { id: 35, type: 'trait', leftTrait: 'Sempre rigoroso', rightTrait: 'Sempre descontraído' }
]

export const frequencyQuestions: Question[] = [
  { id: 36, type: 'frequency', trait: 'confrontador' },
  { id: 37, type: 'frequency', trait: 'competitivo' },
  { id: 38, type: 'frequency', trait: 'persuasivo' },
  { id: 39, type: 'frequency', trait: 'workaholic' },
  { id: 40, type: 'frequency', trait: 'persistente' }
]