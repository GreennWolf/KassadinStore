import { motion } from "framer-motion";
import { Package, Sparkles, Gift, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Skin from  "../../assets/Skin.png";
import Loot from  "../../assets/Loot.png";
import lootbox from  "../../assets/LOOTBOXES.png";
import Cupones from  "../../assets/Cupones.png";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

export const RewardOptionsGrid = () => {
  const navigate = useNavigate();
  
  const options = [
    {
      title: "Lootboxes",
      icon: Package,
      image: lootbox,
      path: "/lootboxes"
    },
    {
      title: "Skins",
      icon: ShoppingBag,
      image: Skin,
      path: "/tiendaOro/skins"
    },
    {
      title: "Cupones",
      icon: Gift,
      image: Cupones,
      path: "/cupones"
    },
    {
      title: "LOOT",
      icon: Sparkles,
      image: Loot,
      path: "/tiendaOro/loot"
    }
  ];

  return (
    <div className="lg:col-span-1">
      <div className="grid grid-cols-2 gap-4 h-full">
        {options.map((option, index) => (
          <motion.div
            key={option.title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="h-[240px]"
          >
          <RewardOption
            {...option}
            onClick={() => {
              if (option.path === '') {
                toast.info('En mantenimiento, pronto estará disponible', {
                  position: 'top-center',
                  autoClose: 3000,
                });
              } else {
                navigate(option.path);
              }
            }}
          />
          </motion.div>
        ))}
      </div>
      <ToastContainer />
    </div>
  );
};