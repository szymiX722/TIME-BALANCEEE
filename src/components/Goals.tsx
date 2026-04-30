/* Goals manager — list + add new */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Goal, GoalPeriod, Category } from '@/types';
import { GoalItem } from './GoalItem';

interface GoalsProps {
  goals: Goal[];
  categories: Category[];
  getProgress: (g: Goal) => { minutes: number; completed: boolean };
  onAdd: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  onRemove: (id: string) => void;
}

export function Goals({ goals, categories, getProgress, onAdd, onRemove }: GoalsProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [target, setTarget] = useState(60);
  const [period, setPeriod] = useState<GoalPeriod>('daily');

  const handleSubmit = () => {
    if (!name.trim() || !categoryId || target <= 0) return;
    onAdd({
      name: name.trim(),
      categoryId,
      targetMinutes: target,
      period,
      rewardXP: 75,
      rewardCoins: period === 'daily' ? 5 : 20,
    });
    setName('');
    setTarget(60);
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Cele</h2>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="p-1.5 rounded-lg bg-secondary hover:bg-accent transition-colors"
        >
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 text-foreground" />}
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-2xl p-4 shadow-card space-y-3 overflow-hidden"
          >
            <input
              type="text"
              placeholder="Nazwa celu (np. Czytaj 30 min dziennie)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-secondary text-foreground text-sm border-0 focus:ring-2 ring-primary outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 px-3 rounded-lg bg-secondary text-foreground text-sm border-0 focus:ring-2 ring-primary outline-none"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
                className="h-10 px-3 rounded-lg bg-secondary text-foreground text-sm border-0 focus:ring-2 ring-primary outline-none"
              >
                <option value="daily">Dzienny</option>
                <option value="weekly">Tygodniowy</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="flex-1 h-10 px-3 rounded-lg bg-secondary text-foreground text-sm border-0 focus:ring-2 ring-primary outline-none"
              />
              <span className="text-xs text-muted-foreground">min</span>
              <Button size="sm" onClick={handleSubmit}>Dodaj</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 && !adding && (
        <div className="bg-card rounded-2xl p-6 text-center shadow-card">
          <Target className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Brak celów. Dodaj pierwszy →</p>
        </div>
      )}

      <div className="space-y-2">
        {goals.map(goal => {
          const { minutes, completed } = getProgress(goal);
          const cat = categories.find(c => c.id === goal.categoryId);
          return (
            <GoalItem
              key={goal.id}
              goal={goal}
              category={cat}
              minutes={minutes}
              completed={completed}
              onRemove={onRemove}
            />
          );
        })}
      </div>
    </div>
  );
}
