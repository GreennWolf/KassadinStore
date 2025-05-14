// components/lootboxes/ResultModal.jsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

// Puedes importar aquí la imagen de cupón si es necesario
import cuponImage from "../../assets/Cupones.png";

export const ResultModal = ({ isOpen, onClose, resultItem }) => {
  if (!resultItem) return null;

  // Función para obtener el nombre del ítem
  const getItemName = (item) => {
    if (item.itemType === "Gold") {
      return `${item.details?.amount || item.itemId} Oro`;
    }
    if (item.itemType === "RewardCouponPreset") {
      const name = item.details?.name || "Cupón sin nombre";
      return name;
    }
    if (item.itemType === "Skin") {
      return item.itemId.NombreSkin;
    }
    if (item.itemType === "Item") {
      return item.itemId.name;
    }
    return "Ítem desconocido";
  };

  // Configuración de estilos por rareza (puedes adaptar esto según tu lógica)
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

  const rarity = getRarityConfig(resultItem.dropRate);

  // Determinar la imagen a mostrar
  let itemImage = null;
  if (resultItem.itemType === "Gold") {
    // Se muestra el ícono de Coins (ya importado)
  } else if (resultItem.itemType === "RewardCouponPreset") {
    itemImage = resultItem.details?.image || cuponImage;
  } else {
    itemImage = resultItem.itemId?.srcLocal;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        putCross={true}
        className="bg-black/95 backdrop-blur-xl border-gray-800 max-w-sm mx-auto p-4"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Resultado de la Apertura
          </DialogTitle>
        </DialogHeader>
        <Card
          className={cn(
            "border-2 p-4 mx-auto shadow-2xl rounded-lg",
            rarity.borderColor,
            rarity.bgColor
          )}
        >
          <CardContent className="flex flex-col items-center gap-4">
            {resultItem.itemType === "Gold" ? (
              <Coins className="w-48 h-48 text-yellow-500" />
            ) : resultItem.itemType === "RewardCouponPreset" ? (
              <img
                src={itemImage}
                alt={getItemName(resultItem)}
                className="w-48 h-48 object-contain"
              />
            ) : (
              <img
                src={itemImage}
                alt={getItemName(resultItem)}
                className="w-48 h-48 object-contain"
              />
            )}
            <h3 className={cn("text-2xl font-bold", rarity.textColor)}>
              ¡Felicitaciones!
            </h3>
            <p className="text-gray-400 text-center">
              Has obtenido: {getItemName(resultItem)} <br />
              Probabilidad: {resultItem.dropRate}%
            </p>
            <p className="text-sm text-gray-500 text-center">
              El ítem ha sido agregado a tu inventario.
            </p>
            <Button onClick={onClose} className="mt-4">
              Cerrar
            </Button>
          </CardContent>
        </Card>
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-300 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>
      </DialogContent>
    </Dialog>
  );
};
