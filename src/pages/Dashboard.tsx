/* Dashboard page - daily time tracking overview */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Undo2, Flame, Clock } from 'lucide-react';
import { DopamineBar } from '@/components/DopamineBar';
import { AddActivity } from '@/components/AddActivity';
import { getIcon } from '@/lib/icons';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface DashboardProps {
  store: ReturnType<typeof import('@/hooks/useAppStore').useAppStore>;
}

export default function Dashboard({ store }: DashboardProps) {
  const { state, getTodayData, addEntry, removeEntry, undo, today } = store;
  const dayData = getTodayData();

  const totalMinutes = dayData.entries.reduce((s, e) => s + e.minutes, 0);
  const remainingMinutes = Math.max(0, 1440 - totalMinutes);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  // Aggregate entries by category for pie chart
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    dayData.entries.forEach(e => {
      map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.minutes);
    });
    return Array.from(map.entries()).map(([catId, minutes]) => {
      const cat = state.categories.find(c => c.id === catId);
      return {
        name: cat?.name || catId,
        value: minutes,
        color: cat?.color || '0 0% 60%',
        percentage: Math.round((minutes / 1440) * 100),
      };
    });
  }, [dayData.entries, state.categories]);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {format(new Date(), 'EEEE, d MMMM', { locale: pl })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state.user.streak > 0 && (
            <div className="flex items-center gap-1 bg-accent px-2.5 py-1 rounded-full">
              <Flame className="h-4 w-4 text-cat-praca" />
              <span className="text-xs font-semibold text-foreground">{state.user.streak}</span>
            </div>
          )}
          <button
            onClick={undo}
            disabled={state.undoStack.length === 0}
            className="p-2 rounded-xl bg-secondary hover:bg-accent disabled:opacity-30 transition-colors"
          >
            <Undo2 className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Day progress */}
      <motion.div variants={fadeUp} className="bg-card rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Postęp dnia</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalHours}h {totalMins}m / 24h
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (totalMinutes / 1440) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          Pozostało: {Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}m
        </p>
      </motion.div>

      {/* Pie chart */}
      <motion.div variants={fadeUp} className="bg-card rounded-2xl p-4 shadow-card">
        <h2 className="text-sm font-medium text-foreground mb-3">Rozkład dnia</h2>
        {chartData.length > 0 ? (
          <div className="flex items-center gap-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={600}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={`hsl(${entry.color})`} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} min`, '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {chartData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `hsl(${item.color})` }} />
                  <span className="text-xs text-foreground flex-1">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            Dodaj pierwszą aktywność →
          </div>
        )}
      </motion.div>

      {/* Dopamine Score */}
      <motion.div variants={fadeUp} className="bg-card rounded-2xl p-4 shadow-card">
        <DopamineBar score={dayData.dopamineScore} />
      </motion.div>

      {/* Today's entries */}
      {dayData.entries.length > 0 && (
        <motion.div variants={fadeUp} className="bg-card rounded-2xl p-4 shadow-card">
          <h2 className="text-sm font-medium text-foreground mb-3">Dzisiejsze aktywności</h2>
          <div className="space-y-2">
            {dayData.entries.map((entry, i) => {
              const cat = state.categories.find(c => c.id === entry.categoryId);
              const Icon = getIcon(cat?.icon || '');
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 py-2 group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `hsl(${cat?.color || '0 0% 60%'} / 0.15)` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: `hsl(${cat?.color || '0 0% 60%'})` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{cat?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.minutes >= 60 ? `${Math.floor(entry.minutes / 60)}h ${entry.minutes % 60}m` : `${entry.minutes} min`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeEntry(today, entry.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-destructive transition-opacity"
                  >
                    Usuń
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Coins / Gems display */}
      <motion.div variants={fadeUp} className="flex gap-3">
        <div className="flex-1 bg-card rounded-2xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-cat-praca">🪙 {state.user.coins}</p>
          <p className="text-xs text-muted-foreground mt-1">Monety</p>
        </div>
        <div className="flex-1 bg-card rounded-2xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-cat-czytanie">💎 {state.user.gems}</p>
          <p className="text-xs text-muted-foreground mt-1">Klejnoty</p>
        </div>
      </motion.div>

      <AddActivity categories={state.categories} onAdd={addEntry} />
    </motion.div>
  );
}
