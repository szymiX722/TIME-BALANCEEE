/* Single goal row with progress bar */
import { motion } from 'framer-motion';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { Goal, Category } from '@/types';
import { getIcon } from '@/lib/icons';

interface GoalItemProps {
  goal: Goal;
  category?: Category;
  minutes: number;
  completed: boolean;
  onRemove?: (id: string) => void;
}

export function GoalItem({ goal, category, minutes, completed, onRemove }: GoalItemProps) {
  const Icon = getIcon(category?.icon || '');
  const progress = Math.min(1, minutes / goal.targetMinutes);
  const color = category?.color || '174 62% 47%';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-2xl p-4 shadow-card transition-opacity ${completed ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `hsl(${color} / 0.15)` }}
        >
          <Icon className="h-5 w-5" style={{ color: `hsl(${color})` }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{goal.name}</h3>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {goal.period === 'daily' ? 'Dzienny' : 'Tygodniowy'}
              </span>
              {completed ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <CheckCircle2 className="h-4 w-4 text-cat-sport" />
                </motion.div>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2 tabular-nums">
            {minutes}/{goal.targetMinutes} min
          </p>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: `hsl(${color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {goal.rewardXP > 0 && <span>+{goal.rewardXP} XP</span>}
              {goal.rewardCoins > 0 && <span>🪙 {goal.rewardCoins}</span>}
            </div>
            {onRemove && (
              <button onClick={() => onRemove(goal.id)} className="p-1 rounded hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
