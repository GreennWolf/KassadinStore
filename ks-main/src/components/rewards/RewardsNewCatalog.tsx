import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface RewardItem {
  id: number;
  name: string;
  rarity: string;
  image: string;
}

interface RewardsNewCatalogProps {
  items: RewardItem[];
  mode: 'lootboxes' | 'direct';
}

export const RewardsNewCatalog = ({ items, mode }: RewardsNewCatalogProps) => {
  // console.log('RewardsNewCatalog rendering with items:', items); // Debug log
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Recompensas Disponibles</h2>
      <div className="grid grid-cols-1 gap-4">
        {items.map((item, index) => {
          // console.log('Rendering item:', item); // Debug log for each item
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group relative overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                <div className="p-4 relative flex items-center space-x-4">
                  <div className="w-24 h-24 transform group-hover:scale-105 transition-transform duration-300">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white group-hover:text-yellow-500 transition-colors">
                      {item.name}
                    </h3>
                    <span className={`text-sm block mb-2 ${mode === 'direct' ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {mode === 'direct' ? '1000 puntos' : item.rarity}
                    </span>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold w-full sm:w-auto"
                    >
                      Canjear Ahora
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};