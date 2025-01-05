import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from 'react-toastify';
import { useNotifications } from '../context/notificationContext';
import { Check } from 'lucide-react';
import { 
  getAllStatus, 
  markStatusAsViewed, 
  updatePurchase,
  confirmPurchaseStatus 
} from '../services/purcharseService';
import { getSkinById } from '../services/champsService';
import { getItemById } from '../services/itemService';
import { getCurrencyById } from '../services/currencyService';
import { getCuponById } from '../services/cuponServices';

const OrderDetailsModal = ({ isOpen, onClose, order, onOrderUpdated, statuses, admin }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [itemDetails, setItemDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusList, setStatusList] = useState(statuses || []);
  const [currentOrder, setCurrentOrder] = useState(order);
  const [currency, setCurrency] = useState({});
  const [cupon, setCupon] = useState({});
  const { updateNotifications } = useNotifications();

  useEffect(() => {
    setCurrentOrder(order);
    if (isOpen && order) {
      if (!admin) {
        handleMarkAsViewed();
      }
      fetchData();
    }
  }, [isOpen, order, admin]);

  const handleMarkAsViewed = async () => {
    try {
      if (order?.statusChangeViewed === false) {
        await markStatusAsViewed(order._id);
        setCurrentOrder(prev => ({
          ...prev,
          statusChangeViewed: true
        }));
        updateNotifications();
      }
    } catch (error) {
      console.error('Error marking as viewed:', error);
      toast.error('Error al marcar como visto');
    }
  };

  const handleConfirmStatus = async () => {
    try {
        const response = await confirmPurchaseStatus(currentOrder._id);
        const confirmationAction = currentOrder.status.statusId.confirmationAction;

        if (confirmationAction?.type === 'startTimer') {
            setCurrentOrder(prev => ({
                ...prev,
                ...response,
                status: {
                    ...response.status,
                    estadoConfirmado: true,
                    confirmadoEn: new Date()
                }
            }));
        } else if (confirmationAction?.type === 'changeStatus') {
            setCurrentOrder(response);
        } else {
            setCurrentOrder(prev => ({
                ...prev,
                status: {
                    ...prev.status,
                    estadoConfirmado: true,
                    confirmadoEn: new Date()
                }
            }));
        }

        toast.success('Estado confirmado exitosamente');
        
        if (onOrderUpdated) {
            onOrderUpdated(currentOrder._id);
        }
    } catch (error) {
        console.error('Error confirmando el estado:', error);
        toast.error('Error al confirmar el estado');
    }
};

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchItemsDetails(),
        fetchCurrency(),
        fetchStatuses(),
        order.cupon ? fetchCupon() : Promise.resolve(null)
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchItemsDetails = async () => {
    if (!currentOrder?.items) return;
    
    try {
      const itemPromises = currentOrder.items.map(async item => {
        const itemId = item.itemId._id || item.itemId;
        let itemData;
        
        if (item.itemType === 'Skin') {
          itemData = await getSkinById(itemId);
        } else {
          itemData = await getItemById(itemId);
          if (itemData.type === 'chromas') {
            try {
              const skinId = item.itemId.skin?._id || item.itemId.skin || itemData.skin;
              if (skinId) {
                const skinData = await getSkinById(skinId);
                itemData = { ...itemData, skinData };
              }
            } catch (error) {
              console.error('Error fetching chroma skin:', error);
            }
          }
        }
        return itemData;
      });

      const itemsData = await Promise.all(itemPromises);
      const itemsMap = {};
      
      currentOrder.items.forEach((item, index) => {
        const itemId = item.itemId._id || item.itemId;
        itemsMap[`${itemId}-${index}`] = {
          ...itemsData[index],
          isSkin: item.itemType === 'Skin'
        };
      });
      
      setItemDetails(itemsMap);
    } catch (error) {
      console.error('Error fetching item details:', error);
      toast.error('Error al cargar los detalles de los items');
    }
  };

  const fetchStatuses = async () => {
    if (!statuses) {
      try {
        const response = await getAllStatus();
        setStatusList(response);
      } catch (error) {
        console.error('Error fetching statuses:', error);
        toast.error('Error al cargar los estados');
      }
    }
  };

  const fetchCurrency = async () => {
    try {
      const currencyData = await getCurrencyById(order.currencyId);
      setCurrency(currencyData);
    } catch (error) {
      console.error('Error fetching currency:', error);
      toast.error('Error al obtener la divisa');
    }
  };

  const fetchCupon = async () => {
    try {
      const response = await getCuponById(order.cupon);
      setCupon(response);
    } catch (error) {
      console.error('Error fetching coupon:', error);
      toast.error('Error al cargar el cupón');
    }
  };

  const handleStatusChange = async (newStatusId) => {
    try {
      await updatePurchase(currentOrder._id, { status: newStatusId });
      const selectedStatusData = statusList.find(s => s._id === newStatusId);
      const updatedOrder = {
        ...currentOrder,
        status: {
          statusId: newStatusId,
          estadoConfirmado: false,
          confirmadoEn: null
        }
      };
      setCurrentOrder(updatedOrder);
      
      toast.success('Estado actualizado exitosamente');
      
      if (onOrderUpdated) {
        onOrderUpdated(currentOrder._id, newStatusId, selectedStatusData);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatTime = (timeInMinutes) => {
    const days = Math.floor(timeInMinutes / (24 * 60));
    const hours = Math.floor((timeInMinutes % (24 * 60)) / 60);
    const minutes = Math.floor(timeInMinutes % 60);
    const seconds = Math.round((timeInMinutes % 1) * 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    
    return parts.join(' ') || '0s';
  };

  const renderStatusCard = () => {
    const currentStatus = statusList.find(s => s._id === currentOrder?.status?.statusId._id);
    const timeRemaining = currentOrder?.timerEndTime ? new Date(currentOrder.timerEndTime) - new Date() : null;
    
    const formatTimeRemaining = (ms) => {
        if (ms <= 0) return "Tiempo expirado";
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);
        return parts.join(' ') || '0s';
    };

    const getStatusActionDescription = (status) => {
        if (!status.confirmationAction) return null;
        
        switch (status.confirmationAction.type) {
            case 'startTimer':
                return `Se iniciará un temporizador de ${formatTime(status.confirmationAction.config.time)}`;
            case 'changeStatus':
                const targetStatus = statusList.find(s => s._id === status.confirmationAction.config.targetStatus);
                return `Cambiará al estado: ${targetStatus?.status || 'Desconocido'}`;
            default:
                return null;
        }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Estado del Pedido</span>
            {admin && (
              <Select
                value={currentOrder?.status?.statusId._id}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Cambiar estado" />
                </SelectTrigger>
                <SelectContent>
                  {statusList.map((status) => (
                    <SelectItem key={status._id} value={status._id}>
                      {status.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-lg">Estado Actual</Label>
              <p style={{ color: currentStatus?.color }}>{currentStatus?.status}</p>
            </div>
            
            <div>
              <Label className="text-lg">Descripción</Label>
              <p>{currentStatus?.description}</p>
            </div>

            {currentOrder?.timerEndTime && (
              <div>
                <Label className="text-lg">Tiempo Restante</Label>
                <p className="text-xl font-mono">
                  {formatTimeRemaining(timeRemaining)}
                </p>
              </div>
            )}

            {currentStatus?.confirmacion && (
              <div className="space-y-2">
                <Label className="text-lg">Estado de Confirmación</Label>
                {currentOrder?.status?.estadoConfirmado ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <p>Confirmado el {formatDate(currentOrder?.status?.confirmadoEn)}</p>
                  </div>
                ) : !admin && (
                  <div className="space-y-2">
                    <p className="text-yellow-500">Pendiente de confirmación</p>
                    {getStatusActionDescription(currentStatus) && (
                      <p className="text-sm text-muted-foreground">
                        Al confirmar: {getStatusActionDescription(currentStatus)}
                      </p>
                    )}
                    <Button 
                      onClick={handleConfirmStatus}
                      className="w-full"
                    >
                      {currentStatus.confirmacionText || 'Confirmar'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
};

  const renderItem = (item, index) => {
    const itemId = item.itemId._id || item.itemId;
    const itemKey = `${itemId}-${index}`;
    const itemDetail = itemDetails[itemKey];

    if (loading) {
      return (
        <Card className="bg-muted">
          <CardContent className="p-4">
            <div className="animate-pulse flex items-center gap-4">
              <div className="bg-muted-foreground h-20 w-20 rounded" />
              <div className="flex-1">
                <div className="bg-muted-foreground h-4 w-3/4 rounded mb-2" />
                <div className="bg-muted-foreground h-4 w-1/2 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!itemDetail) {
      return (
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">Error al cargar los detalles del item</p>
          </CardContent>
        </Card>
      );
    }

    const isChroma = itemDetail.type === 'chromas' && itemDetail.skinData;

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <img 
              src={itemDetail.srcLocal || itemDetail.src} 
              alt={item.itemType === 'Skin' ? itemDetail.NombreSkin : itemDetail.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              {isChroma && itemDetail.skinData && (
                <p className="text-sm text-muted-foreground mb-1">
                  Chroma para: <span className="font-medium">{itemDetail.skinData.NombreSkin}</span>
                </p>
              )}
              <h4 className="font-semibold">
                {item.itemType === 'Skin' ? itemDetail.NombreSkin : itemDetail.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {item.itemType === 'Skin' ? 'Skin' : itemDetail.type === 'chromas' ? 'Chroma' : 'Item'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Cantidad: {item.quantity}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ImageModal = () => (
    <Dialog open={isImageModalOpen} onOpenChange={() => setIsImageModalOpen(false)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Recibo</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center max-h-[80vh]">
          <img
            src={currentOrder?.receiptUrl}
            alt="Recibo ampliado"
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Pedido {currentOrder?._id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalles Básicos</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Fecha: {formatDate(currentOrder?.purchaseDate)}</p>
                <p>XP Ganada: {currentOrder?.earnedXp}</p>
                {currentOrder?.rankUpgrade && (
                  <div>
                    <p className='flex gap-2'>Estabas en <p className='text-red-500'>{currentOrder.rankUpgrade.from.name}</p></p>
                    <p className='flex gap-2'>Ascendiste a <p className='text-blue-500'>{currentOrder.rankUpgrade.to.name}</p></p>
                    <p className='flex gap-2'>Oro ganado por ascenso <p className='text-yellow-500'>{currentOrder.rankUpgrade.goldEarned}</p></p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cuenta Riot</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{currentOrder?.riotName}</p>
                <p>Región: {currentOrder?.region}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cuenta Discord</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{currentOrder?.discordName || 'No Agregado'}</p>
              </CardContent>
            </Card>

            {renderStatusCard()}

            <Card>
              <CardHeader>
                <CardTitle>Detalles de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cupon?.cupon && (
                  <div className="flex justify-between">
                    <span>Cupón:</span>
                    <span>{cupon.cupon}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Divisa:</span>
                  <span>{currency?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>RP Total:</span>
                  <span>{currentOrder?.totalRP}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currency?.symbol}{currentOrder?.originalPrice}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{currency?.symbol}{currentOrder?.Total}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentOrder?.items?.map((item, index) => (
                  <div key={`item-${index}`}>
                    {renderItem(item, index)}
                  </div>
                ))}
              </CardContent>
            </Card>

            {currentOrder?.receipt && (
              <Card>
                <CardHeader>
                  <CardTitle>Comprobante</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={currentOrder.receiptUrl}
                    alt="Recibo de pago"
                    className="max-w-full h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
                    onClick={() => setIsImageModalOpen(true)}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ImageModal />
    </>
  );
};

export default OrderDetailsModal;