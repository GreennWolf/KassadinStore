import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

const RedeemModal = ({ isOpen, onClose, selectedItems, onRedeemComplete }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    riotName: '',
    discordName: '',
    region: ''
  });

  const regions = [
    // { value: 'NA', label: 'Norte América' },
    // { value: 'EUW', label: 'Europa Oeste' },
    // { value: 'EUNE', label: 'Europa Norte & Este' },
    // { value: 'KR', label: 'Corea' },
    // { value: 'JP', label: 'Japón' },
    { value: 'LAN', label: 'LAN' },
    { value: 'LAS', label: 'LAS' },
    // { value: 'BR', label: 'Brasil' },
    // { value: 'OCE', label: 'Oceanía' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegionChange = (value) => {
    setFormData(prev => ({
      ...prev,
      region: value
    }));
  };

  const resetForm = () => {
    setFormData({
      riotName: '',
      discordName: '',
      region: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.riotName || !formData.discordName || !formData.region) {
      toast.error("Por favor completa todos los campos");
      return;
    }
  
    try {
      setLoading(true);
      await onRedeemComplete(formData); // Pasar los datos del formulario
      handleClose();
    } catch (error) {
      console.error("Error al crear la redención:", error);
      toast.error("Error al crear la redención");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener la imagen del item según la nueva estructura
  const getItemImage = (item) => {
    // 1. Intentar obtener desde details.srcLocal
    if (item.details?.srcLocal) {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      return `${baseUrl}/images/${item.details.srcLocal}`;
    } 
    // 2. Intentar obtener desde details.src
    else if (item.details?.src) {
      return item.details.src;
    } 
    // 3. Fallback a la estructura antigua
    else if (item.itemId?.srcLocal) {
      return item.itemId.srcLocal;
    }
    // 4. Imagen por defecto si no hay nada
    return "/placeholder-item.png";
  };

  // Función para obtener el nombre del item según la nueva estructura
  const getItemName = (item) => {
    // 1. Intentar obtener desde details.name
    if (item.details?.name) {
      return item.details.name;
    } 
    // 2. Fallback a la estructura antigua
    else if (item.itemId?.name) {
      return item.itemId.name;
    } 
    else if (item.itemId?.NombreSkin) {
      return item.itemId.NombreSkin;
    }
    // 3. Nombre genérico si no hay nada
    return "Item sin nombre";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reclamar Items</DialogTitle>
          <DialogDescription>
            Completa los datos necesarios para reclamar tus items seleccionados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {selectedItems?.length > 0 && (
            <div className="space-y-2">
              <Label>Items Seleccionados</Label>
              <div className="grid grid-cols-2 gap-2">
                {selectedItems.map((item, index) => (
                  <Card key={index} className="p-2 flex items-center space-x-2">
                    <img 
                      src={getItemImage(item)}
                      alt={getItemName(item)}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        e.target.src = "/placeholder-item.png";
                        e.target.onerror = null;
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {getItemName(item)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.itemType}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="riotName">Nombre de invocador</Label>
              <Input
                id="riotName"
                name="riotName"
                placeholder="Tu nombre en League of Legends"
                value={formData.riotName}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordName">Usuario de Discord</Label>
              <Input
                id="discordName"
                name="discordName"
                placeholder="Tu usuario#0000"
                value={formData.discordName}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Región</Label>
              <Select
                value={formData.region}
                onValueChange={handleRegionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu región" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando
                  </>
                ) : (
                  'Reclamar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RedeemModal;