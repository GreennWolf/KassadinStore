import { TopNav } from "@/components/TopNav";
import { motion } from "framer-motion";
import { Package, Sparkles, Gift, ShoppingBag, Star, Coins } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";

const RewardOption = ({ icon: Icon, title, image, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    className="w-full"
  >
    <Card 
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer group h-[240px] bg-gradient-to-br from-black to-zinc-900 border-zinc-800"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
      
      <div className="relative h-full p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        <div className="mt-auto">
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="h-1 w-12 bg-primary rounded-full transform origin-left group-hover:scale-x-150 transition-transform" />
        </div>
      </div>
    </Card>
  </motion.div>
);

const XPSystemDialog = () => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-3 bg-white text-black rounded-lg font-semibold text-lg hover:bg-white/90 transition-colors"
      >
        Comenzar ahora
      </motion.button>
    </AlertDialogTrigger>
    <AlertDialogContent className="max-w-2xl">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-2xl mb-4 flex items-center gap-2">
          <Star className="text-yellow-500" /> Sistema de XP y Oro <Coins className="text-yellow-500" />
        </AlertDialogTitle>
        <AlertDialogDescription className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white">Sistema de XP 🎮</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Gana XP completando misiones
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Sube de nivel para desbloquear recompensas
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Accede a contenido exclusivo
                </li>
              </ul>
              <img 
                src="/lovable-uploads/52d20088-5ab7-41d4-bbc4-1039096de313.png" 
                alt="XP System"
                className="w-full h-32 object-contain"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white">Sistema de Oro 💰</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  Gana oro completando desafíos diarios
                </li>
                <li className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  Intercambia oro por recompensas exclusivas
                </li>
                <li className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  Participa en eventos especiales
                </li>
              </ul>
              <img 
                src="/lovable-uploads/8320024c-86d2-4025-8edd-92e78fa36e21.png" 
                alt="Gold System"
                className="w-full h-32 object-contain"
              />
            </motion.div>
          </div>

          <div className="mt-6 p-4 bg-zinc-900 rounded-lg">
            <p className="text-sm text-gray-300">
              💡 Consejo: Completa misiones diarias para maximizar tus ganancias de XP y oro. ¡Cuanto más juegues, más rápido progresarás!
            </p>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
    </AlertDialogContent>
  </AlertDialog>
);

const Recompensas = () => {
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    {
      title: "Lootboxes",
      icon: Package,
      image: "/lovable-uploads/b4d589db-dc1a-49f4-9844-46ffcb1a6558.png",
      link:'/lootboxes'
    },
    {
      title: "Skins",
      icon: ShoppingBag,
      image: "/lovable-uploads/96f576d4-60e7-4745-83d2-57efd475a432.png",
      link:'/tiendaOro/skins'
    },
    {
      title: "Cupones",
      icon: Gift,
      image: "/lovable-uploads/55760504-2451-4399-a4ea-eea90f896c35.png",
      link:'/cupones'
    },
    {
      title: "LOOT",
      icon: Sparkles,
      image: "/lovable-uploads/ea802663-4892-4177-ae24-4039068a578c.png",
      link:'/tiendaOro/loot'
    }
  ];

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
                    Obtén recompensas diarias y exclusivas. Inicia sesión con Google, Steam o cualquier otro método para comenzar.
                  </motion.p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2"
                >
                  <img 
                    src="/lovable-uploads/1f0680e5-2081-4521-bf27-49233fbdaac5.png"
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
                  <XPSystemDialog />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-4 h-full">
              {options.map((option, index) => (
                <Link to={option.link} key={option.title}> 
                  <motion.div
                    key={option.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="h-[240px]"
                  >
                    <RewardOption
                      {...option}
                      onClick={() => setSelectedOption(option.title)}
                    />
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Recompensas;