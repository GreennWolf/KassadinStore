import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

export function RewardCouponForm({ isOpen, onClose, onSubmit, initialData }) {
  // Se añade el campo "applicableTo" con valor por defecto "ambos"
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      percent: "",
      maxUses: "",
      validDays: "",
      gold: "",
      type: "store",
      applicableTo: "ambos",
      isActive: true,
    }
  );

  // Si el initialData cambia (por ejemplo, al editar), se actualiza el estado
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }

    if (formData.percent <= 0 || formData.percent > 100) {
      toast({ title: "Error", description: "El porcentaje debe estar entre 1 y 100", variant: "destructive" });
      return;
    }

    if (formData.maxUses < 1) {
      toast({ title: "Error", description: "El número máximo de usos debe ser al menos 1", variant: "destructive" });
      return;
    }

    if (formData.validDays < 1) {
      toast({ title: "Error", description: "Los días de validez deben ser al menos 1", variant: "destructive" });
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-background text-foreground p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            {initialData ? "Editar Cupón" : "Crear Cupón"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="text-white bg-gray-800 border border-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="percent">Descuento (%)</Label>
              <Input
                id="percent"
                name="percent"
                type="number"
                value={formData.percent}
                onChange={handleChange}
                min="1"
                max="100"
                required
                className="text-white bg-gray-800 border border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses">Máx. Usos</Label>
              <Input
                id="maxUses"
                name="maxUses"
                type="number"
                value={formData.maxUses}
                onChange={handleChange}
                min="1"
                required
                className="text-white bg-gray-800 border border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validDays">Días de validez</Label>
              <Input
                id="validDays"
                name="validDays"
                type="number"
                value={formData.validDays}
                onChange={handleChange}
                min="1"
                required
                className="text-white bg-gray-800 border border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gold">Valor en Oro (opcional)</Label>
              <Input
                id="gold"
                name="gold"
                type="number"
                value={formData.gold}
                onChange={handleChange}
                min="0"
                className="text-white bg-gray-800 border border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="text-white bg-gray-800 border border-gray-600">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">Tienda</SelectItem>
                  <SelectItem value="lootbox">Lootbox</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicableTo">Aplicable a</Label>
              <Select
                value={formData.applicableTo}
                onValueChange={(value) =>
                  {
                    setFormData((prev) => ({ ...prev, applicableTo: value }))
                  }
                  
                }
              >
                <SelectTrigger className="text-white bg-gray-800 border border-gray-600">
                  <SelectValue placeholder="Selecciona opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambos">Ambos</SelectItem>
                  <SelectItem value="skins">Skins</SelectItem>
                  <SelectItem value="items">Items</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={() =>
                setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
              }
              className="form-checkbox"
              id="isActive"
            />
            <Label htmlFor="isActive">Activo</Label>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {initialData ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
