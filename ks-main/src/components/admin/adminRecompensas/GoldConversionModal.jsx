import React, { useState, useEffect } from "react";
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
import { getAllRpPrice } from "../../../services/rpService";

export function GoldConversionModal({ isOpen, onClose, conversion, onSubmit, mode }) {
  const [formData, setFormData] = useState({
    gold: conversion?.gold || "",
    rpPrice: conversion?.rpPrice?._id || "",
  });
  const [rps, setRPs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRPs();
  }, []);

  const fetchRPs = async () => {
    try {
      const data = await getAllRpPrice();
      setRPs(data);
    } catch (error) {
      console.error("Error fetching RPs:", error);
    } finally {
      setLoading(false);
    }
  };

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
            <Label htmlFor="gold">Cantidad de Oro</Label>
            <Input
              id="gold"
              type="number"
              value={formData.gold}
              onChange={(e) => setFormData({ ...formData, gold: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rpPrice">RP</Label>
            <Select
              value={formData.rpPrice}
              onValueChange={(value) => setFormData({ ...formData, rpPrice: value })}
              required
              
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un RP" />
              </SelectTrigger>
              <SelectContent className="bg-black text-white">
                {rps.map((rp) => (
                  <SelectItem key={rp._id} value={rp._id}>
                    {rp.valueRP} RP
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {mode === "create" ? "Crear" : "Actualizar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}