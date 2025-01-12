import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"
import { getAllSkins, getAllChampions } from "../../../services/champsService";
import { getAllRpPrice } from "../../../services/rpService";

const REGIONS = ['LAS', 'LAN', 'NA', 'EUW', 'EUNE', 'OCE', 'BR', 'KR', 'JP', 'TR', 'RU'];

export const ProductModal = ({ isOpen, onClose, product, onSubmit, mode, activeCategory }) => {
    const [formData, setFormData] = useState({
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
        // Campos específicos para unrankeds
        nivel: '',
        escencia: '',
        rpAmount: '',
        escenciaNaranja:'',
        region: '',
        handUpgrade: true
    });

    const [rpPrices, setRpPrices] = useState([]);
    const [skins, setSkins] = useState([]);
    const [champions, setChampions] = useState([]);
    const [loading, setLoading] = useState(false);

    const itemTypes = [
        { value: 'loot', label: 'Botín' },
        { value: 'icon', label: 'Icono' },
        { value: 'chromas', label: 'Chroma' },
        { value: 'presale', label: 'Preventa' },
        { value: 'tft', label: 'TFT' },
        { value: 'bundle', label: 'Bundle' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return;
            setLoading(true);
            try {
                const params = { 
                    showAll: 'true',
                    limit: 0
                };
                
                // Solo cargar los datos necesarios según la categoría
                const promises = [];
                promises.push(getAllRpPrice());

                if (activeCategory === 'skins') {
                    promises.push(getAllSkins(params));
                    promises.push(getAllChampions());
                } else if (activeCategory === 'chromas') {
                    promises.push(getAllSkins(params));
                }

                const responses = await Promise.all(promises);
                setRpPrices(responses[0]);

                if (activeCategory === 'skins') {
                    setSkins(responses[1].data);
                    setChampions(responses[2]);
                } else if (activeCategory === 'chromas') {
                    setSkins(responses[1].data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchData();
    }, [isOpen, activeCategory]);

    useEffect(() => {
        if (product && Object.keys(product).length > 0) {
            const newFormData = {
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
                // Campos de unrankeds
                nivel: product.nivel || '',
                escencia: product.escencia || '',
                escenciaNaranja: product.escenciaNaranja || '',
                rpAmount: product.rpAmount || '',
                region: product.region || '',
                
                handUpgrade: product.handUpgrade !== undefined ? product.handUpgrade : true
            };
            
            setFormData(newFormData);
        } else {
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
                region: '',
                escenciaNaranja: '',
                handUpgrade: true
            });
        }
    }, [product, activeCategory]);
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Por favor, seleccione un archivo de imagen válido');
                e.target.value = '';
                return;
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('El archivo es demasiado grande. Por favor seleccione una imagen menor a 5MB.');
                e.target.value = '';
                return;
            }

            setFormData(prev => ({
                ...prev,
                src: file
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const requiredFields = {
                skins: ['NombreSkin', 'champion', 'priceRP'],
                unrankeds: ['titulo', 'priceRP', 'nivel', 'rpAmount', 'region'],
                default: ['name', 'type', 'priceRP']
            };

            const fieldsToValidate = activeCategory === 'skins' 
                ? requiredFields.skins 
                : activeCategory === 'unrankeds'
                    ? requiredFields.unrankeds
                    : requiredFields.default;

            for (const field of fieldsToValidate) {
                if (!formData[field]) {
                    throw new Error(`El campo ${field} es requerido`);
                }
            }

            if (formData.type === 'chromas' && !formData.skin) {
                throw new Error('Debe seleccionar una skin para el chroma');
            }

            // Validaciones específicas para unrankeds
            if (activeCategory === 'unrankeds') {
                if (formData.nivel < 1) {
                    throw new Error('El nivel debe ser mayor a 0');
                }
                if (formData.rpAmount < 0) {
                    throw new Error('La cantidad de RP no puede ser negativa');
                }
            }

            const submitData = {
                ...formData,
                ...(activeCategory === 'unrankeds' && {
                    escencia: parseInt(formData.escencia) || 0,
                    escenciaNaranja: parseInt(formData.escenciaNaranja) || 0, // Añadido
                    nivel: parseInt(formData.nivel),
                    rpAmount: parseInt(formData.rpAmount)
                })
            };

            await onSubmit(submitData);
            onClose();
        } catch (error) {
            console.error('Error in form submission:', error);
            alert(error.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Crear' : 'Editar'} {
                            activeCategory === 'skins' ? 'Skin' : 
                            activeCategory === 'unrankeds' ? 'Cuenta' : 
                            'Item'
                        }
                    </DialogTitle>
                </DialogHeader>
    
                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeCategory === 'unrankeds' ? (
                        // Formulario para Unrankeds
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="titulo">Título</Label>
                                <Input
                                    id="titulo"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nivel">Nivel</Label>
                                    <Input
                                        id="nivel"
                                        type="number"
                                        value={formData.nivel}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nivel: e.target.value }))}
                                        required
                                        min="1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="escencia">Esencia Azul</Label>
                                    <Input
                                        id="escencia"
                                        type="number"
                                        value={formData.escencia}
                                        onChange={(e) => setFormData(prev => ({ ...prev, escencia: e.target.value }))}
                                        min="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="escenciaNaranja">Esencia Naranja</Label>
                                    <Input
                                        id="escenciaNaranja"
                                        type="number"
                                        value={formData.escenciaNaranja}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            escenciaNaranja: e.target.value 
                                        }))}
                                        min="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rpAmount">Cantidad de RP</Label>
                                    <Input
                                        id="rpAmount"
                                        type="number"
                                        value={formData.rpAmount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, rpAmount: e.target.value }))}
                                        required
                                        min="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="region">Región</Label>
                                    <select
                                        id="region"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.region}
                                        onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                                        required
                                    >
                                        <option value="">Seleccionar región</option>
                                        {REGIONS.map(region => (
                                            <option key={region} value={region}>
                                                {region}
                                            </option>
                                        ))}
                                    </select>
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
                        </>
                    ) : activeCategory === 'skins' ? (
                        // Formulario para Skins
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="skinName">Nombre de la Skin</Label>
                                <Input
                                    id="skinName"
                                    value={formData.NombreSkin}
                                    onChange={(e) => setFormData(prev => ({ ...prev, NombreSkin: e.target.value }))}
                                    required
                                />
                            </div>
    
                            <div className="space-y-2">
                                <Label htmlFor="champion">Campeón</Label>
                                <select
                                    id="champion"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.champion}
                                    onChange={(e) => setFormData(prev => ({ ...prev, champion: e.target.value }))}
                                    required
                                >
                                    <option value="">Seleccionar campeón</option>
                                    {champions.map((champ) => (
                                        <option key={champ._id} value={champ._id}>
                                            {champ.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        // Formulario para Items normales
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="itemName">Nombre del Item</Label>
                                <Input
                                    id="itemName"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
    
                            <div className="space-y-2">
                                <Label htmlFor="itemType">Tipo de Item</Label>
                                <select
                                    id="itemType"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                    required
                                >
                                    <option value="">Seleccionar tipo</option>
                                    {itemTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
    
                    <div className="space-y-2">
                        <Label htmlFor="priceRP">Precio RP</Label>
                        <select
                            id="priceRP"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.priceRP}
                            onChange={(e) => setFormData(prev => ({ ...prev, priceRP: e.target.value }))}
                            required
                        >
                            <option value="">Seleccionar precio</option>
                            {rpPrices.map((price) => (
                                <option key={price._id} value={price._id}>
                                    {price.valueRP} RP
                                </option>
                            ))}
                        </select>
                    </div>
    
                    {formData.type === 'chromas' && (
                        <div className="space-y-2">
                            <Label htmlFor="skin">Skin Asociada</Label>
                            <select
                                id="skin"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.skin}
                                onChange={(e) => setFormData(prev => ({ ...prev, skin: e.target.value }))}
                                required
                            >
                                <option value="">Seleccionar skin</option>
                                {skins.map((skin) => (
                                    <option key={skin._id} value={skin._id}>
                                        {skin.NombreSkin}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
    
                    <div className="space-y-2">
                        <Label htmlFor="srcWeb">URL de la imagen (opcional)</Label>
                        <Input
                            id="srcWeb"
                            value={formData.srcWeb}
                            onChange={(e) => setFormData(prev => ({ ...prev, srcWeb: e.target.value }))}
                        />
                    </div>
    
                    <div className="space-y-2">
                        <Label htmlFor="image">Imagen Local</Label>
                        <Input
                            type="file"
                            accept="image/*"
                            className="cursor-pointer"
                            onChange={handleFileChange}
                            required={mode === 'create'}
                        />
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
                            <Label htmlFor="reward" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Disponible en tienda de oro
                            </Label>
                        </div>
                    )}
    
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Procesando...' : (mode === 'create' ? 'Crear' : 'Guardar')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};