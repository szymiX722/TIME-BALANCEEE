/* Stats page - weekly & monthly views + mood/dopamine correlation */
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { MOOD_EMOJIS } from '@/components/MoodSelector';

interface StatsProps {
  store: ReturnType<typeof import('@/hooks/useAppStore').useAppStore>;
}

export default function Stats({ store }: StatsProps) {
  const { state, getDayData } = store;
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Deep link from heatmap: ?day=YYYY-MM-DD opens the day in month view
  useEffect(() => {
    const d = searchParams.get('day');
    if (d) {
      setView('month');
      setSelectedDay(d);
      setMonthDate(new Date(d));
    }
  }, [searchParams]);

  // Mood vs Dopamine correlation data
  const moodCorrelation = useMemo(() => {
    return Object.values(state.days)
      .filter(d => d.journal?.mood && d.entries.length > 0)
      .map(d => ({ mood: d.journal!.mood, dopamine: d.dopamineScore, date: d.date }));
  }, [state.days]);

  // Weekly data
  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weeklyData = useMemo(() => {
    return weekDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = getDayData(dateStr);
      const byCategory = new Map<string, number>();
      dayData.entries.forEach(e => {
        byCategory.set(e.categoryId, (byCategory.get(e.categoryId) || 0) + e.minutes);
      });
      return {
        label: format(day, 'EEE', { locale: pl }),
        date: dateStr,
        total: dayData.entries.reduce((s, e) => s + e.minutes, 0),
        categories: byCategory,
      };
    });
  }, [weekDays, getDayData]);

  const weekTotal = weeklyData.reduce((s, d) => s + d.total, 0);
  const avgDopamine = useMemo(() => {
    const scores = weekDays.map(d => getDayData(format(d, 'yyyy-MM-dd')).dopamineScore).filter(s => s > 0);
    return scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
  }, [weekDays, getDayData]);

  // Monthly calendar
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;

  const getDominantColor = (dateStr: string) => {
    const day = getDayData(dateStr);
    if (day.entries.length === 0) return null;
    const byCategory = new Map<string, number>();
    day.entries.forEach(e => byCategory.set(e.categoryId, (byCategory.get(e.categoryId) || 0) + e.minutes));
    let maxCat = '';
    let maxMin = 0;
    byCategory.forEach((min, cat) => { if (min > maxMin) { maxMin = min; maxCat = cat; } });
    return state.categories.find(c => c.id === maxCat)?.color || null;
  };

  const selectedDayData = selectedDay ? getDayData(selectedDay) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-5"
    >
      <h1 className="text-2xl font-bold text-foreground">Statystyki</h1>

      {/* View toggle */}
      <div className="flex bg-secondary rounded-xl p-1">
        {(['week', 'month'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === v ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            {v === 'week' ? 'Tydzień' : 'Miesiąc'}
          </button>
        ))}
      </div>

      {view === 'week' ? (
        <>
          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 rounded-xl bg-secondary hover:bg-accent">
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {format(weekDays[0], 'd MMM', { locale: pl })} — {format(weekDays[6], 'd MMM yyyy', { locale: pl })}
            </span>
            <button onClick={() => setWeekOffset(o => o + 1)} className="p-2 rounded-xl bg-secondary hover:bg-accent">
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {/* Bar chart */}
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barCategoryGap="20%">
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => [`${Math.floor(value / 60)}h ${value % 60}m`, 'Czas']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {weeklyData.map((_, i) => (
                      <Cell key={i} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-4 shadow-card text-center">
              <p className="text-xl font-bold text-foreground">{Math.floor(weekTotal / 60)}h</p>
              <p className="text-xs text-muted-foreground mt-1">Łącznie</p>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-card text-center">
              <p className="text-xl font-bold text-foreground">{avgDopamine}</p>
              <p className="text-xs text-muted-foreground mt-1">Śr. Dopamine</p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="p-2 rounded-xl bg-secondary hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground capitalize">
              {format(monthDate, 'LLLL yyyy', { locale: pl })}
            </span>
            <button
              onClick={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="p-2 rounded-xl bg-secondary hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(d => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {calendarDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const color = getDominantColor(dateStr);
                const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                const isSelected = selectedDay === dateStr;
                return (
                  <motion.button
                    key={dateStr}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedDay(dateStr)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors relative ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    } ${isToday ? 'font-bold' : ''}`}
                    style={{
                      backgroundColor: color ? `hsl(${color} / 0.2)` : undefined,
                      color: color ? `hsl(${color})` : undefined,
                    }}
                  >
                    {day.getDate()}
                    {isToday && (
                      <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Day detail */}
          {selectedDayData && selectedDayData.entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <h3 className="text-sm font-medium text-foreground mb-3">
                {format(new Date(selectedDay!), 'd MMMM yyyy', { locale: pl })}
              </h3>
              <div className="space-y-2">
                {selectedDayData.entries.map(entry => {
                  const cat = state.categories.find(c => c.id === entry.categoryId);
                  return (
                    <div key={entry.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `hsl(${cat?.color || '0 0% 60%'})` }} />
                        <span className="text-sm text-foreground">{cat?.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{entry.minutes} min</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Dopamine Score: {selectedDayData.dopamineScore}/100</p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
