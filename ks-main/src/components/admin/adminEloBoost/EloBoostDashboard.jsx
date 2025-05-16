import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getEloBoostStats } from '@/services/eloBoostService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Colores para los gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const STATUS_COLORS = {
  'pending_payment': '#9CA3AF',
  'pending_account': '#F59E0B',
  'processing': '#3B82F6',
  'completed': '#10B981',
  'cancelled': '#EF4444',
};

// Etiquetas de estado
const STATUS_LABELS = {
  'pending_payment': 'Pendiente de Pago',
  'pending_account': 'Pendiente de Cuenta',
  'processing': 'En Proceso',
  'completed': 'Completado',
  'cancelled': 'Cancelado',
};

const EloBoostDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const token = localStorage.getItem('token') || (user ? user.token : null);

  // Cargar estadísticas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getEloBoostStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las estadísticas',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
  };

  // Preparar datos para gráficos
  const prepareOrdersByStatusData = () => {
    if (!stats?.ordersByStatus) return [];
    
    return stats.ordersByStatus.map(item => ({
      name: STATUS_LABELS[item._id] || item._id,
      value: item.count,
      revenue: item.totalRevenue,
      status: item._id,
    }));
  };

  const prepareOrdersByMonthData = () => {
    if (!stats?.ordersByMonth) return [];
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return stats.ordersByMonth.map(item => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      orders: item.count,
      revenue: item.revenue,
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-16">
            <p>Cargando estadísticas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-16">
            <p>No se pudieron cargar las estadísticas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ordersByStatusData = prepareOrdersByStatusData();
  const ordersByMonthData = prepareOrdersByMonthData();

  return (
    <div className="space-y-6">
      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.totalOrders}</CardTitle>
            <CardDescription>Órdenes Totales</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">${stats.totalRevenue.toFixed(2)}</CardTitle>
            <CardDescription>Ingresos Totales</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">
              {ordersByStatusData.find(item => item.status === 'processing')?.value || 0}
            </CardTitle>
            <CardDescription>Órdenes en Proceso</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Órdenes por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes por Estado</CardTitle>
            <CardDescription>
              Distribución del total de órdenes según su estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {ordersByStatusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} (${props.payload.revenue ? `$${props.payload.revenue.toFixed(2)}` : '$0.00'})`, 
                      name
                    ]} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Órdenes por Mes */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes por Mes</CardTitle>
            <CardDescription>
              Tendencia de órdenes e ingresos en los últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ordersByMonthData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" name="Órdenes" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="revenue" name="Ingresos ($)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Órdenes Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
          <CardDescription>
            Las últimas 5 órdenes recibidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Rango</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No hay órdenes recientes
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <div className="font-medium">{order.user?.username || 'Usuario desconocido'}</div>
                      </TableCell>
                      <TableCell>
                        {order.currentRank?.rank?.name} {order.currentRank?.division} →{' '}
                        {order.targetRank?.rank?.name} {order.targetRank?.division}
                      </TableCell>
                      <TableCell>${order.totalPrice?.toFixed(2)}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_COLORS[order.status] ? 'outline' : 'secondary'}
                          style={{ borderColor: STATUS_COLORS[order.status], color: STATUS_COLORS[order.status] }}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Rangos Más Solicitados */}
      <Card>
        <CardHeader>
          <CardTitle>Rangos Más Solicitados</CardTitle>
          <CardDescription>
            Los destinos de boost más populares
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rango</TableHead>
                  <TableHead>División</TableHead>
                  <TableHead>Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topTargetRanks?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No hay datos disponibles
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.topTargetRanks?.map((rank, index) => (
                    <TableRow key={index}>
                      <TableCell>{rank._id.rankName || 'Desconocido'}</TableCell>
                      <TableCell>{rank._id.division}</TableCell>
                      <TableCell>{rank.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EloBoostDashboard;