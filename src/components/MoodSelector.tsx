/* Mood selector — emoji scale 1-5 */
import { motion } from 'framer-motion';

interface MoodSelectorProps {
  value: number;
  onChange: (mood: number) => void;
  size?: 'sm' | 'md';
}

export const MOOD_EMOJIS = ['😞', '😐', '🙂', '😄', '🤩'];
export const MOOD_LABELS = ['Źle', 'Słabo', 'OK', 'Dobrze', 'Super'];

export function MoodSelector({ value, onChange, size = 'md' }: MoodSelectorProps) {
  const buttonSize = size === 'sm' ? 'w-8 h-8 text-base' : 'w-10 h-10 text-xl';
  return (
    <div className="flex items-center justify-between gap-1">
      {MOOD_EMOJIS.map((emoji, i) => {
        const mood = i + 1;
        const active = value === mood;
        return (
          <motion.button
            key={mood}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => onChange(mood)}
            className={`${buttonSize} rounded-xl flex items-center justify-center transition-all ${
              active ? 'bg-accent ring-2 ring-primary scale-110' : 'bg-secondary hover:bg-accent/60 grayscale opacity-60'
            }`}
            title={MOOD_LABELS[i]}
          >
            {emoji}
          </motion.button>
        );
      })}
    </div>
  );
}
