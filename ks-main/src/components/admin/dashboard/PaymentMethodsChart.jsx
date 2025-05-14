import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import dashboardService from '@/services/dashboardService';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Colores para los diferentes métodos de pago
const COLORS = [
  '#FF8042', '#FFBB28', '#4BC0C0', '#A259FF', '#0088FE', 
  '#00C49F', '#F87171', '#34D399', '#A78BFA', '#F472B6'
];

export const PaymentMethodsChart = ({ timeRange, mode = 'porcentaje', customDateRange }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [paymentMethodsGlobal, setPaymentMethodsGlobal] = useState({});

  // Cargar monedas disponibles al iniciar
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const currencyData = await dashboardService.getAvailableCurrenciesForFiltering();
        setCurrencies(currencyData);
        // Establecer la primera moneda como seleccionada por defecto si existe
        if (currencyData.length > 0 && !selectedCurrency) {
          setSelectedCurrency(currencyData[0].code);
        }
      } catch (error) {
        console.error('Error al cargar monedas disponibles:', error);
      }
    };

    fetchCurrencies();
  }, []);

  // Función para normalizar nombres de métodos de pago
  const normalizeMethodName = (name) => {
    // Corregir el nombre específico de "Transaccioness" a "Transacciones"
    if (name === "Transaccioness") {
      return "Transacciones";
    }
    return name;
  };

  // Cargar datos cuando cambia el filtro de tiempo o la moneda seleccionada
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener datos según el rango de tiempo seleccionado
        let data;
        if (timeRange === 'custom' && customDateRange) {
          data = await dashboardService.getDashboardStats('custom', customDateRange, selectedCurrency);
        } else {
          data = await dashboardService.getDashboardStats(timeRange, null, selectedCurrency);
        }
        
        if (data && data.ingresosPorMoneda) {
          // Agregar métodos de pago de todas las monedas
          const globalMethods = {};
          
          // Recorrer todas las monedas y sus métodos de pago
          Object.entries(data.ingresosPorMoneda).forEach(([currencyCode, currencyData]) => {
            // Procesar métodos de pago para esta moneda
            if (currencyData.methods) {
              Object.entries(currencyData.methods).forEach(([methodName, methodData]) => {
                const normalizedName = normalizeMethodName(methodName);
                
                if (!globalMethods[normalizedName]) {
                  globalMethods[normalizedName] = {
                    name: normalizedName,
                    count: 0,
                    amount: 0,
                    symbol: methodData.symbol || currencyData.symbol || '$'
                  };
                }
                
                // Agregar datos para este método
                globalMethods[normalizedName].count += methodData.count || 0;
                globalMethods[normalizedName].amount += methodData.totalRevenue || 0;
              });
            }
          });
          
          // Guardar métodos globales procesados
          setPaymentMethodsGlobal(globalMethods);
          
          // Si hay una moneda seleccionada y existe en los datos
          if (selectedCurrency && data.ingresosPorMoneda[selectedCurrency]) {
            // Procesar métodos para esta moneda específica
            const currencyData = data.ingresosPorMoneda[selectedCurrency];
            
            // Convertir a formato para gráfico
            const methods = Object.entries(currencyData.methods || {}).map(([methodName, methodData]) => ({
              name: normalizeMethodName(methodName),
              count: methodData.count || 0,
              amount: methodData.totalRevenue || 0,
              symbol: methodData.symbol || currencyData.symbol || '$'
            })).sort((a, b) => (mode === 'porcentaje' ? b.amount : b.count) - (mode === 'porcentaje' ? a.amount : a.count));
            
            setChartData(methods);
          } else {
            // Si no hay moneda seleccionada o no existe, usar métodos globales
            setChartData(
              Object.values(globalMethods)
                .sort((a, b) => (mode === 'porcentaje' ? b.amount : b.count) - (mode === 'porcentaje' ? a.amount : a.count))
            );
          }
        } else {
          setChartData([]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar datos de métodos de pago:', error);
        setError('No se pudieron cargar los datos de métodos de pago');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, mode, selectedCurrency, customDateRange]);
  
  // Manejar cambio de moneda
  const handleCurrencyChange = (value) => {
    setSelectedCurrency(value);
  };
  
  // Calcular porcentajes para el modo porcentaje
  const getPercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };
  
  // Personalizar tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = chartData.reduce((sum, item) => sum + (mode === 'porcentaje' ? item.amount : item.count), 0);
      const percentage = getPercentage(mode === 'porcentaje' ? data.amount : data.count, total);
      
      return (
        <div className="bg-black/90 p-3 rounded border border-white/10 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-white/80">
            Órdenes: <span className="font-bold">{data.count}</span>
          </p>
          <p className="text-sm text-white/80">
            Ingresos: <span className="font-bold">{data.symbol}{data.amount.toLocaleString()}</span>
          </p>
          <p className="text-sm text-white/80">
            Porcentaje: <span className="font-bold">{percentage}%</span>
          </p>
        </div>
      );
    }
  
    return null;
  };
  
  // Renderizar leyenda personalizada
  const renderCustomizedLegend = (props) => {
    const { payload ,className=''} = props;
    
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
            <span className="text-xs md:text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar etiquetas en las secciones del gráfico
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }) => {
    if (mode !== 'porcentaje' || !percent) return null;
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    // Solo mostrar porcentaje si es mayor a 5%
    if (percent < 0.05) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Calcular porcentaje para cada elemento
  const calculatePercentages = (data) => {
    if (!data.length) return [];
    
    const total = data.reduce((sum, item) => 
      sum + (mode === 'porcentaje' ? item.amount : item.count), 0);
    
    if (total === 0) return data;
    
    return data.map(item => ({
      ...item,
      percent: (mode === 'porcentaje' ? item.amount : item.count) / total
    }));
  };
  
  return (
    <div className="space-y-4">
      {currencies.length > 0 && (
        <div className="w-full">
          <Select 
            value={selectedCurrency} 
            onValueChange={handleCurrencyChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una moneda" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="h-[250px] flex items-center justify-center">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-muted-foreground">No hay datos de métodos de pago disponibles</p>
        </div>
      ) : (
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={calculatePercentages(chartData)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey={mode === 'porcentaje' ? 'amount' : 'count'}
              >
                {chartData.map((entry, index) => (
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
        </div>
      )}
    </div>
  );
};  