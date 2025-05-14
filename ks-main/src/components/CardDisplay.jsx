import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BadgeCheck, Trophy, Star, Award, Coins, FileQuestion } from "lucide-react";
import { useEffect, useState } from "react";
import { getNextRank } from "@/services/rankService"; 
import { getTotalPurchases } from '../services/purcharseService';
import { ChangePasswordModal } from "./ChangePasswordModal";
import { Button } from "@/components/ui/button";

export const CardDisplay = ({ user }) => {
  const [perfilImage, setPerfilImage] = useState("");
  const [nextRankInfo, setNextRankInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);

  useEffect(() => {
    setPerfilImage(user?.src ? user.src : "");

    const fetchNextRank = async () => {
      try {
        if (user?.xp !== undefined) {
          const rankInfo = await getNextRank(user.xp);
          setNextRankInfo(rankInfo);

          // Calcula el progreso como porcentaje
          const totalXpForNextRank = rankInfo.nextRank?.xp || 0;
          const xpFromCurrentRank = user.xp - (rankInfo.currentRank?.xp || 0);
          const currentProgress = Math.min(
            (xpFromCurrentRank / (totalXpForNextRank - rankInfo.currentRank?.xp || 1)) * 100,
            100
          );
          setProgress(currentProgress);
        }
      } catch (error) {
        console.error("Error fetching next rank info:", error);
      }
    };

    const fetchTotalPurchases = async () => {
      if(user){
        try {
          const tp = await getTotalPurchases(user._id);
          setTotalPurchases(tp.totalPurchases);
        } catch (error) {
          console.error("Error fetching total purchases:", error);
        }
      }
    };

    fetchNextRank();
    fetchTotalPurchases();

  }, [user]);

  const xpToNextRank =
    nextRankInfo?.nextRank?.xp && user?.xp
      ? nextRankInfo.nextRank.xp - user.xp
      : 0;

  return (
    <div className="bg-card rounded-xl p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Mi Cuenta</h2>

        {user && (
          <div className="flex gap-2 justify-center items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => window.open("https://discord.com/invite/T9WJ2jGvAD", "_blank", "noopener noreferrer")}
          >
            <FileQuestion/>
            Soporte
          </Button>
          <ChangePasswordModal userId={user._id} />
          </div>  
          )}
      </div>

      {/* Profile Section */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 relative">
            <img
              src={perfilImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-card p-1.5 rounded-full border border-border">
            <BadgeCheck className="w-5 h-5 text-primary" />
          </div>
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <h3 className="text-2xl font-bold mb-1">{user?.username}</h3>
            <p className="text-muted-foreground">Cuenta verificada</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {nextRankInfo?.nextRank?.xp - user?.xp >= 0
                  ? `Te falta ${nextRankInfo?.nextRank?.xp - user?.xp} XP para subir de rango`
                  : "¡Has alcanzado el rango máximo!"}
              </span>
              <span className="text-primary">
                {user?.xp}/{nextRankInfo?.nextRank?.xp || "∞"} XP
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-secondary/50 p-4 rounded-lg text-center">
          <Award className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
          <p className="text-lg font-semibold">{totalPurchases}</p>
          <p className="text-sm text-muted-foreground">Total Pedidos</p>
        </div>
        <div className="bg-secondary/50 p-4 rounded-lg text-center">
          <Star className="w-6 h-6 mx-auto mb-2 text-purple-500" />
          <p className="text-lg font-semibold">
            {nextRankInfo?.currentRank?.name || "Sin rango"}
          </p>
          <p className="text-sm text-muted-foreground">Rango Actual</p>
        </div>
        <div className="bg-secondary/50 p-4 rounded-lg text-center col-span-2 md:col-span-1">
          <Coins className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
          <p className="text-lg font-semibold">{user?.gold !== undefined ? user.gold : 'N/A'}</p>
          <p className="text-sm text-muted-foreground">Oro</p>
        </div>
      </div>
    </div>
  );
};