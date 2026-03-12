/* Shop page - purchase themes, backgrounds, and styles with coins/gems */
import { motion } from 'framer-motion';
import { ShoppingBag, Check, Paintbrush } from 'lucide-react';
import { SHOP_ITEMS, BACKGROUND_STYLES } from '@/types';
import { Button } from '@/components/ui/button';

interface ShopProps {
  store: ReturnType<typeof import('@/hooks/useAppStore').useAppStore>;
}

export default function Shop({ store }: ShopProps) {
  const { state, purchaseItem, setActiveBackground } = store;

  const groupedItems = {
    theme: SHOP_ITEMS.filter(i => i.type === 'theme'),
    background: SHOP_ITEMS.filter(i => i.type === 'background'),
    'chart-style': SHOP_ITEMS.filter(i => i.type === 'chart-style'),
    'category-color': SHOP_ITEMS.filter(i => i.type === 'category-color'),
  };

  const typeLabels: Record<string, string> = {
    theme: 'Motywy kolorystyczne',
    background: 'Tła aplikacji',
    'chart-style': 'Style wykresów',
    'category-color': 'Kolory kategorii',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-5"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Sklep</h1>
        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Balance */}
      <div className="flex gap-3">
        <div className="flex-1 bg-card rounded-2xl p-4 shadow-card text-center">
          <p className="text-xl font-bold text-cat-praca">🪙 {state.user.coins}</p>
          <p className="text-xs text-muted-foreground mt-1">Monety</p>
        </div>
        <div className="flex-1 bg-card rounded-2xl p-4 shadow-card text-center">
          <p className="text-xl font-bold text-cat-czytanie">💎 {state.user.gems}</p>
          <p className="text-xs text-muted-foreground mt-1">Klejnoty</p>
        </div>
      </div>

      {/* Shop sections */}
      {Object.entries(groupedItems).map(([type, items]) => (
        <div key={type} className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{typeLabels[type]}</h2>
          {items.map((item, i) => {
            const owned = state.user.purchasedItems.includes(item.id);
            const canAfford = item.currency === 'coins'
              ? state.user.coins >= item.price
              : state.user.gems >= item.price;
            const isActiveBackground = item.type === 'background' && state.user.activeBackground === item.value;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 ${isActiveBackground ? 'ring-2 ring-primary' : ''}`}
              >
                {/* Background preview swatch */}
                {item.type === 'background' && item.preview && (
                  <div
                    className="w-10 h-10 rounded-xl shrink-0 border border-border"
                    style={{ background: item.preview }}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>

                {/* Actions */}
                {owned ? (
                  item.type === 'background' ? (
                    isActiveBackground ? (
                      <div className="flex items-center gap-1 text-primary">
                        <Paintbrush className="h-4 w-4" />
                        <span className="text-xs font-medium">Aktywne</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveBackground(item.value)}
                        className="shrink-0"
                      >
                        Użyj
                      </Button>
                    )
                  ) : (
                    <div className="flex items-center gap-1 text-cat-sport">
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-medium">Kupione</span>
                    </div>
                  )
                ) : (
                  <Button
                    size="sm"
                    disabled={!canAfford}
                    onClick={() => purchaseItem(item.id, item.price, item.currency)}
                    className="shrink-0"
                  >
                    {item.currency === 'coins' ? '🪙' : '💎'} {item.price}
                  </Button>
                )}
              </motion.div>
            );
          })}

          {/* Reset background button */}
          {type === 'background' && state.user.activeBackground !== 'none' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveBackground('none')}
              className="text-xs text-muted-foreground"
            >
              Resetuj tło do domyślnego
            </Button>
          )}
        </div>
      ))}
    </motion.div>
  );
}
