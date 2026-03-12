/* Quick-add activity dialog — uses a proper dialog for full visibility */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Clock } from 'lucide-react';
import { Category } from '@/types';
import { getIcon } from '@/lib/icons';
import { Button } from '@/components/ui/button';

interface AddActivityProps {
  categories: Category[];
  onAdd: (categoryId: string, minutes: number) => void;
}

export function AddActivity({ categories, onAdd }: AddActivityProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [inputMode, setInputMode] = useState<'minutes' | 'hours'>('minutes');

  const handleAdd = () => {
    if (!selectedCategory) return;
    const totalMinutes = inputMode === 'hours' ? minutes * 60 : minutes;
    onAdd(selectedCategory, totalMinutes);
    setOpen(false);
    setSelectedCategory(null);
    setMinutes(30);
  };

  const handleClose = () => {
    // Just close — no rewards granted, no data saved
    setOpen(false);
    setSelectedCategory(null);
    setMinutes(30);
  };

  const quickMinutes = [15, 30, 45, 60, 90, 120];

  return (
    <>
      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary shadow-card-lg flex items-center justify-center"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </motion.button>

      {/* Modal overlay + centered dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl p-6 shadow-card-lg max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Dodaj aktywność</h3>
                <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Category grid */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {categories.map(cat => {
                  const Icon = getIcon(cat.icon);
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <motion.button
                      key={cat.id}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                        isSelected ? 'bg-accent ring-2 ring-primary' : 'bg-secondary hover:bg-accent'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `hsl(${cat.color} / 0.15)` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: `hsl(${cat.color})` }} />
                      </div>
                      <span className="text-[10px] font-medium text-foreground truncate w-full text-center">
                        {cat.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Time input - only shown after selecting category */}
              {selectedCategory && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex bg-secondary rounded-lg p-0.5">
                      <button
                        onClick={() => { setInputMode('minutes'); setMinutes(30); }}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          inputMode === 'minutes' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        Minuty
                      </button>
                      <button
                        onClick={() => { setInputMode('hours'); setMinutes(1); }}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          inputMode === 'hours' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        Godziny
                      </button>
                    </div>
                  </div>

                  {/* Quick select */}
                  <div className="flex flex-wrap gap-2">
                    {(inputMode === 'minutes' ? quickMinutes : [1, 2, 3, 4, 6, 8]).map(val => (
                      <button
                        key={val}
                        onClick={() => setMinutes(val)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          minutes === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-accent'
                        }`}
                      >
                        {val}{inputMode === 'minutes' ? ' min' : ' h'}
                      </button>
                    ))}
                  </div>

                  {/* Custom input + submit button */}
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={inputMode === 'minutes' ? 1440 : 24}
                      value={minutes}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                      className="flex-1 h-10 px-3 rounded-lg bg-secondary text-foreground text-sm border-0 focus:ring-2 ring-primary outline-none"
                    />
                    <Button onClick={handleAdd} className="h-10 px-6 shrink-0">
                      Dodaj
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
