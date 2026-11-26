import type { Frequency } from './types';

export interface HabitTemplate {
  emoji: string;
  name: string;
  points: number;
  frequency: Frequency;
}

export interface RewardTemplate {
  emoji: string;
  name: string;
  cost: number;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  { emoji: '💧', name: 'Boire 1,5 L d’eau', points: 10, frequency: { type: 'daily' } },
  { emoji: '🏃', name: 'Faire du sport', points: 30, frequency: { type: 'weekly', times: 3 } },
  { emoji: '📚', name: 'Lire 20 minutes', points: 15, frequency: { type: 'daily' } },
  { emoji: '📝', name: 'Devoirs ou révisions', points: 25, frequency: { type: 'days', days: [0, 1, 2, 3, 4] } },
  { emoji: '🛏️', name: 'Au lit avant minuit', points: 15, frequency: { type: 'daily' } },
  { emoji: '🧹', name: 'Ranger ma chambre', points: 20, frequency: { type: 'weekly', times: 1 } },
  { emoji: '📵', name: 'Pas de téléphone au réveil', points: 10, frequency: { type: 'daily' } },
  { emoji: '🍎', name: 'Manger un fruit', points: 10, frequency: { type: 'daily' } },
];

export const REWARD_TEMPLATES: RewardTemplate[] = [
  { emoji: '🎮', name: '1 h de jeu vidéo', cost: 60 },
  { emoji: '🎬', name: 'Soirée film ou série', cost: 120 },
  { emoji: '😴', name: 'Grasse matinée', cost: 150 },
  { emoji: '🍕', name: 'Commander à manger', cost: 300 },
  { emoji: '🛍️', name: 'Un petit achat plaisir', cost: 500 },
  { emoji: '🕹️', name: 'Un nouveau jeu', cost: 1500 },
];

export const EMOJI_CHOICES = ['💧', '🏃', '📚', '📝', '🛏️', '🧹', '📵', '🍎', '🧘', '🎸', '💻', '🦷', '🚶', '🥗', '🧠', '💪', '🎨', '🌱', '📖', '🗣️'];
export const REWARD_EMOJIS = ['🎮', '🎬', '😴', '🍕', '🛍️', '🕹️', '🍔', '🎧', '🍦', '☕', '🎟️', '👟', '📱', '🎁', '🍫', '🏖️'];
