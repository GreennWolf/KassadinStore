import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangeSelector } from './DateRangeSelector';
import dashboardService from '@/services/dashboardService';
import { Skeleton } from "@/components/ui/skeleton";
import { InfoIcon, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const TopProductsTable = ({ timeRange }) => {
  const [localTimeRange, setLocalTimeRange] = useState(timeRange || 'month');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  
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
          // Usar fechas personalizadas
          data = await dashboardService.getDashboardStats('custom', {
            startDate: customDateRange.startDate,
            endDate: customDateRange.endDate
          });
        } else {
          // Usar filtro predefinido
          data = await dashboardService.getDashboardStats(localTimeRange);
        }
        
        if (data && data.productosTopVendidos) {
          // Guardar todos los productos
          setAllProducts(data.productosTopVendidos);
          // Mostrar solo los primeros 5 por defecto
          setProducts(data.productosTopVendidos.slice(0, 5));
        } else {
          setProducts([]);
          setAllProducts([]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar productos más vendidos:', error);
        setError('No se pudieron cargar los productos más vendidos');
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

  const toggleShowAll = () => {
    if (showAll) {
      setProducts(allProducts.slice(0, 5));
    } else {
      setProducts(allProducts);
    }
    setShowAll(!showAll);
  };

  const getPlaceholderImage = (itemType) => {
    // Devolver imagen placeholder según tipo de producto
    switch (itemType) {
      case 'Skin':
        return "/assets/Skin-cp9HGoEY.png";
      case 'Item':
        return "/assets/Skin-cp9HGoEY.png";
      default:
        return "/assets/Skin-cp9HGoEY.png";
    }
  };

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Productos Más Vendidos</CardTitle>
        <DateRangeSelector onRangeChange={handleRangeChange} initialValue={localTimeRange} />
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Ventas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton para carga
              Array(5).fill(0).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-8 h-8 rounded-md" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.itemId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <img 
                        src={product.srcLocal || getPlaceholderImage(product.itemType)} 
                        alt={product.itemName} 
                        className="w-8 h-8 rounded-md object-cover bg-black/20"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getPlaceholderImage(product.itemType);
                        }}
                      />
                      <span>{product.itemName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{product.totalQuantity}</TableCell>
                  <TableCell className="text-right">{product.totalSales}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <InfoIcon className="h-8 w-8 mb-2" />
                    <p>No hay productos vendidos en este período</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Botón para ver todos los productos */}
        {allProducts.length > 5 && !isLoading && (
          <div className="mt-4 flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleShowAll}
              className="flex items-center gap-1.5"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>Ver menos</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Ver todos ({allProducts.length})</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};