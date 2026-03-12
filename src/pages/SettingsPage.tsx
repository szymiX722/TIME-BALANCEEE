/* Settings page - manage categories, dark mode, export */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Download, Moon, Sun, X } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Category } from '@/types';

interface SettingsProps {
  store: ReturnType<typeof import('@/hooks/useAppStore').useAppStore>;
}

export default function SettingsPage({ store }: SettingsProps) {
  const { state, addCategory, updateCategory, removeCategory, toggleDarkMode, exportCSV } = store;
  const [editing, setEditing] = useState<string | null>(null);
  const [newCat, setNewCat] = useState(false);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('200 60% 50%');

  const presetColors = [
    '174 62% 47%', '142 71% 45%', '262 52% 55%', '220 70% 55%',
    '32 95% 55%', '340 75% 55%', '200 80% 50%', '15 80% 55%',
    '50 85% 50%', '0 0% 60%', '280 70% 55%', '160 60% 45%',
  ];

  const handleAddCategory = () => {
    if (!catName.trim()) return;
    const id = catName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    addCategory({
      id,
      name: catName,
      color: catColor,
      icon: 'CircleDot',
      dopamineWeight: 0,
    });
    setCatName('');
    setNewCat(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-5"
    >
      <h1 className="text-2xl font-bold text-foreground">Ustawienia</h1>

      {/* Dark mode toggle */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {state.user.darkMode ? (
              <Moon className="h-5 w-5 text-cat-sen" />
            ) : (
              <Sun className="h-5 w-5 text-cat-praca" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Tryb ciemny</p>
              <p className="text-xs text-muted-foreground">
                {state.user.darkMode ? 'Włączony' : 'Wyłączony'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              state.user.darkMode ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <motion.div
              className="absolute top-0.5 w-6 h-6 bg-card rounded-full shadow-sm"
              animate={{ left: state.user.darkMode ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Eksport danych</p>
            <p className="text-xs text-muted-foreground">Pobierz wszystkie dane jako CSV</p>
          </div>
          <Button size="sm" onClick={exportCSV} variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Categories management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Kategorie</h2>
          <button
            onClick={() => setNewCat(true)}
            className="p-1.5 rounded-lg bg-secondary hover:bg-accent transition-colors"
          >
            <Plus className="h-4 w-4 text-foreground" />
          </button>
        </div>

        {/* Add new category */}
        {newCat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-card rounded-2xl p-4 shadow-card space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Nowa kategoria</h3>
              <button onClick={() => setNewCat(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Nazwa kategorii"
              value={catName}
              onChange={e => setCatName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-secondary text-foreground text-sm border-0 focus:ring-2 ring-primary outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {presetColors.map(color => (
                <button
                  key={color}
                  onClick={() => setCatColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    catColor === color ? 'scale-125 ring-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: `hsl(${color})` }}
                />
              ))}
            </div>
            <Button size="sm" onClick={handleAddCategory}>Dodaj</Button>
          </motion.div>
        )}

        {/* Category list */}
        {state.categories.map((cat, i) => {
          const Icon = getIcon(cat.icon);
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `hsl(${cat.color} / 0.15)` }}
              >
                <Icon className="h-4 w-4" style={{ color: `hsl(${cat.color})` }} />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground">{cat.name}</span>
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: `hsl(${cat.color})` }}
              />
              <button
                onClick={() => removeCategory(cat.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
