interface Trait {
  id: number
  value: number
  description: string
}

export function getMainTraits(traits: Record<number, number>): Trait[] {
  // Convert traits object to array of {id, value} pairs
  const traitArray = Object.entries(traits).map(([id, value]) => ({
    id: Number(id),
    value,
    description: getTraitTendency(Number(id), value)
  }))

  // Sort by how far the value is from neutral (3)
  return traitArray
    .sort((a, b) => Math.abs(b.value - 3) - Math.abs(a.value - 3))
    .slice(0, 3)
}

export function getTraitsSummary(traits: Record<number, number>): string {
  const mainTraits = getMainTraits(traits)
  const tendencies = mainTraits.map(trait => getTraitTendency(trait.id, trait.value))
  
  return tendencies.join(', ')
}

export function getTraitTendency(id: number, value: number): string {
  const tendencies: Record<number, [string, string]> = {
    1: ['análise crítica e objetiva', 'construção de relacionamentos'],
    2: ['excelência e qualidade', 'agilidade e eficiência'],
    3: ['independência', 'colaboração'],
    4: ['diplomacia e tato', 'comunicação direta'],
    5: ['inovação e criatividade', 'estabilidade e consistência'],
    29: ['inovação e mudança', 'tradição e estabilidade'],
    // Add more tendencies as needed
  }

  const [left, right] = tendencies[id] || ['', '']
  return value <= 3 ? left : right
}

export function getTraitDescription(id: number, value: number): string {
  const descriptions: Record<number, [string, string]> = {
    1: ['tendência à análise', 'tendência ao acolhimento'],
    2: ['foco em velocidade', 'foco em qualidade'],
    3: ['perfil independente', 'perfil colaborativo'],
    4: ['perfil diplomático', 'perfil direto'],
    5: ['perfil estável', 'perfil inovador'],
    29: ['buscar inovação', 'valorizar tradição']
    // Add more descriptions as needed
  }

  const [left, right] = descriptions[id] || ['', '']
  return value <= 3 ? left : right
}