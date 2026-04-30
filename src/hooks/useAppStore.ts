/* LocalStorage-based data store for DayFlow */
import { useState, useEffect, useCallback } from 'react';
import {
  AppState, DayData, ActivityEntry, Category, Quest, JournalEntry,
  Goal, GoalCompletion, ActiveTimer, UserData,
  DEFAULT_CATEGORIES, QUEST_POOL,
  XP_REWARDS, levelFromXP,
} from '@/types';
import { format, startOfWeek } from 'date-fns';
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
  xp: 0,
  level: 1,
};

/* Pick random quests from pool, excluding given IDs */
function pickRandomQuests(count: number, excludeIds: string[]): string[] {
  const available = QUEST_POOL.filter(q => !excludeIds.includes(q.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(q => q.id);
}

/* Period key for goal completion tracking */
function periodKeyFor(date: Date, period: 'daily' | 'weekly'): string {
  if (period === 'daily') return format(date, 'yyyy-MM-dd');
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return format(weekStart, "yyyy-'W'II");
}

const getInitialState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const state: AppState = {
        categories: parsed.categories || DEFAULT_CATEGORIES,
        days: parsed.days || {},
        quests: QUEST_POOL,
        activeQuests: parsed.activeQuests || [],
        questProgress: parsed.questProgress || [],
        user: { ...defaultUser, ...parsed.user },
        goals: parsed.goals || [],
        goalCompletions: parsed.goalCompletions || [],
        activeTimer: parsed.activeTimer || null,
        undoStack: [],
      };
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

  return {
    categories: DEFAULT_CATEGORIES,
    days: {},
    quests: QUEST_POOL,
    activeQuests: pickRandomQuests(ACTIVE_QUEST_COUNT, []),
    questProgress: [],
    user: defaultUser,
    goals: [],
    goalCompletions: [],
    activeTimer: null,
    undoStack: [],
  };
};

export function useAppStore() {
  const [state, setState] = useState<AppState>(getInitialState);

  /* Persist debounced */
  useEffect(() => {
    const t = setTimeout(() => {
      const { undoStack, ...toSave } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }, 300);
    return () => clearTimeout(t);
  }, [state]);

  /* Streak update */
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setState(prev => {
      if (prev.user.lastActiveDate === today) return prev;
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      const newStreak = prev.user.lastActiveDate === yesterday ? prev.user.streak + 1 : 1;
      return { ...prev, user: { ...prev.user, streak: newStreak, lastActiveDate: today } };
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
      if (cat) weightedSum += cat.dopamineWeight * entry.minutes;
    });
    const maxPossible = 3 * totalMinutes;
    const minPossible = -2 * totalMinutes;
    const normalized = ((weightedSum - minPossible) / (maxPossible - minPossible)) * 100;
    return Math.round(Math.min(100, Math.max(0, normalized)));
  }, [state.categories]);

  const getActiveQuests = useCallback((): Quest[] => {
    return state.activeQuests
      .map(id => QUEST_POOL.find(q => q.id === id))
      .filter((q): q is Quest => !!q);
  }, [state.activeQuests]);

  /* ===== XP helpers ===== */
  /** Award XP, detect level-up, fire toast and emit floating animation event. */
  const awardXP = useCallback((amount: number, label?: string) => {
    if (amount <= 0) return;
    setState(prev => {
      const newXP = prev.user.xp + amount;
      const { level: newLevel } = levelFromXP(newXP);
      const leveledUp = newLevel > prev.user.level;
      // Emit floating XP event for UI animation
      window.dispatchEvent(new CustomEvent('dayflow:xp-gain', { detail: { amount, label } }));
      if (leveledUp) {
        setTimeout(() => {
          toast.success(`🎉 Level ${newLevel}!`, {
            description: 'Awansowałeś na nowy poziom',
            duration: 4500,
          });
          window.dispatchEvent(new CustomEvent('dayflow:level-up', { detail: { level: newLevel } }));
        }, 100);
      }
      return { ...prev, user: { ...prev.user, xp: newXP, level: newLevel } };
    });
  }, []);

  /* ===== Goals ===== */
  /** Check goal progress against today's entries; auto-complete when target reached. */
  const checkGoals = useCallback((dayEntries: ActivityEntry[], allDays: Record<string, DayData>) => {
    setState(prev => {
      let coinsEarned = 0;
      let xpEarned = 0;
      const completedTitles: string[] = [];
      const now = new Date();
      const newCompletions = [...prev.goalCompletions];

      prev.goals.forEach(goal => {
        const key = periodKeyFor(now, goal.period);
        const already = newCompletions.some(c => c.goalId === goal.id && c.periodKey === key);
        if (already) return;

        // Calculate current progress for the goal's period
        let totalMinutes = 0;
        if (goal.period === 'daily') {
          totalMinutes = dayEntries
            .filter(e => e.categoryId === goal.categoryId)
            .reduce((s, e) => s + e.minutes, 0);
        } else {
          // weekly: sum across the week
          const weekStart = startOfWeek(now, { weekStartsOn: 1 });
          for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            const ds = format(d, 'yyyy-MM-dd');
            const day = allDays[ds];
            if (day) {
              totalMinutes += day.entries
                .filter(e => e.categoryId === goal.categoryId)
                .reduce((s, e) => s + e.minutes, 0);
            }
          }
        }

        if (totalMinutes >= goal.targetMinutes) {
          newCompletions.push({ goalId: goal.id, periodKey: key, completedAt: Date.now() });
          coinsEarned += goal.rewardCoins;
          xpEarned += goal.rewardXP;
          completedTitles.push(goal.name);
        }
      });

      if (completedTitles.length === 0) return prev;

      // Show toasts
      setTimeout(() => {
        completedTitles.forEach(t => {
          toast.success(`🎯 Cel osiągnięty: ${t}`, {
            description: `+${xpEarned} XP ${coinsEarned > 0 ? `+${coinsEarned} 🪙` : ''}`,
            duration: 4000,
          });
        });
      }, 150);

      // Award XP via separate state mutation (after this state update)
      if (xpEarned > 0) {
        setTimeout(() => awardXP(xpEarned, 'goal'), 0);
      }

      return {
        ...prev,
        goalCompletions: newCompletions,
        user: { ...prev.user, coins: prev.user.coins + coinsEarned },
      };
    });
  }, [awardXP]);

  /* ===== Activities ===== */
  const addEntry = useCallback((categoryId: string, minutes: number) => {
    if (minutes <= 0) return;
    let newEntriesForGoals: ActivityEntry[] = [];
    let allDaysSnapshot: Record<string, DayData> = {};
    let questXP = 0;

    setState(prev => {
      const dayData = prev.days[today] || { date: today, entries: [], dopamineScore: 0, xpEarned: 0 };
      const newEntry: ActivityEntry = {
        id: crypto.randomUUID(),
        categoryId,
        minutes,
        timestamp: Date.now(),
      };
      const newEntries = [...dayData.entries, newEntry];
      const dopamineScore = calculateDopamineScore(newEntries);

      // Quest completion
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
          questXP += XP_REWARDS.COMPLETE_QUEST;
          completedQuestTitles.push(quest.title);
          const replacement = pickRandomQuests(1, newActiveQuests);
          if (replacement.length > 0) {
            newActiveQuests = newActiveQuests.map(id => id === questId ? replacement[0] : id);
          }
        }
      });

      if (completedQuestTitles.length > 0) {
        setTimeout(() => {
          completedQuestTitles.forEach(title => {
            toast.success(`🎉 Quest ukończony: ${title}`, {
              description: `+${coinsEarned} 🪙 ${gemsEarned > 0 ? `+${gemsEarned} 💎` : ''} +${XP_REWARDS.COMPLETE_QUEST} XP`,
              duration: 4000,
            });
          });
        }, 100);
      }

      const xpEarnedToday = (dayData.xpEarned || 0) + XP_REWARDS.ADD_ACTIVITY;
      const updatedDays = {
        ...prev.days,
        [today]: { ...dayData, entries: newEntries, dopamineScore, xpEarned: xpEarnedToday },
      };
      newEntriesForGoals = newEntries;
      allDaysSnapshot = updatedDays;

      return {
        ...prev,
        days: updatedDays,
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
            xpAwarded: XP_REWARDS.ADD_ACTIVITY + questXP,
            completedQuestIds: completedQuestTitles.length > 0
              ? newQuestProgress.filter(qp => qp.date === today && qp.completed).map(qp => qp.questId)
              : [],
            previousActiveQuests: prev.activeQuests,
          }
        }],
      };
    });

    // Award XP outside (uses latest state)
    awardXP(XP_REWARDS.ADD_ACTIVITY + questXP, 'activity');
    // Check goals after entries committed
    setTimeout(() => checkGoals(newEntriesForGoals, allDaysSnapshot), 0);
  }, [today, calculateDopamineScore, awardXP, checkGoals]);

  const removeEntry = useCallback((date: string, entryId: string) => {
    setState(prev => {
      const dayData = prev.days[date];
      if (!dayData) return prev;
      const newEntries = dayData.entries.filter(e => e.id !== entryId);
      const dopamineScore = calculateDopamineScore(newEntries);
      return {
        ...prev,
        days: { ...prev.days, [date]: { ...dayData, entries: newEntries, dopamineScore } },
      };
    });
  }, [calculateDopamineScore]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.undoStack.length === 0) return prev;
      const lastAction = prev.undoStack[prev.undoStack.length - 1];
      const newStack = prev.undoStack.slice(0, -1);

      if (lastAction.type === 'addEntry') {
        const { entryId, date, coinsEarned, gemsEarned, xpAwarded, completedQuestIds, previousActiveQuests } =
          lastAction.data as {
            entryId: string; date: string;
            coinsEarned: number; gemsEarned: number; xpAwarded: number;
            completedQuestIds: string[];
            previousActiveQuests: string[];
          };
        const dayData = prev.days[date];
        if (!dayData) return { ...prev, undoStack: newStack };
        const newEntries = dayData.entries.filter(e => e.id !== entryId);
        const dopamineScore = calculateDopamineScore(newEntries);
        const newQuestProgress = prev.questProgress.filter(
          qp => !completedQuestIds.includes(qp.questId) || qp.date !== date
        );
        const newXP = Math.max(0, prev.user.xp - (xpAwarded || 0));
        const { level: newLevel } = levelFromXP(newXP);

        return {
          ...prev,
          days: {
            ...prev.days,
            [date]: { ...dayData, entries: newEntries, dopamineScore, xpEarned: Math.max(0, (dayData.xpEarned || 0) - (xpAwarded || 0)) },
          },
          activeQuests: previousActiveQuests || prev.activeQuests,
          questProgress: newQuestProgress,
          user: {
            ...prev.user,
            coins: prev.user.coins - (coinsEarned || 0),
            gems: prev.user.gems - (gemsEarned || 0),
            xp: newXP,
            level: newLevel,
          },
          undoStack: newStack,
        };
      }
      return { ...prev, undoStack: newStack };
    });
  }, [calculateDopamineScore]);

  /* ===== Journal ===== */
  /** Set or update journal entry for a given date. */
  const setJournal = useCallback((date: string, journal: Partial<JournalEntry>) => {
    let isNew = false;
    setState(prev => {
      const day = prev.days[date] || { date, entries: [], dopamineScore: 0 };
      const existing = day.journal;
      const wasEmpty = !existing || (!existing.text && !existing.mood);
      const updated: JournalEntry = {
        text: journal.text !== undefined ? journal.text : (existing?.text || ''),
        mood: journal.mood !== undefined ? journal.mood : (existing?.mood || 0),
      };
      const willHaveContent = !!(updated.text || updated.mood);
      isNew = wasEmpty && willHaveContent;
      return {
        ...prev,
        days: { ...prev.days, [date]: { ...day, journal: updated } },
      };
    });
    if (isNew) awardXP(XP_REWARDS.JOURNAL_ENTRY, 'journal');
  }, [awardXP]);

  /* ===== Goals CRUD ===== */
  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      goals: [...prev.goals, { ...goal, id: crypto.randomUUID(), createdAt: Date.now() }],
    }));
  }, []);

  const removeGoal = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id),
      goalCompletions: prev.goalCompletions.filter(c => c.goalId !== id),
    }));
  }, []);

  /** Compute live progress per goal (minutes accumulated in current period). */
  const getGoalProgress = useCallback((goal: Goal): { minutes: number; completed: boolean } => {
    const now = new Date();
    const key = periodKeyFor(now, goal.period);
    const completed = state.goalCompletions.some(c => c.goalId === goal.id && c.periodKey === key);
    let minutes = 0;
    if (goal.period === 'daily') {
      const day = state.days[today];
      if (day) {
        minutes = day.entries
          .filter(e => e.categoryId === goal.categoryId)
          .reduce((s, e) => s + e.minutes, 0);
      }
    } else {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const ds = format(d, 'yyyy-MM-dd');
        const day = state.days[ds];
        if (day) {
          minutes += day.entries
            .filter(e => e.categoryId === goal.categoryId)
            .reduce((s, e) => s + e.minutes, 0);
        }
      }
    }
    return { minutes, completed };
  }, [state.days, state.goalCompletions, today]);

  /* ===== Timer ===== */
  const startTimer = useCallback((categoryId: string) => {
    setState(prev => ({
      ...prev,
      activeTimer: {
        startTime: Date.now(),
        accumulatedMs: 0,
        categoryId,
        isRunning: true,
      },
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    setState(prev => {
      if (!prev.activeTimer || !prev.activeTimer.isRunning) return prev;
      const elapsed = Date.now() - prev.activeTimer.startTime;
      return {
        ...prev,
        activeTimer: {
          ...prev.activeTimer,
          isRunning: false,
          accumulatedMs: prev.activeTimer.accumulatedMs + elapsed,
          startTime: Date.now(),
        },
      };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setState(prev => {
      if (!prev.activeTimer || prev.activeTimer.isRunning) return prev;
      return {
        ...prev,
        activeTimer: { ...prev.activeTimer, isRunning: true, startTime: Date.now() },
      };
    });
  }, []);

  /** Stop timer; saves rounded minutes as activity entry. */
  const stopTimer = useCallback(() => {
    const t = state.activeTimer;
    if (!t) return;
    const totalMs = t.isRunning ? t.accumulatedMs + (Date.now() - t.startTime) : t.accumulatedMs;
    const minutes = Math.max(1, Math.round(totalMs / 60000));
    const categoryId = t.categoryId;
    setState(prev => ({ ...prev, activeTimer: null }));
    addEntry(categoryId, minutes);
  }, [state.activeTimer, addEntry]);

  const cancelTimer = useCallback(() => {
    setState(prev => ({ ...prev, activeTimer: null }));
  }, []);

  /* ===== Categories ===== */
  const addCategory = useCallback((category: Category) => {
    setState(prev => ({ ...prev, categories: [...prev.categories, category] }));
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  }, []);

  /* ===== Shop ===== */
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
    setState(prev => ({ ...prev, user: { ...prev.user, activeBackground: value } }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState(prev => ({ ...prev, user: { ...prev.user, darkMode: !prev.user.darkMode } }));
  }, []);

  const addQuest = useCallback((quest: Quest) => {
    setState(prev => ({ ...prev, quests: [...prev.quests, quest] }));
  }, []);

  /* ===== CSV Export (includes Mood, JournalText, XP per day) ===== */
  const exportCSV = useCallback(() => {
    const rows = ['Date,Activity,Duration_minutes,Category,DopamineScore,Mood,JournalText,XP'];
    Object.values(state.days).forEach(day => {
      const mood = day.journal?.mood ?? '';
      const text = (day.journal?.text || '').replace(/"/g, '""').replace(/\n/g, ' ');
      const xp = day.xpEarned ?? '';
      if (day.entries.length === 0) {
        rows.push(`${day.date},,,,${day.dopamineScore},${mood},"${text}",${xp}`);
        return;
      }
      day.entries.forEach(entry => {
        const cat = state.categories.find(c => c.id === entry.categoryId);
        rows.push(`${day.date},${cat?.name || entry.categoryId},${entry.minutes},${cat?.name || 'Unknown'},${day.dopamineScore},${mood},"${text}",${xp}`);
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
    // new
    awardXP,
    setJournal,
    addGoal,
    removeGoal,
    getGoalProgress,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    cancelTimer,
  };
}
