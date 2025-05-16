import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAllEloBoostOrders, updateEloBoostOrderStatus } from '@/services/eloBoostService';
import { useToast } from '@/hooks/use-toast';
import EloBoostOrderDetailsModal from './EloBoostOrderDetailsModal';

// Badge de estado
const StatusBadge = ({ status }) => {
  const getVariant = () => {
    switch (status) {
      case 'pending_payment':
        return 'secondary';
      case 'pending_account':
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

  const getLabel = () => {
    switch (status) {
      case 'pending_payment':
        return 'Pendiente de Pago';
      case 'pending_account':
        return 'Pendiente de Cuenta';
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

  return (
    <Badge variant={getVariant()}>
      {getLabel()}
    </Badge>
  );
};

const EloBoostOrdersManager = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    paymentStatus: 'all', // Inicializar con 'all' para mostrar todos los pagos
  });
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const token = localStorage.getItem('token');

  // Cargar órdenes
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllEloBoostOrders(token);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las órdenes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar órdenes
  const filteredOrders = orders.filter((order) => {
    // Filtrar por estado (ignoramos el filtro si es "all")
    if (filters.status && filters.status !== "all" && order.status !== filters.status) {
      return false;
    }

    // Filtrar por estado de pago (ignoramos el filtro si es "all")
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      if (filters.paymentStatus === 'paid' && !order.payment) {
        return false;
      }
      if (filters.paymentStatus === 'pending' && order.payment) {
        return false;
      }
    }

    // Filtrar por búsqueda (usuario, ID, etc.)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        order._id.toLowerCase().includes(searchTerm) ||
        order.user?.username?.toLowerCase().includes(searchTerm) ||
        order.user?.email?.toLowerCase().includes(searchTerm)
      );
    }

    return true;
  });

  // Manejar cambio de filtros
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Abrir modal de detalles
  const handleViewDetails = (order) => {
    setCurrentOrder(order);
    setIsModalOpen(true);
  };

  // Actualizar estado de una orden
  const handleUpdateStatus = async (orderId, status, notesData) => {
    try {
      // Determinar los datos a enviar
      const updateData = {
        status: status
      };
      
      // Si se proporcionan notas, añadirlas a la petición
      if (notesData && notesData.notes) {
        updateData.notes = notesData.notes;
      }
      
      // Realizar la petición de actualización
      const response = await updateEloBoostOrderStatus(orderId, updateData, token);
      
      // Recibimos la orden actualizada desde el servidor (incluye fechas actualizadas)
      const updatedOrder = response.order;
      
      // Actualizar el estado localmente con todos los datos actualizados
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { 
            ...order, 
            ...updatedOrder, 
            status: updatedOrder.status,
            startDate: updatedOrder.startDate,
            completionDate: updatedOrder.completionDate,
            notes: updatedOrder.notes
          } : order
        )
      );

      // Si el modal está abierto y la orden actual es la que se actualizó
      if (isModalOpen && currentOrder?._id === orderId) {
        setCurrentOrder((prev) => ({ 
          ...prev, 
          ...updatedOrder,
          status: updatedOrder.status,
          startDate: updatedOrder.startDate,
          completionDate: updatedOrder.completionDate,
          notes: updatedOrder.notes
        }));
      }
      
      toast({
        title: 'Éxito',
        description: 'Estado de la orden actualizado correctamente',
      });
      
      // Volver a cargar todas las órdenes para asegurarnos de tener datos frescos
      if (status === 'processing' || status === 'completed') {
        // console.log("Actualizando órdenes...");
        setTimeout(() => {
          fetchOrders();
        }, 500);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: es });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Órdenes de Elo Boost</CardTitle>
        <CardDescription>
          Gestione las órdenes de Elo Boost y su estado actual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/4">
            <Input
              placeholder="Buscar por ID o usuario..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="w-full md:w-1/4">
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending_payment">Pendiente de Pago</SelectItem>
                <SelectItem value="pending_account">Pendiente de Cuenta</SelectItem>
                <SelectItem value="processing">En Proceso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-1/4">
            <Select
              value={filters.paymentStatus}
              onValueChange={(value) => handleFilterChange('paymentStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pagos</SelectItem>
                <SelectItem value="paid">Pagados</SelectItem>
                <SelectItem value="pending">Pendientes de pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-1/4 flex justify-end">
            <Button onClick={fetchOrders}>Actualizar</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <p>Cargando órdenes...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Boost</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No se encontraron órdenes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-xs">
                        {order._id.substring(order._id.length - 8)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.user?.username || 'Usuario desconocido'}</div>
                        <div className="text-xs text-muted-foreground">{order.user?.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-sm">
                            {order.currentRank?.rank?.name} {order.currentRank?.division} →{' '}
                            {order.targetRank?.rank?.name} {order.targetRank?.division}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>${order.totalPrice?.toFixed(2)}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        {order.payment ? (
                          <Badge variant="outline" className="bg-green-100/10 text-green-600 border-green-600">
                            Pagado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100/10 text-yellow-600 border-yellow-600">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleViewDetails(order)}
                        >
                          Detalles
                        </Button>
                        {order.status === 'pending_payment' && !order.payment && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleViewDetails(order)}
                          >
                            Ver Pago
                          </Button>
                        )}
                        {order.status === 'pending_account' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order._id, 'processing')}
                          >
                            Iniciar
                          </Button>
                        )}
                        {order.status === 'processing' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order._id, 'completed')}
                          >
                            Completar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Modal de detalles de orden */}
      {isModalOpen && (
        <EloBoostOrderDetailsModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          order={currentOrder}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </Card>
  );
};

export default EloBoostOrdersManager;