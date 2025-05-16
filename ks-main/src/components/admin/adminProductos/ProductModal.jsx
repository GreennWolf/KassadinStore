import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle } from "lucide-react";
import { getAllRpPrice } from "../../../services/rpService";
import { getAllChampions } from "../../../services/champsService";
import UnrankedSkinSelector from './UnrankedSkinSelector';
import { toast } from 'sonner';

// Constantes
const REGIONS = ['LAS', 'LAN', 'NA', 'EUW', 'EUNE', 'OCE', 'BR', 'KR', 'JP', 'TR', 'RU'];

const ITEM_TYPES = [
    { value: 'loot', label: 'Botín' },
    { value: 'icon', label: 'Icono' },
    { value: 'chromas', label: 'Chroma' },
    { value: 'presale', label: 'Preventa' },
    { value: 'tft', label: 'TFT' },
    { value: 'bundle', label: 'Bundle' }
];

/**
 * Componente ProductModal rediseñado para solucionar problemas con cuentas unranked.
 * Maneja la creación y edición de productos (skins, items, unrankeds).
 */
export const ProductModal = ({ isOpen, onClose, product, onSubmit, mode, activeCategory }) => {
    // ==================== ESTADOS ====================
    
    // Estado principal del formulario 
    const [formData, setFormData] = useState({
        // Campos generales
        name: '',            // Para items
        titulo: '',          // Para unrankeds
        NombreSkin: '',      // Para skins
        priceRP: '',
        type: activeCategory,
        srcWeb: '',
        src: null,
        skin: '',            // Para chromas
        champion: '',        // Para skins
        reward: false,
        
        // Campos específicos para unrankeds
        nivel: '',
        escencia: '',
        rpAmount: '',
        escenciaNaranja: '',
        region: '',
        handUpgrade: true,
        stock: 1,            // Stock para unrankeds (nuevo campo)
        selectedSkins: []    // Skins seleccionadas con datos completos
    });
    
    // Estados para datos externos
    const [rpPrices, setRpPrices] = useState([]);
    const [champions, setChampions] = useState([]);
    
    // Estados de UI
    const [loading, setLoading] = useState(false);
    const [skinSelectorOpen, setSkinSelectorOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    
    // ==================== EFECTOS ====================
    
    // Cargar datos iniciales cuando se abre el modal
    useEffect(() => {
        if (!isOpen) return;
        
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const promises = [getAllRpPrice()];
                
                // Cargar campeones solo si es necesario
                if (activeCategory === 'skins') {
                    promises.push(getAllChampions());
                }
                
                const results = await Promise.all(promises);
                
                // Actualizar estados
                setRpPrices(results[0] || []);
                
                if (activeCategory === 'skins' && results[1]) {
                    setChampions(results[1]);
                }
            } catch (error) {
                console.error('Error al cargar datos iniciales:', error);
                toast.error('Error al cargar datos. Por favor, intenta nuevamente.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchInitialData();
    }, [isOpen, activeCategory]);
    
    // Inicializar/resetear formulario cuando cambia el producto o se abre/cierra el modal
    useEffect(() => {
        if (!isOpen) return;
        
        // Resetear errores
        setErrors({});
        setTouched({});
        
        // Inicializar con datos del producto si estamos editando
        if (product && mode === 'edit') {
            // Procesar skins si existen
            let selectedSkins = [];
            
            if (product.skins && Array.isArray(product.skins)) {
                // Extraer datos relevantes de cada skin
                selectedSkins = product.skins
                    .filter(skin => skin && (typeof skin === 'string' || skin._id))
                    .map(skin => {
                        // Si la skin es solo un ID
                        if (typeof skin === 'string') {
                            return {
                                id: skin,
                                name: `Skin ${skin.slice(-6)}`
                            };
                        }
                        
                        // Si la skin es un objeto
                        const API_BASE_URL = `${import.meta.env.VITE_API_URL || ''}/images`;
                        
                        return {
                            id: skin._id,
                            name: skin.NombreSkin || `Skin ${skin._id.slice(-6)}`,
                            champion: skin.championData?.name || 'Campeón',
                            imageUrl: skin.srcLocal ? 
                                (skin.srcLocal.startsWith('http') ? 
                                    skin.srcLocal : 
                                    `${API_BASE_URL}/${skin.srcLocal.replace(/\\/g, '/')}`) : 
                                (skin.srcWeb || null)
                        };
                    });
            }
            
            // Actualizar formData con datos del producto
            setFormData({
                name: product.name || '',
                titulo: product.titulo || '',
                NombreSkin: product.NombreSkin || '',
                priceRP: product.priceRP?._id || product.priceRP || '',
                type: product.type || activeCategory,
                srcWeb: product.srcWeb || '',
                src: null,
                skin: product.skin?._id || product.skin || '',
                champion: product.champion?._id || product.champion || '',
                reward: product.reward || false,
                nivel: product.nivel || '',
                escencia: product.escencia || '',
                escenciaNaranja: product.escenciaNaranja || '',
                rpAmount: product.rpAmount || '',
                region: product.region || '',
                handUpgrade: product.handUpgrade !== undefined ? product.handUpgrade : true,
                stock: product.stock !== undefined ? product.stock : 1,
                selectedSkins: selectedSkins
            });
        } else {
            // Inicializar con valores por defecto para un nuevo producto
            setFormData({
                name: '',
                titulo: '',
                NombreSkin: '',
                priceRP: '',
                type: activeCategory,
                srcWeb: '',
                src: null,
                skin: '',
                champion: '',
                reward: false,
                nivel: '',
                escencia: '',
                rpAmount: '',
                escenciaNaranja: '',
                region: '',
                handUpgrade: true,
                stock: 1,
                selectedSkins: []
            });
        }
    }, [isOpen, product, mode, activeCategory]);
    
    // ==================== MANEJADORES DE EVENTOS ====================
    
    // Manejar cambios en los campos del formulario
    const handleChange = (e) => {
        const { id, name, value, type, checked } = e.target;
        const fieldName = id || name;
        const fieldValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({
            ...prev,
            [fieldName]: fieldValue
        }));
        
        // Marcar campo como tocado para validación
        setTouched(prev => ({
            ...prev,
            [fieldName]: true
        }));
        
        // Validar campo
        validateField(fieldName, fieldValue);
    };
    
    // Manejar cambios de archivo (imagen)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({
                ...prev,
                src: 'Solo se permiten archivos de imagen'
            }));
            e.target.value = '';
            return;
        }
        
        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setErrors(prev => ({
                ...prev,
                src: 'La imagen debe ser menor a 5MB'
            }));
            e.target.value = '';
            return;
        }
        
        // Actualizar estado y limpiar error
        setFormData(prev => ({
            ...prev,
            src: file
        }));
        
        setTouched(prev => ({
            ...prev,
            src: true
        }));
        
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.src;
            return newErrors;
        });
    };
    
    // Manejar selección de skins
    const handleSkinSelection = (selectedSkins) => {
        console.log('Skins seleccionadas:', selectedSkins);
        
        setFormData(prev => ({
            ...prev,
            selectedSkins: selectedSkins || []
        }));
    };
    
    // ==================== VALIDACIÓN ====================
    
    // Validar un campo específico
    const validateField = (field, value) => {
        let error = null;
        
        switch (field) {
            case 'NombreSkin':
                if (activeCategory === 'skins' && !value?.trim()) {
                    error = 'El nombre de la skin es requerido';
                }
                break;
                
            case 'name':
                if (activeCategory !== 'skins' && activeCategory !== 'unrankeds' && !value?.trim()) {
                    error = 'El nombre es requerido';
                }
                break;
                
            case 'titulo':
                if (activeCategory === 'unrankeds' && !value?.trim()) {
                    error = 'El título es requerido';
                }
                break;
                
            case 'priceRP':
                if (!value) {
                    error = 'Seleccione un precio';
                }
                break;
                
            case 'champion':
                if (activeCategory === 'skins' && !value) {
                    error = 'Seleccione un campeón';
                }
                break;
                
            case 'nivel':
                if (activeCategory === 'unrankeds') {
                    if (!value) {
                        error = 'El nivel es requerido';
                    } else if (parseInt(value) < 1) {
                        error = 'El nivel debe ser mayor a 0';
                    }
                }
                break;

            case 'stock':
                if (activeCategory === 'unrankeds') {
                    if (!value) {
                        error = 'El stock es requerido';
                    } else if (parseInt(value) < 1) {
                        error = 'El stock debe ser al menos 1';
                    }
                }
                break;
                
            case 'rpAmount':
                if (activeCategory === 'unrankeds') {
                    if (!value) {
                        error = 'La cantidad de RP es requerida';
                    } else if (parseInt(value) < 0) {
                        error = 'No puede ser negativo';
                    }
                }
                break;
                
            case 'region':
                if (activeCategory === 'unrankeds' && !value) {
                    error = 'Seleccione una región';
                }
                break;
                
            case 'skin':
                if (formData.type === 'chromas' && !value) {
                    error = 'Seleccione una skin';
                }
                break;
        }
        
        // Actualizar estado de errores
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));
        
        return !error;
    };
    
    // Validar todo el formulario
    const validateForm = () => {
        const fieldsToValidate = {
            skins: ['NombreSkin', 'champion', 'priceRP'],
            unrankeds: ['titulo', 'priceRP', 'nivel', 'rpAmount', 'region', 'escenciaNaranja', 'stock'],
            default: ['name', 'type', 'priceRP']
        };
        
        // Determinar campos a validar según la categoría
        const fieldList = activeCategory === 'skins' 
            ? fieldsToValidate.skins 
            : activeCategory === 'unrankeds'
                ? fieldsToValidate.unrankeds
                : fieldsToValidate.default;
                
        // Validar si es chroma
        if (formData.type === 'chromas') {
            fieldList.push('skin');
        }
        
        // Validar todos los campos
        let isValid = true;
        
        fieldList.forEach(field => {
            // Marcar como tocado
            setTouched(prev => ({
                ...prev,
                [field]: true
            }));
            
            // Validar
            const fieldValid = validateField(field, formData[field]);
            if (!fieldValid) {
                isValid = false;
            }
        });
        
        // Validar imagen en crear
        if (mode === 'create' && !formData.src && !formData.srcWeb) {
            setErrors(prev => ({
                ...prev,
                src: 'Se requiere una imagen (local o URL)'
            }));
            
            setTouched(prev => ({
                ...prev,
                src: true
            }));
            
            isValid = false;
        }
        
        return isValid;
    };
    
    // Determinar si un campo tiene error
    const hasError = (field) => {
        return touched[field] && errors[field];
    };
    
    // Renderizar mensaje de error
    const renderError = (field) => {
        if (hasError(field)) {
            return (
                <div className="text-red-500 text-sm mt-1">
                    {errors[field]}
                </div>
            );
        }
        return null;
    };
    
    // ==================== ENVÍO DEL FORMULARIO ====================
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validar formulario
        if (!validateForm()) {
            toast.error('Por favor, completa todos los campos requeridos');
            return;
        }
        
        try {
            setLoading(true);
            
            // Preparar los datos según la categoría
            if (activeCategory === 'unrankeds') {
                // Para unrankeds, usar FormData
                const formDataObj = new FormData();
                
                // Añadir campos básicos
                formDataObj.append('titulo', formData.titulo);
                formDataObj.append('priceRP', formData.priceRP);
                formDataObj.append('nivel', formData.nivel);
                formDataObj.append('rpAmount', formData.rpAmount);
                formDataObj.append('region', formData.region);
                formDataObj.append('escenciaNaranja', formData.escenciaNaranja || '0');
                formDataObj.append('escencia', formData.escencia || '0');
                formDataObj.append('handUpgrade', formData.handUpgrade ? 'true' : 'false');
                formDataObj.append('stock', formData.stock || '1');
                
                if (formData.srcWeb) {
                    formDataObj.append('srcWeb', formData.srcWeb);
                }
                
                // Añadir imagen si existe
                if (formData.src) {
                    formDataObj.append('image', formData.src);
                }
                
                // SIMPLIFICACIÓN: Usar un solo enfoque consistente para las skins
                // Extraer IDs de las skins seleccionadas
                const skinIds = formData.selectedSkins
                    .filter(skin => typeof skin.id === 'string' && skin.id.match(/^[0-9a-fA-F]{24}$/))
                    .map(skin => skin.id);
                
                console.log(`[DEBUG] Enviando ${skinIds.length} skins:`, skinIds);
                
                // Añadir cada ID individualmente con notación skins[]
                if (skinIds.length > 0) {
                    skinIds.forEach(id => {
                        formDataObj.append('skins[]', id);
                    });
                } else {
                    // Si no hay skins seleccionadas, enviar array vacío
                    formDataObj.append('skins[]', '');
                }
                
                // Manejo especial para edición si hay un ID de producto
                if (mode === 'edit' && product && product._id) {
                    // Primero actualizar con el FormData (datos básicos + skins)
                    await onSubmit(formDataObj);
                    
                    toast.success('¡Cuenta unranked actualizada con éxito!');
                    onClose();
                } else {
                    // Para crear, simplemente enviar el FormData
                    await onSubmit(formDataObj);
                    toast.success('¡Cuenta unranked creada con éxito!');
                    onClose();
                }
            } else if (activeCategory === 'skins') {
                // Para skins
                const usesFormData = !!formData.src;
                
                if (usesFormData) {
                    const formDataObj = new FormData();
                    
                    formDataObj.append('NombreSkin', formData.NombreSkin);
                    formDataObj.append('champion', formData.champion);
                    formDataObj.append('priceRP', formData.priceRP);
                    formDataObj.append('reward', formData.reward ? 'true' : 'false');
                    
                    if (formData.srcWeb) {
                        formDataObj.append('srcWeb', formData.srcWeb);
                    }
                    
                    formDataObj.append('image', formData.src);
                    
                    await onSubmit(formDataObj);
                } else {
                    // Si no hay imagen, enviar como JSON
                    const submitData = {
                        NombreSkin: formData.NombreSkin,
                        champion: formData.champion,
                        priceRP: formData.priceRP,
                        srcWeb: formData.srcWeb || '',
                        reward: formData.reward
                    };
                    
                    await onSubmit(submitData);
                }
                
                // Notificar éxito
                toast.success(`${mode === 'create' ? 'Skin creada' : 'Skin actualizada'} con éxito`);
                onClose();
            } else {
                // Para items
                const usesFormData = !!formData.src;
                
                if (usesFormData) {
                    const formDataObj = new FormData();
                    
                    formDataObj.append('name', formData.name);
                    formDataObj.append('type', formData.type);
                    formDataObj.append('priceRP', formData.priceRP);
                    formDataObj.append('reward', formData.reward ? 'true' : 'false');
                    
                    if (formData.srcWeb) {
                        formDataObj.append('srcWeb', formData.srcWeb);
                    }
                    
                    if (formData.type === 'chromas' && formData.skin) {
                        formDataObj.append('skin', formData.skin);
                    }
                    
                    formDataObj.append('image', formData.src);
                    
                    await onSubmit(formDataObj);
                } else {
                    // Si no hay imagen, enviar como JSON
                    const submitData = {
                        name: formData.name,
                        type: formData.type,
                        priceRP: formData.priceRP,
                        srcWeb: formData.srcWeb || '',
                        reward: formData.reward
                    };
                    
                    if (formData.type === 'chromas' && formData.skin) {
                        submitData.skin = formData.skin;
                    }
                    
                    await onSubmit(submitData);
                }
                
                // Notificar éxito
                toast.success(`${mode === 'create' ? 'Item creado' : 'Item actualizado'} con éxito`);
                onClose();
            }
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            toast.error(error.message || 'Error al enviar el formulario');
        } finally {
            setLoading(false);
        }
    };
    
    // ==================== RENDERIZADO ====================
    
    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {mode === 'create' ? 'Crear' : 'Editar'} {
                                activeCategory === 'skins' ? 'Skin' : 
                                activeCategory === 'unrankeds' ? 'Cuenta' : 
                                'Item'
                            }
                        </DialogTitle>
                    </DialogHeader>
        
                    {loading && !rpPrices.length ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p>Cargando datos...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {activeCategory === 'unrankeds' ? (
                                // Formulario para Unrankeds
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="titulo">Título</Label>
                                        <Input
                                            id="titulo"
                                            value={formData.titulo}
                                            onChange={handleChange}
                                            className={hasError('titulo') ? 'border-red-500' : ''}
                                        />
                                        {renderError('titulo')}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nivel">Nivel</Label>
                                            <Input
                                                id="nivel"
                                                type="number"
                                                value={formData.nivel}
                                                onChange={handleChange}
                                                min="1"
                                                className={hasError('nivel') ? 'border-red-500' : ''}
                                            />
                                            {renderError('nivel')}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="stock">Stock</Label>
                                            <Input
                                                id="stock"
                                                type="number"
                                                value={formData.stock}
                                                onChange={handleChange}
                                                min="1"
                                                className={hasError('stock') ? 'border-red-500' : ''}
                                            />
                                            {renderError('stock')}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="escencia">Esencia Azul</Label>
                                            <Input
                                                id="escencia"
                                                type="number"
                                                value={formData.escencia}
                                                onChange={handleChange}
                                                min="0"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="escenciaNaranja">Esencia Naranja</Label>
                                            <Input
                                                id="escenciaNaranja"
                                                type="number"
                                                value={formData.escenciaNaranja}
                                                onChange={handleChange}
                                                min="0"
                                                className={hasError('escenciaNaranja') ? 'border-red-500' : ''}
                                            />
                                            {renderError('escenciaNaranja')}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="rpAmount">Cantidad de RP</Label>
                                            <Input
                                                id="rpAmount"
                                                type="number"
                                                value={formData.rpAmount}
                                                onChange={handleChange}
                                                min="0"
                                                className={hasError('rpAmount') ? 'border-red-500' : ''}
                                            />
                                            {renderError('rpAmount')}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="region">Región</Label>
                                            <select
                                                id="region"
                                                className={`flex h-10 w-full rounded-md border ${
                                                    hasError('region') ? 'border-red-500' : 'border-input'
                                                } bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                                                value={formData.region}
                                                onChange={handleChange}
                                            >
                                                <option value="">Seleccionar región</option>
                                                {REGIONS.map(region => (
                                                    <option key={region} value={region}>
                                                        {region}
                                                    </option>
                                                ))}
                                            </select>
                                            {renderError('region')}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="handUpgrade"
                                            checked={formData.handUpgrade}
                                            onCheckedChange={(checked) => 
                                                setFormData(prev => ({ ...prev, handUpgrade: checked }))
                                            }
                                        />
                                        <Label htmlFor="handUpgrade">
                                            Subida a mano
                                        </Label>
                                    </div>

                                    {/* Sección de skins */}
                                    <div className="space-y-2 mt-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-base">Skins de la cuenta</Label>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setSkinSelectorOpen(true)}
                                            >
                                                Editar Skins
                                            </Button>
                                        </div>
                                        
                                        <div className="border rounded-md p-3 min-h-[100px] bg-background overflow-y-auto">
                                            {formData.selectedSkins && formData.selectedSkins.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.selectedSkins.map((skin, index) => (
                                                        <div 
                                                            key={index} 
                                                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm flex items-center"
                                                            title={`${skin.name} ${skin.champion ? `(${skin.champion})` : ''}`}
                                                        >
                                                            {skin.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                                    No hay skins seleccionadas
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground">
                                            Total: {formData.selectedSkins?.length || 0} skins seleccionadas
                                        </div>
                                    </div>
                                </>
                            ) : activeCategory === 'skins' ? (
                                // Formulario para Skins
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="NombreSkin">Nombre de la Skin</Label>
                                        <Input
                                            id="NombreSkin"
                                            value={formData.NombreSkin}
                                            onChange={handleChange}
                                            className={hasError('NombreSkin') ? 'border-red-500' : ''}
                                        />
                                        {renderError('NombreSkin')}
                                    </div>
        
                                    <div className="space-y-2">
                                        <Label htmlFor="champion">Campeón</Label>
                                        <select
                                            id="champion"
                                            className={`flex h-10 w-full rounded-md border ${
                                                hasError('champion') ? 'border-red-500' : 'border-input'
                                            } bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                                            value={formData.champion}
                                            onChange={handleChange}
                                        >
                                            <option value="">Seleccionar campeón</option>
                                            {champions.map((champ) => (
                                                <option key={champ._id} value={champ._id}>
                                                    {champ.name}
                                                </option>
                                            ))}
                                        </select>
                                        {renderError('champion')}
                                    </div>
                                </>
                            ) : (
                                // Formulario para Items
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre del Item</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={hasError('name') ? 'border-red-500' : ''}
                                        />
                                        {renderError('name')}
                                    </div>
        
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Tipo de Item</Label>
                                        <select
                                            id="type"
                                            className={`flex h-10 w-full rounded-md border ${
                                                hasError('type') ? 'border-red-500' : 'border-input'
                                            } bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                                            value={formData.type}
                                            onChange={handleChange}
                                        >
                                            <option value="">Seleccionar tipo</option>
                                            {ITEM_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                        {renderError('type')}
                                    </div>
                                </>
                            )}
        
                            {/* Campos comunes para todas las categorías */}
                            <div className="space-y-2">
                                <Label htmlFor="priceRP">Precio RP</Label>
                                <select
                                    id="priceRP"
                                    className={`flex h-10 w-full rounded-md border ${
                                        hasError('priceRP') ? 'border-red-500' : 'border-input'
                                    } bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                                    value={formData.priceRP}
                                    onChange={handleChange}
                                >
                                    <option value="">Seleccionar precio</option>
                                    {rpPrices.map((price) => (
                                        <option key={price._id} value={price._id}>
                                            {price.valueRP} RP
                                        </option>
                                    ))}
                                </select>
                                {renderError('priceRP')}
                            </div>
        
                            {formData.type === 'chromas' && (
                                <div className="space-y-2">
                                    <Label htmlFor="skin">Skin Asociada</Label>
                                    <select
                                        id="skin"
                                        className={`flex h-10 w-full rounded-md border ${
                                            hasError('skin') ? 'border-red-500' : 'border-input'
                                        } bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                                        value={formData.skin}
                                        onChange={handleChange}
                                    >
                                        <option value="">Seleccionar skin</option>
                                        {/* Aquí se cargarían las skins disponibles */}
                                    </select>
                                    {renderError('skin')}
                                </div>
                            )}
        
                            <div className="space-y-2">
                                <Label htmlFor="srcWeb">URL de la imagen (opcional)</Label>
                                <Input
                                    id="srcWeb"
                                    value={formData.srcWeb}
                                    onChange={handleChange}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                            </div>
        
                            <div className="space-y-2">
                                <Label htmlFor="src">Imagen Local</Label>
                                <Input
                                    id="src"
                                    type="file"
                                    accept="image/*"
                                    className={`cursor-pointer ${hasError('src') ? 'border-red-500' : ''}`}
                                    onChange={handleFileChange}
                                />
                                {renderError('src')}
                                {formData.src && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Archivo seleccionado: {formData.src.name}
                                    </div>
                                )}
                            </div>

                            {activeCategory !== 'unrankeds' && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="reward"
                                        checked={formData.reward}
                                        onCheckedChange={(checked) => 
                                            setFormData(prev => ({ ...prev, reward: !!checked }))
                                        }
                                    />
                                    <Label htmlFor="reward">
                                        Disponible en tienda de oro
                                    </Label>
                                </div>
                            )}
        
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : mode === 'create' ? 'Crear' : 'Guardar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Selector de skins - componente mejorado */}
            <UnrankedSkinSelector 
                isOpen={skinSelectorOpen}
                onClose={() => setSkinSelectorOpen(false)}
                selectedSkins={formData.selectedSkins}
                onSave={handleSkinSelection}
            />
        </>
    );
};

export default ProductModal;