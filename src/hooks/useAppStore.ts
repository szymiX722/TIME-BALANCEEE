/* LocalStorage-based data store for DayFlow */
import { useState, useEffect, useCallback } from 'react';
import {
  AppState, DayData, ActivityEntry, Category, Quest, QuestProgress,
  DEFAULT_CATEGORIES, QUEST_POOL, UserData
} from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STORAGE_KEY = 'dayflow-data';
const ACTIVE_QUEST_COUNT = 3;

const defaultUser: UserData = {
  coins: 0,
  gems: 0,
  purchasedItems: [],
  activeTheme: 'default',
  activeBackground: 'none',
  streak: 0,
  lastActiveDate: '',
  darkMode: false,
};

/* Pick random quests from pool, excluding given IDs */
function pickRandomQuests(count: number, excludeIds: string[]): string[] {
  const available = QUEST_POOL.filter(q => !excludeIds.includes(q.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(q => q.id);
}

const getInitialState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const state: AppState = {
        categories: parsed.categories || DEFAULT_CATEGORIES,
        days: parsed.days || {},
        quests: QUEST_POOL, // always use full pool
        activeQuests: parsed.activeQuests || [],
        questProgress: parsed.questProgress || [],
        user: { ...defaultUser, ...parsed.user },
        undoStack: [],
      };
      // Ensure 3 active quests
      if (state.activeQuests.length < ACTIVE_QUEST_COUNT) {
        const needed = ACTIVE_QUEST_COUNT - state.activeQuests.length;
        const newPicks = pickRandomQuests(needed, state.activeQuests);
        state.activeQuests = [...state.activeQuests, ...newPicks];
      }
      return state;
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }

  const initialActive = pickRandomQuests(ACTIVE_QUEST_COUNT, []);
  return {
    categories: DEFAULT_CATEGORIES,
    days: {},
    quests: QUEST_POOL,
    activeQuests: initialActive,
    questProgress: [],
    user: defaultUser,
    undoStack: [],
  };
};

export function useAppStore() {
  const [state, setState] = useState<AppState>(getInitialState);

  // Persist to localStorage on state changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const { undoStack, ...toSave } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }, 300);
    return () => clearTimeout(timeout);
  }, [state]);

  // Update streak on mount
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setState(prev => {
      if (prev.user.lastActiveDate === today) return prev;
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      const newStreak = prev.user.lastActiveDate === yesterday ? prev.user.streak + 1 : 1;
      return {
        ...prev,
        user: { ...prev.user, streak: newStreak, lastActiveDate: today }
      };
    });
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');

  const getTodayData = useCallback((): DayData => {
    return state.days[today] || { date: today, entries: [], dopamineScore: 0 };
  }, [state.days, today]);

  const getDayData = useCallback((date: string): DayData => {
    return state.days[date] || { date, entries: [], dopamineScore: 0 };
  }, [state.days]);

  const calculateDopamineScore = useCallback((entries: ActivityEntry[]): number => {
    if (entries.length === 0) return 0;
    const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0);
    if (totalMinutes === 0) return 0;

    let weightedSum = 0;
    entries.forEach(entry => {
      const cat = state.categories.find(c => c.id === entry.categoryId);
      if (cat) {
        weightedSum += cat.dopamineWeight * entry.minutes;
      }
    });

    const maxPossible = 3 * totalMinutes;
    const minPossible = -2 * totalMinutes;
    const normalized = ((weightedSum - minPossible) / (maxPossible - minPossible)) * 100;
    return Math.round(Math.min(100, Math.max(0, normalized)));
  }, [state.categories]);

  /* Get active quest objects */
  const getActiveQuests = useCallback((): Quest[] => {
    return state.activeQuests
      .map(id => QUEST_POOL.find(q => q.id === id))
      .filter((q): q is Quest => !!q);
  }, [state.activeQuests]);

  const addEntry = useCallback((categoryId: string, minutes: number) => {
    setState(prev => {
      const dayData = prev.days[today] || { date: today, entries: [], dopamineScore: 0 };
      const newEntry: ActivityEntry = {
        id: crypto.randomUUID(),
        categoryId,
        minutes,
        timestamp: Date.now(),
      };
      const newEntries = [...dayData.entries, newEntry];
      const dopamineScore = calculateDopamineScore(newEntries);

      // Check quest completion - only for active quests
      let coinsEarned = 0;
      let gemsEarned = 0;
      const newQuestProgress = [...prev.questProgress];
      let newActiveQuests = [...prev.activeQuests];
      const completedQuestTitles: string[] = [];

      prev.activeQuests.forEach(questId => {
        const quest = QUEST_POOL.find(q => q.id === questId);
        if (!quest) return;

        const alreadyCompleted = prev.questProgress.some(
          qp => qp.questId === quest.id && qp.date === today && qp.completed
        );
        if (alreadyCompleted) return;

        const totalForCategory = newEntries
          .filter(e => e.categoryId === quest.categoryId)
          .reduce((s, e) => s + e.minutes, 0);

        if (totalForCategory >= quest.targetMinutes) {
          newQuestProgress.push({ questId: quest.id, date: today, completed: true });
          coinsEarned += quest.rewardCoins;
          gemsEarned += quest.rewardGems;
          completedQuestTitles.push(quest.title);

          // Replace completed quest with a new one
          const excludeIds = newActiveQuests;
          const replacement = pickRandomQuests(1, excludeIds);
          if (replacement.length > 0) {
            newActiveQuests = newActiveQuests.map(id =>
              id === questId ? replacement[0] : id
            );
          }
        }
      });

      // Show toast notifications for completed quests
      if (completedQuestTitles.length > 0) {
        setTimeout(() => {
          completedQuestTitles.forEach(title => {
            toast.success(`🎉 Quest ukończony: ${title}`, {
              description: `+${coinsEarned} 🪙 ${gemsEarned > 0 ? `+${gemsEarned} 💎` : ''}`,
              duration: 4000,
            });
          });
        }, 100);
      }

      return {
        ...prev,
        days: {
          ...prev.days,
          [today]: { ...dayData, entries: newEntries, dopamineScore },
        },
        activeQuests: newActiveQuests,
        questProgress: newQuestProgress,
        user: {
          ...prev.user,
          coins: prev.user.coins + coinsEarned,
          gems: prev.user.gems + gemsEarned,
        },
        undoStack: [...prev.undoStack.slice(-9), {
          type: 'addEntry',
          data: {
            entryId: newEntry.id,
            date: today,
            coinsEarned,
            gemsEarned,
            completedQuestIds: completedQuestTitles.length > 0
              ? newQuestProgress.filter(qp => qp.date === today && qp.completed).map(qp => qp.questId)
              : [],
            previousActiveQuests: prev.activeQuests,
          }
        }],
      };
    });
  }, [today, calculateDopamineScore]);

  const removeEntry = useCallback((date: string, entryId: string) => {
    setState(prev => {
      const dayData = prev.days[date];
      if (!dayData) return prev;
      const newEntries = dayData.entries.filter(e => e.id !== entryId);
      const dopamineScore = calculateDopamineScore(newEntries);
      return {
        ...prev,
        days: {
          ...prev.days,
          [date]: { ...dayData, entries: newEntries, dopamineScore },
        },
      };
    });
  }, [calculateDopamineScore]);

  /* Undo properly reverses quest rewards and entry */
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.undoStack.length === 0) return prev;
      const lastAction = prev.undoStack[prev.undoStack.length - 1];
      const newStack = prev.undoStack.slice(0, -1);

      if (lastAction.type === 'addEntry') {
        const { entryId, date, coinsEarned, gemsEarned, completedQuestIds, previousActiveQuests } =
          lastAction.data as {
            entryId: string; date: string;
            coinsEarned: number; gemsEarned: number;
            completedQuestIds: string[];
            previousActiveQuests: string[];
          };
        const dayData = prev.days[date];
        if (!dayData) return { ...prev, undoStack: newStack };
        const newEntries = dayData.entries.filter(e => e.id !== entryId);
        const dopamineScore = calculateDopamineScore(newEntries);

        // Reverse quest progress
        const newQuestProgress = prev.questProgress.filter(
          qp => !completedQuestIds.includes(qp.questId) || qp.date !== date
        );

        return {
          ...prev,
          days: {
            ...prev.days,
            [date]: { ...dayData, entries: newEntries, dopamineScore },
          },
          activeQuests: previousActiveQuests || prev.activeQuests,
          questProgress: newQuestProgress,
          user: {
            ...prev.user,
            coins: prev.user.coins - (coinsEarned || 0),
            gems: prev.user.gems - (gemsEarned || 0),
          },
          undoStack: newStack,
        };
      }
      return { ...prev, undoStack: newStack };
    });
  }, [calculateDopamineScore]);

  const addCategory = useCallback((category: Category) => {
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, category],
    }));
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
    }));
  }, []);

  const purchaseItem = useCallback((itemId: string, price: number, currency: 'coins' | 'gems') => {
    setState(prev => {
      if (prev.user.purchasedItems.includes(itemId)) return prev;
      const balance = currency === 'coins' ? prev.user.coins : prev.user.gems;
      if (balance < price) return prev;
      return {
        ...prev,
        user: {
          ...prev.user,
          [currency]: prev.user[currency] - price,
          purchasedItems: [...prev.user.purchasedItems, itemId],
        },
      };
    });
  }, []);

  const setActiveBackground = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, activeBackground: value },
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, darkMode: !prev.user.darkMode },
    }));
  }, []);

  const addQuest = useCallback((quest: Quest) => {
    setState(prev => ({
      ...prev,
      quests: [...prev.quests, quest],
    }));
  }, []);

  const exportCSV = useCallback(() => {
    const rows = ['Date,Activity,Duration_minutes,Category,DopamineScore'];
    Object.values(state.days).forEach(day => {
      day.entries.forEach(entry => {
        const cat = state.categories.find(c => c.id === entry.categoryId);
        rows.push(`${day.date},${cat?.name || entry.categoryId},${entry.minutes},${cat?.name || 'Unknown'},${day.dopamineScore}`);
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dayflow-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.days, state.categories]);

  return {
    state,
    today,
    getTodayData,
    getDayData,
    addEntry,
    removeEntry,
    undo,
    addCategory,
    updateCategory,
    removeCategory,
    purchaseItem,
    setActiveBackground,
    toggleDarkMode,
    addQuest,
    exportCSV,
    calculateDopamineScore,
    getActiveQuests,
  };
}
