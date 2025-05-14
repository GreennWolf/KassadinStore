import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SelectionModal } from "./SelectionModal";
import { Plus, X, Upload, Trophy, AlertCircle, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createRewardCouponPreset, getRewardCouponPresetByType } from "../../../services/rewardCouponPresetService";
// Importamos el servicio para fragmentos
import { createFragmentsPreset } from "../../../services/fragmentsService";

export function LootboxModal({ isOpen, onClose, lootbox, onSubmit, mode, ranks = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    items: [],
    purchaseLimit: "",
    minimumRank: "none",
    endDate: "",
    file: null,
    color: "#808080" // Valor predeterminado: gris
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lootbox && mode === "edit") {
      // Transformar items populados a { itemId: <string> } antes de usar
      const transformedItems = lootbox.items.map(item => {
        const newItem = { ...item };
        if (item.itemType === 'Skin' || item.itemType === 'Item') {
          if (typeof item.itemId === 'object' && item.itemId._id) {
            newItem.itemId = item.itemId._id;
          }
        } else if (item.itemType === 'Gold') {
          newItem.itemId = item.details?.amount || '0';
        } else if (item.itemType === 'RewardCouponPreset') {
          if (typeof item.itemId === 'object' && item.itemId.discount && item.itemId.days) {
            newItem.itemId = `${item.itemId.discount}-${item.itemId.days}`;
          } else {
            if (item.details?.discount && item.details?.days) {
              newItem.itemId = `${item.details.discount}-${item.details.days}`;
            }
          }
        }
        // Para los fragmentos, asumimos que ya viene con el id correcto o con "local-preset"
        return newItem;
      });

      setFormData({
        name: lootbox.name,
        description: lootbox.description,
        price: lootbox.price,
        items: transformedItems,
        purchaseLimit: lootbox.purchaseLimit || "",
        minimumRank: lootbox.minimumRank?._id || "none",
        endDate: lootbox.endDate ? new Date(lootbox.endDate).toISOString().split('T')[0] : "",
        file: null,
        color: lootbox.color || "#808080" // Usar el color de la lootbox o el predeterminado
      });
      if (lootbox.image) {
        setImagePreview(lootbox.image);
      }
    } else if (!lootbox && mode === "create") {
      setFormData({
        name: "",
        description: "",
        price: "",
        items: [],
        purchaseLimit: "",
        minimumRank: "none",
        endDate: "",
        file: null,
        color: "#808080" // Valor predeterminado para nuevas lootboxes
      });
      setImagePreview(null);
    }
  }, [lootbox, mode]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
    if (!formData.description.trim()) newErrors.description = "La descripción es requerida";
    if (!formData.price || formData.price <= 0) newErrors.price = "El precio debe ser mayor a 0";
    if (formData.items.length === 0) newErrors.items = "Debe agregar al menos un item";

    const totalRate = getTotalRate();
    if (totalRate !== 100) {
      newErrors.items = `La suma de probabilidades debe ser 100% (actual: ${totalRate}%)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) {
      toast.error("Por favor, corrija los errores antes de continuar");
      return;
    }
  
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("price", formData.price);
      submitData.append("color", formData.color); // Agregar el color al formulario
  
      let preparedItems = [...formData.items];
  
      // console.log("🔍 Buscando cupones existentes...");
      let existingPresets = [];
      try {
        existingPresets = await getRewardCouponPresetByType("lootbox");
        // console.log("✅ Cupones existentes obtenidos:", existingPresets);
      } catch (error) {
        console.error("⚠️ Error obteniendo cupones existentes:", error);
        toast.error("No se pudo verificar los cupones existentes.");
      }
  
      // Procesar cupones y fragmentos antes de enviar los datos
      const updatedItems = await Promise.all(
        preparedItems.map(async (item) => {
          if (
            item.itemType === "RewardCouponPreset" &&
            item.itemId === "local-preset"
          ) {
            // Procesar cupones
            const existingPreset = existingPresets.find(
              (preset) =>
                preset.percent === parseInt(item.details.percent, 10) &&
                preset.validDays === parseInt(item.details.validDays, 10) &&
                preset.maxUses === parseInt(item.details.maxUses, 10) &&
                preset.rpType === item.details.rpType &&
                preset.rpPrice?.toString() === item.details.rpPrice &&
                preset.maxApplicableSkins?.toString() === item.details.maxApplicableSkins &&
                preset.applicableTo?.toString() === item.details.applicableTo
            );
  
            if (existingPreset) {
              return { ...item, itemId: existingPreset._id };
            } else {
              try {
                const createdPreset = await createRewardCouponPreset({
                  name: item.details.name,
                  percent: parseInt(item.details.percent, 10),
                  validDays: parseInt(item.details.validDays, 10),
                  maxUses: parseInt(item.details.maxUses, 10),
                  type: "lootbox",
                  rpPrice: item.details.rpPrice,
                  rpType: item.details.rpType,
                  maxApplicableSkins: item.details.maxApplicableSkins,
                  applicableTo: item.details.applicableTo,
                });
                return { ...item, itemId: createdPreset._id };
              } catch (error) {
                console.error("❌ Error al crear el preset del cupón:", error);
                toast.error("No se pudo crear el cupón en la base de datos.");
                return null;
              }
            }
          } else if (item.itemType === "FragmentsPreset") {
            // Siempre creamos un nuevo preset de fragmentos y usamos su _id
            try {
              const createdFragmentPreset = await createFragmentsPreset({
                name: item.details.name,
                type: item.details.type,
                rewardType: item.details.rewardType,
                requiredQuantity: parseInt(item.details.requiredQuantity, 10),
                ...(item.details.itemId ? { itemId: item.details.itemId } : {}),
                ...(item.details.rpId ? { rpId: item.details.rpId } : {}),
              });
              // console.log('enviado',{ ...item, itemId: createdFragmentPreset.data_id } , createdFragmentPreset);
              return { ...item, itemId: createdFragmentPreset.data._id };
            } catch (error) {
              console.error("❌ Error al crear el preset del fragmento:", error);
              toast.error("No se pudo crear el fragmento en la base de datos.");
              return null;
            }
          }
          return item;
        })
      );
  
      // console.log("🚀 Enviando lootbox con los siguientes items:", updatedItems);
      preparedItems = updatedItems.filter((item) => item !== null);
  
      if (preparedItems.length === 0) {
        toast.error("No se pudo agregar ningún item a la lootbox.");
        return;
      }
  
      submitData.append("items", JSON.stringify(preparedItems));
  
      if (formData.purchaseLimit) {
        submitData.append("purchaseLimit", formData.purchaseLimit);
      }
      if (formData.minimumRank && formData.minimumRank !== "none") {
        submitData.append("minimumRank", formData.minimumRank);
      }
      if (formData.endDate) {
        submitData.append("endDate", formData.endDate);
      }
      if (formData.file) {
        submitData.append("image", formData.file);
      }
  
      // console.log("🚀 Enviando lootbox con los siguientes items:", preparedItems);
  
      await onSubmit(submitData);
  
      toast.success("🎉 Lootbox creada correctamente.");
  
      resetForm();
    } catch (error) {
      console.error("❌ Error al crear la lootbox:", error);
      toast.error("Error al crear la lootbox. Revisa los datos e intenta de nuevo.");
    }
  };  
  
  const resetForm = () => {
    // console.log("🧹 Reseteando formulario...");

    setFormData({
      name: "",
      description: "",
      price: "",
      items: [],
      purchaseLimit: "",
      minimumRank: "none",
      endDate: "",
      file: null,
      color: "#808080" // Resetear al color predeterminado
    });

    setImagePreview(null);
    onClose();
    toast.info("El formulario ha sido restablecido.");
  };

  const handleAddItem = (item) => {
    // Asegurarse que el item tenga un color asignado
    const itemWithColor = {
      ...item,
      color: item.color || getDefaultColorByType(item.itemType)
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, itemWithColor]
    }));
    setErrors(prev => ({ ...prev, items: null }));
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
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleUpdateItemColor = (index, newColor) => {
    const updatedItems = formData.items.map((item, i) =>
      i === index ? { ...item, color: newColor } : item
    );
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar los 5MB");
        return;
      }
      setFormData(prev => ({ ...prev, file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const getTotalRate = () => {
    return formData.items.reduce((sum, item) => sum + Number(item.dropRate), 0);
  };

  // Función para obtener un color predeterminado según el tipo de item
  const getDefaultColorByType = (itemType) => {
    switch (itemType) {
      case 'Skin':
        return '#9C27B0'; // Púrpura para skins
      case 'Gold':
        return '#FFD700'; // Dorado para oro
      case 'RewardCouponPreset':
        return '#4CAF50'; // Verde para cupones
      case 'FragmentsPreset':
        return '#2196F3'; // Azul para fragmentos
      case 'Item':
      default:
        return '#FF5722'; // Naranja para items generales
    }
  };

  // Ya no usamos clases basadas en rareza, ahora usamos el color personalizado del item
  const getItemStyle = (item) => {
    // Extraer el color sin el # para usarlo en las clases
    const itemColor = item.color || getDefaultColorByType(item.itemType);
    
    return {
      border: 'border-border',
      bg: 'bg-background',
      text: 'text-foreground',
      shadow: 'shadow-sm',
      customColor: itemColor // Guardamos el color personalizado para usarlo con style
    };
  };

  const getItemDisplay = (item) => {
    // console.log(item);
    switch (item.itemType) {
      case 'Skin':
      case 'Item':
        return item.details?.name || 'Item';
      case 'RewardCouponPreset':
        return `${item.details.name}`;
      case 'Gold':
        return `${item.details?.amount || '0'} Oro`;
      case 'FragmentsPreset':
        return `${item.details.name}`;
      default:
        return item.itemType;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-4xl h-screen overflow-y-auto overflow-x-hidden p-0",
          "sm:rounded-lg"
        )}
      >
        <ScrollArea className="h-[80vh] overflow-x-hidden">
          <div className="p-6">
            <DialogHeader className="pb-2">
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6 text-primary" />
                {mode === "create" ? "Crear Nueva Lootbox" : "Editar Lootbox"}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Información General</TabsTrigger>
                <TabsTrigger value="items">Items y Probabilidades</TabsTrigger>
              </TabsList>

              <form id="lootbox-form" onSubmit={handleSubmit} className="space-y-6 py-6">
                {/* Pestaña General */}
                <TabsContent value="general" className="m-0 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                      )}
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
                      {errors.price && (
                        <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="resize-none min-h-[100px]"
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                    )}
                  </div>

                  {/* Nuevo campo para el color */}
                  <div className="space-y-2">
                    <Label htmlFor="color">Color de la Lootbox</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-16 h-12 p-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{formData.color}</p>
                        <p className="text-xs text-muted-foreground">
                          Este color se usará para personalizar la apariencia de la lootbox
                        </p>
                      </div>
                    </div>
                  </div>

                  <Card>
                    <div className="border-b">
                      <CardHeader>
                        <CardTitle className="text-base">Imagen de la Lootbox</CardTitle>
                      </CardHeader>
                    </div>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        {imagePreview ? (
                          <div className="relative w-40 h-40 group">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setImagePreview(null);
                                setFormData(prev => ({ ...prev, file: null }));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-40 h-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                            <div className="text-center">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <span className="text-sm text-muted-foreground mt-2">
                                Subir imagen
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <Input
                            id="image"
                            type="file"
                            onChange={handleImageChange}
                            accept="image/*"
                            className="cursor-pointer"
                          />
                          <p className="text-sm text-muted-foreground">
                            Formato: JPG, PNG o WebP. Máximo 5MB.
                          </p>
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
                    <Label htmlFor="endDate">Fecha de Expiración</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </TabsContent>

                {/* Pestaña Items */}
                <TabsContent value="items" className="m-0">
                  <Card>
                    <div className="border-b">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base">Items de la Lootbox</CardTitle>
                        <div className={cn(
                          "text-sm",
                          getTotalRate() === 100 ? "text-green-500" : "text-yellow-500"
                        )}>
                          Total: {getTotalRate()}%
                          {getTotalRate() !== 100 && (
                            <span>
                              {getTotalRate() < 100 
                                ?  `(Faltan ${100 - getTotalRate()}%)`
                                :  `(Excede por ${getTotalRate() - 100}%)`}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                    </div>
                    <CardContent className="space-y-4">
                      {errors.items && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {errors.items}
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={() => setShowSelectionModal(true)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Item
                      </Button>

                      <div className="space-y-3">
                        {formData.items.map((item, index) => {
                          const itemStyle = getItemStyle(item);
                          return (
                            <Card
                              key={`${item.itemType}-${item.itemId}-${index}`}
                              className={cn(
                                "border transition-all hover:shadow-md overflow-hidden",
                                itemStyle.shadow
                              )}
                              style={{
                                borderColor: itemStyle.customColor,
                                borderLeftWidth: '4px'
                              }}
                            >
                              <CardContent className="flex items-center p-4">
                                {item.details?.image && (
                                  <div className="w-12 h-12 rounded overflow-hidden mr-4">
                                    <img
                                      src={item.details.image}
                                      alt={item.details.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {getItemDisplay(item)}
                                  </div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span>{item.itemType}</span>
                                    <div 
                                      className="w-3 h-3 rounded-full border border-muted" 
                                      style={{ backgroundColor: itemStyle.customColor }}
                                      title="Color del recuadro de recompensa"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {/* Selector de color para el item */}
                                  <div className="flex items-center gap-2" title="Color del recuadro de la recompensa">
                                    <div className="flex items-center gap-1">
                                      <Palette className="h-4 w-4 text-muted-foreground" />
                                      <div 
                                        className="w-6 h-6 rounded border border-border overflow-hidden cursor-pointer"
                                        style={{ background: `linear-gradient(to bottom right, ${item.color || getDefaultColorByType(item.itemType)} 50%, white 50%)` }}
                                      >
                                        <Input
                                          type="color"
                                          value={item.color || getDefaultColorByType(item.itemType)}
                                          onChange={(e) => handleUpdateItemColor(index, e.target.value)}
                                          className="h-8 w-8 opacity-0 cursor-pointer"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Selector de porcentaje */}
                                  <div className="w-20 flex items-center">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={item.dropRate}
                                      onChange={(e) => handleUpdateItemRate(index, e.target.value)}
                                      className="text-right"
                                    />
                                    <span className="text-sm ml-1">%</span>
                                  </div>
                                  
                                  {/* Botón para eliminar */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(index)}
                                    className="hover:text-red-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </form>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-background/95 backdrop-blur py-4 px-6">
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="lootbox-form"
              disabled={getTotalRate() !== 100}
            >
              {mode === "create" ? "Crear Lootbox" : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal de selección de items */}
      <SelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        onSelect={handleAddItem}
        totalRate={getTotalRate()}
      />
    </Dialog>
  );
}