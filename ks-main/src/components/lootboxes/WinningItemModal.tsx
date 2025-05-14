import { motion, AnimatePresence } from "framer-motion";
import { getRarityStyles, getRarityTextColor } from "@/utils/rarityUtils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WinningItemModalProps {
  item: {
    name: string;
    rarity: string;
    image: string;
  } | null;
  onClose?: () => void;
}

export const WinningItemModal = ({ item, onClose }: WinningItemModalProps) => {
  if (!item) return null;

  const getRarityColor = (rarity: string) => {
    const colorClass = getRarityTextColor(rarity);
    const colorMap: Record<string, string> = {
      'text-orange-400': '#fb923c',
      'text-violet-400': '#a78bfa',
      'text-blue-400': '#60a5fa',
      'text-amber-700': '#b45309'
    };
    return colorMap[colorClass] || '#ffffff';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            transition: {
              duration: 0.5,
              type: "spring",
              stiffness: 260,
              damping: 20
            }
          }}
          exit={{ scale: 0, opacity: 0 }}
          className="relative"
        >
          <motion.div
            animate={{
              boxShadow: [
                `0 0 20px ${getRarityColor(item.rarity)}`,
                `0 0 60px ${getRarityColor(item.rarity)}`,
                `0 0 20px ${getRarityColor(item.rarity)}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`relative bg-card/95 rounded-xl p-8 ${getRarityStyles(item.rarity)}`}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50 hover:bg-white/10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="relative z-10">
              <div className="text-center">
                <div className="w-64 h-64 mx-auto mb-6">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
                <p className={`${getRarityTextColor(item.rarity)} text-lg`}>
                  {item.rarity}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};