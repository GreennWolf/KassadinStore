import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { getRPPrices } from '@/services/rpPriceService';
import { useToast } from '@/hooks/use-toast';

// Componente para una división sortable
const SortableDivision = ({ division, updateDivision, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: division.id || division.name 
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center p-3 border rounded-md mb-2 bg-background"
    >
      <button 
        type="button"
        className="cursor-grab p-1"
        {...attributes} 
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="ml-2 flex-1">
        <Label htmlFor={`division-${index}`} className="sr-only">
          División {index + 1}
        </Label>
        <Input
          id={`division-${index}`}
          value={division.name}
          onChange={(e) => updateDivision(index, { ...division, name: e.target.value })}
          className="w-full"
        />
      </div>
    </div>
  );
};

const EloBoostRankModal = ({ isOpen, onClose, onSave, rank }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    order: 0,
    rankUpPriceRPId: '',  // ID del RP para subir desde el rango anterior
    divisionPriceRPId: '', // ID del RP para subir de división
    divisions: [
      { name: 'IV', order: 0, id: 'div-1' },
      { name: 'III', order: 1, id: 'div-2' },
      { name: 'II', order: 2, id: 'div-3' },
      { name: 'I', order: 3, id: 'div-4' },
    ],
    active: true,
    icon: null,
  });
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [rpPrices, setRpPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Configuración de sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cargar precios RP disponibles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchRPPrices();
    }
  }, [isOpen]);

  // Función para cargar precios RP
  const fetchRPPrices = async () => {
    try {
      setLoading(true);
      const data = await getRPPrices();
      setRpPrices(data);
    } catch (error) {
      console.error('Error fetching RP prices:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los precios de RP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos del rango si estamos editando
  useEffect(() => {
    if (rank && rpPrices.length > 0) {
      setFormData({
        name: rank.name || '',
        order: rank.order || 0,
        rankUpPriceRPId: rank.rankUpPriceRP?._id || '',
        divisionPriceRPId: rank.divisionPriceRP?._id || '',
        divisions: rank.divisions.map((div, index) => ({
          ...div,
          id: `div-${index + 1}`, // Añadir ID para drag and drop
        })) || [],
        active: rank.active !== undefined ? rank.active : true,
        icon: null, // No cargamos el archivo, solo la URL
      });
      
      setPreviewUrl(rank.icon ? import.meta.env.VITE_API_URL + rank.icon : '');
    } else if (!rank) {
      resetForm();
    }
  }, [rank, rpPrices, isOpen]);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      order: 0,
      rankUpPriceRPId: '',
      divisionPriceRPId: '',
      divisions: [
        { name: 'IV', order: 0, id: 'div-1' },
        { name: 'III', order: 1, id: 'div-2' },
        { name: 'II', order: 2, id: 'div-3' },
        { name: 'I', order: 3, id: 'div-4' },
      ],
      active: true,
      icon: null,
    });
    setPreviewUrl('');
  };

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Manejar cambio de select
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejar cambio de switch
  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      active: checked,
    }));
  };

  // Manejar cambio de archivo de imagen
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        icon: file,
      }));
      
      // Previsualizar imagen
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Actualizar una división
  const updateDivision = (index, division) => {
    const newDivisions = [...formData.divisions];
    newDivisions[index] = division;
    setFormData((prev) => ({
      ...prev,
      divisions: newDivisions,
    }));
  };

  // Manejar submit del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar que se seleccionaron precios RP
    if (!formData.rankUpPriceRPId || !formData.divisionPriceRPId) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar precios RP para rango y división',
        variant: 'destructive',
      });
      return;
    }
    
    // Preparar divisiones (eliminar IDs temporales y actualizar órdenes)
    const cleanDivisions = formData.divisions.map((div, index) => ({
      name: div.name,
      order: index,
    }));
    
    // Preparar datos para enviar
    const rankData = {
      ...formData,
      divisions: cleanDivisions,
    };
    
    onSave(rankData);
  };

  // Manejar evento de drag and drop
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.divisions.findIndex(item => item.id === active.id);
        const newIndex = prev.divisions.findIndex(item => item.id === over.id);
        
        return {
          ...prev,
          divisions: arrayMove(prev.divisions, oldIndex, newIndex),
        };
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rank ? 'Editar rango' : 'Crear nuevo rango'}
          </DialogTitle>
          <DialogDescription>
            Complete los detalles del rango de Elo Boost a continuación.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <p>Cargando datos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Rango</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Hierro"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="order">Orden</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  value={formData.order}
                  onChange={handleChange}
                  placeholder="Ej. 1"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Define el orden jerárquico (menor = inferior)
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rankUpPriceRPId">Precio RP para Subir Rango</Label>
                <Select
                  value={formData.rankUpPriceRPId}
                  onValueChange={(value) => handleSelectChange('rankUpPriceRPId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un precio RP" />
                  </SelectTrigger>
                  <SelectContent>
                    {rpPrices.length === 0 ? (
                      <SelectItem value="" disabled>
                        No hay precios RP disponibles
                      </SelectItem>
                    ) : (
                      rpPrices.map((price) => (
                        <SelectItem key={price._id} value={price._id}>
                          {price.valueRP} RP (${price.priceSeguro})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Precio RP para subir desde el rango anterior
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="divisionPriceRPId">Precio RP para Subir División</Label>
                <Select
                  value={formData.divisionPriceRPId}
                  onValueChange={(value) => handleSelectChange('divisionPriceRPId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un precio RP" />
                  </SelectTrigger>
                  <SelectContent>
                    {rpPrices.length === 0 ? (
                      <SelectItem value="" disabled>
                        No hay precios RP disponibles
                      </SelectItem>
                    ) : (
                      rpPrices.map((price) => (
                        <SelectItem key={price._id} value={price._id}>
                          {price.valueRP} RP (${price.priceSeguro})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Precio RP para subir de división dentro del mismo rango
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="icon">Icono del Rango</Label>
              <div className="flex items-start space-x-4">
                <div>
                  <Input
                    id="icon"
                    name="icon"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full"
                    required={!rank}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Imagen PNG o JPG recomendada (128x128px)
                  </p>
                </div>
                
                {previewUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="w-16 h-16 object-contain border rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="divisions">Divisiones</Label>
                <p className="text-xs text-muted-foreground">
                  Arrastre para reordenar
                </p>
              </div>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={formData.divisions.map(d => d.id || d.name)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {formData.divisions.map((division, index) => (
                      <SortableDivision
                        key={division.id || division.name}
                        division={division}
                        updateDivision={updateDivision}
                        index={index}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="active">Activo</Label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {rank ? 'Actualizar Rango' : 'Crear Rango'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EloBoostRankModal;