import axios from 'axios';

// Configuración base de Axios
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Constantes para las URLs base
const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_ITEMS = `${API_BASE_URL}/items`;
const API_BASE_IMAGES = `${API_BASE_URL}/images`;
const API_BASE_CHROMAS = `${API_BASE_URL}/chromas`;

// Función para transformar URLs de imágenes
const transformImageUrls = (product) => {
    if (!product) return product;

    // Copia el producto para no modificar el original
    const transformedProduct = { ...product };
    
    // Determina el tipo de producto (Skin o Item)
    const isSkin = product.itemType === 'Skin';
    
    // Define la URL base según el tipo
    let baseUrl;
    if (isSkin) {
        baseUrl = API_BASE_IMAGES;
    } else if (product.type === 'chromas') {
        baseUrl = API_BASE_CHROMAS;
    } else {
        baseUrl = API_BASE_ITEMS;
    }
    
    // Transforma las rutas de las imágenes
    if (transformedProduct.srcLocal) {
        transformedProduct.srcLocal = `${baseUrl}/${transformedProduct.srcLocal.replace(/\\/g, '/')}`;
    }
    
    // Loguear productos desconocidos
    if ((isSkin && transformedProduct.itemName === 'Skin desconocida') ||
        (!isSkin && transformedProduct.itemName === 'Producto desconocido')) {
        // console.log(
            '[ALERTA] Producto desconocido encontrado:',
            {
                id: transformedProduct.itemId,
                tipo: transformedProduct.itemType,
                contexto: 'Renderizado en frontend',
                datosCompletos: JSON.stringify(transformedProduct),
                fecha: new Date().toISOString(),
                url: window.location.href,
                ruta: transformedProduct.srcLocal || 'Sin ruta de imagen',
                otros: {
                    totalVentas: transformedProduct.totalSales,
                    cantidad: transformedProduct.totalQuantity
                }
            }
        );
    }
    
    return transformedProduct;
};

// Función para transformar un array de productos
const transformProductArray = (products) => {
    if (!Array.isArray(products)) return [];
    return products.map(transformImageUrls);
};

// Función para manejar errores
const handleRequestError = (error) => {
    console.error('Error en la solicitud del dashboard:', error);
    throw error;
};

// Verificar si el usuario es admin
const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.role === 'admin';
};

// Obtener estadísticas del dashboard
export const getDashboardStats = async (timeFilter = 'all', customRange = null, currencyCode = null) => {
    if (!isAdmin()) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
    }

    try {
        let url = `/dashboard/stats?timeFilter=${timeFilter}`;
        
        // Agregar parámetros de fecha personalizada si es necesario
        if (timeFilter === 'custom' && customRange) {
            const startDate = customRange.startDate instanceof Date 
                ? customRange.startDate.toISOString().split('T')[0] 
                : customRange.startDate;
                
            const endDate = customRange.endDate instanceof Date 
                ? customRange.endDate.toISOString().split('T')[0] 
                : customRange.endDate;
                
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        
        // Agregar filtro por moneda si se proporciona
        if (currencyCode) {
            url += `&currency=${currencyCode}`;
        }
        
        const response = await api.get(url, {
            withCredentials: true, // Importante para CORS
        });
        
        // Transformar las URLs de las imágenes en los productos más vendidos
        const data = { ...response.data.data };
        
        if (data.productosTopVendidos && Array.isArray(data.productosTopVendidos)) {
            data.productosTopVendidos = transformProductArray(data.productosTopVendidos);
        }
        
        return data;
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener monedas disponibles para filtrado
export const getAvailableCurrenciesForFiltering = async () => {
    if (!isAdmin()) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
    }

    try {
        const dashboardData = await getDashboardStats('all');
        return dashboardData.monedasDisponibles || [];
    } catch (error) {
        handleRequestError(error);
    }
};

// Transformar datos para gráficos
export const transformDataForCharts = (dashboardData, currencyCode = null) => {
    if (!dashboardData) return {};

    // Filtrar por moneda si se proporciona
    const filterByCurrency = (data, code) => {
        if (!code) return data;
        return Object.fromEntries(
            Object.entries(data).filter(([key]) => key === code)
        );
    };

    // Datos para gráfico de ingresos por moneda
    const filteredRevenue = currencyCode 
        ? filterByCurrency(dashboardData.ingresosPorMoneda, currencyCode)
        : dashboardData.ingresosPorMoneda;
    
    const currencyCodes = Object.keys(filteredRevenue || {});
    const currencyNames = currencyCodes.map(code => {
        const currencyData = filteredRevenue[code];
        return currencyData.name || code;
    });
    
    const revenueByCountryChart = {
        labels: currencyNames,
        datasets: [{
            label: 'Ingresos totales',
            data: currencyCodes.map(code => {
                return filteredRevenue[code]?.total?.totalRevenue || 0;
            }),
            backgroundColor: [
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(255, 205, 86, 0.6)',
                'rgba(201, 203, 207, 0.6)'
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(201, 203, 207, 1)'
            ],
            borderWidth: 1
        }]
    };

    // Datos para gráfico de productos más vendidos
    const topProducts = dashboardData.productosTopVendidos || [];
    const topProductsChart = {
        labels: topProducts.slice(0, 5).map(product => product.itemName),
        datasets: [{
            label: 'Cantidad vendida',
            data: topProducts.slice(0, 5).map(product => product.totalQuantity),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    };

    // Preparar datos para gráficos de métodos de pago y estados por moneda
    const prepareChartDataByCurrency = (chartType) => {
        // Si hay filtro de moneda, devolver solo datos de esa moneda
        if (currencyCode && filteredRevenue[currencyCode]) {
            const currencyData = filteredRevenue[currencyCode];
            
            if (chartType === 'payment') {
                // Para métodos de pago
                const methodsData = {
                    currency: currencyCode,
                    symbol: currencyData.symbol,
                    methods: Object.entries(currencyData.methods || {}).map(([method, data]) => ({
                        name: method,
                        count: data.count,
                        total: data.totalRevenue
                    }))
                };
                return [methodsData];
            } else if (chartType === 'status') {
                // Para estados
                const statusData = dashboardData.ordenesStats.porEstado[currencyCode];
                if (statusData) {
                    return [{
                        currency: currencyCode,
                        statuses: Object.entries(statusData.statuses || {}).map(([status, data]) => ({
                            name: status,
                            count: data.count,
                            total: data.total,
                            symbol: data.symbol
                        }))
                    }];
                }
                return [];
            }
        }
        
        // Si no hay filtro, devolver datos agrupados por moneda
        return Object.entries(filteredRevenue || {}).map(([code, currencyData]) => {
            if (chartType === 'payment') {
                // Para métodos de pago
                return {
                    currency: code,
                    symbol: currencyData.symbol,
                    methods: Object.entries(currencyData.methods || {}).map(([method, data]) => ({
                        name: method,
                        count: data.count,
                        total: data.totalRevenue
                    }))
                };
            } else if (chartType === 'status') {
                // Para estados
                const statusData = dashboardData.ordenesStats.porEstado[code];
                if (statusData) {
                    return {
                        currency: code,
                        statuses: Object.entries(statusData.statuses || {}).map(([status, data]) => ({
                            name: status,
                            count: data.count,
                            total: data.total,
                            symbol: data.symbol
                        }))
                    };
                }
                return null;
            }
            return null;
        }).filter(Boolean);
    };

    // Datos para gráfico de métodos de pago
    const paymentMethodsData = prepareChartDataByCurrency('payment');
    
    // Datos para gráfico de estados de órdenes
    const orderStatusData = prepareChartDataByCurrency('status');
    
    return {
        revenueByCountryChart,
        topProductsChart,
        paymentMethodsData,
        orderStatusData
    };
};

// Formatear números con separadores de miles y decimales según la moneda
export const formatCurrency = (amount, currencyCode = 'ARS') => {
    try {
        // Determinar el formato según el código de moneda
        let options = { style: 'currency' };
        
        switch (currencyCode) {
            case 'ARS':
                options = { ...options, currency: 'ARS', locale: 'es-AR' };
                break;
            case 'CLP':
                options = { ...options, currency: 'CLP', locale: 'es-CL' };
                break;
            case 'MXN':
                options = { ...options, currency: 'MXN', locale: 'es-MX' };
                break;
            case 'USD':
                options = { ...options, currency: 'USD', locale: 'en-US' };
                break;
            default:
                options = { ...options, currency: currencyCode, locale: 'es' };
        }
        
        return new Intl.NumberFormat(options.locale, { 
            style: options.style, 
            currency: options.currency 
        }).format(amount);
    } catch (error) {
        // Si hay un error, retornar el formato básico
        return new Intl.NumberFormat('es', { 
            style: 'currency', 
            currency: 'USD' 
        }).format(amount);
    }
};

// Obtener datos comparativos (mes actual vs mes anterior)
export const getComparativeData = async (currencyCode = null) => {
    if (!isAdmin()) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
    }

    try {
        // Obtener datos del mes actual
        const currentMonthData = await getDashboardStats('month', null, currencyCode);
        
        // Crear un rango personalizado para el mes anterior
        const today = new Date();
        const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayPreviousMonth = new Date(firstDayCurrentMonth);
        lastDayPreviousMonth.setDate(lastDayPreviousMonth.getDate() - 1);
        const firstDayPreviousMonth = new Date(lastDayPreviousMonth.getFullYear(), lastDayPreviousMonth.getMonth(), 1);
        
        // Formatear fechas para la API
        const startDate = firstDayPreviousMonth.toISOString().split('T')[0];
        const endDate = lastDayPreviousMonth.toISOString().split('T')[0];
        
        // Obtener datos del mes anterior con rango personalizado
        const previousMonthData = await getDashboardStats('custom', { startDate, endDate }, currencyCode);
        
        // Calcular porcentajes de cambio
        const calculateChange = (current, previous) => {
            if (!previous || previous === 0) return { value: current, percentage: 100, increased: true };
            const change = ((current - previous) / previous) * 100;
            return {
                value: current,
                percentage: Math.abs(change).toFixed(2),
                increased: change >= 0
            };
        };
        
        // Procesar comparativas para cada moneda
        const revenueComparisons = {};
        
        // Obtener todas las monedas disponibles en actual y anterior
        const allCurrencies = new Set([
            ...Object.keys(currentMonthData.ingresosPorMoneda || {}),
            ...Object.keys(previousMonthData.ingresosPorMoneda || {})
        ]);
        
        // Calcular comparativas para cada moneda
        allCurrencies.forEach(code => {
            // Si hay filtro de moneda, solo procesar esa moneda
            if (currencyCode && code !== currencyCode) return;
            
            const currentRevenue = currentMonthData.ingresosPorMoneda[code]?.total?.totalRevenue || 0;
            const previousRevenue = previousMonthData.ingresosPorMoneda[code]?.total?.totalRevenue || 0;
            
            revenueComparisons[code] = {
                ...calculateChange(currentRevenue, previousRevenue),
                symbol: currentMonthData.ingresosPorMoneda[code]?.symbol || '$'
            };
        });
        
        // Crear objeto con datos comparativos
        return {
            usuarios: calculateChange(
                currentMonthData.totalUsuarios, 
                previousMonthData.totalUsuarios
            ),
            ordenes: calculateChange(
                currentMonthData.ordenesStats.total, 
                previousMonthData.ordenesStats.total
            ),
            ordenesConfirmadas: calculateChange(
                currentMonthData.ordenesStats.confirmadas, 
                previousMonthData.ordenesStats.confirmadas
            ),
            ingresosPorMoneda: revenueComparisons,
            periodo: {
                actual: {
                    desde: currentMonthData.periodo.desde,
                    hasta: currentMonthData.periodo.hasta
                },
                anterior: {
                    desde: previousMonthData.periodo.desde,
                    hasta: previousMonthData.periodo.hasta
                }
            },
            currencyFilter: currencyCode
        };
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener datos de tendencias (últimos 6 meses)
export const getTrendsData = async (currencyCode = null) => {
    if (!isAdmin()) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
    }

    try {
        // Obtener últimos 6 meses
        const monthsData = [];
        const today = new Date();
        
        for (let i = 0; i < 6; i++) {
            const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
            
            const startDateStr = month.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            
            const data = await getDashboardStats('custom', 
                { startDate: startDateStr, endDate: endDateStr }, 
                currencyCode
            );
            
            monthsData.push({
                month: month.toLocaleString('es', { month: 'long' }),
                year: month.getFullYear(),
                data
            });
        }
        
        // Formatear datos para gráficos de tendencias
        const labels = monthsData.map(m => `${m.month} ${m.year}`).reverse();
        
        let revenueDatasets = [];
        
        if (currencyCode) {
            // Si hay filtro de moneda, solo mostrar esa moneda
            const currencyData = monthsData.map(m => 
                m.data.ingresosPorMoneda[currencyCode]?.total?.totalRevenue || 0
            ).reverse();
            
            const symbol = monthsData[0]?.data.ingresosPorMoneda[currencyCode]?.symbol || '$';
            
            revenueDatasets = [{
                label: `Ingresos en ${currencyCode}`,
                data: currencyData,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.4
            }];
        } else {
            // Si no hay filtro, analizar todos los códigos de moneda en los datos
            const currencyCodes = new Set();
            monthsData.forEach(m => {
                Object.keys(m.data.ingresosPorMoneda || {}).forEach(code => {
                    currencyCodes.add(code);
                });
            });
            
            // Crear datasets para cada moneda
            revenueDatasets = Array.from(currencyCodes).map((code, index) => {
                const colors = [
                    { bg: 'rgba(54, 162, 235, 0.1)', border: 'rgba(54, 162, 235, 1)' },
                    { bg: 'rgba(255, 99, 132, 0.1)', border: 'rgba(255, 99, 132, 1)' },
                    { bg: 'rgba(75, 192, 192, 0.1)', border: 'rgba(75, 192, 192, 1)' },
                    { bg: 'rgba(153, 102, 255, 0.1)', border: 'rgba(153, 102, 255, 1)' },
                    { bg: 'rgba(255, 159, 64, 0.1)', border: 'rgba(255, 159, 64, 1)' },
                    { bg: 'rgba(255, 205, 86, 0.1)', border: 'rgba(255, 205, 86, 1)' },
                    { bg: 'rgba(201, 203, 207, 0.1)', border: 'rgba(201, 203, 207, 1)' }
                ];
                
                const colorIndex = index % colors.length;
                
                return {
                    label: code,
                    data: monthsData.map(m => m.data.ingresosPorMoneda[code]?.total?.totalRevenue || 0).reverse(),
                    borderColor: colors[colorIndex].border,
                    backgroundColor: colors[colorIndex].bg,
                    tension: 0.4
                };
            });
        }
        
        const revenueData = {
            labels,
            datasets: revenueDatasets
        };
        
        // Preparar datos para órdenes por moneda
        const prepareOrdersDataByCurrency = () => {
            if (currencyCode) {
                // Si hay filtro, solo mostrar órdenes de esa moneda
                return {
                    labels,
                    datasets: [
                        {
                            label: `Órdenes totales en ${currencyCode}`,
                            data: monthsData.map(m => 
                                m.data.ordenesStats.porEstado[currencyCode]?.total || 0
                            ).reverse(),
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.1)',
                            tension: 0.4
                        }
                    ]
                };
            } else {
                // Si no hay filtro, mostrar órdenes totales y confirmadas
                return {
                    labels,
                    datasets: [
                        {
                            label: 'Órdenes totales',
                            data: monthsData.map(m => m.data.ordenesStats?.total || 0).reverse(),
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Órdenes confirmadas',
                            data: monthsData.map(m => m.data.ordenesStats?.confirmadas || 0).reverse(),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            tension: 0.4,
                            borderDash: [5, 5]
                        }
                    ]
                };
            }
        };
        
        const ordersData = prepareOrdersDataByCurrency();
        
        const usersData = {
            labels,
            datasets: [
                {
                    label: 'Usuarios totales',
                    data: monthsData.map(m => m.data.totalUsuarios).reverse(),
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.1)',
                    tension: 0.4
                }
            ]
        };
        
        return {
            revenueData,
            ordersData,
            usersData,
            rawData: monthsData.reverse(),
            currencyFilter: currencyCode
        };
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener todos los métodos de pago disponibles
export const getAvailablePaymentMethods = async () => {
    if (!isAdmin()) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
    }

    try {
        const response = await api.get('/payment-methods', {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener todas las monedas disponibles
export const getAvailableCurrencies = async () => {
    if (!isAdmin()) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
    }

    try {
        const response = await api.get('/currencies', {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener todos los estados de órdenes disponibles
export const getAvailableOrderStatuses = async () => {
    if (!isAdmin()) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
    }

    try {
        const response = await api.get('/order-statuses', {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        handleRequestError(error);
    }
};

// Función para exportar datos a CSV
export const exportDashboardDataToCSV = async (dataType, timeFilter = 'month', customRange = null, currencyCode = null) => {
    if (!isAdmin()) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
    }

    try {
        let data;
        
        // Obtener datos según el tipo
        if (dataType === 'products') {
            data = await getDashboardStats(timeFilter, customRange, currencyCode);
            return exportProductsToCSV(data.productosTopVendidos);
        } else if (dataType === 'revenue') {
            data = await getDashboardStats(timeFilter, customRange, currencyCode);
            return exportRevenueToCSV(data.ingresosPorMoneda, currencyCode);
        } else if (dataType === 'orders') {
            data = await getDashboardStats(timeFilter, customRange, currencyCode);
            return exportOrdersToCSV(data.ordenesStats, currencyCode);
        } else if (dataType === 'complete') {
            data = await getDashboardStats(timeFilter, customRange, currencyCode);
            return exportCompleteDataToCSV(data, currencyCode);
        }
        
        throw new Error('Tipo de datos para exportación no válido');
    } catch (error) {
        handleRequestError(error);
    }
};

// Función auxiliar para exportar productos a CSV
const exportProductsToCSV = (products) => {
    if (!products || products.length === 0) {
        throw new Error('No hay datos de productos para exportar');
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Nombre,Tipo,Cantidad Vendida,Total Ventas\n";
    
    products.forEach(product => {
        csvContent += `${product.itemId},"${product.itemName || 'Desconocido'}",${product.itemType || 'N/A'},${product.totalQuantity},${product.totalSales}\n`;
    });
    
    return downloadCSV(csvContent, 'productos_vendidos.csv');
};

// Función auxiliar para exportar ingresos a CSV
const exportRevenueToCSV = (revenueData, currencyFilter = null) => {
    if (!revenueData) {
        throw new Error('No hay datos de ingresos para exportar');
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Moneda,Código,Método de Pago,Símbolo,Total,Cantidad de Órdenes\n";
    
    Object.entries(revenueData).forEach(([currencyCode, currencyData]) => {
        // Filtrar por moneda si es necesario
        if (currencyFilter && currencyCode !== currencyFilter) return;
        
        // Exportar por método de pago
        Object.entries(currencyData.methods || {}).forEach(([method, data]) => {
            csvContent += `"${currencyData.name}",${currencyCode},${method},${data.symbol || '$'},${data.totalRevenue},${data.count}\n`;
        });
        
        // Incluir el total de la moneda
        if (currencyData.total) {
            csvContent += `"${currencyData.name}",${currencyCode},TOTAL,${currencyData.symbol || '$'},${currencyData.total.totalRevenue},${currencyData.total.count}\n`;
        }
    });
    
    const filename = currencyFilter ? `ingresos_${currencyFilter}.csv` : 'ingresos_por_moneda.csv';
    return downloadCSV(csvContent, filename);
};

// Función auxiliar para exportar órdenes a CSV
const exportOrdersToCSV = (orderData, currencyFilter = null) => {
    if (!orderData) {
        throw new Error('No hay datos de órdenes para exportar');
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Moneda,Estado,Cantidad,Total,Símbolo\n";
    
    // Exportar por moneda y estado
    Object.entries(orderData.porEstado || {}).forEach(([currencyCode, currencyData]) => {
        // Filtrar por moneda si es necesario
        if (currencyFilter && currencyCode !== currencyFilter) return;
        
        // Exportar por estado para cada moneda
        Object.entries(currencyData.statuses || {}).forEach(([status, data]) => {
            csvContent += `"${currencyCode}","${status}",${data.count},${data.total || 0},${data.symbol || '$'}\n`;
        });
        
        // Incluir total por moneda
        csvContent += `"${currencyCode}","TOTAL",${currencyData.total},,,\n`;
    });
    
    // Incluir totales generales
    csvContent += `"TODAS","TOTAL ÓRDENES",${orderData.total},,,\n`;
    csvContent += `"TODAS","TOTAL CONFIRMADAS",${orderData.confirmadas},,,\n`;
    
    const filename = currencyFilter ? `ordenes_${currencyFilter}.csv` : 'ordenes_por_estado.csv';
    return downloadCSV(csvContent, filename);
};

// Función auxiliar para exportar datos completos a CSV
const exportCompleteDataToCSV = (data, currencyFilter = null) => {
    if (!data) {
        throw new Error('No hay datos para exportar');
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Reporte del Dashboard - Generado el " + new Date().toLocaleString() + "\n\n";
    
    if (currencyFilter) {
        csvContent += `FILTRO DE MONEDA APLICADO: ${currencyFilter}\n\n`;
    }
    
    // Datos generales
    csvContent += "DATOS GENERALES\n";
    csvContent += "Período," + data.timeFilter + "\n";
    csvContent += "Fecha inicio," + new Date(data.periodo.desde).toLocaleString() + "\n";
    csvContent += "Fecha fin," + new Date(data.periodo.hasta).toLocaleString() + "\n";
    csvContent += "Total Usuarios," + data.totalUsuarios + "\n";
    csvContent += "Total Órdenes," + data.ordenesStats.total + "\n";
    csvContent += "Órdenes Confirmadas," + data.ordenesStats.confirmadas + "\n\n";
    
    // Datos de órdenes por estado
    csvContent += "ÓRDENES POR ESTADO Y MONEDA\n";
    csvContent += "Moneda,Estado,Cantidad,Total,Símbolo\n";
    
    Object.entries(data.ordenesStats.porEstado || {}).forEach(([currencyCode, currencyData]) => {
        // Filtrar por moneda si es necesario
        if (currencyFilter && currencyCode !== currencyFilter) return;
        
        Object.entries(currencyData.statuses || {}).forEach(([status, info]) => {
            csvContent += `"${currencyCode}","${status}",${info.count},${info.total || 0},${info.symbol || '$'}\n`;
        });
        
        csvContent += `"${currencyCode}","TOTAL",${currencyData.total},,,\n`;
    });
    
    csvContent += "\nINGRESOS POR MONEDA Y MÉTODO DE PAGO\n";
    csvContent += "Moneda,Código,Método de Pago,Símbolo,Total,Cantidad de Órdenes\n";
    
    // Datos de ingresos por moneda y método de pago
    Object.entries(data.ingresosPorMoneda || {}).forEach(([currencyCode, currencyData]) => {
        // Filtrar por moneda si es necesario
        if (currencyFilter && currencyCode !== currencyFilter) return;
        
        // Por método de pago
        Object.entries(currencyData.methods || {}).forEach(([method, methodData]) => {
            csvContent += `"${currencyData.name}",${currencyCode},${method},${methodData.symbol || '$'},${methodData.totalRevenue},${methodData.count}\n`;
        });
        
        // Total de la moneda
        if (currencyData.total) {
            csvContent += `"${currencyData.name}",${currencyCode},TOTAL,${currencyData.symbol || '$'},${currencyData.total.totalRevenue},${currencyData.total.count}\n`;
        }
    });
    
    csvContent += "\nPRODUCTOS MÁS VENDIDOS\n";
    csvContent += "ID,Nombre,Tipo,Cantidad Vendida,Total Ventas\n";
    
    if (data.productosTopVendidos && data.productosTopVendidos.length > 0) {
        data.productosTopVendidos.forEach(product => {
            csvContent += `${product.itemId},"${product.itemName || 'Desconocido'}",${product.itemType || 'N/A'},${product.totalQuantity},${product.totalSales}\n`;
        });
    }
    
    const filename = currencyFilter 
        ? `reporte_completo_${currencyFilter}.csv` 
        : 'reporte_completo_dashboard.csv';
    
    return downloadCSV(csvContent, filename);
};

// Función auxiliar para descargar el CSV
const downloadCSV = (csvContent, filename) => {
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
};

export default {
    getDashboardStats,
    transformDataForCharts,
    formatCurrency,
    getComparativeData,
    getTrendsData,
    getAvailablePaymentMethods,
    getAvailableCurrencies,
    getAvailableOrderStatuses,
    getAvailableCurrenciesForFiltering,
    exportDashboardDataToCSV
};