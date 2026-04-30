/* XP / Level progress bar with floating XP gain animation */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { levelFromXP } from '@/types';

interface XPBarProps {
  xp: number;
  compact?: boolean;
}

interface FloatingXP {
  id: number;
  amount: number;
}

export function XPBar({ xp, compact = false }: XPBarProps) {
  const { level, currentLevelXP, nextLevelXP, progress } = levelFromXP(xp);
  const [floats, setFloats] = useState<FloatingXP[]>([]);
  const [pulse, setPulse] = useState(false);

  /* Listen to global xp gain events for floating animation */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { amount: number };
      const id = Date.now() + Math.random();
      setFloats(f => [...f, { id, amount: detail.amount }]);
      setPulse(true);
      setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1400);
      setTimeout(() => setPulse(false), 600);
    };
    window.addEventListener('dayflow:xp-gain', handler);
    return () => window.removeEventListener('dayflow:xp-gain', handler);
  }, []);

  const intoLevel = xp - currentLevelXP;
  const span = nextLevelXP - currentLevelXP;

  return (
    <div className={`relative ${compact ? '' : 'space-y-1.5'}`}>
      <div className="flex items-center gap-2">
        <motion.div
          animate={pulse ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0"
        >
          <Star className="h-3.5 w-3.5 text-primary-foreground fill-primary-foreground" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">Lvl {level}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{intoLevel}/{span} XP</span>
          </div>
          <div className="mt-0.5 h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress * 100)}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Floating +XP */}
      <AnimatePresence>
        {floats.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -28, scale: 1 }}
            exit={{ opacity: 0, y: -42 }}
            transition={{ duration: 1.2 }}
            className="pointer-events-none absolute right-0 -top-2 text-xs font-bold text-primary"
          >
            +{f.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
