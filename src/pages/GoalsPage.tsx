/* Goals page */
import { motion } from 'framer-motion';
import { Goals } from '@/components/Goals';

interface GoalsPageProps {
  store: ReturnType<typeof import('@/hooks/useAppStore').useAppStore>;
}

export default function GoalsPage({ store }: GoalsPageProps) {
  const { state, addGoal, removeGoal, getGoalProgress } = store;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-5"
    >
      <h1 className="text-2xl font-bold text-foreground">Cele</h1>
      <p className="text-sm text-muted-foreground">
        Zdefiniuj cele dzienne i tygodniowe — postęp jest liczony automatycznie z aktywności.
      </p>

      <Goals
        goals={state.goals}
        categories={state.categories}
        getProgress={getGoalProgress}
        onAdd={addGoal}
        onRemove={removeGoal}
      />
    </motion.div>
  );
}
