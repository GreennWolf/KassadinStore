import { useState, useEffect, useMemo } from "react";
import { getActiveItems, claimRewardCoupon, getUserRewardCoupons, claimFragmentReward } from "@/services/inventoryService";
import { getItemById } from "@/services/itemService";
import { getSkinById } from "@/services/champsService"; // Importamos getSkinById para fragmentos específicos
import { createRedeem } from "@/services/rewardRedeemService";
import { toast } from "sonner";
import { Loader2, ClipboardCheck, CheckCircle2, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import cuponImage from "../assets/Cupones.png";
import skinFragmentImage from "../assets/Skin.png";
import placeholderImage from "../assets/Skin.png";
import RedeemModal from "./RedeemModal";
import RewardRevealModal from "./RewardRevealModal";

// Constantes para URLs base
const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_ITEMS = `${API_BASE_URL}/items`;
const API_BASE_CHROMAS = `${API_BASE_URL}/api/chromas`;
const API_BASE_IMAGE = `${API_BASE_URL}/images`;

// Caché de items y skins para optimizar rendimiento
const itemsCache = new Map();
const skinsCache = new Map();

// Función mejorada para obtener URL de imágenes
const getImageUrl = (item) => {
  if (!item) return placeholderImage;

  // Para cupones, usamos la imagen por defecto o la proporcionada
  if (item.itemType === "RewardCouponPreset") {
    return item.details?.image || cuponImage;
  }
  
  // Para fragmentos, comprobar si es un fragmento específico
  if (item.itemType === "FragmentsUser" || item.itemType === "FragmentsPreset") {
    // Si es un fragmento específico, intentamos obtener la imagen del item/skin asociado
    if (item.details?.fragmentType === "especifico" && item.details?.ItemId) {
      const itemId = typeof item.details.ItemId === 'object' ? item.details.ItemId._id || item.details.ItemId : item.details.ItemId;
      const isFragmentForSkin = item.details.fragmentReward === "skin";
      
      // Si es un fragmento para una skin
      if (isFragmentForSkin) {
        // Intentar obtener de la caché de skins
        if (skinsCache.has(itemId)) {
          const cachedSkin = skinsCache.get(itemId);
          if (cachedSkin.srcLocal) {
            const cleanPath = cachedSkin.srcLocal.replace(/\\/g, '/');
            return cleanPath.startsWith('http') ? cleanPath : `${API_BASE_IMAGE}/${cleanPath}`;
          }
        }
      } 
      // Si es un fragmento para un item
      else {
        // Intentar obtener de la caché de items
        if (itemsCache.has(itemId)) {
          const cachedItem = itemsCache.get(itemId);
          if (cachedItem.srcLocal) {
            const cleanPath = cachedItem.srcLocal.replace(/\\/g, '/');
            const baseUrl = cachedItem.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
            return `${baseUrl}/${cleanPath}`;
          }
        }
      }
    }
    
    // Si no hay imagen específica, usar la imagen predeterminada
    return item.details?.image || skinFragmentImage;
  }
  
  // Para skins, comprobamos varias posibles ubicaciones
  if (item.itemType === "Skin") {
    // Primero, intentamos con details.srcLocal o details.image
    if (item.details?.srcLocal) {
      const cleanPath = item.details.srcLocal.replace(/\\/g, '/');
      return cleanPath.startsWith('http') ? cleanPath : `${API_BASE_IMAGE}/${cleanPath}`;
    }
    
    if (item.details?.image) {
      return item.details.image;
    }
    
    // Luego comprobamos itemId
    const itemData = item.itemId;
    if (itemData && typeof itemData === 'object') {
      if (itemData.srcLocal) {
        const cleanPath = itemData.srcLocal.replace(/\\/g, '/');
        return cleanPath.startsWith('http') ? cleanPath : `${API_BASE_IMAGE}/${cleanPath}`;
      }
      
      // Por último, intentamos con src
      if (itemData.src) {
        return itemData.src;
      }
    }
  }
  
  // Para Item u otros tipos
  if (item.itemType === "Item") {
    // Primero intentamos con details
    if (item.details) {
      // Si tenemos srcLocal en details
      if (item.details.srcLocal) {
        const cleanPath = item.details.srcLocal.replace(/\\/g, '/');
        if (cleanPath.startsWith('http')) return cleanPath;
        
        // Usar la URL base según el tipo de item
        const baseUrl = item.details.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
        return `${baseUrl}/${cleanPath}`;
      }
      
      // Si tenemos image en details
      if (item.details.image) {
        return item.details.image;
      }
      
      // Si tenemos src en details
      if (item.details.src) {
        return item.details.src;
      }
    }
    
    // Luego intentamos con itemId
    if (item.itemId) {
      // Si itemId es un objeto
      if (typeof item.itemId === 'object') {
        // Si tiene srcLocal
        if (item.itemId.srcLocal) {
          const cleanPath = item.itemId.srcLocal.replace(/\\/g, '/');
          if (cleanPath.startsWith('http')) return cleanPath;
          
          // Usar la URL base según el tipo de item
          const baseUrl = item.itemId.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
          return `${baseUrl}/${cleanPath}`;
        }
        
        // Si tiene src
        if (item.itemId.src) {
          return item.itemId.src;
        }
      }
      
      // Si itemId es solo un string (un ID) pero tenemos el objeto cacheado
      if (typeof item.itemId === 'string' && itemsCache.has(item.itemId)) {
        const cachedItem = itemsCache.get(item.itemId);
        
        if (cachedItem.srcLocal) {
          const cleanPath = cachedItem.srcLocal.replace(/\\/g, '/');
          if (cleanPath.startsWith('http')) return cleanPath;
          
          // Usar la URL base según el tipo de item
          const baseUrl = cachedItem.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
          return `${baseUrl}/${cleanPath}`;
        }
        
        // Si tiene src
        if (cachedItem.src) {
          return cachedItem.src;
        }
      }
    }
  }
  
  // Si llegamos hasta aquí y no hemos encontrado una imagen, devolver placeholder
  return placeholderImage;
};

// Función mejorada para obtener el nombre del item
const getItemName = (item) => {
  if (!item) return "Sin nombre";
  
  // Primero intentamos con details
  if (item.details) {
    if (item.details.name) return item.details.name;
    if (item.details.fragmentName) return item.details.fragmentName;
    if (item.details.NombreSkin) return item.details.NombreSkin;
  }
  
  // Caso especial para fragmentos específicos
  if (item.itemType === "FragmentsUser" && item.details?.fragmentType === "especifico" && item.details?.ItemId) {
    const itemId = typeof item.details.ItemId === 'object' ? item.details.ItemId._id || item.details.ItemId : item.details.ItemId;
    const isFragmentForSkin = item.details.fragmentReward === "skin";
    
    // Si es un fragmento para una skin
    if (isFragmentForSkin && skinsCache.has(itemId)) {
      const cachedSkin = skinsCache.get(itemId);
      return `Fragmento: ${cachedSkin.NombreSkin || cachedSkin.name || item.details.fragmentName || "Skin"}`;
    }
    // Si es un fragmento para un item
    else if (!isFragmentForSkin && itemsCache.has(itemId)) {
      const cachedItem = itemsCache.get(itemId);
      return `Fragmento: ${cachedItem.name || item.details.fragmentName || "Item"}`;
    }
  }
  
  // Luego intentamos con itemId
  if (item.itemId && typeof item.itemId === 'object') {
    if (item.itemId.name) return item.itemId.name;
    if (item.itemId.NombreSkin) return item.itemId.NombreSkin;
  }
  
  // Si itemId es un string (un ID) pero tenemos el objeto cacheado
  if (typeof item.itemId === 'string') {
    // Primero buscamos en la caché de items
    if (itemsCache.has(item.itemId)) {
      const cachedItem = itemsCache.get(item.itemId);
      if (cachedItem.name) return cachedItem.name;
    }
    // Luego en la caché de skins
    if (skinsCache.has(item.itemId)) {
      const cachedSkin = skinsCache.get(item.itemId);
      if (cachedSkin.NombreSkin) return cachedSkin.NombreSkin;
      if (cachedSkin.name) return cachedSkin.name;
    }
  }
  
  // Otras opciones específicas por tipo
  if (item.itemType === "FragmentsUser") {
    return item.details?.fragmentName || "Fragmento";
  }
  
  if (item.itemType === "Item") {
    // Intentamos mostrar al menos el ID parcial como referencia
    if (typeof item.itemId === 'string') {
      return `Item #${item.itemId.substring(0, 8)}...`;
    }
  }
  
  // Si no encontramos nada, usar un fallback
  return item.name || "Sin nombre";
};

export const InventoryDisplay = ({onRedeemUpdate}) => {
  const [items, setItems] = useState([]);
  const [claimedCouponsMap, setClaimedCouponsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [rewardItem, setRewardItem] = useState(null);
  const [loadingItemDetails, setLoadingItemDetails] = useState(false);
  const userId = JSON.parse(localStorage.getItem('user'))?._id;

  // Agrupar fragmentos por ID y calcular cantidades totales
  const fragmentsGrouped = useMemo(() => {
    const fragments = {};
    
    // Primero filtramos solo los fragmentos
    const fragmentItems = items.filter(item => item.itemType === "FragmentsUser");
    
    // Agrupamos por fragmentId
    fragmentItems.forEach(item => {
      // Identificar el fragmentId de diferentes posibles ubicaciones
      let fragmentId = null;
      
      // 1. Intentar obtener de details.fragmentId
      if (item.details?.fragmentId) {
        fragmentId = item.details.fragmentId;
      } 
      // 2. Intentar obtener de itemId si es un objeto
      else if (item.itemId && typeof item.itemId === 'object') {
        if (item.itemId.fragmentId) {
          fragmentId = typeof item.itemId.fragmentId === 'object' ? 
                      item.itemId.fragmentId._id : 
                      item.itemId.fragmentId;
        } else {
          // 3. Si itemId existe pero no tiene fragmentId, usar el propio itemId
          fragmentId = item.itemId._id;
        }
      } 
      // 4. Si itemId es directamente un string (id)
      else if (item.itemId && typeof item.itemId === 'string') {
        fragmentId = item.itemId;
      }
      
      if (!fragmentId) {
        console.warn("No se pudo identificar el fragmentId para:", item);
        return;
      }
      
      if (!fragments[fragmentId]) {
        fragments[fragmentId] = {
          items: [],
          totalQuantity: 0,
          requiredQuantity: item.details?.requiredQuantity || 
                           (item.itemId && typeof item.itemId === 'object' ? 
                             item.itemId.requiredQuantity || 1 : 1),
          name: item.details?.fragmentName || 
                (item.itemId && typeof item.itemId === 'object' ? 
                  item.itemId.name || "Fragmento" : "Fragmento"),
          fragmentId: fragmentId // Guardamos explícitamente el fragmentId para facilitar acceso
        };
      }
      
      // Determinar la cantidad del fragmento
      const quantity = item.quantity || 1;
      fragments[fragmentId].items.push(item);
      fragments[fragmentId].totalQuantity += quantity;
    });
    
    return fragments;
  }, [items]);

  useEffect(() => {
    fetchInventory();
    fetchClaimedCoupons();
  }, []);

  // Función para cargar detalles de items y skins para fragmentos específicos
  const loadItemDetails = async (itemsToLoad) => {
    try {
      setLoadingItemDetails(true);
      
      // Array para todas las promesas
      const allPromises = [];
      
      // 1. Procesar items normales que necesitan cargar datos
      const itemPromises = itemsToLoad
        .filter(item => 
          item.itemType === "Item" && 
          typeof item.itemId === 'string' && 
          !itemsCache.has(item.itemId)
        )
        .map(async (item) => {
          try {
            const itemData = await getItemById(item.itemId);
            if (itemData) {
              itemsCache.set(item.itemId, itemData);
              console.log(`Item ${item.itemId} cargado y cacheado:`, itemData);
            }
          } catch (error) {
            console.error(`Error al cargar detalles del item ${item.itemId}:`, error);
          }
        });
      
      allPromises.push(...itemPromises);
      
      // 2. Procesar fragmentos específicos para skins
      const skinFragments = itemsToLoad
        .filter(item => 
          item.itemType === "FragmentsUser" && 
          item.details?.fragmentType === "especifico" &&
          item.details?.ItemId &&
          item.details?.fragmentReward === "skin"
        )
        .map(item => {
          const itemId = typeof item.details.ItemId === 'object' 
            ? item.details.ItemId._id || item.details.ItemId 
            : item.details.ItemId;
          return { fragmentItem: item, itemId };
        })
        .filter(({ itemId }) => !skinsCache.has(itemId));
      
      if (skinFragments.length > 0) {
        console.log(`Cargando ${skinFragments.length} skins para fragmentos específicos`);
        
        const skinPromises = skinFragments.map(async ({ itemId }) => {
          try {
            const skinData = await getSkinById(itemId);
            if (skinData) {
              skinsCache.set(itemId, skinData);
              console.log(`Skin ${itemId} cargada y cacheada para fragmento:`, skinData);
            }
          } catch (error) {
            console.error(`Error al cargar skin para fragmento:`, error);
          }
        });
        
        allPromises.push(...skinPromises);
      }
      
      // 3. Procesar fragmentos específicos para items
      const itemFragments = itemsToLoad
        .filter(item => 
          item.itemType === "FragmentsUser" && 
          item.details?.fragmentType === "especifico" &&
          item.details?.ItemId &&
          item.details?.fragmentReward === "item"
        )
        .map(item => {
          const itemId = typeof item.details.ItemId === 'object' 
            ? item.details.ItemId._id || item.details.ItemId 
            : item.details.ItemId;
          return { fragmentItem: item, itemId };
        })
        .filter(({ itemId }) => !itemsCache.has(itemId));
      
      if (itemFragments.length > 0) {
        console.log(`Cargando ${itemFragments.length} items para fragmentos específicos`);
        
        const itemFragmentPromises = itemFragments.map(async ({ itemId }) => {
          try {
            const itemData = await getItemById(itemId);
            if (itemData) {
              itemsCache.set(itemId, itemData);
              console.log(`Item ${itemId} cargado y cacheado para fragmento:`, itemData);
            }
          } catch (error) {
            console.error(`Error al cargar item para fragmento:`, error);
          }
        });
        
        allPromises.push(...itemFragmentPromises);
      }
      
      // Esperar a que todas las promesas se resuelvan
      await Promise.all(allPromises);
      
      // Forzar re-render para mostrar los datos actualizados
      setItems(prevItems => [...prevItems]);
    } catch (error) {
      console.error("Error al cargar detalles de items y fragmentos:", error);
    } finally {
      setLoadingItemDetails(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await getActiveItems(userId);
      console.log("Items cargados:", response.items);
      
      // Actualizar state inmediatamente con los datos disponibles
      setItems(response.items);
      
      // Identificar items que necesitan cargar datos adicionales
      const itemsNeedingDetails = response.items.filter(item => 
        // Items normales
        (item.itemType === "Item" && 
         typeof item.itemId === 'string' && 
         !itemsCache.has(item.itemId)) ||
        // Fragmentos específicos para skins
        (item.itemType === "FragmentsUser" && 
         item.details?.fragmentType === "especifico" &&
         item.details?.ItemId &&
         item.details?.fragmentReward === "skin" &&
         !skinsCache.has(typeof item.details.ItemId === 'object' 
                         ? item.details.ItemId._id || item.details.ItemId 
                         : item.details.ItemId)) ||
        // Fragmentos específicos para items
        (item.itemType === "FragmentsUser" && 
         item.details?.fragmentType === "especifico" &&
         item.details?.ItemId &&
         item.details?.fragmentReward === "item" &&
         !itemsCache.has(typeof item.details.ItemId === 'object' 
                        ? item.details.ItemId._id || item.details.ItemId 
                        : item.details.ItemId))
      );
      
      // Cargar detalles de items y fragmentos que lo necesitan
      if (itemsNeedingDetails.length > 0) {
        console.log(`Cargando detalles para ${itemsNeedingDetails.length} items y fragmentos...`);
        loadItemDetails(itemsNeedingDetails);
      }
    } catch (error) {
      console.error("Error al cargar el inventario:", error);
      toast.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimedCoupons = async () => {
    try {
      const response = await getUserRewardCoupons(userId);
      const map = response.reduce((acc, coupon) => {
        if (coupon.entryId) {
          acc[coupon.entryId] = coupon;
        }
        return acc;
      }, {});
      setClaimedCouponsMap(map);
    } catch (error) {
      console.error("Error al obtener cupones reclamados:", error);
      toast.error("Error al obtener cupones reclamados");
    }
  };

  const handleClaimCoupon = async (presetId, entryId) => {
    try {
      toast.loading("Canjeando cupón...");
      const response = await claimRewardCoupon({ userId, presetId, entryId });
      const newCoupon = response.coupon;
      toast.dismiss();
      toast.success("Cupón canjeado correctamente", {
        description: `Código: ${newCoupon.code}`,
      });
      setClaimedCouponsMap((prev) => ({
        ...prev,
        [entryId]: newCoupon,
      }));
      fetchInventory();
    } catch (error) {
      toast.dismiss();
      console.error("Error al reclamar el cupón:", error);
      toast.error(error.response?.data?.message || "Error al reclamar el cupón");
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado al portapapeles");
  };

  // Función para manejar el cierre del modal de recompensa
  const handleRewardModalClose = () => {
    // Cerrar el modal
    setRewardModalOpen(false);
    
    // Esperar un poco antes de limpiar el item para que la animación de cierre se complete
    setTimeout(() => {
      setRewardItem(null);
    }, 300);
  };

  // Función para manejar directamente el canje de fragmentos
  const handleDirectFragmentClaim = async (fragmentItem) => {
    try {
      // Mostrar toast de carga
      const loadingToast = toast.loading("Canjeando fragmentos...");
      
      // Obtener el fragmentPresetId para enviar al backend
      let fragmentPresetId = null;
      
      if (fragmentItem.details?.fragmentId) {
        fragmentPresetId = fragmentItem.details.fragmentId;
      } else if (fragmentItem.itemId) {
        if (typeof fragmentItem.itemId === 'object' && fragmentItem.itemId.fragmentId) {
          fragmentPresetId = typeof fragmentItem.itemId.fragmentId === 'object' ? 
                          fragmentItem.itemId.fragmentId._id : 
                          fragmentItem.itemId.fragmentId;
        } else if (typeof fragmentItem.itemId === 'object') {
          fragmentPresetId = fragmentItem.itemId._id;
        } else {
          fragmentPresetId = fragmentItem.itemId;
        }
      }
      
      if (!fragmentPresetId) {
        toast.dismiss(loadingToast);
        toast.error("No se pudo identificar el fragmento para canjear");
        return;
      }
      
      console.log("Canjeando fragmento con ID:", fragmentPresetId);
      
      // Llamar a la API con el fragmentPresetId identificado
      const response = await claimFragmentReward(fragmentPresetId);
      
      // Quitar toast de carga
      toast.dismiss(loadingToast);
      
      // Verificar si tenemos un item de recompensa para mostrar
      if (response.inventoryItem) {
        // Guardar la recompensa y mostrar el modal
        setRewardItem(response.inventoryItem);
        setRewardModalOpen(true);
      } else if (response.coupon) {
        // Si es un cupón, también podemos mostrarlo en el modal
        setRewardItem({
          ...response.coupon,
          itemType: 'RewardCouponPreset',
          details: {
            name: response.coupon.presetId?.name || `Cupón de Recompensa (${response.coupon.code})`,
            obtainedFrom: "fragment_claim",
            fullInfo: true,
            src: "",
            srcLocal: ""
          }
        });
        setRewardModalOpen(true);
      } else {
        // Mensaje genérico si no hay detalles específicos
        toast.success("Fragmentos canjeados exitosamente");
      }
      
      // Actualizar el inventario
      fetchInventory();
      if (onRedeemUpdate) onRedeemUpdate();
    } catch (error) {
      toast.dismiss();
      console.error("Error al canjear fragmentos:", error);
      toast.error(error.response?.data?.message || "Error al canjear los fragmentos");
    }
  };

  const handleItemClick = (item) => {
    if (!selectionMode) {
      // Si no estamos en modo selección
      if (item.itemType !== "RewardCouponPreset" && item.itemType !== "FragmentsUser") {
        // Para items normales, abrir modal de redención
        setSelectedItems([item]);
        setIsRedeemModalOpen(true);
      } else if (item.itemType === "FragmentsUser") {
        // Para fragmentos, obtenemos el fragmentId para buscar en la agrupación
        let fragmentId = null;
        
        if (item.details?.fragmentId) {
          fragmentId = item.details.fragmentId;
        } else if (item.itemId) {
          if (typeof item.itemId === 'object' && item.itemId.fragmentId) {
            fragmentId = typeof item.itemId.fragmentId === 'object' ? 
                        item.itemId.fragmentId._id : 
                        item.itemId.fragmentId;
          } else if (typeof item.itemId === 'object') {
            fragmentId = item.itemId._id;
          } else {
            fragmentId = item.itemId;
          }
        }
        
        if (!fragmentId) {
          toast.error("No se puede procesar este fragmento, falta información");
          return;
        }
        
        const fragmentGroup = fragmentsGrouped[fragmentId];
        const canClaim = fragmentGroup && fragmentGroup.totalQuantity >= fragmentGroup.requiredQuantity;
        
        if (canClaim) {
          // Canjear directamente sin abrir modal
          handleDirectFragmentClaim(item);
        } else {
          const remaining = fragmentGroup ? fragmentGroup.requiredQuantity - fragmentGroup.totalQuantity : 1;
          toast.info(`Necesitas ${remaining} fragmentos más para reclamar este ítem.`);
        }
      }
      return;
    }

    // En modo selección
    if (item.itemType === "RewardCouponPreset") {
      return; // No permitir selección de cupones
    }
    
    // Para fragmentos, solo permitir selección si tienen suficientes (agrupados)
    if (item.itemType === "FragmentsUser") {
      let fragmentId = null;
      
      if (item.details?.fragmentId) {
        fragmentId = item.details.fragmentId;
      } else if (item.itemId) {
        if (typeof item.itemId === 'object' && item.itemId.fragmentId) {
          fragmentId = typeof item.itemId.fragmentId === 'object' ? 
                      item.itemId.fragmentId._id : 
                      item.itemId.fragmentId;
        } else if (typeof item.itemId === 'object') {
          fragmentId = item.itemId._id;
        } else {
          fragmentId = item.itemId;
        }
      }
      
      if (!fragmentId) return;
      
      const fragmentGroup = fragmentsGrouped[fragmentId];
      const canClaim = fragmentGroup && fragmentGroup.totalQuantity >= fragmentGroup.requiredQuantity;
      
      if (!canClaim) return;
    }

    setSelectedItems(prev => {
      const isSelected = prev.some(selectedItem => selectedItem._id === item._id);
      if (isSelected) {
        return prev.filter(selectedItem => selectedItem._id !== item._id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleRedeemComplete = async (formData) => {
    try {
      // Verificar si todos los items seleccionados son fragmentos
      const allFragments = selectedItems.every(item => item.itemType === "FragmentsUser");
      
      if (allFragments) {
        // Si son fragmentos, usamos la función específica para fragmentos
        // Obtenemos el primer fragmento para su procesamiento
        const fragmentItem = selectedItems[0];
        await handleDirectFragmentClaim(fragmentItem);
      } else {
        // Si no son todos fragmentos, seguimos con el flujo normal de redención
        const redeemData = {
          userId,
          items: JSON.stringify(selectedItems.map(item => ({
            _id: item.itemType === "FragmentsUser" 
              ? item.details?.fragmentId || (
                  typeof item.itemId === 'object' ? item.itemId._id : item.itemId
                )
              : (item.itemId?._id || item.itemId),
            itemType: item.itemType === "FragmentsUser" ? "FragmentsPreset" : item.itemType,
            fragmentUserId: item.itemType === "FragmentsUser" ? item._id : undefined
          }))),
          riotName: formData.riotName,
          discordName: formData.discordName,
          region: formData.region
        };
    
        await createRedeem(redeemData);
        toast.success("Items reclamados exitosamente");
      }
      
      // Actualizar inventario
      fetchInventory();
      setSelectedItems([]);
      setSelectionMode(false);
      onRedeemUpdate();
    } catch (error) {
      console.error("Error al reclamar items:", error);
      toast.error("Error al reclamar los items");
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedItems([]);
    }
  };

  const openRedeemModal = () => {
    if (selectedItems.length > 0) {
      setIsRedeemModalOpen(true);
    } else {
      toast.error("Selecciona al menos un item para reclamar");
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando inventario...</span>
        </div>
      </div>
    );
  }

  // Filtrar ítems que pueden ser reclamados (no cupones y fragmentos con suficiente cantidad)
  const claimableItems = items.filter(item => {
    if (item.itemType === "RewardCouponPreset") return false;
    
    if (item.itemType === "FragmentsUser") {
      let fragmentId = null;
      
      if (item.details?.fragmentId) {
        fragmentId = item.details.fragmentId;
      } else if (item.itemId) {
        if (typeof item.itemId === 'object' && item.itemId.fragmentId) {
          fragmentId = typeof item.itemId.fragmentId === 'object' ? 
                      item.itemId.fragmentId._id : 
                      item.itemId.fragmentId;
        } else if (typeof item.itemId === 'object') {
          fragmentId = item.itemId._id;
        } else {
          fragmentId = item.itemId;
        }
      }
      
      if (!fragmentId) return false;
      
      const fragmentGroup = fragmentsGrouped[fragmentId];
      return fragmentGroup && fragmentGroup.totalQuantity >= fragmentGroup.requiredQuantity;
    }
    
    return true;
  });
  
  const hasClaimableItems = claimableItems.length > 0;

  return (
    <div className="bg-card rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Tu Inventario</h2>
          <p className="text-sm text-muted-foreground">
            Aquí encontrarás todos tus ítems disponibles
          </p>
        </div>
        {hasClaimableItems && (
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button 
              variant={selectionMode ? "secondary" : "outline"}
              onClick={toggleSelectionMode}
            >
              {selectionMode ? "Cancelar Selección" : "Selección Múltiple"}
            </Button>
            {selectionMode && (
              <Button
                onClick={openRedeemModal}
                disabled={selectedItems.length === 0}
              >
                Reclamar Seleccionados ({selectedItems.length})
              </Button>
            )}
          </div>
        )}
      </div>

      {loadingItemDetails && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Cargando imágenes y detalles adicionales...
              </p>
            </div>
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => {
            const itemData = item.itemId;
            const isCoupon = item.itemType === "RewardCouponPreset";
            const isFragment = item.itemType === "FragmentsUser";
            const isFragmentSpecific = isFragment && item.details?.fragmentType === "especifico";
            const isItem = item.itemType === "Item";
            const claimedCoupon = isCoupon ? claimedCouponsMap[item.entryId] : null;
            const isSelected = selectedItems.some(selectedItem => selectedItem._id === item._id);
            
            // Para fragmentos, usar datos agrupados si están disponibles
            let currentQuantity = 0;
            let requiredQuantity = 1;
            let fragmentComplete = false;
            let fragmentProgress = 0;
            let fragmentName = isFragment ? (item.details?.fragmentName || "Fragmento") : "";
            
            if (isFragment) {
              // Identificar el fragmentId para buscar en la agrupación
              let fragmentId = null;
              
              if (item.details?.fragmentId) {
                fragmentId = item.details.fragmentId;
              } else if (item.itemId) {
                if (typeof item.itemId === 'object' && item.itemId.fragmentId) {
                  fragmentId = typeof item.itemId.fragmentId === 'object' ? 
                              item.itemId.fragmentId._id : 
                              item.itemId.fragmentId;
                } else if (typeof item.itemId === 'object') {
                  fragmentId = item.itemId._id;
                } else {
                  fragmentId = item.itemId;
                }
              }
              
              if (fragmentId && fragmentsGrouped[fragmentId]) {
                currentQuantity = fragmentsGrouped[fragmentId].totalQuantity;
                requiredQuantity = fragmentsGrouped[fragmentId].requiredQuantity;
                fragmentName = fragmentsGrouped[fragmentId].name;
              } else {
                // Fallback a los datos del item individual
                currentQuantity = item.quantity || 0;
                
                if (item.details?.requiredQuantity) {
                  requiredQuantity = item.details.requiredQuantity;
                } else if (typeof item.itemId === 'object' && item.itemId.requiredQuantity) {
                  requiredQuantity = item.itemId.requiredQuantity;
                }
                
                if (item.details?.fragmentName) {
                  fragmentName = item.details.fragmentName;
                } else if (typeof item.itemId === 'object' && item.itemId.name) {
                  fragmentName = item.itemId.name;
                }
              }
              
              fragmentComplete = currentQuantity >= requiredQuantity;
              fragmentProgress = Math.min(Math.round((currentQuantity / requiredQuantity) * 100), 100);
            }
            
            // Cálculo de color de progreso basado en el porcentaje
            let progressColor = 'bg-red-500';
            if (fragmentProgress >= 75) progressColor = 'bg-green-500';
            else if (fragmentProgress >= 50) progressColor = 'bg-yellow-500';
            else if (fragmentProgress >= 25) progressColor = 'bg-orange-500';

            // Obtener la imagen del ítem con la función mejorada
            const itemImage = getImageUrl(item);
            
            // Obtener el nombre del ítem con la función mejorada
            const itemName = getItemName(item);
            
            // Check si el item está esperando cargar detalles
            const isWaitingForDetails = 
              (isItem && typeof item.itemId === 'string' && !itemsCache.has(item.itemId)) ||
              (isFragmentSpecific && 
                item.details?.fragmentReward === 'skin' && 
                !skinsCache.has(typeof item.details.ItemId === 'object' 
                               ? item.details.ItemId._id || item.details.ItemId 
                               : item.details.ItemId)) ||
              (isFragmentSpecific && 
                item.details?.fragmentReward === 'item' && 
                !itemsCache.has(typeof item.details.ItemId === 'object' 
                              ? item.details.ItemId._id || item.details.ItemId 
                              : item.details.ItemId));

            return (
              <div
                key={item._id}
                className={`relative group bg-accent rounded-lg overflow-hidden shadow-sm 
                  ${(selectionMode && !isCoupon && (!isFragment || fragmentComplete)) ? 'cursor-pointer' : ''} 
                  ${isSelected ? 'ring-2 ring-primary' : ''}
                  ${isFragment && !fragmentComplete ? 'opacity-80' : ''}
                  ${isWaitingForDetails ? 'opacity-70' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="aspect-square relative overflow-hidden">
                  {/* Etiqueta de tipo */}
                  {isCoupon && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded z-10">
                      Reward Cupón
                    </div>
                  )}
                  {isFragmentSpecific && (
                    <div className="absolute top-2 left-2 bg-green-400 text-black text-xs font-bold px-2 py-1 rounded z-10">
                      Fragmento Específico
                    </div>
                  )}
                  {isFragment && !isFragmentSpecific && (
                    <div className="absolute top-2 left-2 bg-blue-400 text-black text-xs font-bold px-2 py-1 rounded z-10">
                      Fragmento
                    </div>
                  )}
                  {isItem && (
                    <div className="absolute top-2 left-2 bg-purple-400 text-black text-xs font-bold px-2 py-1 rounded z-10">
                      Item
                    </div>
                  )}
                  {!isCoupon && !isFragment && !isItem && (
                    <div className="absolute top-2 left-2 bg-gray-400 text-black text-xs font-bold px-2 py-1 rounded z-10">
                      {item.itemType}
                    </div>
                  )}
                  
                  {/* Imagen del ítem */}
                  <img
                    src={itemImage}
                    alt={itemName}
                    className="w-full h-full p-2 transition-transform object-cover duration-300 group-hover:scale-110"
                    onError={(e) => {
                      console.error("Error cargando imagen:", e.target.src, "para item:", item);
                      e.target.src = placeholderImage;
                      e.target.onerror = null;
                    }}
                  />

                  {/* Icono de carga para items con detalles pendientes */}
                  {isWaitingForDetails && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                      <Loader2 className="h-10 w-10 animate-spin text-primary-foreground" />
                    </div>
                  )}

                  {/* Capa de interacción */}
                  {isCoupon ? (
                    item.claimed ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          claimedCoupon && handleCopyCode(claimedCoupon.code);
                        }}
                        className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-lg font-bold cursor-pointer z-10"
                      >
                        <span>{claimedCoupon ? claimedCoupon.code : "Reclamado"}</span>
                        <ClipboardCheck className="w-6 h-6 mt-2 text-green-400" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            
                            // Solución mejorada: maneja tanto ObjectId directo como objeto con _id
                            const presetId = item.itemId && typeof item.itemId === 'object' 
                              ? (item.itemId._id ? item.itemId._id.toString() : item.itemId.toString()) 
                              : item.itemId.toString();
                            
                            if (presetId && item.entryId) {
                              handleClaimCoupon(presetId, item.entryId);
                            } else {
                              toast.error("No se puede canjear este cupón, faltan datos");
                              console.error("Datos del cupón incompletos:", { itemId: item.itemId, entryId: item.entryId });
                            }
                          }}
                          className="bg-primary text-black px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Canjear Cupón
                        </button>
                      </div>
                    )
                  ) : isFragment ? (
                    // Para fragmentos mostramos progreso
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      {fragmentComplete ? (
                        <button 
                          className="bg-primary text-black px-4 py-2 rounded-md hover:bg-primary/90 transition-colors mb-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectFragmentClaim(item);
                          }}
                        >
                          Reclamar Recompensa
                        </button>
                      ) : (
                        <div className="text-white text-center px-4">
                          <p className="mb-1">Progreso: {currentQuantity}/{requiredQuantity}</p>
                          <div className="w-full h-2 bg-gray-700 rounded-full">
                            <div
                              className={`h-full rounded-full ${progressColor}`}
                              style={{ width: `${fragmentProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    !selectionMode && !isWaitingForDetails && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <button className="bg-primary text-black px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                          {selectionMode ? "Seleccionar" : "Utilizar"}
                        </button>
                      </div>
                    )
                  )}

                  {/* Indicador de selección */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-20">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                  )}

                  {/* Metadata adicional */}
                  {isCoupon && itemData && (
                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-md text-xs text-white z-10">
                      {item.claimed ? claimedCoupon?.currentUses + '/' + item.details.maxUses : "Sin reclamar"}
                    </div>
                  )}

                  {isFragment && (
                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-md text-xs text-white z-10">
                      {currentQuantity}/{requiredQuantity}
                    </div>
                  )}

                  {!isCoupon && !isFragment && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded-md text-xs text-white z-10">
                      x{item.quantity || 1}
                    </div>
                  )}
                  
                  {/* Barra de progreso para fragmentos (siempre visible) */}
                  {isFragment && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
                      <div 
                        className={`h-full rounded-full ${progressColor}`}
                        style={{ width: `${fragmentProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                {/* Nombre del ítem */}
                <div className="p-2 text-sm truncate text-center bg-black/40 text-white">
                  {itemName}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No tienes ítems en tu inventario.
        </div>
      )}

      {/* Modal de redención normal */}
      <RedeemModal
        isOpen={isRedeemModalOpen}
        onClose={() => {
          setIsRedeemModalOpen(false);
          if (selectionMode) {
            setSelectedItems([]);
            setSelectionMode(false);
          }
        }}
        selectedItems={selectedItems}
        onRedeemComplete={handleRedeemComplete}
      />

      {/* Modal de revelación de recompensa */}
      <RewardRevealModal
        isOpen={rewardModalOpen}
        onClose={handleRewardModalClose}
        reward={rewardItem}
      />
    </div>
  );
};

export default InventoryDisplay;