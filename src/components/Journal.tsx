/* Daily journal — text + mood, with debounced autosave */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpenText, Check } from 'lucide-react';
import { MoodSelector } from './MoodSelector';
import { Textarea } from '@/components/ui/textarea';
import { JournalEntry } from '@/types';

interface JournalProps {
  date: string;
  initial?: JournalEntry;
  onSave: (date: string, journal: Partial<JournalEntry>) => void;
}

export function Journal({ date, initial, onSave }: JournalProps) {
  const [text, setText] = useState(initial?.text || '');
  const [mood, setMood] = useState(initial?.mood || 0);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Sync from props when date changes
  useEffect(() => {
    setText(initial?.text || '');
    setMood(initial?.mood || 0);
    isFirstRender.current = true;
  }, [date, initial?.text, initial?.mood]);

  // Debounced autosave on change
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSave(date, { text, mood });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [text, mood, date, onSave]);

  const handleMoodChange = (m: number) => setMood(m === mood ? 0 : m);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpenText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Dziennik dnia</span>
        </div>
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <Check className="h-3 w-3" /> Zapisano
          </motion.div>
        )}
      </div>

      <MoodSelector value={mood} onChange={handleMoodChange} />

      <motion.div layout>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Jak minął dzisiejszy dzień? Co Ci się udało, co Cię zaskoczyło?"
          className="resize-none rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-primary text-sm transition-all"
          style={{ minHeight: text ? '120px' : '60px' }}
        />
      </motion.div>
    </div>
  );
}
