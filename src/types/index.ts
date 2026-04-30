/* Types for the DayFlow application */

export interface Category {
  id: string;
  name: string;
  color: string; // HSL string like "174 62% 47%"
  icon: string; // lucide icon name
  dopamineWeight: number; // positive = productive, negative = unproductive
}

export interface ActivityEntry {
  id: string;
  categoryId: string;
  minutes: number;
  timestamp: number; // Date.now()
}

export interface JournalEntry {
  text: string;
  mood: number; // 1-5
}

export interface DayData {
  date: string; // YYYY-MM-DD
  entries: ActivityEntry[];
  dopamineScore: number;
  journal?: JournalEntry;
  xpEarned?: number; // XP earned this day (for CSV export)
}

export type GoalPeriod = 'daily' | 'weekly';

export interface Goal {
  id: string;
  name: string;
  categoryId: string;
  targetMinutes: number;
  period: GoalPeriod;
  createdAt: number;
  rewardXP: number;
  rewardCoins: number;
}

export interface GoalCompletion {
  goalId: string;
  periodKey: string; // 'YYYY-MM-DD' for daily, 'YYYY-Www' for weekly
  completedAt: number;
}

export interface ActiveTimer {
  startTime: number;        // ms timestamp when started/resumed
  accumulatedMs: number;    // total ms accumulated before current run
  categoryId: string;
  isRunning: boolean;
}

export interface Quest {
  id: string;
  categoryId: string;
  targetMinutes: number;
  title: string;
  rewardCoins: number;
  rewardGems: number;
}

export interface QuestProgress {
  questId: string;
  date: string;
  completed: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'theme' | 'chart-style' | 'category-color' | 'background';
  price: number;
  currency: 'coins' | 'gems';
  value: string; // CSS value or theme name
  preview?: string; // CSS background for preview
}

export interface UserData {
  coins: number;
  gems: number;
  purchasedItems: string[]; // item IDs
  activeTheme: string;
  activeBackground: string;
  streak: number;
  lastActiveDate: string;
  darkMode: boolean;
  xp: number;
  level: number;
}

export interface AppState {
  categories: Category[];
  days: Record<string, DayData>;
  quests: Quest[];
  activeQuests: string[]; // IDs of currently active quests (max 3)
  questProgress: QuestProgress[];
  user: UserData;
  goals: Goal[];
  goalCompletions: GoalCompletion[];
  activeTimer: ActiveTimer | null;
  undoStack: Array<{ type: string; data: unknown }>;
}

/* ===== XP / Level system ===== */
/** XP awarded for various actions */
export const XP_REWARDS = {
  ADD_ACTIVITY: 10,
  COMPLETE_QUEST: 50,
  COMPLETE_GOAL: 75,
  JOURNAL_ENTRY: 15,
} as const;

/** Cumulative XP required to reach each level (index = level). Exponential-ish curve. */
export function xpRequiredForLevel(level: number): number {
  // L1=0, L2=100, L3=250, L4=500, L5=850, L6=1300, L7=1850 ...
  if (level <= 1) return 0;
  return Math.round(50 * level * (level - 1) + 50 * (level - 1));
}

export function levelFromXP(xp: number): { level: number; currentLevelXP: number; nextLevelXP: number; progress: number } {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= xp) level++;
  const currentLevelXP = xpRequiredForLevel(level);
  const nextLevelXP = xpRequiredForLevel(level + 1);
  const progress = (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
  return { level, currentLevelXP, nextLevelXP, progress };
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'nauka', name: 'Nauka', color: '174 62% 47%', icon: 'BookOpen', dopamineWeight: 3 },
  { id: 'sport', name: 'Sport', color: '142 71% 45%', icon: 'Dumbbell', dopamineWeight: 3 },
  { id: 'czytanie', name: 'Czytanie', color: '262 52% 55%', icon: 'Book', dopamineWeight: 2 },
  { id: 'sen', name: 'Sen', color: '220 70% 55%', icon: 'Moon', dopamineWeight: 1 },
  { id: 'praca', name: 'Praca', color: '32 95% 55%', icon: 'Briefcase', dopamineWeight: 2 },
  { id: 'rozrywka', name: 'Rozrywka', color: '340 75% 55%', icon: 'Gamepad2', dopamineWeight: -1 },
  { id: 'social', name: 'Social media', color: '200 80% 50%', icon: 'Smartphone', dopamineWeight: -2 },
  { id: 'jedzenie', name: 'Jedzenie', color: '15 80% 55%', icon: 'UtensilsCrossed', dopamineWeight: 0 },
  { id: 'dojazdy', name: 'Dojazdy', color: '50 85% 50%', icon: 'Car', dopamineWeight: 0 },
  { id: 'inne', name: 'Inne', color: '0 0% 60%', icon: 'MoreHorizontal', dopamineWeight: 0 },
];

/* Full quest pool for rotation system */
export const QUEST_POOL: Quest[] = [
  { id: 'qp1', categoryId: 'czytanie', targetMinutes: 30, title: 'Czytaj 30 min', rewardCoins: 10, rewardGems: 0 },
  { id: 'qp2', categoryId: 'sport', targetMinutes: 45, title: 'Trenuj 45 min', rewardCoins: 15, rewardGems: 1 },
  { id: 'qp3', categoryId: 'nauka', targetMinutes: 60, title: 'Nauka 1h', rewardCoins: 20, rewardGems: 1 },
  { id: 'qp4', categoryId: 'sen', targetMinutes: 420, title: 'Sen minimum 7h', rewardCoins: 15, rewardGems: 0 },
  { id: 'qp5', categoryId: 'social', targetMinutes: 0, title: 'Zero social media przez 2h', rewardCoins: 20, rewardGems: 1 },
  { id: 'qp6', categoryId: 'sport', targetMinutes: 20, title: 'Spacer 20 min', rewardCoins: 8, rewardGems: 0 },
  { id: 'qp7', categoryId: 'nauka', targetMinutes: 20, title: 'Nauka języka 20 min', rewardCoins: 10, rewardGems: 0 },
  { id: 'qp8', categoryId: 'inne', targetMinutes: 10, title: 'Medytacja 10 min', rewardCoins: 10, rewardGems: 1 },
  { id: 'qp9', categoryId: 'czytanie', targetMinutes: 60, title: 'Czytaj 1h', rewardCoins: 20, rewardGems: 1 },
  { id: 'qp10', categoryId: 'sport', targetMinutes: 60, title: 'Trening siłowy 1h', rewardCoins: 20, rewardGems: 1 },
  { id: 'qp11', categoryId: 'nauka', targetMinutes: 90, title: 'Nauka 1.5h', rewardCoins: 25, rewardGems: 2 },
  { id: 'qp12', categoryId: 'praca', targetMinutes: 120, title: 'Praca głęboka 2h', rewardCoins: 25, rewardGems: 2 },
];

export const DEFAULT_QUESTS: Quest[] = QUEST_POOL.slice(0, 3);

export const SHOP_ITEMS: ShopItem[] = [
  // Themes
  { id: 'theme-ocean', name: 'Motyw Ocean', description: 'Chłodne odcienie błękitu', type: 'theme', price: 50, currency: 'coins', value: 'ocean' },
  { id: 'theme-sunset', name: 'Motyw Zachód', description: 'Ciepłe kolory zachodzącego słońca', type: 'theme', price: 50, currency: 'coins', value: 'sunset' },
  { id: 'theme-forest', name: 'Motyw Las', description: 'Naturalne odcienie zieleni', type: 'theme', price: 50, currency: 'coins', value: 'forest' },
  // Backgrounds
  { id: 'bg-dark-gradient', name: 'Dark Gradient', description: 'Ciemny gradient tła', type: 'background', price: 40, currency: 'coins', value: 'dark-gradient', preview: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' },
  { id: 'bg-light-minimal', name: 'Light Minimal', description: 'Jasne minimalistyczne tło', type: 'background', price: 30, currency: 'coins', value: 'light-minimal', preview: 'linear-gradient(180deg, #fafafa, #f0f0f0)' },
  { id: 'bg-purple-neon', name: 'Purple Neon', description: 'Neonowy fiolet', type: 'background', price: 60, currency: 'gems', value: 'purple-neon', preview: 'linear-gradient(135deg, #2d1b69, #11001c, #44107a)' },
  { id: 'bg-ocean-blue', name: 'Ocean Blue', description: 'Odcienie oceanu', type: 'background', price: 50, currency: 'coins', value: 'ocean-blue', preview: 'linear-gradient(135deg, #0c2340, #134e5e, #71b280)' },
  { id: 'bg-forest-green', name: 'Forest Green', description: 'Leśna zieleń', type: 'background', price: 50, currency: 'coins', value: 'forest-green', preview: 'linear-gradient(135deg, #1b4332, #2d6a4f, #52b788)' },
  { id: 'bg-gradient', name: 'Tło Gradient', description: 'Delikatny gradient w tle', type: 'background', price: 30, currency: 'coins', value: 'gradient', preview: 'linear-gradient(135deg, hsl(174 62% 47% / 0.1), hsl(262 52% 55% / 0.1))' },
  { id: 'bg-dots', name: 'Tło Kropki', description: 'Subtelny wzór kropek', type: 'background', price: 30, currency: 'coins', value: 'dots', preview: 'radial-gradient(circle, #ccc 1px, transparent 1px)' },
  // Chart styles
  { id: 'chart-rounded', name: 'Zaokrąglone wykresy', description: 'Wykresy z zaokrąglonymi krawędziami', type: 'chart-style', price: 5, currency: 'gems', value: 'rounded' },
  // Category colors
  { id: 'cat-neon', name: 'Neonowe kategorie', description: 'Jaskrawe kolory kategorii', type: 'category-color', price: 8, currency: 'gems', value: 'neon' },
];

/* Background CSS mapping */
export const BACKGROUND_STYLES: Record<string, string> = {
  'none': 'none',
  'dark-gradient': 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  'light-minimal': 'linear-gradient(180deg, #fafafa, #f0f0f0)',
  'purple-neon': 'linear-gradient(135deg, #2d1b69, #11001c, #44107a)',
  'ocean-blue': 'linear-gradient(135deg, #0c2340, #134e5e, #71b280)',
  'forest-green': 'linear-gradient(135deg, #1b4332, #2d6a4f, #52b788)',
  'gradient': 'linear-gradient(135deg, hsl(174 62% 47% / 0.08), hsl(262 52% 55% / 0.08))',
  'dots': 'radial-gradient(circle, hsl(0 0% 80%) 1px, transparent 1px)',
};
