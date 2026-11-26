/** Une date locale au format AAAA-MM-JJ (comparable en tant que texte). */
export type DateKey = string;

export type Frequency =
  | { type: 'daily' }
  /** Jours précis : 0 = lundi … 6 = dimanche */
  | { type: 'days'; days: number[] }
  /** N fois par semaine, n'importe quels jours */
  | { type: 'weekly'; times: number }
  /** Tâche unique : disparaît une fois faite */
  | { type: 'once' };

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  /** Tickets de base, avant le bonus de série */
  points: number;
  frequency: Frequency;
  createdAt: DateKey;
  archived?: boolean;
}

export interface Completion {
  id: string;
  habitId: string;
  date: DateKey;
  /** Tickets réellement gagnés (bonus de série inclus), figés au moment du clic */
  points: number;
  at: number;
}

export interface Reward {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  archived?: boolean;
}

export interface Purchase {
  id: string;
  rewardId: string;
  name: string;
  emoji: string;
  cost: number;
  date: DateKey;
  at: number;
}

export interface FocusSession {
  id: string;
  minutes: number;
  points: number;
  date: DateKey;
  at: number;
}

export interface Settings {
  /** Pseudo affiché dans le bilan à partager */
  name: string;
  /** La journée bascule à cette heure (0 = minuit, 4 = 4 h du matin) */
  dayEndHour: number;
  focusMinutes: number;
  breakMinutes: number;
  focusPoints: number;
  sound: boolean;
}

export interface State {
  version: 1;
  /** Horodatage de la dernière modification, sert à la synchronisation */
  updatedAt: number;
  onboarded: boolean;
  habits: Habit[];
  rewards: Reward[];
  completions: Completion[];
  purchases: Purchase[];
  focus: FocusSession[];
  settings: Settings;
  /** Succès déjà annoncés */
  unlocked: string[];
  /** Dernier niveau annoncé */
  lastLevel: number;
}
