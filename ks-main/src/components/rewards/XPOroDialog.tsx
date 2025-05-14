import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { Star, Coins } from "lucide-react";

export const XPOroDialog = () => {
  return (
    <AlertDialog>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" /> Sistema de Recompensas <Coins className="text-yellow-500" />
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-white">Oro 💰</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    Gana Oro al subir de rango
                  </li>
                  <li className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    Recibe recompensas especiales por logros
                  </li>
                  <li className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    Desbloquea contenido exclusivo
                  </li>
                </ul>
                <img 
                  src="/lovable-uploads/8320024c-86d2-4025-8edd-92e78fa36e21.png" 
                  alt="Gold System"
                  className="w-full h-32 object-contain"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-white">XP 🎮</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Gana XP comprando items
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Sube de nivel para desbloquear recompensas
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Accede a eventos especiales
                  </li>
                </ul>
                <img 
                  src="/lovable-uploads/52d20088-5ab7-41d4-bbc4-1039096de313.png" 
                  alt="XP System"
                  className="w-full h-32 object-contain"
                />
              </motion.div>
            </div>

            <div className="mt-6 p-4 bg-zinc-900 rounded-lg">
              <p className="text-sm text-gray-300">
                💡 Consejo: Completa misiones diarias y sube de rango para maximizar tus ganancias de XP y Oro. ¡Cuanto más juegues, más rápido progresarás!
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};