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

export interface DayData {
  date: string; // YYYY-MM-DD
  entries: ActivityEntry[];
  dopamineScore: number;
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
}

export interface AppState {
  categories: Category[];
  days: Record<string, DayData>;
  quests: Quest[];
  questProgress: QuestProgress[];
  user: UserData;
  undoStack: Array<{ type: string; data: unknown }>;
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

export const DEFAULT_QUESTS: Quest[] = [
  { id: 'q1', categoryId: 'czytanie', targetMinutes: 30, title: 'Czytaj 30 min', rewardCoins: 10, rewardGems: 0 },
  { id: 'q2', categoryId: 'sport', targetMinutes: 45, title: 'Trenuj 45 min', rewardCoins: 15, rewardGems: 1 },
  { id: 'q3', categoryId: 'nauka', targetMinutes: 60, title: 'Nauka 1h', rewardCoins: 20, rewardGems: 1 },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'theme-ocean', name: 'Motyw Ocean', description: 'Chłodne odcienie błękitu', type: 'theme', price: 50, currency: 'coins', value: 'ocean' },
  { id: 'theme-sunset', name: 'Motyw Zachód', description: 'Ciepłe kolory zachodzącego słońca', type: 'theme', price: 50, currency: 'coins', value: 'sunset' },
  { id: 'theme-forest', name: 'Motyw Las', description: 'Naturalne odcienie zieleni', type: 'theme', price: 50, currency: 'coins', value: 'forest' },
  { id: 'bg-gradient', name: 'Tło Gradient', description: 'Delikatny gradient w tle', type: 'background', price: 30, currency: 'coins', value: 'gradient' },
  { id: 'bg-dots', name: 'Tło Kropki', description: 'Subtelny wzór kropek', type: 'background', price: 30, currency: 'coins', value: 'dots' },
  { id: 'chart-rounded', name: 'Zaokrąglone wykresy', description: 'Wykresy z zaokrąglonymi krawędziami', type: 'chart-style', price: 5, currency: 'gems', value: 'rounded' },
  { id: 'cat-neon', name: 'Neonowe kategorie', description: 'Jaskrawe kolory kategorii', type: 'category-color', price: 8, currency: 'gems', value: 'neon' },
];
