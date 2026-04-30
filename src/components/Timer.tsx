/* Live activity timer with start/pause/stop and persistent state */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, X, Timer as TimerIcon, Maximize2, Minimize2 } from 'lucide-react';
import { Category, ActiveTimer } from '@/types';
import { getIcon } from '@/lib/icons';
import { Button } from '@/components/ui/button';

interface TimerProps {
  activeTimer: ActiveTimer | null;
  categories: Category[];
  onStart: (categoryId: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onCancel: () => void;
}

/** Format ms as MM:SS (or HH:MM:SS if >= 1h) */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function Timer({ activeTimer, categories, onStart, onPause, onResume, onStop, onCancel }: TimerProps) {
  const [now, setNow] = useState(Date.now());
  const [picking, setPicking] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Tick every second when running
  useEffect(() => {
    if (!activeTimer?.isRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeTimer?.isRunning]);

  if (!activeTimer && !picking) {
    return (
      <button
        onClick={() => setPicking(true)}
        className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 hover:bg-accent/40 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TimerIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Live Timer</p>
          <p className="text-xs text-muted-foreground">Mierz czas w czasie rzeczywistym</p>
        </div>
        <Play className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  // Category picker
  if (picking && !activeTimer) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Wybierz kategorię</p>
          <button onClick={() => setPicking(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {categories.map(cat => {
            const Icon = getIcon(cat.icon);
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => { onStart(cat.id); setPicking(false); }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-secondary hover:bg-accent transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `hsl(${cat.color} / 0.15)` }}
                >
                  <Icon className="h-4 w-4" style={{ color: `hsl(${cat.color})` }} />
                </div>
                <span className="text-[10px] font-medium text-foreground truncate w-full text-center">{cat.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!activeTimer) return null;

  const elapsed = activeTimer.isRunning
    ? activeTimer.accumulatedMs + (now - activeTimer.startTime)
    : activeTimer.accumulatedMs;
  const cat = categories.find(c => c.id === activeTimer.categoryId);
  const Icon = getIcon(cat?.icon || '');

  const TimerCard = (
    <motion.div
      layout
      className={`bg-card rounded-2xl shadow-card ${focusMode ? 'p-10' : 'p-5'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `hsl(${cat?.color || '0 0% 60%'} / 0.15)` }}
          >
            <Icon className="h-4 w-4" style={{ color: `hsl(${cat?.color || '0 0% 60%'})` }} />
          </div>
          <span className="text-sm font-medium text-foreground">{cat?.name}</span>
        </div>
        <button onClick={() => setFocusMode(f => !f)} className="p-1 rounded-lg hover:bg-secondary">
          {focusMode ? <Minimize2 className="h-4 w-4 text-muted-foreground" /> : <Maximize2 className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      <motion.div
        animate={activeTimer.isRunning ? { opacity: [1, 0.7, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={`text-center font-bold tabular-nums text-foreground ${focusMode ? 'text-7xl my-8' : 'text-5xl my-4'}`}
      >
        {formatTime(elapsed)}
      </motion.div>

      <div className="flex items-center justify-center gap-2">
        {activeTimer.isRunning ? (
          <Button onClick={onPause} variant="outline" size="lg" className="rounded-full">
            <Pause className="h-4 w-4" /> Pauza
          </Button>
        ) : (
          <Button onClick={onResume} size="lg" className="rounded-full">
            <Play className="h-4 w-4" /> Wznów
          </Button>
        )}
        <Button onClick={onStop} variant="default" size="lg" className="rounded-full bg-cat-sport hover:bg-cat-sport/90">
          <Square className="h-4 w-4" /> Zakończ
        </Button>
        <Button onClick={onCancel} variant="ghost" size="icon" className="rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-[10px] text-center text-muted-foreground mt-3">
        Zapis zostanie zaokrąglony do pełnych minut
      </p>
    </motion.div>
  );

  if (focusMode) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="w-full max-w-md">{TimerCard}</div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return TimerCard;
}
