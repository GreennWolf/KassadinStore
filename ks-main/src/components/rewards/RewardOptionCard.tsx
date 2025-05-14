import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface RewardOptionCardProps {
  title: string;
  icon: React.ReactNode;
  image: string;
}

export const RewardOptionCard = ({ title, icon, image }: RewardOptionCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (title === "Cupones") {
      navigate("/cupones");
    } else if (title === "Lootboxes") {
      navigate("/lootboxes");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className="w-full"
      onClick={handleClick}
    >
      <Card className="relative overflow-hidden cursor-pointer group h-[240px] bg-gradient-to-br from-black to-zinc-900 border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        
        <div className="relative h-full p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
              {icon}
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
};