export const RARITY_CONFIGS = {
  Legendaria: {
    border: 'border-orange-500',
    background: 'bg-orange-500/10',
    text: 'text-orange-400'
  },
  Epica: {
    border: 'border-violet-500',
    background: 'bg-violet-500/10',
    text: 'text-violet-400'
  },
  Comun: {
    border: 'border-blue-500',
    background: 'bg-blue-500/10',
    text: 'text-blue-400'
  },
  Carton: {
    border: 'border-amber-900',
    background: 'bg-amber-900/10',
    text: 'text-amber-700'
  }
};

export const getRarityStyles = (rarity: string) => {
  const config = RARITY_CONFIGS[rarity as keyof typeof RARITY_CONFIGS];
  return `${config.border} ${config.background}`;
};

export const getRarityTextColor = (rarity: string) => {
  return RARITY_CONFIGS[rarity as keyof typeof RARITY_CONFIGS].text;
};