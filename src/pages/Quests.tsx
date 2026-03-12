/* Quests page - daily quests with gamification and rotation */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Flame, Trophy, Sparkles } from 'lucide-react';
import { getIcon } from '@/lib/icons';

interface QuestsProps {
  store: ReturnType<typeof import('@/hooks/useAppStore').useAppStore>;
}

export default function Quests({ store }: QuestsProps) {
  const { state, today, getTodayData, getActiveQuests } = store;
  const dayData = getTodayData();
  const activeQuests = getActiveQuests();

  const questStatus = useMemo(() => {
    return activeQuests.map(quest => {
      const completed = state.questProgress.some(
        qp => qp.questId === quest.id && qp.date === today && qp.completed
      );
      const currentMinutes = dayData.entries
        .filter(e => e.categoryId === quest.categoryId)
        .reduce((s, e) => s + e.minutes, 0);
      const progress = Math.min(1, currentMinutes / quest.targetMinutes);
      const cat = state.categories.find(c => c.id === quest.categoryId);
      return { quest, completed, currentMinutes, progress, category: cat };
    });
  }, [activeQuests, state.questProgress, today, dayData.entries, state.categories]);

  const completedCount = questStatus.filter(q => q.completed).length;
  const allCompleted = completedCount === questStatus.length && questStatus.length > 0;

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-5"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Questy</h1>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4" />
          {completedCount}/{questStatus.length}
        </div>
      </div>

      {/* Streak */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Flame className="h-6 w-6 text-cat-praca" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{state.user.streak} dni</p>
            <p className="text-xs text-muted-foreground">Aktualny streak</p>
          </div>
        </div>
      </motion.div>

      {/* All completed banner */}
      {allCompleted && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-accent rounded-2xl p-4 text-center"
        >
          <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-lg font-semibold text-accent-foreground">🎉 Wszystkie questy ukończone!</p>
          <p className="text-xs text-muted-foreground mt-1">Nowe questy pojawią się jutro</p>
        </motion.div>
      )}

      {/* Quest cards */}
      <div className="space-y-3">
        {questStatus.map(({ quest, completed, currentMinutes, progress, category }, i) => {
          const Icon = getIcon(category?.icon || '');
          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-card rounded-2xl p-4 shadow-card transition-all ${completed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `hsl(${category?.color || '0 0% 60%'} / 0.15)` }}
                >
                  <Icon className="h-5 w-5" style={{ color: `hsl(${category?.color || '0 0% 60%'})` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{quest.title}</h3>
                    {completed ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                        <CheckCircle2 className="h-5 w-5 text-cat-sport" />
                      </motion.div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {currentMinutes}/{quest.targetMinutes} min
                  </p>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: `hsl(${category?.color || '174 62% 47%'})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {quest.rewardCoins > 0 && (
                      <span className="text-xs text-muted-foreground">🪙 {quest.rewardCoins}</span>
                    )}
                    {quest.rewardGems > 0 && (
                      <span className="text-xs text-muted-foreground">💎 {quest.rewardGems}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
