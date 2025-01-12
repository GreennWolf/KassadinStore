import { TopNav } from "@/components/TopNav";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { XPOroDialog } from "@/components/rewards/XPOroDialog";
import { StepsSection } from "@/components/sections/StepsSection";
import { RewardOptionsGrid } from "@/components/rewards/RewardOptionsGrid";
import rewardBoy from '../assets/rewardBoy.png'


const Recompensas = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card className="relative overflow-hidden h-[500px] glow-border-animation bg-gradient-to-br from-black to-zinc-900 border-none">
              <div className="relative h-full p-8 flex flex-col justify-between z-10">
                <div className="space-y-4 max-w-xl">
                  <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl font-bold text-white"
                  >
                    Beneficios exclusivos
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-white/80"
                  >
                    Obtene recompensas exclusivas, subiendo de rango al hacer compras.
                  </motion.p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute right-8 md:-bottom-10 -bottom-5 transform -translate-y-1/2"
                >
                  <img 
                    src={rewardBoy}
                    alt="Rewards"
                    className="w-96 h-96 object-contain grayscale"
                  />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center space-x-4 z-10"
                >
                  
                <XPOroDialog />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <RewardOptionsGrid />
        </div>

        <StepsSection />
      </main>
    </div>
  );
};

export default Recompensas;