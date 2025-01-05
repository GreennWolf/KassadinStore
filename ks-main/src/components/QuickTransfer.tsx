import { Clock, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export const QuickTransfer = ({ purchases, loading }) => {
  const [timerPurchases, setTimerPurchases] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    fetchTimerPurchases();
  }, [purchases]);

  useEffect(() => {
    if (!timerPurchases.length) return;

    const timer = setInterval(() => {
      updateTimeRemaining();
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, timerPurchases]);

  const updateTimeRemaining = () => {
    const currentPurchase = timerPurchases[currentIndex];
    if (!currentPurchase?.timerEndTime) return;

    const timeStr = formatTimeRemaining(currentPurchase.timerEndTime);
    setTimeRemaining(timeStr);

    if (timeStr === "Tiempo expirado") {
      fetchTimerPurchases();
    }
  };

  const fetchTimerPurchases = () => {
    const withTimers = purchases.filter(purchase => 
      purchase.status?.statusId.confirmationAction?.type === 'startTimer' && 
      purchase.timerEndTime &&
      new Date(purchase.timerEndTime) > new Date()
    );
    setTimerPurchases(withTimers);
    if (withTimers.length > 0) {
      updateTimeRemaining();
    }
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const distance = end - now;

    if (distance < 0) return "Tiempo expirado";

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : timerPurchases.length - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev < timerPurchases.length - 1 ? prev + 1 : 0);
  };

  if (loading) {
    return (
      <div className="h-full space-y-6">
        <div className="bg-card rounded-xl p-8 space-y-8 h-full flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-muted-foreground">Cargando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (timerPurchases.length === 0) {
    return (
      <div className="h-full space-y-6">
        <div className="bg-card rounded-xl p-8 space-y-8 h-full flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            No hay pedidos con temporizador actualmente
          </p>
        </div>
      </div>
    );
  }

  const currentPurchase = timerPurchases[currentIndex];

  return (
    <div className="h-full space-y-6">
      <div className="bg-card rounded-xl p-8 space-y-8 h-full">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Pedidos en curso</h2>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {timerPurchases.length}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevious}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span>Tiempo restante:</span>
            </div>
            
            <div className="text-2xl font-mono font-bold text-center">
              {timeRemaining}
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Orden ID:</div>
              <div className="font-medium">{currentPurchase._id}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Items:</div>
              <div className="font-medium">
                {currentPurchase.items.map((item, index) => (
                  <div key={index}>{item.itemType}: {item.itemId.NombreSkin || 'Item'}</div>
                ))}
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNext}
            className="shrink-0"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};