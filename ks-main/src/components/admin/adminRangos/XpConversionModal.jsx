// XpConversionModal.jsx
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
import { getAllCurrencies } from "../../../services/currencyService";

export function XpConversionModal({ isOpen, onClose, conversion, onSubmit, mode }) {
  const [formData, setFormData] = useState({
    xpAmount: conversion?.xpAmount || "",
    currency: conversion?.currency || "",
    currencyAmount: conversion?.currencyAmount || "",
  });
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const data = await getAllCurrencies();
      setCurrencies(data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
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
            <Label htmlFor="xpAmount">Cantidad de XP</Label>
            <Input
              id="xpAmount"
              type="number"
              value={formData.xpAmount}
              onChange={(e) => setFormData({ ...formData, xpAmount: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una moneda" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency._id} value={currency._id}>
                    <div className="flex items-center gap-2">
                      {currency.imageUrl && (
                        <img
                          src={currency.imageUrl}
                          alt={currency.name}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      {currency.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currencyAmount">Cantidad en Moneda</Label>
            <Input
              id="currencyAmount"
              type="number"
              value={formData.currencyAmount}
              onChange={(e) => setFormData({ ...formData, currencyAmount: e.target.value })}
              required
            />
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
