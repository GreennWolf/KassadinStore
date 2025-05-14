import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { getAllStatus } from '../services/purcharseService.js';
import { Loader2, Check } from "lucide-react";
import RedeemDetailsModal from './RedeemDetailsModal';
import { StatusToolTip } from '@/components/StatusToolTip';

export const RedeemTransactionsTable = ({ redeems, loading, onRedeemUpdate }) => {
  const [orders, setOrders] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const STATUS_DISPLAY_LIMIT = 4;

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    if (redeems) {
      processUserRedeems();
    }
  }, [redeems]);

  const processUserRedeems = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error("No hay usuario logueado");
        return;
      }

      const userRedeems = redeems.filter(redeem => redeem.userId === user._id);
      setOrders(userRedeems);
    } catch (error) {
      console.error("Error al procesar redeems:", error);
      toast.error("Error al procesar redeems");
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await getAllStatus();
      setStatusList(response);
    } catch (error) {
      console.error('Error al obtener estados:', error);
      toast.error('Error al cargar los estados');
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleOrderUpdated = async (orderId) => {
    try {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { 
                ...order, 
                status: {
                  ...order.status,
                  estadoConfirmado: true,
                  confirmadoEn: new Date()
                }
              }
            : order
        )
      );

      if (onRedeemUpdate) {
        await onRedeemUpdate();
      }
    } catch (error) {
      console.error('Error updating redeem:', error);
      toast.error('Error al actualizar el redeem');
    }
  };

  const getStatusFromOrder = (order) => {
    if (!order?.status) return null;
    const statusId = order.status.statusId?._id || order.status.statusId;
    return statusList.find(s => s._id === statusId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusDotStyle = (color) => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '9999px',
    backgroundColor: color,
    animation: 'pulse 3s ease-in-out infinite',
    boxShadow: `0 0 8px ${color}99`,
    transition: 'all 700ms'
  });

  const displayedStatuses = showAllStatuses 
    ? statusList 
    : statusList.slice(0, STATUS_DISPLAY_LIMIT);

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando redeems...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-xl p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Redeems Recientes</h2>
            <p className="text-sm text-muted-foreground">
              Mira todos tus redeems y sus estados aqui
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex flex-wrap gap-4 md:gap-6">
              {displayedStatuses.map((status) => (
                <div key={status._id} className="flex items-center gap-2">
                  <div style={getStatusDotStyle(status.color)}></div>
                  <span className="text-sm capitalize">{status.status}</span>
                  {status.confirmacion && (
                    <span className="text-xs text-muted-foreground">(Requiere confirmación)</span>
                  )}
                </div>
              ))}
            </div>
            {statusList.length > STATUS_DISPLAY_LIMIT && (
              <button 
                className="text-primary hover:text-primary/80 transition-colors"
                onClick={() => setShowAllStatuses(!showAllStatuses)}
              >
                {showAllStatuses ? 'Ver menos' : 'Ver todos'}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="text-muted-foreground text-sm border-b border-border">
                    <th className="text-center pb-4 font-normal px-4 md:px-6">ID</th>
                    <th className="text-center pb-4 font-normal px-4 md:px-6">ESTADOS</th>
                    <th className="text-center pb-4 font-normal px-4 md:px-6">USUARIO</th>
                    <th className="text-center pb-4 font-normal px-4 md:px-6">RIOT ID</th>
                    <th className="text-center pb-4 font-normal px-4 md:px-6">Region</th>
                    <th className="text-center pb-4 font-normal px-4 md:px-6">ITEMS</th>
                    <th className="text-center pb-4 font-normal px-4 md:px-6">FECHA</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order) => {
                      const status = getStatusFromOrder(order);
                      if (!status) return null;

                      return (
                        <tr 
                          key={order._id} 
                          className="border-t border-border hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => handleOrderClick(order)}
                        >
                          <td className="py-4 text-center px-4 md:px-6">{order._id}</td>
                          <td className="py-4 px-4 md:px-6 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div style={getStatusDotStyle(status?.color)}></div>
                              <div className="flex flex-col items-center">
                                <span className="capitalize whitespace-nowrap" style={{ color: status?.color }}>
                                  <StatusToolTip status={status}/>
                                </span>
                                {status?.confirmacion && (
                                  <div className="flex items-center gap-1 text-xs">
                                    {order.status?.estadoConfirmado ? (
                                      <span className="text-green-500 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Confirmado
                                      </span>
                                    ) : (
                                      <span className="text-yellow-500">
                                        Pendiente de confirmar
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-center px-4 md:px-6">{order.userId.username}</td>
                          <td className="py-4 text-center px-4 md:px-6 text-muted-foreground">{order.riotName}</td>
                          <td className="py-4 text-center px-4 md:px-6 text-muted-foreground">{order.region}</td>
                          <td className="py-4 text-center px-4 md:px-6 text-muted-foreground">{order.items.length}</td>
                          <td className="py-4 text-center px-4 md:px-6 text-muted-foreground">
                            {formatDate(order.redeemDate)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay resultados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <RedeemDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          order={selectedOrder}
          onOrderUpdated={handleOrderUpdated}
          statuses={statusList}
          admin={false}
        />
      )}
    </>
  );
};