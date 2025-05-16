import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import dashboardService from '@/services/dashboardService';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Colores para los diferentes estados
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', 
  '#4BC0C0', '#F87171', '#34D399', '#A78BFA', '#F472B6'
];

// Función para verificar si un objeto está vacío
const isEmptyObject = (obj) => Object.keys(obj).length === 0;

export const OrderStatusChart = ({ timeRange, customDateRange }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("total"); // "total", "confirmed", "pending"
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener datos con los parámetros de tiempo correspondientes
        let data;
        if (timeRange === 'custom' && customDateRange) {
          data = await dashboardService.getDashboardStats('custom', customDateRange);
        } else {
          data = await dashboardService.getDashboardStats(timeRange);
        }
        
        // console.log("Datos recibidos del backend:", data?.ordenesStats);
        
        // Verificar si existen estadosGlobales
        if (data?.ordenesStats?.estadosGlobales && !isEmptyObject(data.ordenesStats.estadosGlobales)) {
          // console.log("Usando estadosGlobales:", data.ordenesStats.estadosGlobales);
          
          // Transformar estadosGlobales a formato para gráficos
          const statusData = Object.entries(data.ordenesStats.estadosGlobales)
            .filter(([name, details]) => details && name) // Filtrar valores nulos
            .map(([name, details]) => ({
              name,
              value: details.count || 0,
              confirmedValue: details.confirmedCount || 0,
              pendingValue: details.pendingCount || 0,
              requiresConfirmation: details.requiresConfirmation || false,
              amount: details.total || 0,
              symbol: details.symbol || '$'
            }))
            .sort((a, b) => b.value - a.value);
          
          setChartData(statusData);
          // console.log("Chart data generado desde estadosGlobales:", statusData);
        } 
        // Plan alternativo: si no existe estadosGlobales, agregar manualmente
        else if (data?.ordenesStats?.porEstado && !isEmptyObject(data.ordenesStats.porEstado)) {
          // console.log("Agregando manualmente desde porEstado:", data.ordenesStats.porEstado);
          
          const aggregatedStatuses = {};
          
          // Recorrer todas las monedas y extraer/agregar los estados
          Object.entries(data.ordenesStats.porEstado).forEach(([currencyCode, currencyData]) => {
            // console.log(`Procesando moneda ${currencyCode}:`, currencyData);
            
            if (currencyData && currencyData.statuses) {
              // Recorrer los estados de esta moneda
              Object.entries(currencyData.statuses).forEach(([statusName, statusData]) => {
                // console.log(`  - Estado ${statusName}:`, statusData);
                
                if (!aggregatedStatuses[statusName]) {
                  aggregatedStatuses[statusName] = {
                    name: statusName,
                    value: 0,
                    confirmedValue: 0,
                    pendingValue: 0,
                    requiresConfirmation: statusData.requiresConfirmation || false,
                    amount: 0,
                    symbol: statusData.symbol || '$'
                  };
                }
                
                // Sumar los valores
                aggregatedStatuses[statusName].value += statusData.count || 0;
                aggregatedStatuses[statusName].confirmedValue += statusData.confirmedCount || 0;
                aggregatedStatuses[statusName].pendingValue += statusData.pendingCount || 0;
                aggregatedStatuses[statusName].amount += statusData.total || 0;
              });
            } else {
              // console.log(`La moneda ${currencyCode} no tiene estados o está mal formateada`);
            }
          });
          
          // Convertir a array y ordenar
          const statusesArray = Object.values(aggregatedStatuses)
            .sort((a, b) => b.value - a.value);
          
          setChartData(statusesArray);
          // console.log("Chart data generado manualmente:", statusesArray);
        } else {
          // console.log("No se encontraron datos de estados", {
            estadosGlobales: data?.ordenesStats?.estadosGlobales,
            porEstado: data?.ordenesStats?.porEstado
          });
          setChartData([]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar datos de estados de órdenes:', error);
        setError('No se pudieron cargar los datos de estados de órdenes');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, customDateRange]);
  
  // Obtener datos según el modo de visualización
  const getChartDataByMode = () => {
    switch (viewMode) {
      case "confirmed":
        return chartData
          .filter(item => item.requiresConfirmation && item.confirmedValue > 0)
          .map(item => ({
            ...item,
            value: item.confirmedValue
          }));
      case "pending":
        return chartData
          .filter(item => item.requiresConfirmation && item.pendingValue > 0)
          .map(item => ({
            ...item,
            value: item.pendingValue
          }));
      case "total":
      default:
        return chartData;
    }
  };
  
  // Personalizar tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/90 p-3 rounded border border-white/10 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-white/80">Cantidad: <span className="font-bold">{data.value}</span></p>
          {data.requiresConfirmation && (
            <>
              <p className="text-sm text-white/80">Confirmadas: <span className="font-bold">{data.confirmedValue}</span></p>
              <p className="text-sm text-white/80">Pendientes: <span className="font-bold">{data.pendingValue}</span></p>
            </>
          )}
          <p className="text-sm text-white/80">Total: <span className="font-bold">{data.symbol}{data.amount.toLocaleString()}</span></p>
        </div>
      );
    }
  
    return null;
  };
  
  // Renderizar leyenda personalizada
  const renderCustomizedLegend = (props) => {
    const { payload } = props;
    
    return (
      <div className="flex flex-wrap gap-4 text-sm justify-center mt-2">
        {payload.map((entry, index) => (
          <div 
            key={`legend-${index}`} 
            className="flex items-center gap-1.5"
          >
            <div
              style={{
                backgroundColor: entry.color,
                width: '10px',
                height: '10px',
                borderRadius: '50%'
              }}
            />
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };
  
  // Determinar el título según modo de visualización
  const getViewTitle = () => {
    switch (viewMode) {
      case "confirmed": return "Confirmadas";
      case "pending": return "Pendientes por Confirmar";
      default: return "Total";
    }
  };
  
  // Determinar si hay requisito de confirmación
  const hasConfirmableOrders = chartData.some(item => item.requiresConfirmation);
  
  // Comprobar si hay datos confirmados o pendientes disponibles
  const hasConfirmedData = chartData.some(item => item.requiresConfirmation && item.confirmedValue > 0);
  const hasPendingData = chartData.some(item => item.requiresConfirmation && item.pendingValue > 0);
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (isLoading) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
      </div>
    );
  }
  
  const displayData = getChartDataByMode();
  
  // Siempre mantener la estructura principal incluyendo las pestañas
  return (
    <div className="space-y-4">
      {hasConfirmableOrders && (
        <Tabs defaultValue="total" className="w-full" onValueChange={setViewMode} value={viewMode}>
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="confirmed" disabled={!hasConfirmedData}>Confirmadas</TabsTrigger>
            <TabsTrigger value="pending" disabled={!hasPendingData}>Pendientes</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      
      <div className="h-[230px]">
        {displayData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-muted-foreground">
              No hay datos {viewMode !== "total" ? `de órdenes ${getViewTitle().toLowerCase()}` : "de estados disponibles"}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {displayData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderCustomizedLegend} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};