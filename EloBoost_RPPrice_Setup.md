# Configuración del Sistema de EloBoost con Precios RP

Este documento describe cómo configurar y utilizar correctamente el sistema de EloBoost con los precios RP y conversiones de moneda.

## Visión General

El sistema de EloBoost ahora utiliza el mismo mecanismo de precios que el resto de la aplicación:

1. Cada rango y precio de división está vinculado a un valor RP específico
2. Los valores RP se convierten a diferentes monedas usando el sistema RPPriceConversion
3. Los usuarios pueden seleccionar la moneda deseada en la interfaz

## Pasos para la Configuración

### 1. Crear Precios RP

Antes de configurar los rangos de EloBoost, necesita tener precios RP disponibles en el sistema. Hemos proporcionado un script que crea precios RP comunes:

```bash
# Desde el directorio raíz del proyecto
node lol-store-server/scripts/createRPPrices.js
```

Este script creará precios RP comunes que pueden usarse para los rangos de EloBoost.

### 2. Verificar/Crear Conversiones de Precios

Asegúrese de que existen conversiones para las monedas que desea utilizar:

1. Acceda al panel de administración
2. Vaya a la sección "Precios y Conversiones"
3. Verifique que haya conversiones para cada precio RP y moneda que desea utilizar

### 3. Configurar Rangos de EloBoost

Ahora puede configurar los rangos de EloBoost con los precios RP:

1. Acceda al panel de administración
2. Vaya a la sección "EloBoost" > "Rangos"
3. Al crear o editar un rango:
   - Seleccione un valor RP para "Precio RP para Subir Rango"
   - Seleccione un valor RP para "Precio RP para Subir División"
   - Complete los demás datos del rango
   - Guarde los cambios

### 4. Configurar Ajustes Adicionales

Configure los porcentajes adicionales para servicios especiales:

1. Acceda a la sección "EloBoost" > "Configuración"
2. Ajuste los porcentajes para:
   - Rol específico
   - Campeón específico
   - Duo Queue
3. Guarde los cambios

## Cómo Funciona el Sistema

1. **Frontend (Página de EloBoost):**
   - Los usuarios seleccionan rango actual y deseado
   - Pueden seleccionar la moneda deseada
   - El sistema calcula automáticamente:
     - Precio base en RP
     - Costo adicional en RP (para opciones especiales)
     - Precio total en RP
     - Valor convertido en la moneda seleccionada

2. **Backend (Procesamiento de Órdenes):**
   - Las órdenes almacenan:
     - Valores en RP (baseRPPrice, totalRPPrice, additionalRPCost)
     - Valores convertidos a moneda (basePrice, totalPrice, additionalCost)
     - Referencia a la moneda utilizada (currency)
   - El cálculo se realiza utilizando las conversiones de RP a moneda

3. **API de Precios:**
   - Endpoint `/api/eloboost/price-conversions` proporciona todas las conversiones disponibles
   - Endpoint `/api/eloboost/calculate` calcula el precio exacto según las selecciones del usuario

## Solución de Problemas

Si tiene problemas configurando el sistema:

1. **No aparecen precios RP en el selector:**
   - Verifique que existen precios RP en la base de datos
   - Ejecute el script `createRPPrices.js` para crear precios iniciales

2. **Error al guardar un rango:**
   - Asegúrese de seleccionar un precio RP válido para ambos campos
   - Verifique que el nombre y orden del rango no estén duplicados

3. **No se muestran conversiones de moneda:**
   - Verifique que existen monedas activas
   - Asegúrese de tener conversiones configuradas para cada precio RP

## Recomendaciones

- Use precios RP distintos para diferentes rangos y divisiones
- Configure todas las conversiones de moneda para cada precio RP
- Mantenga los precios RP consistentes con los valores reales del juego

---

Con esta configuración, su sistema de EloBoost ahora utilizará el mismo sistema de precios que el resto de la aplicación, proporcionando una experiencia coherente para los usuarios y facilitando la administración de precios y conversiones.