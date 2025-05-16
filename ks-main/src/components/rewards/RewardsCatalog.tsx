import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface RewardItem {
  id: number;
  name: string;
  rarity: string;
  image: string;
}

interface RewardsCatalogProps {
  items: RewardItem[];
  mode: 'lootboxes' | 'direct';
}

export const RewardsCatalog = ({ items, mode }: RewardsCatalogProps) => {
  // // console.log('RewardsCatalog rendering with items:', items); // Debug log
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item, index) => {
        // // console.log('Rendering item:', item); // Debug log for each item
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group relative overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              <div className="p-6 relative">
                <div className="mb-6 transform group-hover:scale-105 transition-transform duration-300">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full aspect-square object-contain"
                  />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-white group-hover:text-yellow-500 transition-colors">
                  {item.name}
                </h3>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${mode === 'direct' ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {mode === 'direct' ? '1000 puntos' : item.rarity}
                  </span>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
                  >
                    Canjear
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};