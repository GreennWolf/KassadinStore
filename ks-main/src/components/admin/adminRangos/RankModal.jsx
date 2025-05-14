import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function RankModal({ isOpen, onClose, rank, onSubmit, mode }) {
  const [formData, setFormData] = useState({
    name: rank?.name || "",
    xp: rank?.xp || "",
    gold: rank?.gold || "",
    file: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("xp", formData.xp);
    data.append("gold", formData.gold);
    if (formData.file) {
      data.append("icon", formData.file);
    }
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Crear Nuevo Rango" : "Editar Rango"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xp">XP Requerido</Label>
            <Input
              id="xp"
              type="number"
              value={formData.xp}
              onChange={(e) => setFormData({ ...formData, xp: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gold">Oro de Recompensa</Label>
            <Input
              id="gold"
              type="number"
              value={formData.gold}
              onChange={(e) => setFormData({ ...formData, gold: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">Icono</Label>
            <Input
              id="icon"
              type="file"
              onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
              accept="image/*"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === "create" ? "Crear" : "Actualizar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}