import React, { memo, useState, useEffect } from "react";
import { getAllCurrencies } from "../../../services/currencyService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const CuponForm = memo(({ data, setData, onSubmit, submitText, onClose }) => {
  const [currencies, setCurrencies] = useState([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);

  useEffect(() => {
    const fetchCurrencies = async () => {
      setIsLoadingCurrencies(true);
      try {
        const currenciesData = await getAllCurrencies();
        setCurrencies(currenciesData);
      } catch (error) {
        console.error("Error al cargar divisas:", error);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };

    if (data.type === "fixed") {
      fetchCurrencies();
    }
  }, [data.type]);

  const handleCurrencyValueChange = (currencyId, value) => {
    const updatedValues = [...(data.currencyValues || [])];
    const existingIndex = updatedValues.findIndex(
      (cv) => cv.currency._id === currencyId
    );
    const numericValue = value === "" ? value : Number(value);

    if (existingIndex >= 0) {
      updatedValues[existingIndex] = {
        ...updatedValues[existingIndex],
        value: numericValue,
      };
    } else {
      const currency = currencies.find((c) => c._id === currencyId);
      updatedValues.push({
        currency,
        value: numericValue,
      });
    }

    setData((prev) => ({ ...prev, currencyValues: updatedValues }));
  };

  const handleMaxUsesChange = (value) => {
    setData((prev) => ({
      ...prev,
      maxUses: value === "" ? "" : Number(value),
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Formulario de Cupón</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cupon">Código del cupón</Label>
          <Input
            id="cupon"
            value={data.cupon || ""}
            onChange={(e) => setData((prev) => ({ ...prev, cupon: e.target.value }))}
            required
          />
        </div>
  
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de cupón</Label>
          <Select
            value={data.type || "percent"}
            onValueChange={(value) =>
              setData((prev) => ({
                ...prev,
                type: value,
                value: value === "percent" ? prev.value : "",
                currencyValues: value === "fixed" ? [] : undefined,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tipo de cupón" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Porcentaje</SelectItem>
              <SelectItem value="fixed">Valor fijo</SelectItem>
            </SelectContent>
          </Select>
        </div>
  
        {data.type === "percent" ? (
          <div className="space-y-2">
            <Label htmlFor="value">Porcentaje de descuento</Label>
            <Input
              id="value"
              type="number"
              placeholder="Porcentaje"
              value={data.value ?? ""}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  value: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              min="0"
              max="100"
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="currencyValues">Valores por moneda</Label>
            {isLoadingCurrencies ? (
              <p className="text-sm text-gray-500 mt-1">Cargando divisas...</p>
            ) : (
              currencies.map((currency) => (
                <div key={currency._id} className="space-y-2">
                  <Label>
                    Valor en {currency.name} ({currency.symbol})
                  </Label>
                  <Input
                    type="number"
                    placeholder={`Valor en ${currency.symbol}`}
                    value={
                      data.currencyValues?.find(
                        (cv) => cv.currency._id === currency._id
                      )?.value ?? ""
                    }
                    onChange={(e) =>
                      handleCurrencyValueChange(currency._id, e.target.value)
                    }
                    min="0"
                    required
                  />
                </div>
              ))
            )}
          </div>
        )}
  
        <div className="space-y-2">
          <Label htmlFor="maxUses">Número máximo de usos</Label>
          <Input
            id="maxUses"
            type="number"
            placeholder="0 para ilimitado"
            value={data.maxUses}
            onChange={(e) => handleMaxUsesChange(e.target.value)}
            min="0"
          />
        </div>
  
        <div className="space-y-2">
          <Label htmlFor="rpType">Tipo de RP</Label>
          <Select
            value={data.rpType || "ambos"}
            onValueChange={(value) =>
              setData((prev) => ({
                ...prev,
                rpType: value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un Tipo de RP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ambos">Ambos</SelectItem>
              <SelectItem value="seguro">Seguro</SelectItem>
              <SelectItem value="barato">Barato</SelectItem>
            </SelectContent>
          </Select>
        </div>
  
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            placeholder="Descripción del cupón"
            value={data.description || ""}
            onChange={(e) =>
              setData((prev) => ({ ...prev, description: e.target.value }))
            }
            required
          />
        </div>
  
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={data.isInfinite || false}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                isInfinite: e.target.checked,
                validUntil: e.target.checked ? null : prev.validUntil,
              }))
            }
            className="form-checkbox"
            id="isInfinite"
          />
          <Label htmlFor="isInfinite">Duración indefinida</Label>
        </div>
  
        <div className="space-y-2">
          <Label htmlFor="validFrom">Válido desde</Label>
          <Input
            id="validFrom"
            type="datetime-local"
            value={
              data.validFrom ? new Date(data.validFrom).toISOString().slice(0, 16) : ""
            }
            onChange={(e) =>
              setData((prev) => ({ ...prev, validFrom: new Date(e.target.value) }))
            }
            required
          />
        </div>
  
        {!data.isInfinite && (
          <div className="space-y-2">
            <Label htmlFor="validUntil">Válido hasta</Label>
            <Input
              id="validUntil"
              type="datetime-local"
              value={
                data.validUntil
                  ? new Date(data.validUntil).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setData((prev) => ({ ...prev, validUntil: new Date(e.target.value) }))
              }
            />
          </div>
        )}
  
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{submitText}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
  
  );
});
