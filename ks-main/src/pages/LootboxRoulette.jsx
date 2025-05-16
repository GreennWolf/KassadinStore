import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
// Importa tus servicios (ajusta las rutas según corresponda)
import { getLootboxById, openLootbox } from "@/services/lootboxService";
import { Coins } from "lucide-react"; // Importamos el ícono de monedas

/**
 * Función para buscar el índice EXACTO del ítem ganador dentro de la lista original.
 */
const findExactItemIndex = (items, target) => {
  return items.findIndex((item) => {
    if (item.itemType !== target.itemType) return false;
    if (item.itemType === "Gold") {
      return item.details?.amount === target.details?.amount;
    }
    // Para RewardCouponPreset, Skin o Item, comparamos los IDs
    const id1 = typeof item.itemId === "object" ? item.itemId._id : item.itemId;
    const id2 = typeof target.itemId === "object" ? target.itemId._id : target.itemId;
    return id1 === id2;
  });
};

/**
 * Función para obtener un nombre representativo del ítem (para mostrar mensajes).
 */
const getItemName = (item) => {
  if (item.itemType === "Gold") return `${item.details?.amount || item.itemId} Oro`;
  if (item.itemType === "RewardCouponPreset") return item.details?.name || "Cupón";
  if (item.itemType === "Skin") return item.itemId?.NombreSkin || "Skin";
  if (item.itemType === "Item") return item.itemId?.name || "Ítem";
  return "Desconocido";
};

/**
 * Función para generar un color más claro (para gradientes)
 */
const getLighterColor = (hexColor) => {
  // Si no se proporciona un color, devolveremos el gris predeterminado
  if (!hexColor || !hexColor.startsWith('#')) return "#9ca3af";
  
  try {
    // Convertir el color hexadecimal a RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Aclarar el color mezclándolo con blanco
    const lighterR = Math.min(r + 60, 255);
    const lighterG = Math.min(g + 60, 255);
    const lighterB = Math.min(b + 60, 255);
    
    // Convertir de nuevo a formato hexadecimal
    return `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return "#9ca3af"; // Color por defecto en caso de error
  }
};

/**
 * Función para generar un color más oscuro (para sombras)
 */
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

/**
 * Componente que implementa la ruleta usando el scroll nativo para centrar el ítem ganador.
 * Se espera que reciba la propiedad `lootboxId`.
 */
const LootboxRoulette = ({ lootboxId }) => {
  const [lootbox, setLootbox] = useState(null);
  const [extendedItems, setExtendedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningItem, setWinningItem] = useState(null);

  // Ref para el contenedor scrollable y para almacenar los refs de cada ítem
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  // CONFIGURACIÓN: cuántas veces se repite la lista original
  const REPS = 10;
  // Tiempo estimado de scroll (en ms). Puedes ajustarlo según pruebas.
  const SCROLL_DURATION = 2000;

  // Cargar la lootbox y extender la lista
  useEffect(() => {
    const fetchLootbox = async () => {
      try {
        const data = await getLootboxById(lootboxId);
        setLootbox(data);
        // Extiende la lista repitiéndola REPS veces
        let list = [];
        for (let i = 0; i < REPS; i++) {
          list = list.concat(data.items);
        }
        setExtendedItems(list);
      } catch (error) {
        console.error("Error al cargar la lootbox:", error);
        toast.error("Error al cargar la lootbox");
      } finally {
        setLoading(false);
      }
    };
    fetchLootbox();
  }, [lootboxId]);

  /**
   * Al hacer click en "Abrir Caja":
   * 1. Se llama a la API para obtener el ítem ganador.
   * 2. Se determina el índice del ítem ganador en la lista original.
   * 3. Se selecciona la copia central de ese ítem en la lista extendida.
   * 4. Se desplaza el contenedor horizontal hasta centrar el ítem.
   * 5. Después de un tiempo, se muestra el resultado.
   */
  const handleOpen = useCallback(async () => {
    if (isSpinning || !lootbox) return;
    setIsSpinning(true);

    try {
      // Llamada a la API para abrir la lootbox
      const response = await openLootbox(lootboxId);
      const targetItem = response.itemReceived;
      // console.log("Ítem ganador:", targetItem);

      // Buscar el índice del ítem ganador en la lista original
      let winningIndex = findExactItemIndex(lootbox.items, targetItem);
      if (winningIndex === -1) {
        console.error("Ítem no encontrado; se usará índice 0");
        winningIndex = 0;
      }

      // Calculamos el índice de la copia central de ese ítem
      const originalLength = lootbox.items.length;
      const copyIndex = Math.floor(REPS / 2) * originalLength + winningIndex;
      // console.log("Índice de copia a desplazar:", copyIndex);

      // Obtenemos el elemento DOM correspondiente
      const targetElement = itemRefs.current[copyIndex];
      if (targetElement && containerRef.current) {
        // Calculamos el scrollLeft para centrar el ítem dentro del contenedor
        const container = containerRef.current;
        const targetOffset =
          targetElement.offsetLeft -
          container.offsetWidth / 2 +
          targetElement.offsetWidth / 2;

        // Usamos scrollTo con comportamiento suave
        container.scrollTo({ left: targetOffset, behavior: "smooth" });
      }

      // Esperamos el tiempo estimado de scroll para mostrar el resultado
      setTimeout(() => {
        setIsSpinning(false);
        setWinningItem(targetItem);
        toast.success(`¡Has obtenido: ${getItemName(targetItem)}!`);
        // Lanzar confetti opcionalmente
        if (targetItem.dropRate <= 5) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } });
      }, SCROLL_DURATION);
    } catch (error) {
      console.error("Error al abrir la lootbox:", error);
      toast.error("No se pudo abrir la caja");
      setIsSpinning(false);
    }
  }, [isSpinning, lootbox, lootboxId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh" }} className="flex items-center justify-center bg-gray-900 text-white">
        <p>Cargando caja...</p>
      </div>
    );
  }

  if (!lootbox) {
    return (
      <div style={{ minHeight: "100vh" }} className="flex items-center justify-center bg-gray-900 text-white">
        <p>Error al cargar la caja</p>
      </div>
    );
  }

  // Obtenemos los colores para aplicar en el diseño
  const mainColor = lootbox.color || "#808080"; // Color principal de la lootbox o gris por defecto
  const lighterColor = getLighterColor(mainColor);
  const darkerColor = getDarkerColor(mainColor);

  return (
    <div className="min-h-screen text-white p-4" 
         style={{ 
           background: `linear-gradient(135deg, #1f2937 0%, ${mainColor}40 100%)` 
         }}>
      <h1 className="text-center text-3xl font-bold mb-4 relative">
        <span className="relative z-10">{lootbox.name}</span>
        <span className="absolute inset-0 blur-lg opacity-70" style={{ background: mainColor, zIndex: 0 }}></span>
      </h1>
      <p className="text-center mb-8">{lootbox.description}</p>

      {/* Contenedor de la ruleta (scroll horizontal) */}
      <div
        ref={containerRef}
        className="overflow-x-auto whitespace-nowrap rounded-lg p-2 relative"
        style={{ 
          position: "relative", 
          maxWidth: "100%", 
          margin: "0 auto",
          background: `linear-gradient(to right, ${darkerColor}, #111827, ${darkerColor})`,
          boxShadow: `0 0 15px ${mainColor}80, inset 0 0 8px ${mainColor}40`,
          border: `1px solid ${mainColor}70`
        }}
      >
        {/* Línea indicadora central */}
        <div 
          className="absolute left-1/2 top-0 bottom-0 w-0.5 z-10 pointer-events-none"
          style={{ 
            background: mainColor,
            boxShadow: `0 0 8px ${mainColor}, 0 0 15px ${mainColor}`
          }}
        ></div>
        
        {extendedItems.map((item, index) => {
          // Determina si es raro para aplicar estilos especiales
          const isRare = item.dropRate <= 5;
          
          return (
            <div
              key={index}
              ref={(el) => (itemRefs.current[index] = el)}
              className="inline-block m-1 p-2 rounded text-center transition-all"
              style={{ 
                width: "200px",
                background: isRare 
                  ? `linear-gradient(135deg, ${lighterColor}70, ${darkerColor}90)` 
                  : 'rgba(17, 24, 39, 0.7)',
                boxShadow: isRare 
                  ? `0 0 10px ${mainColor}90` 
                  : '0 0 5px rgba(0, 0, 0, 0.5)',
                border: isRare
                  ? `1px solid ${mainColor}`
                  : '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {item.itemType === "Gold" ? (
                <div className="relative h-20 flex items-center justify-center">
                  <Coins 
                    className="text-4xl"
                    style={{
                      color: lighterColor,
                      filter: `drop-shadow(0 0 3px ${mainColor})`
                    }}
                  />
                </div>
              ) : item.itemType === "RewardCouponPreset" ? (
                <img
                  src={item.details?.image}
                  alt={getItemName(item)}
                  style={{ width: "100%", height: "100px", objectFit: "contain" }}
                />
              ) : (
                <img
                  src={item.itemId?.srcLocal}
                  alt={getItemName(item)}
                  style={{ width: "100%", height: "100px", objectFit: "contain" }}
                />
              )}
              <p className="text-sm">{getItemName(item)}</p>
              <p className="text-xs opacity-70">{item.dropRate}%</p>
            </div>
          );
        })}
      </div>

      {/* Botón para abrir la lootbox */}
      <div className="text-center mt-8">
        <button
          onClick={handleOpen}
          disabled={isSpinning}
          className="px-6 py-3 rounded-md text-xl transition-all disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${mainColor}, ${darkerColor})`,
            boxShadow: `0 0 10px ${mainColor}80`,
            border: `1px solid ${lighterColor}`,
            transform: isSpinning ? 'scale(0.98)' : 'scale(1)',
          }}
        >
          {isSpinning ? "Girando..." : "Abrir Caja"}
        </button>
      </div>

      {/* Modal de resultado */}
      {winningItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="p-8 rounded-lg text-center relative"
            style={{
              background: `linear-gradient(135deg, #1f2937, ${mainColor}70)`,
              boxShadow: `0 0 25px ${mainColor}70, inset 0 0 15px ${lighterColor}30`,
              border: `1px solid ${mainColor}80`
            }}
          >
            <h2 className="text-2xl font-bold mb-4">¡Felicitaciones!</h2>
            {winningItem.itemType === "Gold" ? (
              <div className="text-6xl mb-4 flex justify-center">
                <Coins 
                  className="h-24 w-24"
                  style={{
                    color: lighterColor,
                    filter: `drop-shadow(0 0 5px ${mainColor})`
                  }}
                />
              </div>
            ) : (
              <img
                src={
                  winningItem.itemType === "RewardCouponPreset"
                    ? winningItem.details?.image
                    : winningItem.itemId?.srcLocal
                }
                alt={getItemName(winningItem)}
                className="mx-auto h-32 mb-4 object-contain"
              />
            )}
            <p className="mb-2">Has obtenido:</p>
            <p className="text-xl font-semibold mb-4">{getItemName(winningItem)}</p>
            <p className="text-sm opacity-70 mb-4">Probabilidad: {winningItem.dropRate}%</p>
            <button
              onClick={() => setWinningItem(null)}
              className="px-4 py-2 rounded-md transition-colors"
              style={{
                background: `linear-gradient(135deg, ${mainColor}, ${darkerColor})`,
                boxShadow: `0 0 10px ${mainColor}80`,
                border: `1px solid ${lighterColor}`
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LootboxRoulette;