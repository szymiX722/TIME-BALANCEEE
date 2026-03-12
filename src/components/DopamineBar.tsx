/* Dopamine Score progress bar */
import { motion } from 'framer-motion';

interface DopamineBarProps {
  score: number;
}

export function DopamineBar({ score }: DopamineBarProps) {
  const getColor = () => {
    if (score >= 70) return 'bg-cat-sport';
    if (score >= 40) return 'bg-cat-praca';
    return 'bg-destructive';
  };

  const getLabel = () => {
    if (score >= 80) return 'Świetnie! 🔥';
    if (score >= 60) return 'Dobrze 👍';
    if (score >= 40) return 'Średnio 😐';
    return 'Słabo 😴';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Dopamine Score</span>
        <span className="text-sm text-muted-foreground">{getLabel()}</span>
      </div>
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
      <div className="text-right">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-sm text-muted-foreground">/100</span>
      </div>
    </div>
  );
}
