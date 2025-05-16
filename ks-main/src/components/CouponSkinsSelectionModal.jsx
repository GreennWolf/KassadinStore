import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CouponSkinsSelectionModal({ isOpen, onClose, eligibleSkins, maxAllowed, onSelect }) {
  // Estado para almacenar, por cada clave compuesta, la cantidad de unidades seleccionadas
  const [selectedCounts, setSelectedCounts] = useState({});

  // Calculamos el total seleccionado sumando las cantidades de cada ítem
  const totalSelected = Object.values(selectedCounts).reduce((sum, count) => sum + count, 0);

  const incrementCount = (compositeKey, available) => {
    const current = selectedCounts[compositeKey] || 0;
    if (totalSelected < maxAllowed && current < available) {
      setSelectedCounts({
        ...selectedCounts,
        [compositeKey]: current + 1,
      });
    }
  };

  const decrementCount = (compositeKey) => {
    const current = selectedCounts[compositeKey] || 0;
    if (current > 0) {
      setSelectedCounts({
        ...selectedCounts,
        [compositeKey]: current - 1,
      });
    }
  };

  const handleConfirm = () => {
    // Se permite confirmar sólo si la suma de unidades seleccionadas es igual a maxAllowed
    if (totalSelected === maxAllowed) {
      onSelect(selectedCounts);
      onClose();
      setSelectedCounts({});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Selecciona unidades para aplicar el cupón (Total: {totalSelected} / {maxAllowed})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {eligibleSkins.map(item => {
            // Generamos la clave compuesta para identificar de forma única cada ítem
            const compositeKey = `${item._id}-${item.isSeguroRP}`;
            // Valor seleccionado para este ítem (por defecto 0)
            const currentCount = selectedCounts[compositeKey] || 0;
            // Máximo disponible es la cantidad que tiene ese ítem en el carrito
            const available = item.quantity;
            return (
              <Card key={compositeKey} className="p-2">
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={item.srcLocal || item.srcWeb}
                      alt={item.name || item.NombreSkin}
                      className="w-16 h-16 rounded-md"
                    />
                    <div className="ml-4">
                      <p className="font-medium">{item.name || item.NombreSkin}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {item.priceRP?.valueRP || item.priceRPData?.valueRP} RP | {item.isSeguroRP ? 'Seguro' : 'Barato'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button variant="outline" size="sm" onClick={() => decrementCount(compositeKey)} disabled={currentCount === 0}>
                      –
                    </Button>
                    <span className="mx-2">{currentCount}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => incrementCount(compositeKey, available)}
                      disabled={currentCount >= available || totalSelected >= maxAllowed}
                    >
                      +
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <DialogFooter className="flex justify-end mt-4">
          <Button onClick={handleConfirm} disabled={totalSelected !== maxAllowed}>
            Confirmar ({totalSelected}/{maxAllowed})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
