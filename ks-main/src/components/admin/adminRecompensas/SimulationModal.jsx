import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trophy, X, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

// IMPORTA AQUÍ LA IMAGEN DE CUPÓN
import cuponImage from "../../../assets/Cupones.png";

export function SimulationModal({ isOpen, onClose, lootbox }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemsList, setItemsList] = useState([]);
  const spinnerRef = useRef(null);

  useEffect(() => {
    setItemsList(generateItemsList());
    setSelectedItem(null);
  }, [lootbox, isOpen]);

  useEffect(() => {
    if (selectedItem) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.4 },
      });
    }
  }, [selectedItem]);

  const generateItemsList = () => {
    // Repetimos X veces para la animación de ruleta
    let items = [];
    const repetitions = 50;
    for (let i = 0; i < repetitions; i++) {
      items = [...items, ...lootbox.items];
    }
    return items;
  };

  const getRarityConfig = (dropRate) => {
    if (dropRate <= 1) {
      return {
        borderColor: "border-yellow-500",
        bgColor: "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20",
        textColor: "text-yellow-500",
      };
    }
    if (dropRate <= 5) {
      return {
        borderColor: "border-purple-500",
        bgColor: "bg-gradient-to-br from-purple-500/20 to-purple-600/20",
        textColor: "text-purple-500",
      };
    }
    if (dropRate <= 20) {
      return {
        borderColor: "border-blue-500",
        bgColor: "bg-gradient-to-br from-blue-500/20 to-blue-600/20",
        textColor: "text-blue-500",
      };
    }
    return {
      borderColor: "border-gray-500",
      bgColor: "bg-gradient-to-br from-gray-500/20 to-gray-600/20",
      textColor: "text-gray-500",
    };
  };

  // Simulación local del item dropeado
  const simulateItemDrop = () => {
    const random = Math.random() * 100;
    let accumulator = 0;
    for (const item of lootbox.items) {
      accumulator += item.dropRate;
      if (random <= accumulator) {
        return item;
      }
    }
    return lootbox.items[lootbox.items.length - 1];
  };

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const targetItem = simulateItemDrop();
    const spinDuration = 5000;

    // Animación
    const itemWidth = 256;
    const gap = 16;
    const itemTotalWidth = itemWidth + gap;

    // Buscar índice
    const itemsBeforeTarget =
      Math.floor(Math.random() * 30) * lootbox.items.length +
      lootbox.items.findIndex(
        (item) =>
          item.itemId._id === targetItem.itemId._id &&
          item.itemType === targetItem.itemType
      );
    const targetPosition = itemsBeforeTarget * itemTotalWidth;
    const containerWidth =
      document.querySelector(".ruleta-container")?.offsetWidth || 0;
    const centerPosition = containerWidth / 2 - itemWidth / 2;
    const finalPosition = -(targetPosition - centerPosition);

    if (spinnerRef.current) {
      // Reset
      spinnerRef.current.style.transition = "none";
      spinnerRef.current.style.transform = "translateX(0) translateY(-50%)";
      spinnerRef.current.offsetHeight; // reflow

      // Anim
      spinnerRef.current.style.transition = `transform ${spinDuration}ms cubic-bezier(0.1, 0.7, 0.1, 1)`;
      spinnerRef.current.style.transform = `translateX(${finalPosition}px) translateY(-50%)`;
    }

    setTimeout(() => {
      setSelectedItem(targetItem);
      setIsSpinning(false);
      if (targetItem.dropRate <= 5) {
        triggerRareAnimation();
      }
    }, spinDuration);
  };

  const triggerRareAnimation = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  /** Conseguir nombre/label del ítem */
  const getItemName = (item) => {
    // Oro
    if (item.itemType === "Gold") {
      return `${item.details?.amount || item.itemId} Oro`;
    }
    // Cupón (RewardCouponPreset): "Cupón {nombre} {percent}% (validez {validDays} días)"
    if (item.itemType === "RewardCouponPreset") {
      const name = item.details?.name || "Cupón sin nombre";
      const percent = item.details?.percent || 0;
      const days = item.details?.validDays || 0;
      return `${name}`;
    }
    // Skin vs Item
    if (item.itemType === "Skin") {
      return item.itemId.NombreSkin;
    } else if (item.itemType === "Item") {
      return item.itemId.name;
    }
    // Fallback
    return "Ítem desconocido";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        putCross={!selectedItem}
        className={cn(
          "bg-black/95 backdrop-blur-xl border-gray-800",
          selectedItem ? "max-w-sm mx-auto p-4" : "max-w-4xl max-h-[90vh] p-6"
        )}
      >
        {/* Header cuando no hay item seleccionado */}
        {!selectedItem && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {lootbox.name}
            </DialogTitle>
          </DialogHeader>
        )}

        {!selectedItem ? (
          // Vista de la ruleta
          <div className="space-y-6">
            <div className="ruleta-container relative h-80 overflow-hidden rounded-xl border border-gray-800 bg-black">
              {/* Gradiente lateral */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10" />
              {/* Marcador central */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary/50 z-20 transform -translate-x-1/2">
                <div className="absolute top-0 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-primary" />
                <div className="absolute bottom-0 left-1/2 w-4 h-4 -translate-x-1/2 translate-y-1/2 rotate-45 bg-primary" />
              </div>
              {/* Carrusel de items */}
              <div
                ref={spinnerRef}
                className="absolute flex gap-4 top-1/2 left-0 -translate-y-1/2 transition-transform"
              >
                {itemsList.map((item, index) => {
                  const rarity = getRarityConfig(item.dropRate);
                  const itemName = getItemName(item);
                  let itemImage = null;

                  // Determinar imagen a mostrar
                  if (item.itemType === "Gold") {
                    // Solo un ícono, en este caso las Coins
                  } else if (item.itemType === "RewardCouponPreset") {
                    // Usamos la imagen del cupón
                    itemImage = item.details?.image ?? null;
                  } else {
                    // Skin o Item => se asume itemId.srcLocal
                    itemImage = item.itemId?.srcLocal;
                  }

                  return (
                    <Card
                      key={`${item.itemId}-${index}`}
                      className={cn(
                        "w-64 h-64 border-2 transition-all duration-300",
                        rarity.borderColor,
                        rarity.bgColor,
                        "hover:scale-105"
                      )}
                    >
                      <CardContent className="p-4 h-full flex flex-col">
                        <div className="flex-1 relative flex items-center justify-center">
                          {item.itemType === "Gold" ? (
                            <Coins className="w-3/4 h-3/4 object-contain text-yellow-500" />
                          ) : item.itemType === "RewardCouponPreset" ? (
                            <img
                              src={itemImage || cuponImage}
                              alt={itemName}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <img
                              src={itemImage}
                              alt={itemName}
                              className="max-w-full max-h-full object-contain"
                            />
                          )}
                        </div>
                        <div className={cn("text-center mt-2", rarity.textColor)}>
                          <p className="font-bold truncate">{itemName}</p>
                          <p className="text-sm opacity-80">{item.dropRate}%</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleSpin}
                disabled={isSpinning}
                className={cn(
                  "relative overflow-hidden transition-all",
                  isSpinning ? "opacity-50" : "hover:scale-105"
                )}
              >
                {isSpinning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Girando...
                  </>
                ) : (
                  "Girar"
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Vista de resultado final
          <div className="relative flex flex-col items-center justify-center">
            <button
              onClick={onClose}
              className="absolute top-3 right-4 text-gray-300 hover:text-white z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <Card
              onClick={onClose}
              className={cn(
                "cursor-pointer border-2 p-4 mx-auto animate-zoomIn shadow-2xl rounded-lg",
                getRarityConfig(selectedItem.dropRate).borderColor,
                getRarityConfig(selectedItem.dropRate).bgColor
              )}
            >
              <CardContent className="flex flex-col items-center gap-4">
                {selectedItem.itemType === "Gold" ? (
                  <Coins className="w-48 h-48 text-yellow-500" />
                ) : selectedItem.itemType === "RewardCouponPreset" ? (
                  <img
                    src={cuponImage}
                    alt="Cupón"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <img
                    src={selectedItem.itemId.srcLocal}
                    alt={getItemName(selectedItem)}
                    className="w-48 h-48 object-contain"
                  />
                )}
                <h3
                  className={cn(
                    "text-2xl font-bold",
                    getRarityConfig(selectedItem.dropRate).textColor
                  )}
                >
                  ¡Felicitaciones!
                </h3>
                <p className="text-gray-400 text-center">
                  Has obtenido: {getItemName(selectedItem)} <br />
                  Probabilidad: {selectedItem.dropRate}%
                </p>
                <p className="text-sm text-gray-500 text-center">
                  El item ha sido agregado a tu inventario.
                </p>
                <p className="mt-4 text-lg font-semibold text-blue-300">
                  Haz click para ir a tu inventario
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
