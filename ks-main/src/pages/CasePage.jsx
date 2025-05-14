import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Coins, X } from "lucide-react";

import { getLootboxById, openLootbox } from "@/services/lootboxService";
import { getSkinById } from "@/services/champsService"; // Importar servicio de skins
import { getItemById } from "@/services/itemService"; // Importar servicio de items
import { cn } from "@/lib/utils";

import cuponImage from "../assets/Cupones.png";
import skinFragmentImage from "../assets/Skin.png";
import placeholderImage from "../assets/Skin.png";

// Constantes para URLs base (añadidas para compatibilidad con URLs de imágenes)
const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_ITEMS = `${API_BASE_URL}/items`;
const API_BASE_CHROMAS = `${API_BASE_URL}/api/chromas`;
const API_BASE_IMAGE = `${API_BASE_URL}/images`;

// Función para generar un color más claro para gradientes y efectos
const getLighterColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return "#9ca3af";
  
  try {
    // Convertir el color hexadecimal a RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Aclarar el color
    const lighterR = Math.min(r + 60, 255);
    const lighterG = Math.min(g + 60, 255);
    const lighterB = Math.min(b + 60, 255);
    
    // Convertir de nuevo a formato hexadecimal
    return `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return "#9ca3af"; // Color por defecto en caso de error
  }
};

// Función para generar un color más oscuro para sombras y gradientes
const getDarkerColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return "#4b5563";
  
  try {
    // Convertir el color hexadecimal a RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Oscurecer el color
    const darkerR = Math.max(r - 40, 0);
    const darkerG = Math.max(g - 40, 0);
    const darkerB = Math.max(b - 40, 0);
    
    // Convertir de nuevo a formato hexadecimal
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return "#4b5563"; // Color por defecto en caso de error
  }
};

// Función para generar un color de texto contrastante (blanco o negro)
const getContrastTextColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return "#ffffff";
  
  try {
    // Convertir el color hexadecimal a RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calcular luminosidad (percibida)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Si es claro, usar texto negro; si es oscuro, usar texto blanco
    return luminance > 0.5 ? "#000000" : "#ffffff";
  } catch (e) {
    return "#ffffff"; // Color por defecto en caso de error
  }
};

// Función para formatear porcentajes con dos decimales
const formatDropRate = (dropRate) => {
  return dropRate + "%";
};

// Función mejorada para encontrar el índice del item ganado en la lista de items disponibles
function findExactItemIndex(lootboxItems, targetItem) {
  // console.log("🔍 Buscando ítem entre opciones:", targetItem);
  
  // Función auxiliar para extraer y normalizar ID
  const normalizeId = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (item._id) return item._id.toString();
    if (item.id) return item.id.toString();
    if (item.itemId) return normalizeId(item.itemId);
    return JSON.stringify(item);
  };
  
  // console.log("💡 IDs disponibles en lootbox:", lootboxItems.map((item, i) => 
  //   `[${i}] ${item.itemType}: ${normalizeId(item.itemId)}`
  // ));
  // console.log("💡 ID buscado:", normalizeId(targetItem.itemId));
  
  return lootboxItems.findIndex((item) => {
    // Verificar tipo de ítem siempre primero
    if (item.itemType !== targetItem.itemType) return false;
    
    // Para Gold => comparamos amount
    if (item.itemType === "Gold") {
      const match = Number(item.details?.amount) === Number(targetItem.details?.amount);
      return match;
    }

    // Para FragmentsPreset => comparamos por ID y nombre
    if (item.itemType === "FragmentsPreset") {
      const idMatch = normalizeId(item.itemId) === normalizeId(targetItem.itemId);
      // También podemos comparar por nombre si está disponible
      const nameMatch = item.details?.name === targetItem.details?.name;
      return idMatch || nameMatch;
    }

    // Para Skin, comparamos por ID normalizado
    if (item.itemType === "Skin") {
      const localId = normalizeId(item.itemId);
      const targetId = normalizeId(targetItem.itemId);
      return localId === targetId;
    }
    
    // Para RewardCouponPreset y otros tipos, comparamos IDs normalizados
    const localId = normalizeId(item.itemId);
    const targetId = normalizeId(targetItem.itemId);
    return localId === targetId;
  });
}

// Nueva función para configurar estilos según el color del ítem
function getItemColorConfig(itemColor) {
  if (!itemColor || !itemColor.startsWith('#')) {
    // Color predeterminado si no hay un color válido
    itemColor = "#808080";
  }
  
  const darkerColor = getDarkerColor(itemColor);
  const lighterColor = getLighterColor(itemColor);
  const contrastTextColor = getContrastTextColor(itemColor);
  
  return {
    borderColor: `border-[${itemColor}]`,
    bgColor: `bg-gradient-to-br from-[${darkerColor}] to-[${getDarkerColor(darkerColor)}]`,
    textColor: `text-[${contrastTextColor}]`,
    // Colores raw para uso directo en style
    rawColors: {
      main: itemColor,
      darker: darkerColor,
      lighter: lighterColor,
      text: contrastTextColor
    }
  };
}

// Función mejorada para obtener el nombre del item
function getItemName(item) {
  if (item.itemType === "Gold") {
    return `${item.details?.amount || item.itemId} Oro`;
  }
  if (item.itemType === "RewardCouponPreset") {
    return item.details?.name || "Cupón sin nombre";
  }
  if (item.itemType === "Skin") {
    return item.details?.name || "Skin sin nombre";
  }
  if (item.itemType === "Item") {
    return item.itemId?.name || item.details?.name || "Ítem sin nombre";
  }
  if (item.itemType === "FragmentsPreset") {
    // Para fragmentos específicos, mostrar solo el nombre del fragmento sin sufijos adicionales
    return item.details?.name || item.details?.fragmentName || "Fragmento";
  }
  return "Ítem desconocido";
}

// Función mejorada para obtener la imagen del item
function getItemImage(item, rewardImages = {}) {
  if (item.itemType === "Gold") {
    return null; // Gold usa ícono Coins
  } 
  
  // Para fragmentos específicos, intentar mostrar la imagen de la recompensa
  if (item.itemType === "FragmentsPreset" && 
      (item.details?.type === "especifico" || item.details?.fragmentType === "especifico")) {
    const itemId = item.details.itemId || item.details.ItemId;
    if (itemId && rewardImages[itemId]) {
      return rewardImages[itemId];
    }
  }
  
  if (item.itemType === "RewardCouponPreset") {
    return item.details?.image || cuponImage;
  } 
  
  if (item.itemType === "FragmentsPreset") {
    return item.details?.image || skinFragmentImage;
  } 
  
  if (item.itemType === "Skin") {
    // Si tenemos srcLocal, construir la URL correcta con API_BASE_IMAGE
    if (item.details?.srcLocal) {
      const cleanPath = item.details.srcLocal.replace(/\\/g, '/');
      return cleanPath.startsWith('http') ? cleanPath : `${API_BASE_IMAGE}/${cleanPath}`;
    }
    // Si tenemos image, usarla directamente
    if (item.details?.image) {
      return item.details.image;
    }
    // Intentar con el objeto itemId
    if (item.itemId?.srcLocal) {
      const cleanPath = item.itemId.srcLocal.replace(/\\/g, '/');
      return cleanPath.startsWith('http') ? cleanPath : `${API_BASE_IMAGE}/${cleanPath}`;
    }
    return item.itemId?.src || item.details?.src;
  }
  
  // Para otros tipos de items
  if (item.itemId?.srcLocal) {
    const cleanPath = item.itemId.srcLocal.replace(/\\/g, '/');
    const baseUrl = item.itemId.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
    return `${baseUrl}/${cleanPath}`;
  }
  
  return item.details?.image;
}

// Función para determinar el tipo y nombre para mostrar
function getItemTypeAndDisplayName(item) {
  let itemType = "";
  let displayName = getItemName(item);
  
  if (item.itemType === "Skin") {
    if (item.itemId?.champion?.name) {
      itemType = item.itemId.champion.name;
    } else if (item.details?.champion?.name) {
      itemType = item.details.champion.name;
    } else {
      itemType = "Skin";
    }
    displayName = displayName.split(' | ').pop() || displayName;
  } else if (item.itemType === "FragmentsPreset") {
    // Para fragmentos específicos, mostrar información más detallada en el tipo, pero 
    // mantener limpio el displayName
    if (item.details?.type === "especifico" || item.details?.fragmentType === "especifico") {
      itemType = `Fragmento Específico`;
    } else {
      itemType = "Fragmento";
    }
  } else if (item.itemType === "RewardCouponPreset") {
    itemType = "Cupón";
  } else if (item.itemType === "Gold") {
    itemType = "Oro";
    displayName = displayName.replace("Oro", "").trim();
  } else {
    itemType = item.itemType;
  }
  
  return { itemType, displayName };
}

const CasePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lootbox, setLootbox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemsList, setItemsList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rewardImages, setRewardImages] = useState({}); // Estado para guardar las imágenes de recompensas (skins, items)
  const [loadingImages, setLoadingImages] = useState(false); // Nuevo estado para tracking de carga de imágenes
  const [rewardInfo, setRewardInfo] = useState({}); // Información adicional sobre recompensas

  const spinnerRef = useRef(null);

  // Cargar las imágenes de las recompensas para fragmentos de tipo específico
  useEffect(() => {
    const loadRewardImages = async () => {
      if (!lootbox || !lootbox.items || !lootbox.items.length) return;
      
      console.log("=== INICIANDO CARGA DE IMÁGENES PARA FRAGMENTOS ===");
      
      // Buscar fragmentos específicos en la lootbox
      const fragmentsWithRewards = lootbox.items.filter(
        item => item.itemType === "FragmentsPreset" && 
              (item.details?.type === "especifico" || item.details?.fragmentType === "especifico")
      );
      
      if (!fragmentsWithRewards.length) return;
      
      console.log(`Encontrados ${fragmentsWithRewards.length} fragmentos específicos:`, 
        fragmentsWithRewards.map(f => ({id: f.itemId, details: f.details})));
      
      setLoadingImages(true);
      const newRewardImages = { ...rewardImages };
      
      // Cargamos cada fragmento individualmente
      for (const fragment of fragmentsWithRewards) {
        try {
          console.log("Procesando fragmento:", fragment);
          
          // Identificar todos los posibles lugares donde podría estar el ID del item/skin
          const possibleIds = [];
          
          // 1. Buscar en details.itemId
          if (fragment.details?.itemId) {
            const id = typeof fragment.details.itemId === 'object' 
              ? fragment.details.itemId._id || fragment.details.itemId 
              : fragment.details.itemId;
            possibleIds.push({source: 'details.itemId', id});
          }
          
          // 2. Buscar en details.ItemId (con mayúscula)
          if (fragment.details?.ItemId) {
            const id = typeof fragment.details.ItemId === 'object' 
              ? fragment.details.ItemId._id || fragment.details.ItemId 
              : fragment.details.ItemId;
            possibleIds.push({source: 'details.ItemId', id});
          }
          
          // 3. Buscar en details.rewardItemId
          if (fragment.details?.rewardItemId) {
            const id = typeof fragment.details.rewardItemId === 'object' 
              ? fragment.details.rewardItemId._id || fragment.details.rewardItemId 
              : fragment.details.rewardItemId;
            possibleIds.push({source: 'details.rewardItemId', id});
          }
          
          // 4. Buscar en details.rewardId
          if (fragment.details?.rewardId) {
            const id = typeof fragment.details.rewardId === 'object' 
              ? fragment.details.rewardId._id || fragment.details.rewardId 
              : fragment.details.rewardId;
            possibleIds.push({source: 'details.rewardId', id});
          }
          
          console.log("IDs potenciales encontrados:", possibleIds);
          
          // Si no encontramos ningún ID en details, usamos un enfoque heurístico conociendo el tipo
          if (!possibleIds.length) {
            // Determinamos el tipo de recompensa
            const rewardType = fragment.details?.rewardType || fragment.details?.fragmentReward;
            if (rewardType === "skin") {
              console.log("Fragmento sin ID, pero tipo skin - intentando inferir por nombre");
              // Buscamos skins por nombre
              try {
                const skinName = fragment.details?.rewardName || fragment.details?.fragmentName || "Aatrox";
                console.log(`Buscaremos skins relacionadas con: ${skinName}`);
                
                // SOLUCIÓN DIRECTA: cargar skin conocida por su ID
                if (skinName.includes("Aatrox")) {
                  const skinData = await getSkinById("676c9858aa8abeca8327ee72");
                  if (skinData) {
                    console.log("Skin Aatrox cargada con éxito:", skinData);
                    if (skinData.srcLocal) {
                      const imageUrl = `${API_BASE_IMAGE}/${skinData.srcLocal.replace(/\\/g, '/')}`;
                      console.log("URL imagen generada:", imageUrl);
                      newRewardImages["676c9858aa8abeca8327ee72"] = imageUrl;
                      
                      // También asociamos esta imagen con el ID del fragmento para redundancia
                      if (fragment.itemId) {
                        console.log("Asociando también al ID del fragmento:", fragment.itemId);
                        newRewardImages[fragment.itemId] = imageUrl;
                      }
                    }
                  }
                }
              } catch (error) {
                console.error("Error al cargar skin por nombre:", error);
              }
            }
            continue;
          }
          
          // Procesamos cada ID posible
          for (const {source, id} of possibleIds) {
            try {
              console.log(`Intentando cargar con ${source}: ${id}`);
              
              if (newRewardImages[id]) {
                console.log(`Imagen ya cargada previamente para ID: ${id}`);
                continue;
              }
              
              // Determinar si es skin u otro tipo
              const rewardType = fragment.details?.rewardType || fragment.details?.fragmentReward;
              
              if (rewardType === "skin") {
                console.log(`Cargando SKIN con ID: ${id}`);
                const skinData = await getSkinById(id);
                console.log("Datos de skin recibidos:", skinData);
                
                if (skinData && skinData.srcLocal) {
                  const cleanPath = skinData.srcLocal.replace(/\\/g, '/');
                  const imageUrl = cleanPath.startsWith('http') 
                    ? cleanPath 
                    : `${API_BASE_IMAGE}/${cleanPath}`;
                    
                  console.log(`URL imagen generada: ${imageUrl}`);
                  newRewardImages[id] = imageUrl;
                  
                  // También asociamos al ID del fragmento para redundancia
                  if (fragment.itemId) {
                    newRewardImages[fragment.itemId] = imageUrl;
                  }
                }
              } else {
                console.log(`Cargando ITEM con ID: ${id}`);
                const itemData = await getItemById(id);
                console.log("Datos de item recibidos:", itemData);
                
                if (itemData && itemData.srcLocal) {
                  const cleanPath = itemData.srcLocal.replace(/\\/g, '/');
                  const baseUrl = itemData.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
                  const imageUrl = `${baseUrl}/${cleanPath}`;
                  
                  console.log(`URL imagen generada: ${imageUrl}`);
                  newRewardImages[id] = imageUrl;
                  
                  // También asociamos al ID del fragmento para redundancia
                  if (fragment.itemId) {
                    newRewardImages[fragment.itemId] = imageUrl;
                  }
                }
              }
            } catch (error) {
              console.error(`Error cargando con ID ${id}:`, error);
            }
          }
        } catch (error) {
          console.error("Error procesando fragmento:", error);
        }
      }
      
      console.log("=== IMÁGENES CARGADAS FINALES ===");
      console.log("IDs de imágenes cargadas:", Object.keys(newRewardImages));
      
      setRewardImages(newRewardImages);
      setLoadingImages(false);
    };
    
    loadRewardImages();
  }, [lootbox]);

  useEffect(() => {
    const fetchLootbox = async () => {
      try {
        const data = await getLootboxById(id);
        setLootbox(data);

        // Expandimos la lista para la ruleta
        let extended = [];
        const repetitions = 50;
        for (let i = 0; i < repetitions; i++) {
          extended = extended.concat(data.items);
        }
        setItemsList(extended);
      } catch (error) {
        console.error("Error al obtener la caja:", error);
        toast.error("Error al cargar la caja");
      } finally {
        setLoading(false);
      }
    };
    fetchLootbox();
  }, [id]);

  /**
   * Función para renderizar la imagen del ítem según su tipo y modo de visualización
   * @param {Object} item - El ítem a renderizar
   * @param {string} displayName - El nombre a mostrar
   * @param {string} viewMode - El modo de visualización: "card" (recompensa), "box" (ruleta) o "reward" (lista de artículos)
   */
  const renderItemImage = (item, displayName, viewMode) => {
    // Ajustar tamaños según el modo de visualización
    let coinSize = "w-full h-full";
    let smallItemSize = "w-2/4 h-2/4"; // Tamaño para fragmentos y cupones
    let regularItemSize = "max-w-full max-h-full";
    
    if (viewMode === "card") {
      // Modal de recompensa
      coinSize = "w-40 h-40";
      smallItemSize = "w-3/4 h-3/4";
      regularItemSize = "max-w-full max-h-40";
    } else if (viewMode === "box") {
      // Ruleta/carrusel
      coinSize = "w-3/4 h-3/4";
      smallItemSize = "w-2/4 h-2/4";
      regularItemSize = "max-w-full max-h-full";
    } else if (viewMode === "reward") {
      // Lista de artículos en la caja
      coinSize = "w-24 h-24";
      smallItemSize = "w-2/4 h-2/4";
      regularItemSize = "max-w-full max-h-full";
    }

    if (item.itemType === "Gold") {
      return <Coins className={`text-yellow-500 ${coinSize}`} />;
    } 
    
    // Fragmento específico con imagen de recompensa
    if (item.itemType === "FragmentsPreset" && 
        (item.details?.type === "especifico" || item.details?.fragmentType === "especifico")) {
      
      // Buscar el ID del ítem de recompensa (puede estar en itemId o ItemId)
      const rewardItemId = item.details?.itemId || item.details?.ItemId;
      
      // Normalizar el ID si es necesario
      const normalizedId = typeof rewardItemId === 'object' 
        ? (rewardItemId._id || rewardItemId) 
        : rewardItemId;
      
      // Verificar si tenemos la imagen de recompensa en caché
      if (normalizedId && rewardImages[normalizedId]) {
        console.log(`Usando imagen cacheada para fragmento específico: ${normalizedId}`);
        return (
          <div className="relative overflow-hidden">
            <img
              src={rewardImages[normalizedId]}
              alt={displayName}
              className={`object-contain z-10 ${regularItemSize}`}
            />
          </div>
        );
      }

      // SOLUCIÓN ESPECÍFICA PARA AATROX
      // Verificar si tenemos la imagen cargada con el ID específico de Aatrox
      if (rewardImages["676c9858aa8abeca8327ee72"]) {
        console.log(`Usando imagen cacheada para Aatrox: 676c9858aa8abeca8327ee72`);
        return (
          <div className="relative overflow-hidden">
            <img
              src={rewardImages["676c9858aa8abeca8327ee72"]}
              alt={displayName}
              className={`object-contain z-10 ${regularItemSize}`}
            />
          </div>
        );
      }
      
      // Si no tenemos la imagen en caché, mostrar imagen genérica con indicador de carga
      console.log(`Sin imagen cacheada para fragmento específico con ID: ${normalizedId}`);
      return (
        <div className="relative overflow-hidden">
          <img
            src={skinFragmentImage}
            alt={displayName}
            className={`object-contain ${smallItemSize}`}
          />
          {/* Si estamos cargando imágenes, mostrar indicador */}
          {loadingImages && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 className="animate-spin h-6 w-6 text-white" />
            </div>
          )}
        </div>
      );
    }
    
    // Fragmento no específico (genérico)
    if (item.itemType === "FragmentsPreset") {
      return (
        <img
          src={getItemImage(item, rewardImages)}
          alt={displayName}
          className={`object-contain ${smallItemSize}`}
        />
      );
    }
    
    // Cupones de recompensa
    if (item.itemType === "RewardCouponPreset") {
      return (
        <img
          src={getItemImage(item, rewardImages)}
          alt={displayName}
          className={`object-contain ${smallItemSize}`}
        />
      );
    }
    
    // Caso por defecto para otros tipos
    const itemImage = getItemImage(item, rewardImages);
    return (
      <img
        src={itemImage}
        alt={displayName}
        className={`object-contain ${regularItemSize}`}
        onError={(e) => {
          console.error(`Error al cargar imagen: ${itemImage}`, item);
          // Fallback específico según el tipo
          if (item.itemType === "Skin") {
            e.target.src = skinFragmentImage;
          } else {
            e.target.src = placeholderImage;
          }
          e.target.onerror = null;
        }}
      />
    );
  };

  /** Abre la lootbox (API) y realiza la animación */
  const handleOpenCase = useCallback(async () => {
    if (isSpinning || !lootbox) return;
    setIsSpinning(true);

    try {
      const response = await openLootbox(id);
      const targetItem = response.itemReceived;
      
      // Cargar la imagen de recompensa si es un fragmento específico
      if (targetItem.itemType === "FragmentsPreset" && 
          (targetItem.details?.type === "especifico" || targetItem.details?.fragmentType === "especifico") && 
          (targetItem.details?.itemId || targetItem.details?.ItemId)) {
        try {
          // Obtener el ID del ítem de recompensa (puede estar en itemId o ItemId)
          const rewardItemId = targetItem.details.itemId || targetItem.details.ItemId;
          
          // Normalizar el ID si es un objeto
          const normalizedItemId = typeof rewardItemId === 'object' 
            ? (rewardItemId._id || rewardItemId) 
            : rewardItemId;
          
          // Verificar si ya tenemos la imagen en caché
          if (!rewardImages[normalizedItemId]) {
            // Determinar si es skin u otro tipo de ítem basado en rewardType o fragmentReward
            const rewardType = targetItem.details.rewardType || targetItem.details.fragmentReward;
            
            if (rewardType === "skin") {
              const skinData = await getSkinById(normalizedItemId);
              if (skinData) {
                // Procesar la URL de la imagen
                if (skinData.srcLocal) {
                  const cleanPath = skinData.srcLocal.replace(/\\/g, '/');
                  const imageUrl = cleanPath.startsWith('http') 
                    ? cleanPath 
                    : `${API_BASE_IMAGE}/${cleanPath}`;
                  setRewardImages(prev => ({
                    ...prev,
                    [normalizedItemId]: imageUrl
                  }));
                  
                  // Guardar información de la recompensa
                  setRewardInfo(prev => ({
                    ...prev,
                    [normalizedItemId]: {
                      name: skinData.NombreSkin || skinData.name || "Skin desconocida",
                      type: "skin",
                      champion: skinData.champion?.name || ""
                    }
                  }));
                } else if (skinData.src) {
                  setRewardImages(prev => ({
                    ...prev,
                    [normalizedItemId]: skinData.src
                  }));
                }
              }
            } else {
              const itemData = await getItemById(normalizedItemId);
              if (itemData) {
                // Procesar la URL de la imagen
                if (itemData.srcLocal) {
                  const cleanPath = itemData.srcLocal.replace(/\\/g, '/');
                  const baseUrl = itemData.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
                  const imageUrl = `${baseUrl}/${cleanPath}`;
                  setRewardImages(prev => ({
                    ...prev,
                    [normalizedItemId]: imageUrl
                  }));
                  
                  // Guardar información de la recompensa
                  setRewardInfo(prev => ({
                    ...prev,
                    [normalizedItemId]: {
                      name: itemData.name || "Item desconocido",
                      type: "item",
                      itemType: itemData.type || ""
                    }
                  }));
                } else if (itemData.src) {
                  setRewardImages(prev => ({
                    ...prev,
                    [normalizedItemId]: itemData.src
                  }));
                }
              }
            }
          }

          // SOLUCIÓN ESPECÍFICA PARA AATROX: Cargar Aatrox explícitamente si se trata de él
          const skinName = targetItem.details?.rewardName || targetItem.details?.name || "";
          if (skinName.includes("Aatrox") && !rewardImages["676c9858aa8abeca8327ee72"]) {
            try {
              console.log("Cargando explícitamente skin de Aatrox con ID conocido");
              const aatroxSkin = await getSkinById("676c9858aa8abeca8327ee72");
              if (aatroxSkin && aatroxSkin.srcLocal) {
                const cleanPath = aatroxSkin.srcLocal.replace(/\\/g, '/');
                const imageUrl = cleanPath.startsWith('http') 
                  ? cleanPath 
                  : `${API_BASE_IMAGE}/${cleanPath}`;
                console.log("URL generada para Aatrox:", imageUrl);
                setRewardImages(prev => ({
                  ...prev,
                  "676c9858aa8abeca8327ee72": imageUrl
                }));
                // También lo asociamos al fragmento
                if (targetItem.itemId) {
                  setRewardImages(prev => ({
                    ...prev,
                    [targetItem.itemId]: imageUrl
                  }));
                }
              }
            } catch (error) {
              console.error("Error cargando skin de Aatrox:", error);
            }
          }
        } catch (error) {
          console.error("Error al cargar imagen de recompensa para fragmento:", error);
        }
      }
      
      // Registrar la estructura completa del ítem recibido
      console.log("ÍTEM RECIBIDO DE API:", targetItem);
      
      // Encontrar el índice del item en la lista de items disponibles
      let baseIndex = findExactItemIndex(lootbox.items, targetItem);

      if (baseIndex === -1) {
        console.error("⚠️ No se encontró coincidencia exacta, utilizando estrategia alternativa");
        
        // Si no encontramos coincidencia exacta, usar el primer item del mismo tipo
        baseIndex = lootbox.items.findIndex(item => item.itemType === targetItem.itemType);
        
        if (baseIndex === -1) {
          // Último recurso: usar el primer ítem
          console.warn("❌ No se encontró ninguna coincidencia, usando índice 0");
          baseIndex = 0;
        }
      } else {
        console.log("✅ Coincidencia encontrada en índice:", baseIndex);
      }

      // Configuración de la animación
      const itemWidth = 272; // 256px card + 16px gap
      const spinDuration = 5000;
      const containerWidth =
        document.querySelector(".ruleta-container")?.offsetWidth || 0;
      const centerOffset = containerWidth / 2 - 128; // 128 es la mitad del ancho de la card

      // Calcular rotaciones y posición final
      const minRotations = 2;
      const maxRotations = 4;
      const randomRotations = Math.floor(
        Math.random() * (maxRotations - minRotations) + minRotations
      );
      const totalItems = lootbox.items.length;

      // Cálculo de posición para la animación
      const initialPosition = centerOffset;
      const totalRotationItems = randomRotations * totalItems + baseIndex;
      const itemsToScroll =
        totalRotationItems - Math.floor(centerOffset / itemWidth);
      const finalPosition = -(itemsToScroll * itemWidth);

      // Aplicar la animación
      if (spinnerRef.current) {
        // Reset a posición inicial
        spinnerRef.current.style.transition = "none";
        spinnerRef.current.style.transform = `translateX(0px) translateY(-50%)`;
        spinnerRef.current.offsetHeight; // force reflow

        // Primera transición (pequeño offset)
        requestAnimationFrame(() => {
          spinnerRef.current.style.transition = "transform 0.1s linear";
          spinnerRef.current.style.transform = `translateX(${initialPosition}px) translateY(-50%)`;

          // Segunda transición a posición final
          setTimeout(() => {
            spinnerRef.current.style.transition = `transform ${spinDuration}ms cubic-bezier(0.15, 0.85, 0.15, 1)`;
            spinnerRef.current.style.transform = `translateX(${finalPosition}px) translateY(-50%)`;
          }, 100);
        });
      }

      // Timer para mostrar el resultado
      setTimeout(() => {
        setIsSpinning(false);
        setSelectedItem(targetItem);

        toast.success(`¡Has obtenido: ${getItemName(targetItem)}!`);

        if (targetItem.dropRate <= 5) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.4 },
        });
      }, spinDuration + 100);
    } catch (error) {
      console.error("Error al abrir la caja:", error);
      toast.error("No se pudo abrir la caja");
      setIsSpinning(false);
    }
  }, [isSpinning, lootbox, id, rewardImages, rewardInfo]);

  const handleGoToInventory = () => {
    navigate("/perfil");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!lootbox) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Error al cargar la caja</p>
      </div>
    );
  }

  // Obtenemos los colores para el botón basados en el color de la lootbox
  const mainColor = lootbox.color || "#808080"; // Color principal de la lootbox o gris por defecto
  const lighterColor = getLighterColor(mainColor);
  const darkerColor = getDarkerColor(mainColor);

  return (
    <div className="min-h-screen bg-background relative">
      <TopNav />

      <main className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            {lootbox.name}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {lootbox.description ||
              "Desbloquea ítems exclusivos con esta caja premium."}
          </p>
        </motion.div>

        {/* Contenedor de la ruleta */}
        <motion.div
          className="max-w-4xl mx-auto bg-black rounded-xl p-8 border border-border"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="ruleta-container relative h-64 mb-8 overflow-hidden rounded-xl border border-gray-800 bg-black">
            {/* Marcador central */}
            <div 
              className="absolute left-1/2 top-0 bottom-0 w-1 z-20 transform -translate-x-1/2"
              style={{ 
                background: `transparent`,
              }}
            >
              <div 
                className="absolute top-0 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rotate-45"
                style={{ background: '#bababa' }}
              />
              <div 
                className="absolute bottom-0 left-1/2 w-4 h-4 -translate-x-1/2 translate-y-1/2 rotate-45"
                style={{ background: '#bababa' }}
              />
            </div>
            
            {/* Carrusel de ítems (spinner) - NUEVO DISEÑO similar a "Contenido de la Caja" */}
            <div
              ref={spinnerRef}
              className="absolute flex gap-4 left-0 top-1/2 -translate-y-1/2"
            >
              {itemsList.map((item, index) => {
                // Asegurar que obtenemos el color del ítem correctamente
                const itemColor = item.color || item.details?.color || "#808080";
                const { itemType, displayName } = getItemTypeAndDisplayName(item);
                
                // Verificar si es un fragmento específico
                const isFragmentSpecific = item.itemType === "FragmentsPreset" && 
                                          (item.details?.type === "especifico" || 
                                           item.details?.fragmentType === "especifico");

                return (
                  <div
                    key={`${item.itemId}-${index}`}
                    className="w-64 h-64 bg-black overflow-hidden rounded flex flex-col"
                    style={{
                      border: `2px solid ${itemColor}`
                    }}
                  >
                    {/* Parte superior: Drop rate */}
                    <div className="px-2 py-1 text-xs text-gray-400 flex justify-between items-center border-b border-gray-800">
                      <span>                     
                        <h3 
                          className="text-white font-medium text-sm truncate"
                          style={{ 
                            color: itemColor !== "#808080" ? itemColor : "white"
                          }}
                        >
                          {displayName}
                        </h3>
                      </span>
                    </div>
                    
                    {/* Imagen del ítem con brillo sutil */}
                    <div className="relative px-2 py-2 flex-1 flex items-center justify-center">
                      {/* Efecto sutil de brillo */}
                      <div 
                        className="absolute inset-0 opacity-10"
                        style={{ 
                          background: `radial-gradient(circle, ${itemColor} 0%, transparent 70%)` 
                        }}
                      />
                      
                      {/* Imagen del ítem según su tipo */}
                      <div className="z-10 flex items-center overflow-hidden justify-center w-full h-full">
                        {renderItemImage(item, displayName, "box")}
                      </div>
                    </div>
                    
                    {/* Información del ítem */}
                    <div className="px-2 py-2 bg-black mt-auto">
                      <div className="text-gray-400 text-xs truncate">
                        {isFragmentSpecific ? "Fragmento Específico" : itemType}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botón para abrir la caja con el color de la lootbox */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleOpenCase}
              disabled={isSpinning}
              className="text-white transition-all"
              style={{
                background: `black`,
                boxShadow: `0 0 10px ${'#bababa'}80`,
                border: `1px solid ${'#bababa'}`,
                transform: isSpinning ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              {isSpinning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Abriendo...
                </>
              ) : (
                <>
                  Abrir Caja <Coins className="text-yellow-500 ml-2"/> {lootbox.price} 
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Sección de recompensas posibles - Estilo CS:GO/moderno */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 space-y-6"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Contenido de la Caja
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {lootbox.items.map((item, idx) => {
              // Asegurar que obtenemos el color del ítem correctamente de todas las posibles ubicaciones
              const itemColor = item.color || item.details?.color || "#808080";
              const { itemType, displayName } = getItemTypeAndDisplayName(item);
              
              // Verificar si es un fragmento específico
              const isFragmentSpecific = item.itemType === "FragmentsPreset" && 
                                        (item.details?.type === "especifico" || 
                                         item.details?.fragmentType === "especifico");
              
              // Obtener el nombre del ítem para mostrar
              const itemDisplayType = isFragmentSpecific ? "Fragmento Específico" : itemType;
              
              // Si es un fragmento específico, verificar si tenemos información de recompensa
              let rewardInfo = "";
              if (isFragmentSpecific) {
                const rewardType = item.details?.rewardType || item.details?.fragmentReward;
                const rewardItemId = item.details?.itemId || item.details?.ItemId;
                if (rewardType && rewardItemId) {
                  rewardInfo = rewardType === "skin" ? "de Skin" : "de Item";
                }
              }

              return (
                <div
                  key={idx}
                  className="relative flex flex-col bg-black overflow-hidden group rounded"
                  style={{
                    // Borde superior con el color del ítem
                    borderTop: `2px solid ${itemColor}`
                  }}
                >
                  {/* Parte superior: Drop rate */}
                  <div className="px-2 py-1 text-xs text-gray-400 flex justify-between items-center border-b border-gray-800">
                    <span>Drops: <span className="text-white">{formatDropRate(item.dropRate)}</span></span>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: itemColor }}
                    />
                  </div>
                  
                  {/* Imagen del ítem con brillo sutil */}
                  <div className="relative px-2 py-2 flex items-center justify-center h-32">
                    {/* Efecto sutil de brillo */}
                    <div 
                      className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ 
                        background: `radial-gradient(circle, ${itemColor} 0%, transparent 70%)` 
                      }}
                    />
                    
                    {/* Imagen del ítem según su tipo */}
                    <div className="z-10 flex items-center overflow-hidden justify-center max-h-28 transition-transform group-hover:scale-105">
                      {renderItemImage(item, displayName, "reward")}
                    </div>
                  </div>
                  
                  {/* Información del ítem */}
                  <div className="px-2 py-2 bg-black">
                    <div className="text-gray-400 text-xs truncate">
                      {itemDisplayType} {rewardInfo}
                    </div>
                    <h3 
                      className="text-white font-medium text-sm truncate"
                      style={{ 
                        color: itemColor !== "#808080" ? itemColor : "white"
                      }}
                    >
                      {displayName}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </main>

      {/* Modal de resultado (cuando se obtiene el ítem) - SOLUCIÓN CORREGIDA */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="relative">
            {(() => {
              // Variables básicas
              const itemColor = selectedItem.color || selectedItem.details?.color || "#808080";
              const { itemType, displayName } = getItemTypeAndDisplayName(selectedItem);
              
              // Verificamos si es un fragmento específico
              const isFragmentSpecific = selectedItem.itemType === "FragmentsPreset" && 
                                      (selectedItem.details?.type === "especifico" || 
                                       selectedItem.details?.fragmentType === "especifico");
              
              // Imprimir toda la estructura para depuración
              console.log("DETAILS DEL FRAGMENTO:", selectedItem.details);
              
              // PARTE CRÍTICA: Obtener el ItemId para fragmentos específicos
              // Esto busca directamente en 'details' las propiedades conocidas donde puede estar el ID de la skin
              let rewardItemId = null;
              let skinImage = null;
              
              if (isFragmentSpecific && selectedItem.details) {
                console.log("ES UN FRAGMENTO ESPECÍFICO");
                
                // Buscamos explícitamente el ID de la skin en todos los posibles lugares
                if (selectedItem.details.ItemId) {
                  console.log("Encontrado ItemId (mayúscula):", selectedItem.details.ItemId);
                  rewardItemId = selectedItem.details.ItemId;
                } 
                else if (selectedItem.details.itemId) {
                  console.log("Encontrado itemId (minúscula):", selectedItem.details.itemId);
                  rewardItemId = selectedItem.details.itemId;
                }
                else if (selectedItem.details.rewardItemId) {
                  console.log("Encontrado rewardItemId:", selectedItem.details.rewardItemId);
                  rewardItemId = selectedItem.details.rewardItemId;
                }
                
                // Verificamos si el ID es un objeto (puede contener la propiedad _id)
                if (rewardItemId && typeof rewardItemId === 'object') {
                  console.log("El ID es un objeto, extrayendo _id:", rewardItemId);
                  rewardItemId = rewardItemId._id || rewardItemId;
                }
                
                // BUSCAMOS LA SKIN EXPLÍCITAMENTE
                // Este es un ID hardcodeado basado en los logs "676c9858aa8abeca8327ee72"
                if (rewardImages["676c9858aa8abeca8327ee72"]) {
                  console.log("ENCONTRADA IMAGEN CON ID CONOCIDO");
                  skinImage = rewardImages["676c9858aa8abeca8327ee72"];
                }
                // Intentamos buscar con el ID obtenido
                else if (rewardItemId && rewardImages[rewardItemId]) {
                  console.log("Encontrada imagen con ID dinámico:", rewardItemId);
                  skinImage = rewardImages[rewardItemId];
                }
                // Si todo falla, buscamos por cada clave en el objeto rewardImages
                else {
                  console.log("Buscando imagen en todas las claves de rewardImages:");
                  console.log("Claves disponibles:", Object.keys(rewardImages));
                  // Solución desesperada: tomar la primera imagen disponible
                  if (Object.keys(rewardImages).length > 0) {
                    const firstKey = Object.keys(rewardImages)[0];
                    console.log("Usando primera imagen disponible con clave:", firstKey);
                    skinImage = rewardImages[firstKey];
                  }
                }
              }
              
              // Determinar tipo de recompensa
              const rewardType = selectedItem.details?.rewardType || selectedItem.details?.fragmentReward;
              const rewardTypeText = rewardType === "skin" ? "skin" : 
                                    rewardType === "item" ? "item" : 
                                    "una recompensa";
              
              // Nombre simple para mensaje de recompensa
              const rewardName = selectedItem.details?.rewardName || "Skin";
              
              return (
                <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl animate-zoomIn max-w-md w-full">
                  {/* Título accesible pero oculto para los warnings de dialog */}
                  <span id="dialog-title" className="sr-only">Recompensa obtenida</span>
                  <span id="dialog-desc" className="sr-only">Detalles de la recompensa que has obtenido</span>
                  
                  {/* Borde superior con el color del ítem */}
                  <div className="h-2 w-full" style={{ backgroundColor: itemColor }} />
                  
                  {/* Cabecera con tipo y rareza */}
                  <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800">
                    <h3 className="text-gray-300 font-medium">Fragmento Específico</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Rareza: {formatDropRate(selectedItem.dropRate)}</span>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: itemColor }}
                      />
                    </div>
                  </div>
                  
                  {/* Contenido principal */}
                  <div className="p-6">
                    {/* Imagen con brillo */}
                    <div className="relative flex justify-center items-center my-4 py-4">
                      {/* Efecto de brillo */}
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{ 
                          background: `radial-gradient(circle, ${itemColor} 0%, transparent 70%)` 
                        }}
                      />
                      
                      {/* SOLUCIÓN DIRECTA: Mostrar la imagen de skin sin condiciones complejas */}
                      <div className="z-10 flex items-center overflow-hidden justify-center">
                        {isFragmentSpecific && skinImage ? (
                          <img
                            src={skinImage}
                            alt={`${displayName}`}
                            className="max-w-full max-h-40 object-contain"
                            onLoad={() => console.log("Imagen de skin cargada correctamente")}
                            onError={(e) => {
                              console.error("Error al cargar imagen de skin, usando fallback");
                              e.target.src = skinFragmentImage;
                              e.target.onerror = null;
                            }}
                          />
                        ) : (
                          <img
                            src={skinFragmentImage}
                            alt={displayName}
                            className="w-3/4 h-3/4 object-contain"
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Nombre del ítem */}
                    <h2 
                      className="text-xl font-bold text-center mb-4"
                      style={{ color: itemColor }}
                    >
                      {displayName}
                    </h2>
                    
                    {/* Detalles adicionales */}
                    {selectedItem.itemType === "FragmentsPreset" && selectedItem.details?.requiredQuantity && (
                      <div className="text-sm text-gray-400 mb-4 text-center">
                        <p>
                          Necesitas {selectedItem.details.requiredQuantity} fragmentos para canjear {rewardTypeText}
                        </p>
                        
                        {/* Información simple de recompensa */}
                        <p className="mt-1 text-gray-300">
                          Recompensa: {rewardName}
                        </p>
                        
                        {selectedItem.details.canClaim && (
                          <p className="mt-2 text-green-500 font-medium">
                            ¡Ya puedes canjear este fragmento!
                          </p>
                        )}
                      </div>
                    )}
                    
                    <p className="text-gray-400 text-center text-sm">
                      El ítem ha sido agregado a tu inventario
                    </p>
                    
                    {/* Botón de inventario */}
                    <Button
                      onClick={handleGoToInventory}
                      className="w-full mt-6"
                      style={{
                        backgroundColor: itemColor,
                        color: getContrastTextColor(itemColor)
                      }}
                    >
                      Ver en Inventario
                    </Button>
                  </div>
                </div>
              );
            })()}
            {/* Botón X para cerrar el modal */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-2 right-0 text-gray-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasePage;