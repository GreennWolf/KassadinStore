import { useState, useEffect } from "react";
import { TransactionsTable } from "./TransactionsTable";
import { RedeemTransactionsTable } from "./RedeemTransactionsTable";
import { InventoryDisplay } from "./InventoryDisplay";
import { cn } from "@/lib/utils";
import { getUserEloBoostOrders, confirmDuoRequest } from "../services/eloBoostService";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";

export const ProfileTabs = ({ purchases, redeems, redeemLoading, loading, onPurchaseUpdate, onRedeemUpdate }) => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [eloboostOrders, setEloboostOrders] = useState([]);
  const [eloboostLoading, setEloboostLoading] = useState(false);
  
  // Cargar órdenes de EloBoost del usuario
  useEffect(() => {
    const fetchEloboostOrders = async () => {
      try {
        setEloboostLoading(true);
        const token = localStorage.getItem('token');
        const data = await getUserEloBoostOrders(token);
        setEloboostOrders(data);
      } catch (error) {
        console.error('Error al cargar órdenes de Elo Boost:', error);
        toast.error('No se pudieron cargar tus órdenes de Elo Boost');
      } finally {
        setEloboostLoading(false);
      }
    };
    
    fetchEloboostOrders();
  }, []);

  const tabs = [
    { id: "transactions", label: "Pedidos" },
    { id: "eloboost", label: "EloBoost" },
    { id: "rewards", label: "Recompensas Reclamadas" },
    { id: "inventory", label: "Inventario" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "transactions":
        return (
          <TransactionsTable 
            purchases={purchases} 
            loading={loading}
            onPurchaseUpdate={onPurchaseUpdate}
          />
        );
      case "eloboost":
        return (
          <EloBoostOrdersTable 
            orders={eloboostOrders} 
            loading={eloboostLoading}
          />
        );
      case "rewards":
        return (
          <RedeemTransactionsTable 
            redeems={redeems} 
            loading={redeemLoading}
            onRedeemUpdate={onRedeemUpdate}
          />
        );
      case "inventory":
        return <InventoryDisplay onRedeemUpdate={onRedeemUpdate}/>;
      default:
        return null;
    }
  };
  
  // Componente para mostrar órdenes de EloBoost
  const EloBoostOrdersTable = ({ orders, loading }) => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    
    if (loading) {
      return <div className="py-8 text-center">Cargando órdenes de EloBoost...</div>;
    }
    
    if (!orders || orders.length === 0) {
      return <div className="py-8 text-center">No tienes órdenes de EloBoost.</div>;
    }
    
    // Función para mostrar el estado en formato legible
    const getStatusLabel = (status) => {
      switch (status) {
        case 'pending_payment': return 'Pendiente de Pago';
        case 'payment_confirmed': return 'Pago Confirmado';
        case 'pending_account': return 'Pendiente de Cuenta';
        case 'pending_duo_confirmation': return 'Confirmación Duo Pendiente';
        case 'processing': return 'En Proceso';
        case 'completed': return 'Completado';
        case 'cancelled': return 'Cancelado';
        default: return status;
      }
    };
    
    // Función para obtener clase de color según estado
    const getStatusClass = (status) => {
      switch (status) {
        case 'completed': return 'text-green-600';
        case 'processing': return 'text-blue-600';
        case 'pending_account': return 'text-yellow-600';
        case 'pending_duo_confirmation': return 'text-amber-600';
        case 'payment_confirmed': return 'text-indigo-600';
        case 'pending_payment': return 'text-gray-600';
        case 'cancelled': return 'text-red-600';
        default: return '';
      }
    };
    
    // Formatear fecha
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    const handleRowClick = (order) => {
      setSelectedOrder(order);
    };
    
    const closeDetails = () => {
      setSelectedOrder(null);
    };
    
    // Modal de detalles de la orden
    const OrderDetailsModal = ({ order, onClose }) => {
      if (!order) return null;

      // Estado para controlar el modal de la imagen
      const [isImageModalOpen, setIsImageModalOpen] = useState(false);
      
      // Estado para edición de cuenta
      const [isEditingAccount, setIsEditingAccount] = useState(false);
      const [accountUsername, setAccountUsername] = useState('');
      const [accountPassword, setAccountPassword] = useState('');
      const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
      const [showPassword, setShowPassword] = useState(false);
      
      // Estado para confirmación de duo
      const [isConfirmingDuo, setIsConfirmingDuo] = useState(false);
      
      // Autocompletar campos cuando se hace clic en editar
      const handleEditAccount = () => {
        // Si ya hay detalles proporcionados, usarlos para autocompletar
        if (order.accountDetails?.provided && order.accountDetails?.username) {
          setAccountUsername(order.accountDetails.username);
        } else {
          // Si no hay datos de cuenta, intentar obtener del usuario
          try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData && userData.riotName) {
              setAccountUsername(userData.riotName);
            }
          } catch (error) {
            console.error('Error obteniendo datos del usuario:', error);
          }
        }
        
        setIsEditingAccount(true);
      };
      
      // Obtener información de usuario para autocompletar
      useEffect(() => {
        // Obtener datos del usuario para autocompletar
        try {
          const userData = JSON.parse(localStorage.getItem('user'));
          if (userData && userData.riotName && !accountUsername) {
            setAccountUsername(userData.riotName);
          }
        } catch (error) {
          console.error('Error obteniendo datos del usuario:', error);
        }
      }, []);
      
      // Formatear nombre de servidor
      const getServerName = (server) => {
        const servers = {
          'LAN': 'Latinoamérica Norte',
          'LAS': 'Latinoamérica Sur',
          'NA': 'Norteamérica',
          'EUW': 'Europa Oeste',
          'EUNE': 'Europa Norte y Este',
          'BR': 'Brasil'
        };
        return servers[server] || server;
      };
      
      // Manejar la actualización de credenciales
      const handleUpdateAccountDetails = async () => {
        if (!accountUsername || !accountPassword) {
          toast.error('Por favor ingresa tanto el usuario como la contraseña');
          return;
        }
        
        try {
          setIsUpdatingAccount(true);
          const token = localStorage.getItem('token');
          
          // Importar la función solo cuando es necesaria
          const { updateAccountDetails } = await import('../services/eloBoostService');
          
          await updateAccountDetails(order._id, {
            username: accountUsername,
            password: accountPassword
          }, token);
          
          toast.success('Credenciales de cuenta actualizadas correctamente');
          setIsEditingAccount(false);
          
          // Refrescar datos
          const { getUserEloBoostOrders } = await import('../services/eloBoostService');
          const updatedOrders = await getUserEloBoostOrders(token);
          setEloboostOrders(updatedOrders);
          
        } catch (error) {
          console.error('Error al actualizar credenciales:', error);
          toast.error('No se pudieron actualizar las credenciales');
        } finally {
          setIsUpdatingAccount(false);
        }
      };
      
      // Manejar la confirmación de solicitud duo
      const handleConfirmDuo = async () => {
        try {
          setIsConfirmingDuo(true);
          const token = localStorage.getItem('token');
          
          await confirmDuoRequest(order._id);
          
          toast.success('Solicitud de duo confirmada exitosamente');
          
          // Refrescar datos
          const updatedOrders = await getUserEloBoostOrders(token);
          setEloboostOrders(updatedOrders);
          
          // Actualizar la orden actual
          const updatedOrder = updatedOrders.find(o => o._id === order._id);
          if (updatedOrder) {
            setSelectedOrder(updatedOrder);
          }
        } catch (error) {
          console.error('Error al confirmar solicitud duo:', error);
          toast.error('No se pudo confirmar la solicitud. Por favor intenta nuevamente.');
        } finally {
          setIsConfirmingDuo(false);
        }
      };
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-lg shadow-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto" style={{ height: 'calc(100vh - 100px)' }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-4">
                <h3 className="text-xl font-semibold">Detalles de la Orden de EloBoost</h3>
                <div className="flex items-center gap-2">
                  <span className={`${getStatusClass(order.status)} font-medium px-3 py-1 rounded-full bg-secondary/30`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl font-bold">
                    ×
                  </button>
                </div>
              </div>
              
              {/* Botón de confirmación para órdenes duo pendientes */}
              {order.status === 'pending_duo_confirmation' && order.duoQueue && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-amber-900">Solicitud de Duo Pendiente</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Tu booster te ha enviado una solicitud de amistad. Por favor confirma que la has aceptado para continuar.
                      </p>
                    </div>
                    <button
                      onClick={handleConfirmDuo}
                      className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50"
                      disabled={isConfirmingDuo}
                    >
                      {isConfirmingDuo ? 'Confirmando...' : 'Confirmar Solicitud'}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Detalles generales */}
                  <div>
                    <h4 className="text-lg font-medium mb-2">Información General</h4>
                    <div className="bg-secondary/20 p-4 rounded-md space-y-2">
                      <p className="text-sm"><strong>ID de Orden:</strong> <span className="font-mono text-xs">{order._id}</span></p>
                      <p className="text-sm"><strong>Creada:</strong> {formatDate(order.createdAt)}</p>
                      {order.startDate && (
                        <p className="text-sm"><strong>Inicio de Boost:</strong> {formatDate(order.startDate)}</p>
                      )}
                      {order.completionDate && (
                        <p className="text-sm"><strong>Finalización:</strong> {formatDate(order.completionDate)}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Detalles del boost */}
                  <div>
                    <h4 className="text-lg font-medium mb-2">Detalles del Boost</h4>
                    <div className="bg-secondary/20 p-4 rounded-md space-y-2">
                      <div className="flex justify-between">
                        <span>Rango Actual:</span>
                        <div className="flex items-center">
                          {order.currentRank?.rank?.icon && (
                            <img 
                              src={`${import.meta.env.VITE_API_URL}${order.currentRank.rank.icon}`} 
                              alt="Rango actual" 
                              className="w-6 h-6 mr-2" 
                            />
                          )}
                          <span>{order.currentRank?.rank?.name} {order.currentRank?.division}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Rango Objetivo:</span>
                        <div className="flex items-center">
                          {order.targetRank?.rank?.icon && (
                            <img 
                              src={`${import.meta.env.VITE_API_URL}${order.targetRank.rank.icon}`} 
                              alt="Rango objetivo" 
                              className="w-6 h-6 mr-2" 
                            />
                          )}
                          <span>{order.targetRank?.rank?.name} {order.targetRank?.division}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Servidor:</span>
                        <span>{getServerName(order.server)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tipo de Cola:</span>
                        <span>{order.queueType === 'solo' ? 'Solo/Dúo' : 'Flexible'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Opciones adicionales */}
                  {(order.specificRole?.selected || order.specificChampion?.selected || order.duoQueue) && (
                    <div>
                      <h4 className="text-lg font-medium mb-2">Opciones Adicionales</h4>
                      <div className="bg-secondary/20 p-4 rounded-md space-y-2">
                        {order.specificRole?.selected && (
                          <div className="flex justify-between">
                            <span>Rol Específico:</span>
                            <span>{order.specificRole.role}</span>
                          </div>
                        )}
                        
                        {order.specificChampion?.selected && (
                          <div className="flex justify-between">
                            <span>Campeón Específico:</span>
                            <span>{order.specificChampion.champion?.name || 'No disponible'}</span>
                          </div>
                        )}
                        
                        {order.duoQueue && (
                          <div className="flex justify-between">
                            <span>Dúo Queue:</span>
                            <span>Sí</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Detalles de la cuenta */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-lg font-medium">Detalles de la Cuenta</h4>
                      {!order.duoQueue && (
                        <button 
                          onClick={() => isEditingAccount ? setIsEditingAccount(false) : handleEditAccount()} 
                          className="text-xs text-blue-500 hover:underline"
                        >
                          {isEditingAccount ? 'Cancelar' : 'Editar'}
                        </button>
                      )}
                    </div>
                    <div className="bg-secondary/20 p-4 rounded-md">
                      {order.duoQueue ? (
                        // Caso especial para Duo Queue
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground mb-3">
                            Esta es una orden de duo boost. No necesitas proporcionar credenciales.
                          </p>
                          {order.payment && (
                            <>
                              <div>
                                <label className="block text-sm font-medium mb-1">Riot Name</label>
                                <div className="p-2 rounded border bg-background">
                                  {order.payment.riotName || 'No disponible'}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Discord Name</label>
                                <div className="p-2 rounded border bg-background">
                                  {order.payment.discordName || 'No disponible'}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Región</label>
                                <div className="p-2 rounded border bg-background">
                                  {order.payment.region || 'No disponible'}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        // Caso normal (no duo queue)
                        !isEditingAccount ? (
                          order.accountDetails?.provided ? (
                            <div className="space-y-2">
                              <p className="text-sm">
                                <span className="text-green-500">✓</span> Has proporcionado las credenciales de tu cuenta.
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Si necesitas actualizarlas, utiliza el botón de editar.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-yellow-500">
                                ⚠️ Debes proporcionar las credenciales de tu cuenta para que podamos proceder con el boost.
                              </p>
                              {order.status === 'pending_account' && (
                                <button 
                                  onClick={() => setIsEditingAccount(true)} 
                                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
                                >
                                  Proporcionar Credenciales
                                </button>
                              )}
                            </div>
                          )
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm mb-1">Usuario de la cuenta</label>
                              <input 
                                type="text" 
                                value={accountUsername} 
                                onChange={(e) => setAccountUsername(e.target.value)} 
                                className="w-full p-2 rounded border bg-background"
                                placeholder="Ingresa el usuario de tu cuenta"
                              />
                            </div>
                            <div>
                              <label className="block text-sm mb-1">Contraseña de la cuenta</label>
                              <div className="relative">
                                <input 
                                  type={showPassword ? "text" : "password"}
                                  value={accountPassword} 
                                  onChange={(e) => setAccountPassword(e.target.value)} 
                                  className="w-full p-2 rounded border bg-background pr-10"
                                  placeholder="Ingresa la contraseña de tu cuenta"
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                                  onClick={() => setShowPassword(!showPassword)}
                                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => setIsEditingAccount(false)} 
                                className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 text-sm"
                                disabled={isUpdatingAccount}
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={handleUpdateAccountDetails} 
                                className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
                                disabled={isUpdatingAccount}
                              >
                                {isUpdatingAccount ? 'Guardando...' : 'Guardar'}
                              </button>
                            </div>
                            <p className="text-xs text-amber-500">
                              Nota: Tus credenciales se almacenan de forma segura y encriptada.
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  
                  {/* Detalles de pago */}
                  <div>
                    <h4 className="text-lg font-medium mb-2">Detalles de Pago</h4>
                    <div className="bg-secondary/20 p-4 rounded-md space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Precio Base</p>
                          <p className="font-medium">${order.basePrice?.toFixed(2)}</p>
                        </div>
                        {order.additionalCost > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">Adicionales</p>
                            <p className="font-medium">${order.additionalCost?.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-2 border-t border-border">
                        <div className="flex justify-between">
                          <span className="font-bold">Total:</span>
                          <span className="font-bold">${order.totalPrice?.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {order.payment && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="mb-2">
                            <p className="text-sm text-muted-foreground">Método de Pago</p>
                            <p className="font-medium">
                              {order.payment.paymentMethod 
                                ? order.payment.paymentMethod
                                : order.payment?.status?.statusId?.status || 'Transferencia Bancaria'}
                            </p>
                          </div>
                          
                          {order.payment.receipt && (
                            <div className="mt-4">
                              <p className="text-sm mb-2 text-muted-foreground">Comprobante de Pago:</p>
                              <div 
                                className="group relative cursor-pointer"
                                onClick={() => setIsImageModalOpen(true)}
                              >
                                <img 
                                  src={`${import.meta.env.VITE_API_URL}/receipts/${order.payment.receipt}`} 
                                  alt="Comprobante de pago" 
                                  className="max-h-40 w-full object-contain rounded border hover:opacity-90 transition-opacity" 
                                  onError={(e) => {
                                    if (!e.target.dataset.triedAlt) {
                                      e.target.dataset.triedAlt = 'true';
                                      e.target.src = `${import.meta.env.VITE_API_URL}/api/purchases/receiptImage/${order.payment.receipt}`;
                                    } else {
                                      e.target.src = '/placeholder.svg';
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-black/50 px-3 py-2 rounded-md">
                                    <span className="text-white text-xs">Click para ampliar</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex justify-end mt-6 pt-4 border-t border-border">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
          
          {/* Modal para ver la imagen ampliada */}
          {isImageModalOpen && order.payment?.receipt && (
            <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
              <div className="relative max-w-4xl w-full">
                <button 
                  onClick={() => setIsImageModalOpen(false)} 
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                >
                  ×
                </button>
                <div className="p-4 text-white font-medium">
                  Comprobante de Pago
                </div>
                <div className="bg-slate-900 flex items-center justify-center p-6 rounded">
                  <img
                    src={`${import.meta.env.VITE_API_URL}/receipts/${order.payment.receipt}`}
                    alt="Comprobante ampliado"
                    className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
                    onError={(e) => {
                      if (!e.target.dataset.triedAlt) {
                        e.target.dataset.triedAlt = 'true';
                        e.target.src = `${import.meta.env.VITE_API_URL}/api/purchases/receiptImage/${order.payment.receipt}`;
                      } else {
                        e.target.src = '/placeholder.svg';
                      }
                    }}
                  />
                </div>
                <div className="p-4 flex justify-between items-center text-white">
                  <div className="text-xs text-gray-400">ID de Transacción: {order._id}</div>
                  <button 
                    onClick={() => setIsImageModalOpen(false)}
                    className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };
    
    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="p-3 text-sm font-medium">Fecha</th>
                <th className="p-3 text-sm font-medium">Boost</th>
                <th className="p-3 text-sm font-medium">Precio</th>
                <th className="p-3 text-sm font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr 
                  key={order._id} 
                  className="border-b border-border hover:bg-secondary/20 cursor-pointer"
                  onClick={() => handleRowClick(order)}
                >
                  <td className="p-3 text-sm">{formatDate(order.createdAt)}</td>
                  <td className="p-3 text-sm">
                    {order.currentRank?.rank?.name} {order.currentRank?.division} {'->'} {order.targetRank?.rank?.name} {order.targetRank?.division}
                  </td>
                  <td className="p-3 text-sm">${order.totalPrice?.toFixed(2)}</td>
                  <td className="p-3 text-sm">
                    <span className={`${getStatusClass(order.status)} font-medium`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={closeDetails} 
          />
        )}
      </>
    );
  };


  return (
    <div className="col-span-12">
      <div className="flex flex-col space-y-4">
        {/* Tabs Navigation */}
        <div className="border-b border-border">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-4 text-sm font-medium transition-colors hover:text-primary relative",
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs Content */}
        <div className="mt-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfileTabs;