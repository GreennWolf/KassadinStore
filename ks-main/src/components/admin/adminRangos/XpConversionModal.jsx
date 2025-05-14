// XpConversionModal.jsx
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function XpConversionModal({ isOpen, onClose, conversion, onSubmit, mode, rpPrices }) {
  const [formData, setFormData] = useState({
    rpPrice: conversion?.rpPrice._id || "",
    xpSeguro: conversion?.xpSeguro || "",
    xpBarato: conversion?.xpBarato || "",
    active: conversion?.active ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Crear Nueva Conversión" : "Editar Conversión"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rpPrice">Valor RP</Label>
            <Select
              value={formData.rpPrice}
              onValueChange={(value) => setFormData({ ...formData, rpPrice: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un valor de RP" />
              </SelectTrigger>
              <SelectContent>
                {rpPrices.map((rp) => (
                  <SelectItem key={rp._id} value={rp._id}>
                    <div className="flex items-center gap-2">
                      {rp.valueRP} RP
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="xpSeguro">XP Seguro</Label>
            <Input
              id="xpSeguro"
              type="number"
              value={formData.xpSeguro}
              onChange={(e) => setFormData({ ...formData, xpSeguro: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="xpBarato">XP Barato</Label>
            <Input
              id="xpBarato"
              type="number"
              value={formData.xpBarato}
              onChange={(e) => setFormData({ ...formData, xpBarato: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Activo</Label>
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