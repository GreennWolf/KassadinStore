const mongoose = require('mongoose');
const User = require('../database/Models/userModel');
const Purchase = require('../database/Models/purcharseModel');
const Currency = require('../database/Models/currencyModel');
const PaymentMethod = require('../database/Models/paymentMethod');
const Status = require('../database/Models/statusModel');
const Item = require('../database/Models/itemsModel');
const Skin = require('../database/Models/skinModel');
const PaymentMethodCurrency = require('../database/Models/PaymentMethodCurrency');

/**
 * Obtiene el rango de fechas según el filtro de tiempo seleccionado
 * @param {string} timeFilter - Filtro de tiempo ('week', 'month', 'year', 'all', 'custom')
 * @param {string} startDateStr - Fecha de inicio para filtro personalizado (formato ISO)
 * @param {string} endDateStr - Fecha de fin para filtro personalizado (formato ISO)
 * @returns {Object} Objeto con fechas de inicio y fin
 */
const getDateRange = (timeFilter, startDateStr, endDateStr) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = now;
  
  switch (timeFilter) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'custom':
      if (startDateStr && endDateStr) {
        startDate = new Date(startDateStr);
        endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
    case 'all':
    default:
      startDate = new Date(1970, 0, 1); // Fecha muy antigua
      break;
  }
  
  return { startDate, endDate };
};

/**
 * Obtiene estadísticas del dashboard
 * @route GET /api/dashboard/stats
 * @access Private/Admin
 */
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('Iniciando obtención de estadísticas del dashboard');
    
    const timeFilter = req.query.timeFilter || 'all';
    const currencyFilter = req.query.currency || null;
    
    const { startDate, endDate } = getDateRange(
      timeFilter, 
      req.query.startDate, 
      req.query.endDate
    );
    
    console.log(`Período: ${startDate.toISOString()} - ${endDate.toISOString()}`);
    
    // Construir filtro base para las órdenes
    const purchaseFilter = {
      purchaseDate: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    // Si hay filtro de moneda, añadirlo
    if (currencyFilter) {
      const currency = await Currency.findOne({ code: currencyFilter });
      if (currency) {
        purchaseFilter.currencyId = currency._id;
        console.log(`Filtro por moneda: ${currency.code} (${currency._id})`);
      }
    }
    
    // 1. Total de usuarios
    const totalUsers = await User.countDocuments();
    console.log(`Total de usuarios: ${totalUsers}`);
    
    // 2. Nuevos usuarios en el período
    let newUsers = 0;
    if (timeFilter !== 'all') {
      newUsers = await User.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
      console.log(`Nuevos usuarios en el período: ${newUsers}`);
    }
    
    // 3. Total de órdenes en el período seleccionado
    const totalOrders = await Purchase.countDocuments(purchaseFilter);
    console.log(`Total de órdenes en el período: ${totalOrders}`);
    
    // 4. Obtener todas las monedas disponibles
    const allCurrencies = await Currency.find({}).lean();
    console.log(`Monedas disponibles: ${allCurrencies.length}`);
    
    // 5. Obtener todos los métodos de pago
    const allPaymentMethods = await PaymentMethod.find({}).lean();
    console.log(`Métodos de pago disponibles: ${allPaymentMethods.length}`);
    
    // 6. Obtener todos los estados posibles
    const allStatus = await Status.find({}).lean();
    console.log(`Estados disponibles: ${allStatus.length}`);
    
    // 7. Obtener órdenes con información detallada y correctamente pobladas
    const purchases = await Purchase.find(purchaseFilter)
      .populate('status.statusId', 'status color description confirmacion confirmacionText active')
      .populate('currencyId', 'code name symbol')
      .populate('paymentMethodId', 'method')
      .select('_id userId status currencyId paymentMethodId Total purchaseDate items')
      .lean();
    
    console.log(`Órdenes recuperadas: ${purchases.length}`);
    
    // 8. Procesar estadísticas de órdenes correctamente
    // Inicializamos estructuras de datos
    const ordersByStatus = {};
    const ordersByStatusAndCurrency = {};
    let totalConfirmed = 0;
    
    // Contador por método de pago
    const ordersByPaymentMethod = {};
    
    // Ingresos por moneda
    const ingresosPorMoneda = {};
    
    // Inicializar estructuras para monedas
    allCurrencies.forEach(currency => {
      const currencyCode = currency.code;
      ingresosPorMoneda[currencyCode] = {
        id: currency._id,
        code: currencyCode,
        name: currency.name,
        symbol: currency.symbol,
        methods: {},
        statuses: {},
        total: {
          count: 0,
          totalRevenue: 0
        }
      };
      
      // Inicializar contadores por método de pago para cada moneda
      allPaymentMethods.forEach(method => {
        ingresosPorMoneda[currencyCode].methods[method.method] = {
          id: method._id,
          count: 0,
          totalRevenue: 0,
          symbol: currency.symbol
        };
      });
    });
    
    // Inicializar contadores por estado 
    // Primero creamos estructura base para todos los estados
    allStatus.forEach(status => {
      ordersByStatus[status.status] = {
        id: status._id,
        name: status.status,
        count: 0,
        confirmedCount: 0, // Cuántas órdenes están confirmadas
        pendingCount: 0,    // Cuántas órdenes están pendientes
        requiresConfirmation: status.confirmacion, // Si este estado requiere confirmación
        total: 0,
        symbol: '$'
      };
    });
    
    // Procesar cada compra para extraer estadísticas
    purchases.forEach(purchase => {
      const statusObj = purchase.status?.statusId;
      const statusName = statusObj?.status || 'Desconocido';
      const currencyObj = purchase.currencyId;
      const currencyCode = currencyObj?.code || 'UNKNOWN';
      const paymentMethod = purchase.paymentMethodId?.method || 'Desconocido';
      const total = purchase.Total || 0;
      
      // Verificar si la orden está confirmada basándonos en el campo estadoConfirmado
      const isConfirmed = purchase.status?.estadoConfirmado === true;
      console.log(statusObj , 'estados data')
      // Si la orden está confirmada, incrementar el contador total
      if (isConfirmed) {
        totalConfirmed++;
      }
      
      // Actualizar contadores de estado global
      if (!ordersByStatus[statusName]) {
        ordersByStatus[statusName] = {
          id: statusObj?._id || null,
          name: statusName,
          count: 0,
          confirmedCount: 0,
          pendingCount: 0,
          requiresConfirmation: statusObj?.confirmacion || false,
          total: 0,
          symbol: currencyObj?.symbol || '$'
        };
      }
      
      // Incrementar el contador general para este estado
      ordersByStatus[statusName].count += 1;
      ordersByStatus[statusName].total += total;
      
      // Incrementar el contador de confirmadas o pendientes según corresponda
      if (isConfirmed) {
        ordersByStatus[statusName].confirmedCount += 1;
      } else if (statusObj?.confirmacion === true) {
        // Solo contar como pendiente si el estado requiere confirmación
        ordersByStatus[statusName].pendingCount += 1;
      }
      
      // Actualizar ingresos por moneda
      if (ingresosPorMoneda[currencyCode]) {
        // Total por moneda
        ingresosPorMoneda[currencyCode].total.count += 1;
        ingresosPorMoneda[currencyCode].total.totalRevenue += total;
        
        // Por método de pago
        if (!ingresosPorMoneda[currencyCode].methods[paymentMethod]) {
          ingresosPorMoneda[currencyCode].methods[paymentMethod] = {
            id: purchase.paymentMethodId?._id || null,
            count: 0,
            totalRevenue: 0,
            symbol: currencyObj?.symbol || '$'
          };
        }
        ingresosPorMoneda[currencyCode].methods[paymentMethod].count += 1;
        ingresosPorMoneda[currencyCode].methods[paymentMethod].totalRevenue += total;
        
        // Por estado
        if (!ingresosPorMoneda[currencyCode].statuses[statusName]) {
          ingresosPorMoneda[currencyCode].statuses[statusName] = {
            id: statusObj?._id || null,
            count: 0,
            confirmedCount: 0,
            pendingCount: 0,
            requiresConfirmation: statusObj?.confirmacion || false,
            totalRevenue: 0,
            symbol: currencyObj?.symbol || '$'
          };
        }
        
        // Incrementar contadores generales de este estado para esta moneda
        ingresosPorMoneda[currencyCode].statuses[statusName].count += 1;
        ingresosPorMoneda[currencyCode].statuses[statusName].totalRevenue += total;
        
        // Incrementar contadores de confirmación
        if (isConfirmed) {
          ingresosPorMoneda[currencyCode].statuses[statusName].confirmedCount += 1;
        } else if (statusObj?.confirmacion === true) {
          ingresosPorMoneda[currencyCode].statuses[statusName].pendingCount += 1;
        }
      }
      
      // Crear clave compuesta para estado + moneda
      const statusCurrencyKey = `${statusName}_${currencyCode}`;
      if (!ordersByStatusAndCurrency[statusCurrencyKey]) {
        ordersByStatusAndCurrency[statusCurrencyKey] = {
          statusId: statusObj?._id || null,
          statusName: statusName,
          currencyId: currencyObj?._id || null,
          currencyCode: currencyCode,
          currencySymbol: currencyObj?.symbol || '$',
          requiresConfirmation: statusObj?.confirmacion || false,
          count: 0,
          confirmedCount: 0,
          pendingCount: 0,
          total: 0
        };
      }
      
      // Actualizar contadores generales para esta combinación de estado+moneda
      ordersByStatusAndCurrency[statusCurrencyKey].count += 1;
      ordersByStatusAndCurrency[statusCurrencyKey].total += total;
      
      // Actualizar contadores de confirmación para estado+moneda
      if (isConfirmed) {
        ordersByStatusAndCurrency[statusCurrencyKey].confirmedCount += 1;
      } else if (statusObj?.confirmacion === true) {
        ordersByStatusAndCurrency[statusCurrencyKey].pendingCount += 1;
      }
      
      // Actualizar contador por método de pago
      if (!ordersByPaymentMethod[paymentMethod]) {
        ordersByPaymentMethod[paymentMethod] = 0;
      }
      ordersByPaymentMethod[paymentMethod] += 1;
    });
    
    // Procesar órdenes por estado y moneda para formato final
    const ordenesEstadosData = {};
    
    // Inicializar estructura por moneda
    allCurrencies.forEach(currency => {
      ordenesEstadosData[currency.code] = {
        statuses: {},
        total: 0
      };
    });
    
    // Poblar con datos reales
    Object.values(ordersByStatusAndCurrency).forEach(item => {
      if (!ordenesEstadosData[item.currencyCode]) {
        ordenesEstadosData[item.currencyCode] = {
          statuses: {},
          total: 0
        };
      }
      
      ordenesEstadosData[item.currencyCode].statuses[item.statusName] = {
        id: item.statusId,
        count: item.count,
        confirmedCount: item.confirmedCount,
        pendingCount: item.pendingCount,
        requiresConfirmation: item.requiresConfirmation,
        total: item.total,
        symbol: item.currencySymbol
      };
      
      ordenesEstadosData[item.currencyCode].total += item.count;
    });
    
    // 9. Obtener productos más vendidos
    const topProductsData = [];
    const itemQuantities = {};
    const itemRevenues = {};
    
    // Recolectar cantidades por item
    purchases.forEach(purchase => {
      const totalItemsInPurchase = purchase.items?.length || 0;
      const revenuePerItem = totalItemsInPurchase > 0 ? purchase.Total / totalItemsInPurchase : 0;
      
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach(item => {
          if (!item || !item.itemId) return;
          
          const itemKey = `${item.itemId}_${item.itemType}`;
          
          if (!itemQuantities[itemKey]) {
            itemQuantities[itemKey] = {
              itemId: item.itemId,
              itemType: item.itemType,
              quantity: 0,
              sales: 0
            };
          }
          
          if (!itemRevenues[itemKey]) {
            itemRevenues[itemKey] = 0;
          }
          
          itemQuantities[itemKey].quantity += (item.quantity || 1);
          itemQuantities[itemKey].sales += 1;
          itemRevenues[itemKey] += revenuePerItem * (item.quantity || 1);
        });
      }
    });
    
    // Convertir a array para ordenar
    const topProductsList = Object.values(itemQuantities);
    topProductsList.sort((a, b) => b.quantity - a.quantity);
    
    // Obtener los top 10 productos más vendidos
    const topItems = topProductsList.slice(0, 10);
    
    // Completar info de productos
    for (const product of topItems) {
      let productDetails = null;
      
      if (product.itemType === 'Skin') {
        productDetails = await Skin.findById(product.itemId)
          .select('NombreSkin src srcLocal champion')
          .lean();
        
        if (productDetails) {
          topProductsData.push({
            itemId: product.itemId,
            itemType: product.itemType,
            isItem: false,
            isSkin: true,
            itemName: productDetails.NombreSkin || 'Skin desconocida',
            srcLocal: productDetails.srcLocal || '',
            srcWeb: productDetails.src || '',
            productType: 'Skin',
            champion: productDetails.champion,
            totalQuantity: product.quantity,
            totalSales: product.sales,
            totalRevenue: parseFloat((itemRevenues[`${product.itemId}_${product.itemType}`] || 0).toFixed(2))
          });
        }
      } else {
        productDetails = await Item.findById(product.itemId)
          .select('name type srcWeb srcLocal')
          .lean();
        
        if (productDetails) {
          topProductsData.push({
            itemId: product.itemId,
            itemType: product.itemType,
            isItem: true,
            isSkin: false,
            itemName: productDetails.name || 'Producto desconocido',
            srcLocal: productDetails.srcLocal || '',
            srcWeb: productDetails.srcWeb || '',
            productType: productDetails.type || 'Desconocido',
            champion: null,
            totalQuantity: product.quantity,
            totalSales: product.sales,
            totalRevenue: parseFloat((itemRevenues[`${product.itemId}_${product.itemType}`] || 0).toFixed(2))
          });
        }
      }
      
      if (!productDetails) {
        console.log(`[ALERTA] Producto desconocido encontrado: ID=${product.itemId}, Tipo=${product.itemType}`);
      }
    }
    
    // 10. Relaciones de métodos de pago y monedas
    const metodosYMonedas = await PaymentMethodCurrency.find({})
      .populate('paymentMethod', 'method')
      .populate('currencies', 'code name symbol')
      .lean();
    
    // Formatear el resultado
    const result = {
      timeFilter,
      currencyFilter,
      periodo: {
        desde: startDate.toISOString(),
        hasta: endDate.toISOString()
      },
      totalUsuarios: totalUsers,
      nuevosUsuarios: newUsers,
      ordenesStats: {
        total: totalOrders,
        confirmadas: totalConfirmed,
        porEstado: ordenesEstadosData,
        estadosGlobales: ordersByStatus
      },
      ingresosPorMoneda: ingresosPorMoneda,
      productosTopVendidos: topProductsData,
      productosTopRentables: [...topProductsData].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
      metodosYMonedas: metodosYMonedas.map(relation => ({
        id: relation._id,
        paymentMethod: relation.paymentMethod ? {
          id: relation.paymentMethod._id,
          method: relation.paymentMethod.method
        } : null,
        currencies: (relation.currencies || []).map(currency => ({
          id: currency._id,
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol
        })),
        isRestricted: relation.isRestricted
      })),
      monedasDisponibles: allCurrencies.map(currency => ({
        id: currency._id,
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol
      }))
    };
    
    // Mostrar datos de resumen
    console.log('===== DATOS DEL DASHBOARD =====');
    console.log(JSON.stringify({
      success: true,
      timeFilter: result.timeFilter,
      currencyFilter: result.currencyFilter,
      periodo: result.periodo,
      estadísticas: {
        usuarios: {
          total: result.totalUsuarios,
          nuevos: result.nuevosUsuarios
        },
        ordenes: {
          total: result.ordenesStats.total,
          confirmadas: result.ordenesStats.confirmadas,
          estadosCount: Object.keys(result.ordenesStats.estadosGlobales).length
        },
        monedas: {
          total: Object.keys(result.ingresosPorMoneda).length,
          activas: Object.values(result.ingresosPorMoneda).filter(m => m.total.count > 0).length
        },
        productos: {
          topVendidos: result.productosTopVendidos.length,
          topRentables: result.productosTopRentables.length
        }
      }
    }, null, 2));
    
    // Mostrar ingresos por moneda
    console.log('===== INGRESOS POR MONEDA =====');
    Object.entries(result.ingresosPorMoneda).forEach(([code, data]) => {
      if (data.total.count > 0) {
        console.log(`${code} (${data.name}): ${data.total.totalRevenue} ${data.symbol} (${data.total.count} ordenes)`);
      }
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error en dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: error.message
    });
  }
};