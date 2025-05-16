import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ChampionIcon from "@/components/ChampionIcon";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Image, X } from 'lucide-react';

const EloBoostOrderDetailsModal = ({ isOpen, onClose, order, onUpdateStatus }) => {
  const [notes, setNotes] = useState(order?.notes || '');
  const [activeTab, setActiveTab] = useState('details');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Intentar crear un objeto Date válido
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.error('Fecha inválida:', dateString);
        return 'Fecha inválida';
      }
      
      return format(date, 'dd MMM yyyy HH:mm', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error de formato';
    }
  };

  // Obtener etiqueta de estado
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'Pendiente de Pago';
      case 'payment_confirmed':
        return 'Pago Confirmado';
      case 'pending_account':
        return 'Pendiente de Cuenta';
      case 'pending_duo_confirmation':
        return 'Confirmación Duo Pendiente';
      case 'processing':
        return 'En Proceso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Obtener variante de badge
  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'secondary';
      case 'payment_confirmed':
        return 'info';
      case 'pending_account':
        return 'warning';
      case 'pending_duo_confirmation':
        return 'warning';
      case 'processing':
        return 'default';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Actualizar estado y notas
  const handleUpdateStatus = async (status) => {
    await onUpdateStatus(order._id, status, notes);
  };
  
  // Acciones disponibles según el estado
  const renderActions = () => {
    switch (order.status) {
      case 'pending_payment':
        return (
          <>
            <Button 
              variant="destructive" 
              onClick={() => handleUpdateStatus('cancelled')}
            >
              Cancelar Orden
            </Button>
          </>
        );
      case 'payment_confirmed':
        return (
          <>
            <Button 
              variant="destructive" 
              onClick={() => handleUpdateStatus('cancelled')}
            >
              Cancelar Orden
            </Button>
          </>
        );
      case 'pending_account':
        return (
          <>
            <Button 
              variant="destructive" 
              onClick={() => handleUpdateStatus('cancelled')}
            >
              Cancelar Orden
            </Button>
          </>
        );
      case 'pending_duo_confirmation':
        return (
          <>
            <Button 
              variant="destructive" 
              onClick={() => handleUpdateStatus('cancelled')}
            >
              Cancelar Orden
            </Button>
          </>
        );
      case 'processing':
        return (
          <>
            <Button 
              variant="destructive" 
              onClick={() => handleUpdateStatus('cancelled')}
            >
              Cancelar Orden
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  if (!order) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" style={{ height: 'calc(100vh - 100px)' }}>
          <DialogHeader>
            <DialogTitle>Detalles de Orden de Elo Boost</DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-2">
                <span>ID: {order._id}</span>
                <span className="mx-1">•</span>
                <Badge variant={getStatusVariant(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </span>
            </DialogDescription>
          </DialogHeader>

          <Tabs 
            defaultValue="details" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full mt-4"
          >
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="account">Cuenta</TabsTrigger>
              <TabsTrigger value="payment">Pago</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            {/* Pestaña de Detalles */}
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Cliente</h3>
                    <div className="bg-secondary/50 p-4 rounded-md">
                      <p><strong>Usuario:</strong> {order.user?.username || 'No disponible'}</p>
                      <p><strong>Email:</strong> {order.user?.email || 'No disponible'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Boost Solicitado</h3>
                    <div className="bg-secondary/50 p-4 rounded-md">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center mr-4">
                          <img 
                            src={order.currentRank?.rank?.icon ? import.meta.env.VITE_API_URL + order.currentRank.rank.icon : '/placeholder.svg'} 
                            alt="Rango actual" 
                            className="w-8 h-8 mr-2" 
                          />
                          <span>{order.currentRank?.rank?.name} {order.currentRank?.division}</span>
                        </div>
                        <span className="mx-2">→</span>
                        <div className="flex items-center">
                          <img 
                            src={order.targetRank?.rank?.icon ? import.meta.env.VITE_API_URL + order.targetRank.rank.icon : '/placeholder.svg'} 
                            alt="Rango deseado" 
                            className="w-8 h-8 mr-2" 
                          />
                          <span>{order.targetRank?.rank?.name} {order.targetRank?.division}</span>
                        </div>
                      </div>
                      <p><strong>LP Actual:</strong> {order.currentRank?.lp}</p>
                      <p><strong>Servidor:</strong> {order.server}</p>
                      <p><strong>Tipo de Cola:</strong> {order.queueType === 'solo' ? 'Solo/Dúo' : 'Flexible'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Opciones Adicionales</h3>
                    <div className="bg-secondary/50 p-4 rounded-md">
                      {order.specificRole?.selected ? (
                        <p><strong>Rol Específico:</strong> {order.specificRole.role}</p>
                      ) : (
                        <p><strong>Rol Específico:</strong> No</p>
                      )}
                      
                      {order.specificChampion?.selected ? (
                        <p className="flex items-center">
                          <strong className="mr-2">Campeón Específico:</strong>
                          <span className="flex items-center">
                            <ChampionIcon 
                              championName={order.specificChampion.champion?.name} 
                              size={20} 
                              className="mr-1" 
                            />
                            {order.specificChampion.champion?.name || 'No especificado'}
                          </span>
                        </p>
                      ) : (
                        <p><strong>Campeón Específico:</strong> No</p>
                      )}
                      
                      <p><strong>Dúo con Booster:</strong> {order.duoQueue ? 'Sí' : 'No'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Detalles de Pago</h3>
                    <div className="bg-secondary/50 p-4 rounded-md">
                      <p><strong>Precio Base:</strong> ${order.basePrice?.toFixed(2)}</p>
                      <p><strong>Adicionales:</strong> ${order.additionalCost?.toFixed(2)}</p>
                      <p className="text-lg font-bold mt-2"><strong>Total:</strong> ${order.totalPrice?.toFixed(2)}</p>
                      <p className="mt-2"><strong>Estado de Pago:</strong> {
                        typeof order.payment?.status === 'object' ? 
                        'Confirmación pendiente' : 
                        (order.payment?.status || 'Sin pago asociado')
                      }</p>
                      {order.payment?.paymentMethod && (
                        <p><strong>Método de Pago:</strong> {order.payment.paymentMethod}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Fechas</h3>
                    <div className="bg-secondary/50 p-4 rounded-md">
                      <p><strong>Creada:</strong> {formatDate(order.createdAt)}</p>
                      <p><strong>Inicio de Boost:</strong> {formatDate(order.startDate)}</p>
                      <p><strong>Finalización:</strong> {formatDate(order.completionDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Pestaña de Cuenta */}
            <TabsContent value="account">
              <div className="space-y-4 pb-4">
                <h3 className="text-lg font-medium mb-2">Datos de la Cuenta</h3>
                
                {order.duoQueue ? (
                  // Si es duo queue, mostrar el RiotName del pago asociado
                  <div className="bg-secondary/50 p-4 rounded-md">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Esta es una orden de duo boost, las credenciales no son necesarias.
                      </p>
                      <div>
                        <Label htmlFor="riotName">Riot Name del Cliente</Label>
                        <div className="mt-1 p-2 border rounded bg-background">
                          {order.payment?.riotName || 'No disponible'}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="discordName">Discord Name</Label>
                        <div className="mt-1 p-2 border rounded bg-background">
                          {order.payment?.discordName || 'No disponible'}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="region">Región</Label>
                        <div className="mt-1 p-2 border rounded bg-background">
                          {order.payment?.region || 'No disponible'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Si NO es duo queue, mostrar credenciales normales
                  order.accountDetails?.provided ? (
                    <div className="bg-secondary/50 p-4 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="username">Usuario</Label>
                          <div className="mt-1 p-2 border rounded bg-background">
                            {order.accountDetails.username}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="password">Contraseña</Label>
                          <div className="mt-1 p-2 border rounded bg-background">
                            {order.accountDetails.password}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-secondary/50 p-4 rounded-md">
                      <p className="text-center text-muted-foreground">
                        El cliente aún no ha proporcionado los datos de la cuenta
                      </p>
                    </div>
                  )
                )}
                
                <div className="bg-yellow-100/20 p-4 rounded-md border border-yellow-200 mt-4">
                  <h4 className="text-amber-600 font-medium">Información Importante</h4>
                  <p className="text-sm mt-1">
                    Los datos de cuenta son confidenciales. Úselos exclusivamente para el servicio 
                    contratado y nunca los comparta con terceros.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Pestaña de Pago */}
            <TabsContent value="payment">
              <div className="space-y-4 pb-4">
                <h3 className="text-lg font-medium mb-2">Detalles del Pago</h3>
                
                <div className="bg-secondary/50 p-4 rounded-md">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total-price">Precio Total</Label>
                      <div className="mt-1 p-2 border rounded bg-background font-bold">
                        ${order.totalPrice?.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="payment-status">Estado del Pago</Label>
                      <div className="mt-1 p-2 border rounded bg-background">
                        {order.payment ? "Pagado" : "Pendiente de pago"}
                      </div>
                    </div>
                    
                    {order.payment?.status && (
                      <div className="space-y-2">
                        <Label htmlFor="payment-status-details">Detalles del estado</Label>
                        <div className="mt-1 p-2 border rounded bg-background">
                          {
                            typeof order.payment.status === 'object' 
                              ? 'Estado pendiente de confirmación' 
                              : order.payment.status
                          }
                        </div>
                      </div>
                    )}
                    
                    {order.payment?.paymentMethod && (
                      <div className="space-y-2">
                        <Label htmlFor="payment-method">Método de Pago</Label>
                        <div className="mt-1 p-2 border rounded bg-background">
                          {order.payment.paymentMethod}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {order.payment?.receipt && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Image className="mr-2 h-5 w-5" /> 
                      Comprobante de Pago
                    </h3>
                    {console.log("Datos del pago:", order.payment)}
                    <div className="bg-secondary/50 p-4 rounded-md border border-secondary flex justify-center">
                      <div className="relative group cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                        <img 
                          src={`${import.meta.env.VITE_API_URL}/receipts/${order.payment.receipt}`}
                          alt="Comprobante de pago" 
                          className="max-w-full h-56 object-contain hover:opacity-90 transition-all rounded-lg shadow-md"
                          onError={(e) => {
                            console.error(`Error loading image: ${e.target.src}`);
                            // Intentar rutas alternativas
                            if (!e.target.dataset.triedAlt) {
                              e.target.dataset.triedAlt = 'true';
                              e.target.src = `${import.meta.env.VITE_API_URL}/api/purchases/receiptImage/${order.payment.receipt}`;
                            } else if (!e.target.dataset.triedAlt2) {
                              e.target.dataset.triedAlt2 = 'true';
                              e.target.src = `${import.meta.env.VITE_API_URL}/public/receipts/${order.payment.receipt}`;
                            } else {
                              e.target.src = '/placeholder.svg';
                              e.target.onerror = null;
                            }
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/70 px-3 py-2 rounded-md">
                            <span className="text-white text-sm font-medium">Click para ampliar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {!order.payment && (
                  <div className="bg-amber-50/10 p-4 rounded-md border border-amber-200 mt-4">
                    <h4 className="text-amber-600 font-medium">Pago Pendiente de Verificación</h4>
                    <p className="text-sm mt-1">
                      El cliente debe completar el pago a través del proceso de checkout y subir un comprobante. Luego, usted como administrador deberá verificar y confirmar manualmente el pago para continuar con el servicio.
                    </p>
                  </div>
                )}
                
                {/* Botones de acción para la pestaña de pago */}
                <div className="mt-8 space-y-4">
                  {/* Confirmar pago */}
                  {order.status === 'pending_payment' && (
                    <div className="flex gap-4 items-center p-4 bg-green-100/10 border border-green-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-green-600">Confirmar Pago</h4>
                        <p className="text-sm text-muted-foreground">
                          Después de revisar el comprobante y verificar que el pago es válido, puede confirmar el pago para proceder con el servicio.
                        </p>
                      </div>
                      <Button 
                        className="px-4 bg-green-600 hover:bg-green-700"
                        onClick={() => onUpdateStatus(order._id, order.duoQueue ? 'payment_confirmed' : 'pending_account')}
                      >
                        Confirmar Pago
                      </Button>
                    </div>
                  )}
                  
                  {/* Revisar comprobante */}
                  {order.status === 'pending_payment' && order.payment?.receipt && (
                    <div className="flex gap-4 items-center p-4 mt-4 bg-amber-100/10 border border-amber-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-amber-600">Comprobante Pendiente de Revisión</h4>
                        <p className="text-sm text-muted-foreground">
                          El cliente ha subido un comprobante de pago. Por favor, verifique que el pago ha sido recibido antes de confirmarlo.
                        </p>
                      </div>
                      <Button 
                        className="px-4 bg-amber-600 hover:bg-amber-700"
                        onClick={() => setIsImageModalOpen(true)}
                      >
                        Ver Comprobante
                      </Button>
                    </div>
                  )}
                  
                  {/* Enviar solicitud duo (solo para órdenes duo con pago confirmado) */}
                  {order.status === 'payment_confirmed' && order.duoQueue && (
                    <div className="flex gap-4 items-center p-4 bg-cyan-100/10 border border-cyan-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-cyan-600">Enviar Solicitud de Amistad</h4>
                        <p className="text-sm text-muted-foreground">
                          El pago ha sido confirmado. Ahora debe enviar la solicitud de amistad al cliente en el juego.
                        </p>
                      </div>
                      <Button 
                        className="px-4 bg-cyan-600 hover:bg-cyan-700"
                        onClick={() => onUpdateStatus(order._id, 'pending_duo_confirmation')}
                      >
                        Solicitud Enviada
                      </Button>
                    </div>
                  )}
                  
                  {/* Iniciar boost */}
                  {order.status === 'pending_account' && order.accountDetails?.provided && (
                    <div className="flex gap-4 items-center p-4 bg-blue-100/10 border border-blue-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-600">Iniciar Boosting</h4>
                        <p className="text-sm text-muted-foreground">
                          El pago está confirmado y los datos de cuenta están disponibles.
                        </p>
                      </div>
                      <Button 
                        className="px-4 bg-blue-600 hover:bg-blue-700"
                        onClick={() => onUpdateStatus(order._id, 'processing')}
                      >
                        Iniciar Boost
                      </Button>
                    </div>
                  )}
                  
                  {/* Completar boost */}
                  {order.status === 'processing' && (
                    <div className="flex gap-4 items-center p-4 bg-purple-100/10 border border-purple-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-purple-600">Completar Boost</h4>
                        <p className="text-sm text-muted-foreground">
                          El boost ha finalizado y se ha alcanzado el rango objetivo.
                        </p>
                      </div>
                      <Button 
                        className="px-4 bg-purple-600 hover:bg-purple-700"
                        onClick={() => onUpdateStatus(order._id, 'completed')}
                      >
                        Marcar Completado
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Pestaña de Notas */}
            <TabsContent value="notes">
              <div className="space-y-4 pb-4">
                <Label htmlFor="notes">Notas Internas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añadir notas sobre esta orden..."
                  className="min-h-[200px]"
                />
                <Button 
                  onClick={() => onUpdateStatus(order._id, order.status, { notes })}
                  className="w-full"
                >
                  Guardar Notas
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between items-center">
            <div className="flex-1">
              {renderActions()}
            </div>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para ver la imagen ampliada */}
      {isImageModalOpen && order.payment?.receipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
          <div className="relative max-w-5xl w-full mx-4">
            <button 
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-10 right-0 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="bg-black/80 rounded-t-lg p-4 text-white">
              <h3 className="text-lg font-medium flex items-center">
                <Image className="mr-2 h-5 w-5" /> 
                Comprobante de Pago
              </h3>
            </div>
            
            <div className="bg-slate-900 p-6 flex items-center justify-center" style={{minHeight: '60vh'}}>
              <img
                src={`${import.meta.env.VITE_API_URL}/receipts/${order.payment.receipt}`}
                alt="Comprobante ampliado"
                className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
                onError={(e) => {
                  console.error(`Error loading image: ${e.target.src}`);
                  // Intentar rutas alternativas
                  if (!e.target.dataset.triedAlt) {
                    e.target.dataset.triedAlt = 'true';
                    e.target.src = `${import.meta.env.VITE_API_URL}/api/purchases/receiptImage/${order.payment.receipt}`;
                  } else if (!e.target.dataset.triedAlt2) {
                    e.target.dataset.triedAlt2 = 'true';
                    e.target.src = `${import.meta.env.VITE_API_URL}/public/receipts/${order.payment.receipt}`;
                  } else {
                    e.target.src = '/placeholder.svg';
                    e.target.onerror = null;
                  }
                }}
              />
            </div>
            
            <div className="bg-black/80 rounded-b-lg p-4 flex justify-between items-center text-white">
              <div className="text-xs text-gray-400">ID de Transacción: {order._id}</div>
              <Button 
                onClick={() => setIsImageModalOpen(false)}
                className="bg-white text-black hover:bg-gray-200"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EloBoostOrderDetailsModal;