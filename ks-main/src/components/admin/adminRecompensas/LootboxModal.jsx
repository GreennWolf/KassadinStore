import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { SelectionModal } from './SelectionModal';
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export function LootboxModal({ isOpen, onClose, lootbox, onSubmit, mode, ranks = [] }) {
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    items: [],
    purchaseLimit: "",
    minimumRank: "none",
    endDate: "",
    file: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  useEffect(() => {
    // Al editar, mostrar la imagen existente
    if (lootbox?.image) {
      setImagePreview(lootbox.image);
    } else {
      setImagePreview(null);
    }
  }, [lootbox]);

  useEffect(() => {
    if (lootbox && mode === "edit") {
      setFormData({
        name: lootbox.name,
        description: lootbox.description,
        price: lootbox.price,
        items: lootbox.items,
        purchaseLimit: lootbox.purchaseLimit || "",
        minimumRank: lootbox.minimumRank?._id || "none",
        endDate: lootbox.endDate ? new Date(lootbox.endDate).toISOString().split('T')[0] : "",
        file: null
      });
    }
  }, [lootbox, mode]);


  const handleSubmit = (e) => {
    e.preventDefault();
      
    // Validar que la suma de dropRates sea 100%
    const totalDropRate = formData.items.reduce((sum, item) => sum + Number(item.dropRate), 0);
    if (totalDropRate !== 100) {
      toast.error("La suma de las probabilidades debe ser 100%");
      return;
    }
  
    // Crear FormData
    const submitData = new FormData();
    
    // Agregar campos básicos
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('price', formData.price);
    
    // Agregar items como JSON string
    submitData.append('items', JSON.stringify(formData.items));
    
    // Agregar campos opcionales solo si tienen valor
    if (formData.purchaseLimit) {
      submitData.append('purchaseLimit', formData.purchaseLimit);
    }
    
    if (formData.minimumRank && formData.minimumRank !== "none") {
      submitData.append('minimumRank', formData.minimumRank);
    }
    
    if (formData.endDate) {
      submitData.append('endDate', formData.endDate);
    }
    
    // Agregar imagen si existe
    if (formData.file) {
      submitData.append('image', formData.file);
    }
  
    onSubmit(submitData);
  };

  const handleAddItem = (item) => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItemRate = (index, newRate) => {
    const updatedItems = formData.items.map((item, i) => 
      i === index ? { ...item, dropRate: Number(newRate) } : item
    );
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const getTotalRate = () => {
    return formData.items.reduce((sum, item) => sum + Number(item.dropRate), 0);
  };

  const getItemDisplay = (item) => {
    switch (item.itemType) {
      case 'Skin':
      case 'Item':
        return item.details.name;
      case 'Cupon':
        return `Cupón ${item.details.discount}% (${item.details.days} días)`;
      case 'Gold':
        return `${item.details.amount} Oro`;
      default:
        return item.itemType;
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Crear Nueva Lootbox" : "Editar Lootbox"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="price">Precio (Oro)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Imagen</Label>
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative w-32 h-32">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, file: null }));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Input
                id="image"
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="cursor-pointer"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <Label>Contenido de la Lootbox</Label>
                <div className="text-sm text-muted-foreground">
                  Total: {getTotalRate()}%
                  {getTotalRate() !== 100 && (
                    <span className="text-destructive ml-2">
                      {getTotalRate() < 100 ? `(Faltan ${100 - getTotalRate()}%)` : `(Excede en ${getTotalRate() - 100}%)`}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <Button 
                  type="button"
                  onClick={() => setShowSelectionModal(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Item
                </Button>

                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <Card key={`${item.itemType}-${item.itemId}-${index}`}>
                      <CardContent className="flex items-center p-4">
                        {item.details?.image && (
                          <img 
                            src={item.details.image} 
                            alt={item.details.name || item.itemType} 
                            className="w-12 h-12 object-cover rounded mr-4"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">
                            {getItemDisplay(item)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.itemType}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.dropRate}
                            onChange={(e) => handleUpdateItemRate(index, e.target.value)}
                            className="w-20"
                          />
                          <span className="text-sm">%</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseLimit">Límite de Compras</Label>
              <Input
                id="purchaseLimit"
                type="number"
                min="0"
                value={formData.purchaseLimit}
                onChange={(e) => setFormData({ ...formData, purchaseLimit: e.target.value })}
                placeholder="Sin límite"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumRank">Rango Mínimo</Label>
              <Select
                value={formData.minimumRank}
                onValueChange={(value) => setFormData({ ...formData, minimumRank: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin requisito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {ranks.map(rank => (
                    <SelectItem key={rank._id} value={rank._id}>
                      {rank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Fecha de Expiración (opcional)</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>

      <SelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        onSelect={handleAddItem}
        totalRate={getTotalRate()}
      />
    </Dialog>
  );
}