import { Clock, ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from 'react-toastify';
import { getSkinById } from '../services/champsService';
import { getItemById } from '../services/itemService';
import { getUnrankedById } from '../services/unrankedService';
import { confirmPurchaseStatus } from '../services/purcharseService';

export const QuickTransfer = ({ 
  purchases, 
  loading, 
  onPurchaseUpdate
}) => {
  const [activePurchases, setActivePurchases] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [itemDetails, setItemDetails] = useState({});
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  useEffect(() => {
    fetchActivePurchases();
  }, [purchases]);

  useEffect(() => {
    if (activePurchases[currentIndex]) {
      fetchItemsDetails(activePurchases[currentIndex]);
    }
  }, [currentIndex, activePurchases]);

  useEffect(() => {
    if (!activePurchases.length) return;

    const timer = setInterval(() => {
      updateTimeRemaining();
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, activePurchases]);

  const updateTimeRemaining = () => {
    const currentPurchase = activePurchases[currentIndex];
    if (!currentPurchase?.timerEndTime) return;

    const timeStr = formatTimeRemaining(currentPurchase.timerEndTime);
    setTimeRemaining(timeStr);

    if (timeStr === "Tiempo expirado") {
      fetchActivePurchases();
    }
  };

  const fetchActivePurchases = () => {
    const activeItems = purchases.filter(purchase => 
      (purchase.status?.statusId.confirmationAction?.type === 'startTimer' && 
       purchase.timerEndTime &&
       new Date(purchase.timerEndTime) > new Date()) ||
      (purchase.status?.statusId.confirmacion && !purchase.status?.estadoConfirmado)
    );
    setActivePurchases(activeItems);
    if (activeItems.length > 0) {
      updateTimeRemaining();
    }
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const distance = end - now;

    if (distance < 0) return "Cuenta regresiva finalizada";

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

  const fetchItemsDetails = async (currentPurchase) => {
    if (!currentPurchase?.items) return;
    
    setIsLoadingItems(true);
    try {
        const itemPromises = currentPurchase.items.map(async (item) => {
            const itemId = item.itemId._id || item.itemId;
            let itemData;
            
            try {
                if (item.itemType === 'Unranked') {
                    itemData = await getUnrankedById(itemId);
                    itemData = { ...itemData, accountData: item.accountData };
                } else if (item.itemType === 'Skin') {
                    itemData = await getSkinById(itemId);
                } else {
                    itemData = await getItemById(itemId);
                    if (itemData.type === 'chromas') {
                        const skinId = item.itemId.skin?._id || item.itemId.skin || itemData.skin;
                        if (skinId) {
                            const skinData = await getSkinById(skinId);
                            itemData = { ...itemData, skinData };
                        }
                    }
                }

                return {
                    ...itemData,
                    isUnranked: item.itemType === 'Unranked',
                    isSkin: item.itemType === 'Skin'
                };
            } catch (error) {
                console.error(`Error fetching details for item ${itemId}:`, error);
                return null;
            }
        });

        const itemsData = await Promise.all(itemPromises);
        const itemsMap = {};
        
        currentPurchase.items.forEach((item, index) => {
            const itemId = item.itemId._id || item.itemId;
            if (itemsData[index]) {
                itemsMap[`${itemId}-${index}`] = itemsData[index];
            }
        });
        
        setItemDetails(itemsMap);
    } catch (error) {
        console.error('Error fetching item details:', error);
        toast.error('Error al cargar los detalles de los items');
    } finally {
        setIsLoadingItems(false);
    }
  };

  const renderItem = (item, index) => {
    const itemId = item.itemId._id || item.itemId;
    const itemKey = `${itemId}-${index}`;
    const itemDetail = itemDetails[itemKey];

    if (!itemDetail) {
      return (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-muted animate-pulse"/>
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted animate-pulse rounded"/>
          </div>
        </div>
      );
    }

    const imageSrc = itemDetail.srcLocal || itemDetail.srcWeb || itemDetail.src;
    
    if (item.itemType === 'Unranked') {
      return (
        <div className="flex items-center gap-4">
          <img 
            src={imageSrc} 
            alt={`Cuenta ${itemDetail.region}`}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium">Cuenta {itemDetail.region}</span>
                <div className="text-sm text-muted-foreground">
                  Nivel: {itemDetail.nivel} • EA: {itemDetail.escencia}
                  {itemDetail.escenciaNaranja > 0 && ` • EN: ${itemDetail.escenciaNaranja}`}
                  {itemDetail.rpAmount > 0 && ` • ${itemDetail.rpAmount}RP`}
                </div>
              </div>
              <span className="text-sm font-medium">x{item.quantity}</span>
            </div>
          </div>
        </div>
      );
    } else if (item.itemType === 'Skin') {
      return (
        <div className="flex items-center gap-4">
          <img 
            src={imageSrc} 
            alt={itemDetail.NombreSkin}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="font-medium">{itemDetail.NombreSkin}</span>
              <span className="text-sm font-medium">x{item.quantity}</span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-4">
          <img 
            src={imageSrc} 
            alt={itemDetail.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{itemDetail.name}</span>
                <div className="text-sm text-muted-foreground">{itemDetail.type}</div>
              </div>
              <span className="text-sm font-medium">x{item.quantity}</span>
            </div>
          </div>
        </div>
      );
    }
  };

  const handleConfirmStatus = async () => {
    try {
      const currentPurchase = activePurchases[currentIndex];
      const response = await confirmPurchaseStatus(currentPurchase._id);
      
      if (response) {
        toast.success('Estado confirmado exitosamente');
        onPurchaseUpdate();
        fetchActivePurchases();
      }
    } catch (error) {
      console.error('Error confirmando el estado:', error);
      toast.error('Error al confirmar el estado');
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : activePurchases.length - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev < activePurchases.length - 1 ? prev + 1 : 0);
  };

  if (loading) {
    return (
      <div className="h-full">
        <Card className="p-8 h-full flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-muted-foreground">Cargando pedidos...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (activePurchases.length === 0) {
    return (
      <div className="h-full">
        <Card className="p-8 h-full flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            No hay pedidos activos actualmente
          </p>
        </Card>
      </div>
    );
  }

  const currentPurchase = activePurchases[currentIndex];
  const needsConfirmation = currentPurchase?.status?.statusId.confirmacion && 
                           !currentPurchase?.status?.estadoConfirmado;

  return (
    <div className="h-full">
      <Card className="p-8 h-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Pedidos Activos</h2>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {activePurchases.length}
          </span>
        </div>

        <div className="flex justify-between items-start gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevious}
            className="mt-20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground">ID de Compra:</p>
                <p className="font-medium">{currentPurchase._id}</p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground">Cuenta Riot:</p>
                <p className="font-medium">{currentPurchase.riotName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Estado:</p>
                  <p className="font-medium" style={{ color: currentPurchase.status?.statusId.color }}>
                    {currentPurchase.status?.statusId.status}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentPurchase.status?.statusId.description}
                  </p>
                </div>

                {currentPurchase.timerEndTime && (
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Cuenta regresiva:</span>
                    </div>
                    <div className="font-mono font-bold" style={{ color: currentPurchase.status?.statusId.color }}>
                      {timeRemaining === "Cuenta regresiva finalizada" ? "Cuenta regresiva finalizada" : timeRemaining}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground">Items:</p>
              <div className="space-y-4">
                {currentPurchase.items.map((item, index) => (
                  <div key={index}>
                    {renderItem(item, index)}
                  </div>
                ))}
              </div>
            </div>

            {needsConfirmation && (
              <div className="pt-4">
                <Button 
                  onClick={handleConfirmStatus}
                  className="w-full"
                >
                  {currentPurchase.status?.statusId.confirmacionText || 'Confirmar Estado'}
                </Button>
              </div>
            )}

            {currentPurchase?.status?.estadoConfirmado && (
              <div className="pt-4 flex items-center justify-center gap-2 text-green-500">
                <Check className="w-4 h-4" />
                <span>Estado confirmado</span>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNext}
            className="mt-20"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuickTransfer;