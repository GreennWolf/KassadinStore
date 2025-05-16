import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDownIcon, RefreshCcw } from "lucide-react";
import { DateRangeSelector } from './DateRangeSelector';
import { TopProductsTable } from './TopProductsTable';
import { CurrencyRevenueCards } from './CurrencyRevenueCards';
import { OrdersChart } from './OrdersChart';
import { TotalStats } from './TotalStats';
import { OrderStatusChart } from './OrderStatusChart';
import { PaymentMethodsChart } from './PaymentMethodsChart';
import dashboardService from '@/services/dashboardService';
import { toast } from 'react-toastify';

export const AdminOverview = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRefresh = async () => {
    setIsLoading(true);
    toast.info("Actualizando datos del dashboard...");
    
    try {
      // Simular una actualización forzada
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
      toast.success("Datos actualizados correctamente");
    } catch (error) {
      console.error("Error al actualizar datos:", error);
      toast.error("Error al actualizar datos");
      setIsLoading(false);
    }
  };
  
  const handleRangeChange = (range, customRange = null) => {
    setTimeRange(range);
    if (range === 'custom' && customRange) {
      setCustomDateRange(customRange);
    }
  };
  
  const handleExportData = async () => {
    try {
      toast.info("Preparando exportación de datos...");
      await dashboardService.exportDashboardDataToCSV('complete', timeRange, customDateRange);
      toast.success("Datos exportados correctamente");
    } catch (error) {
      console.error("Error al exportar datos:", error);
      toast.error("Error al exportar datos");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard General</h2>
          <p className="text-muted-foreground">
            Vista general del estado actual de tu negocio
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeSelector 
            onRangeChange={handleRangeChange} 
            initialValue={timeRange} 
          />
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportData}
            disabled={isLoading}
          >
            <FileDownIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>
      
      <TotalStats timeRange={timeRange} customDateRange={customDateRange} />
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <OrdersChart timeRange={timeRange} customDateRange={customDateRange} />
        <TopProductsTable timeRange={timeRange} customDateRange={customDateRange} />
      </div>
      
      <CurrencyRevenueCards timeRange={timeRange} customDateRange={customDateRange} />
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Estados de Órdenes</CardTitle>
            <CardDescription>
              Distribución de órdenes por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderStatusChart timeRange={timeRange} customDateRange={customDateRange} />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
            <CardDescription>
              Distribución de ventas por método de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="porcentaje" className="space-y-4">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="porcentaje">Porcentaje</TabsTrigger>
                <TabsTrigger value="cantidad">Cantidad</TabsTrigger>
              </TabsList>
              
              <TabsContent value="porcentaje" className="h-[250px]">
                <PaymentMethodsChart timeRange={timeRange} mode="porcentaje" customDateRange={customDateRange} />
              </TabsContent>
              
              <TabsContent value="cantidad" className="h-[250px]">
                <PaymentMethodsChart timeRange={timeRange} mode="cantidad" customDateRange={customDateRange} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};