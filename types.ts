
export interface GameState {
  sceneDescription: string;
  choices: Choice[];
  character: Character;
  history: string[];
  currentImage?: string;
  isGenerating: boolean;
  theme: string;
}

export interface Choice {
  id: string;
  text: string;
  action: string;
}

export interface Character {
  name: string;
  health: number;
  inventory: string[];
  stats: {
    strength: number;
    intelligence: number;
    agility: number;
  };
}

export interface AIResponse {
  sceneDescription: string;
  choices: Choice[];
  inventoryUpdate?: string[];
  statChanges?: Partial<Character['stats']>;
  healthChange?: number;
}
