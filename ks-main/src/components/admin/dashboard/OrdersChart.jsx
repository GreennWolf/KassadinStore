import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DateRangeSelector } from './DateRangeSelector';
import dashboardService from '@/services/dashboardService';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const OrdersChart = ({ timeRange }) => {
  const [localTimeRange, setLocalTimeRange] = useState(timeRange || 'month');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (timeRange) {
      setLocalTimeRange(timeRange);
    }
  }, [timeRange]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let data;
        
        if (localTimeRange === 'custom' && customDateRange) {
          // Usar rango personalizado
          data = await dashboardService.getDashboardStats('custom', {
            startDate: customDateRange.startDate,
            endDate: customDateRange.endDate
          });
        } else {
          // Usar filtro predefinido
          data = await dashboardService.getDashboardStats(localTimeRange);
        }
        
        // Intentar obtener tendencias reales
        try {
          const trends = await dashboardService.getTrendsData();
          
          if (trends && trends.ordersData && trends.ordersData.datasets && trends.ordersData.labels) {
            setChartData(trends.ordersData.datasets[0].data.map((value, index) => ({
              name: trends.ordersData.labels[index],
              orders: value
            })));
          } else {
            // Si no hay datos de tendencia, mostrar mensaje sin datos
            setChartData([]);
            console.log("No hay datos de tendencia disponibles");
          }
        } catch (trendError) {
          console.error('Error al cargar tendencias:', trendError);
          
          // En lugar de crear datos simulados, mostrar un mensaje de error o datos vacíos
          setError('No se pudieron cargar los datos de tendencia de órdenes. Por favor, intente nuevamente más tarde.');
          setChartData([]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar datos de órdenes:', error);
        setError('No se pudieron cargar los datos de tendencia de órdenes');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [localTimeRange, customDateRange]);

  const handleRangeChange = (range, customRange = null) => {
    setLocalTimeRange(range);
    if (range === 'custom' && customRange) {
      setCustomDateRange(customRange);
    }
  };

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Tendencia de Órdenes</CardTitle>
        <DateRangeSelector onRangeChange={handleRangeChange} initialValue={localTimeRange} />
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis 
                  dataKey="name"
                  stroke="#FFFFFF"
                  tick={{ fill: '#FFFFFF' }}
                />
                <YAxis 
                  stroke="#FFFFFF"
                  tick={{ fill: '#FFFFFF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#FFFFFF'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#8b5cf6"
                  fill="url(#ordersGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No hay datos de tendencia disponibles para el período seleccionado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};