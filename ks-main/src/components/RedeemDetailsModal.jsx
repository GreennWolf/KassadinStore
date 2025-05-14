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
import { Check, Loader2 } from 'lucide-react';
import {
  markStatusAsViewed,
  updateRedeem,
  confirmRedeemStatus,
  deleteRedeem
} from '../services/rewardRedeemService';
import { getSkinById } from '../services/champsService';
import { getItemById } from '../services/itemService';
import { getAllStatus } from '../services/purcharseService';
import { FaTrash } from 'react-icons/fa';

const RedeemDetailsModal = ({ isOpen, onClose, order, onOrderUpdated, statuses, admin }) => {
  const [itemDetails, setItemDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusList, setStatusList] = useState(statuses || []);
  const [currentOrder, setCurrentOrder] = useState(order);
  const { updateNotifications } = useNotifications();

  // Función auxiliar para formatear tiempo
  const formatTime = (timeInMinutes) => {
    if (typeof timeInMinutes !== 'number') return '0m';
    const days = Math.floor(timeInMinutes / (24 * 60));
    const hours = Math.floor((timeInMinutes % (24 * 60)) / 60);
    const minutes = Math.floor(timeInMinutes % 60);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(' ') || '0m';
  };

  // Función auxiliar para formatear fechas
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const handleDelete = async (id) => {
    try {
      await deleteRedeem(id);
      toast.success('Redeem eliminado exitosamente');
      onClose();
    } catch (error) {
      console.error('Error eliminando el redeem:', error);
      toast.error('Error al eliminar el redeem');
    }
  };

  const handleConfirmStatus = async () => {
    try {
      const response = await confirmRedeemStatus(currentOrder._id);
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
        fetchStatuses()
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

  const handleStatusChange = async (newStatusId) => {
    try {
      await updateRedeem(currentOrder._id, { status: newStatusId });
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

  const renderStatusCard = () => {
    const currentStatus = statusList.find(s => s._id === currentOrder?.status?.statusId._id);
    const timeRemaining = currentOrder?.timerEndTime ? new Date(currentOrder.timerEndTime) - new Date() : null;
    
    const formatTimeRemaining = (ms) => {
      if (ms <= 0) return "Tiempo expirado";
      const minutes = Math.floor(ms / (1000 * 60));
      return formatTime(minutes);
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
            <span>Estado del Redeem</span>
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
                <p className="text-xl font-mono">{formatTimeRemaining(timeRemaining)}</p>
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
                    <Button onClick={handleConfirmStatus} className="w-full">
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

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <img
              src={itemDetail.srcLocal || itemDetail.src}
              alt={itemDetail.isSkin ? itemDetail.NombreSkin : itemDetail.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h4 className="font-semibold">
                {itemDetail.isSkin ? itemDetail.NombreSkin : itemDetail.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {itemDetail.isSkin ? 'Skin' : 'Item'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-around">
            <div>Detalles del Redeem {currentOrder?._id}</div>
            {admin && (
              <div className="cursor-pointer" onClick={() => handleDelete(currentOrder._id)}>
                <FaTrash />
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles Básicos</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Fecha: {formatDate(currentOrder?.redeemDate)}</p>
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
              <CardTitle>Items Reclamados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentOrder?.items?.map((item, index) => (
                <div key={`item-${index}`}>
                  {renderItem(item, index)}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default  RedeemDetailsModal;