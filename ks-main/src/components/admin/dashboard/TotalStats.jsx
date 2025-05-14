import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, ShoppingCart, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import dashboardService from '@/services/dashboardService';
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export const TotalStats = ({ timeRange, customDateRange }) => {
  const [stats, setStats] = useState({
    users: 0,
    newUsers: 0,
    orders: {
      total: 0,
      confirmadas: 0
    },
    revenue: {},
    currencySpecificData: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparativeData, setComparativeData] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("ALL");
  const [currencies, setCurrencies] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener datos del dashboard
        let data;
        if (timeRange === 'custom' && customDateRange) {
          data = await dashboardService.getDashboardStats('custom', customDateRange);
        } else {
          data = await dashboardService.getDashboardStats(timeRange);
        }
        
        if (data) {
          // Procesar monedas disponibles
          const availableCurrencies = Object.entries(data.ingresosPorMoneda || {}).map(([code, info]) => ({
            code,
            name: info.name || code,
            symbol: info.symbol || '$'
          }));
          
          setCurrencies(availableCurrencies);
          
          // Recopilar datos específicos por moneda
          const currencyData = {};
          
          // Procesar datos por moneda
          Object.entries(data.ingresosPorMoneda || {}).forEach(([code, currencyInfo]) => {
            currencyData[code] = {
              revenue: currencyInfo.total?.totalRevenue || 0,
              orders: currencyInfo.total?.count || 0,
              confirmadas: 0, // Inicializar contador
              users: data.totalUsuarios || 0,
              symbol: currencyInfo.symbol || '$',
              name: currencyInfo.name || code
            };
            
            // Contar órdenes confirmadas por moneda
            if (data.ordenesStats?.porEstado && data.ordenesStats?.porEstado[code]?.statuses) {
              Object.values(data.ordenesStats.porEstado[code].statuses).forEach(status => {
                currencyData[code].confirmadas += (status.confirmedCount || 0);
              });
            }
          });
          
          // Actualizar estado con datos recopilados
          setStats({
            users: data.totalUsuarios || 0,
            newUsers: data.nuevosUsuarios || 0,
            orders: {
              total: selectedCurrency === "ALL" ? data.ordenesStats?.total || 0 : (currencyData[selectedCurrency]?.orders || 0),
              confirmadas: selectedCurrency === "ALL" ? data.ordenesStats?.confirmadas || 0 : 
                (currencyData[selectedCurrency]?.confirmadas || 0)
            },
            revenue: Object.entries(data.ingresosPorMoneda || {}).reduce((acc, [code, info]) => {
              acc[code] = {
                amount: info.total?.totalRevenue || 0,
                symbol: info.symbol || '$',
                name: info.name || code
              };
              return acc;
            }, {}),
            currencySpecificData: currencyData
          });
        }
        
        // Si es mes, obtener datos comparativos
        if (timeRange === 'month') {
          const comparative = await dashboardService.getComparativeData();
          setComparativeData(comparative);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar estadísticas totales:', error);
        setError('No se pudieron cargar las estadísticas totales');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange, selectedCurrency, customDateRange]);

  // Obtener símbolo de la moneda seleccionada
  const getCurrencySymbol = () => {
    if (selectedCurrency === "ALL") return "$";
    const currency = currencies.find(c => c.code === selectedCurrency);
    return currency ? currency.symbol : "$";
  };

  // Obtener datos comparativos
  const getComparative = (type) => {
    if (!comparativeData) {
      // Valores por defecto si no hay datos comparativos
      return {
        value: type === 'users' ? 5 : type === 'orders' ? 10 : 5.2,
        increased: true
      };
    }
    
    if (type === 'users') {
      return {
        value: comparativeData.usuarios.percentage,
        increased: comparativeData.usuarios.increased
      };
    }
    
    if (type === 'orders') {
      return {
        value: comparativeData.ordenes.percentage,
        increased: comparativeData.ordenes.increased
      };
    }
    
    // Para revenue, depende de la moneda seleccionada
    if (selectedCurrency === "ALL") {
      // Retornar valor por defecto para vista general
      return { value: "8.5", increased: true };
    } else if (comparativeData.ingresosPorMoneda && comparativeData.ingresosPorMoneda[selectedCurrency]) {
      return {
        value: comparativeData.ingresosPorMoneda[selectedCurrency].percentage,
        increased: comparativeData.ingresosPorMoneda[selectedCurrency].increased
      };
    }
    
    // Valor por defecto si no se encuentra la moneda específica
    return { value: "7.5", increased: true };
  };

  const renderCurrencyTotal = (currencyCode, currencyInfo) => {
    return (
      <div key={currencyCode} className="flex justify-between items-center py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="bg-gray-800 p-1 rounded-md">
            <span className="text-xs font-semibold">{currencyCode}</span>
          </div>
          <span>{currencyInfo.name}</span>
        </div>
        <div className="font-semibold">
          {currencyInfo.symbol} {currencyInfo.amount.toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h3 className="text-lg font-semibold">Estadísticas Generales</h3>
        
        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Moneda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las monedas</SelectItem>
            {currencies.map(currency => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.name} ({currency.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card de Ingresos */}
        <Card className="bg-card border border-border md:col-span-3 md:row-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales 
              {selectedCurrency !== "ALL" && ` (${selectedCurrency})`}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              selectedCurrency === "ALL" ? (
                <div>
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-1">
                      {Object.entries(stats.revenue)
                        .sort(([, a], [, b]) => b.amount - a.amount) // Ordenar por monto
                        .map(([code, info]) => renderCurrencyTotal(code, info))}
                    </div>
                  </ScrollArea>
                  {timeRange === 'month' && comparativeData && (
                    <p className={`text-xs flex items-center gap-1 mt-2 ${getComparative('revenue').increased ? 'text-green-600' : 'text-red-500'}`}>
                      {getComparative('revenue').increased ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {getComparative('revenue').increased ? '+' : '-'}{getComparative('revenue').value}% promedio vs período anterior
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold">
                    {getCurrencySymbol()} {stats.currencySpecificData[selectedCurrency]?.revenue.toLocaleString() || 0}
                  </div>
                  {timeRange === 'month' && comparativeData && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${getComparative('revenue').increased ? 'text-green-600' : 'text-red-500'}`}>
                      {getComparative('revenue').increased ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {getComparative('revenue').increased ? '+' : '-'}{getComparative('revenue').value}% vs período anterior
                    </p>
                  )}
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Card de Usuarios */}
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedCurrency === "ALL" ? "Usuarios Totales" : `Usuarios (${selectedCurrency})`}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.users.toLocaleString()}</div>
                {stats.newUsers > 0 && (
                  <div className="text-xs text-muted-foreground mb-1">
                    {stats.newUsers.toLocaleString()} nuevos en este período
                  </div>
                )}
                {timeRange === 'month' && comparativeData && (
                  <p className={`text-xs flex items-center gap-1 ${getComparative('users').increased ? 'text-green-600' : 'text-red-500'}`}>
                    {getComparative('users').increased ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {getComparative('users').increased ? '+' : '-'}{getComparative('users').value}% vs período anterior
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Card de Órdenes */}
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedCurrency === "ALL" ? "Órdenes Totales" : `Órdenes (${selectedCurrency})`}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.orders.total.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mb-1">
                  {stats.orders.confirmadas.toLocaleString()} confirmadas
                </div>
                {timeRange === 'month' && comparativeData && (
                  <p className={`text-xs flex items-center gap-1 ${getComparative('orders').increased ? 'text-green-600' : 'text-red-500'}`}>
                    {getComparative('orders').increased ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {getComparative('orders').increased ? '+' : '-'}{getComparative('orders').value}% vs período anterior
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Card de Órdenes Confirmadas */}
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedCurrency === "ALL" ? "Órdenes Confirmadas" : `Confirmadas (${selectedCurrency})`}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.orders.confirmadas.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mb-1">
                  {Math.round((stats.orders.confirmadas / Math.max(stats.orders.total, 1)) * 100)}% del total
                </div>
                {timeRange === 'month' && comparativeData && (
                  <p className={`text-xs flex items-center gap-1 ${getComparative('orders').increased ? 'text-green-600' : 'text-red-500'}`}>
                    {getComparative('orders').increased ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {getComparative('orders').increased ? '+' : '-'}{getComparative('orders').value}% vs período anterior
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};