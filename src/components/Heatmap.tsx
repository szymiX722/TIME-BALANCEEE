/* Heatmap — GitHub-style contributions grid for daily productivity */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { DayData } from '@/types';

interface HeatmapProps {
  days: Record<string, DayData>;
  range?: number; // number of days back from today
  metric?: 'dopamine' | 'productive';
  productiveCategoryIds?: string[]; // for 'productive' mode
  onDayClick?: (date: string) => void;
}

/** Returns intensity 0-4 for cell coloring */
function intensity(value: number, max: number): number {
  if (max === 0 || value === 0) return 0;
  const ratio = value / max;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

export function Heatmap({
  days,
  range = 91,
  metric = 'dopamine',
  productiveCategoryIds = ['nauka', 'praca', 'sport'],
  onDayClick,
}: HeatmapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const cells = useMemo(() => {
    const today = startOfDay(new Date());
    // Align so the grid ends on Sunday of current week — easier to read in 7-row columns
    const list: Array<{ date: string; value: number; total: number; dopamine: number }> = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const ds = format(d, 'yyyy-MM-dd');
      const day = days[ds];
      const total = day?.entries.reduce((s, e) => s + e.minutes, 0) || 0;
      const productive = day?.entries
        .filter(e => productiveCategoryIds.includes(e.categoryId))
        .reduce((s, e) => s + e.minutes, 0) || 0;
      const dopamine = day?.dopamineScore || 0;
      const value = metric === 'dopamine' ? dopamine : productive;
      list.push({ date: ds, value, total, dopamine });
    }
    return list;
  }, [days, range, metric, productiveCategoryIds]);

  const maxValue = Math.max(...cells.map(c => c.value), metric === 'dopamine' ? 100 : 240);

  // Group into weeks (columns of 7)
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // Color intensity classes (uses primary token)
  const intensityClass = (lvl: number) => {
    switch (lvl) {
      case 0: return 'bg-secondary';
      case 1: return 'bg-primary/20';
      case 2: return 'bg-primary/45';
      case 3: return 'bg-primary/70';
      case 4: return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  const hoveredCell = hovered ? cells.find(c => c.date === hovered) : null;

  return (
    <div className="relative">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(cell => {
              const lvl = intensity(cell.value, maxValue);
              return (
                <motion.button
                  key={cell.date}
                  whileHover={{ scale: 1.4 }}
                  onMouseEnter={() => setHovered(cell.date)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onDayClick?.(cell.date)}
                  className={`w-3 h-3 rounded-[3px] ${intensityClass(lvl)} transition-colors`}
                  aria-label={`${cell.date}: ${cell.value}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -translate-x-1/2 -bottom-14 bg-card border border-border rounded-lg px-3 py-1.5 shadow-card text-xs whitespace-nowrap z-10"
        >
          <p className="font-medium text-foreground capitalize">
            {format(new Date(hoveredCell.date), 'EEE, d MMM yyyy', { locale: pl })}
          </p>
          <p className="text-muted-foreground">
            Dopamine: {hoveredCell.dopamine}/100 · {hoveredCell.total} min
          </p>
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-muted-foreground">
        <span>Mniej</span>
        {[0, 1, 2, 3, 4].map(l => (
          <div key={l} className={`w-2.5 h-2.5 rounded-[3px] ${intensityClass(l)}`} />
        ))}
        <span>Więcej</span>
      </div>
    </div>
  );
}
