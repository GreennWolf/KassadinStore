import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export const HeroSection = () => {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-noise opacity-5" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full filter blur-[128px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute bottom-20 right-10 w-72 h-72 bg-white/10 rounded-full filter blur-[128px]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Discover Rare Treasures
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Open exclusive cases and unlock legendary items. Each case contains carefully curated rewards waiting to be discovered.
          </p>
          <Button
            size="lg"
            className="bg-white hover:bg-white/90 text-black"
          >
            Explore Cases
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>

      {/* Floating elements */}
      <motion.div
        animate={{
          y: [-20, 20],
          rotate: [-5, 5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="absolute top-1/4 left-1/4 w-16 h-16 opacity-20"
      >
        <div className="w-full h-full rounded-lg border border-white/20 backdrop-blur-sm" />
      </motion.div>
      <motion.div
        animate={{
          y: [20, -20],
          rotate: [5, -5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="absolute bottom-1/4 right-1/4 w-24 h-24 opacity-20"
      >
        <div className="w-full h-full rounded-lg border border-white/20 backdrop-blur-sm" />
      </motion.div>
    </div>
  );
};