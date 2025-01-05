import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getAllSkins, getAllChampions } from "../../../services/champsService";
import { getAllRpPrice } from "../../../services/rpService";

export const ProductModal = ({ isOpen, onClose, product, onSubmit, mode, activeCategory }) => {
    const [formData, setFormData] = useState({
        name: '',
        NombreSkin: '',
        priceRP: '',
        type: activeCategory,
        srcWeb: '',
        src: null,
        skin: '',
        champion: ''
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

    // Efecto para cargar datos iniciales
    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return;
            setLoading(true);
            try {
                const params = { showAll: 'true' };
                const [rpData, skinsData, champsData] = await Promise.all([
                    getAllRpPrice(),
                    getAllSkins(params),
                    getAllChampions()
                ]);
                setRpPrices(rpData);
                setSkins(skinsData.data);
                setChampions(champsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen]);

    // Efecto separado para manejar la inicialización del formulario
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                NombreSkin: product.NombreSkin || '',
                priceRP: product.priceRP?._id || (typeof product.priceRP === 'string' ? product.priceRP : ''),
                type: product.type || activeCategory,
                srcWeb: product.srcWeb || '',
                src: null,
                skin: product.skin?._id || (typeof product.skin === 'string' ? product.skin : ''),
                champion: product.champion?._id || (typeof product.champion === 'string' ? product.champion : '')
            });
            console.log('Product data loaded:', product);
        } else {
            setFormData({
                name: '',
                NombreSkin: '',
                priceRP: '',
                type: activeCategory,
                srcWeb: '',
                src: null,
                skin: '',
                champion: ''
            });
        }
    }, [product, activeCategory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (activeCategory === 'skins') {
                if (!formData.NombreSkin?.trim()) {
                    throw new Error('El nombre de la skin es requerido');
                }
                if (!formData.champion) {
                    throw new Error('Debe seleccionar un campeón para la skin');
                }
            } else {
                if (!formData.name?.trim()) {
                    throw new Error('El nombre es requerido');
                }
                if (!formData.type) {
                    throw new Error('El tipo de item es requerido');
                }
            }

            if (!formData.priceRP) {
                throw new Error('El precio RP es requerido');
            }

            if (formData.type === 'chromas' && !formData.skin) {
                throw new Error('Debe seleccionar una skin para el chroma');
            }

            const submitData = activeCategory === 'skins'
                ? {
                    NombreSkin: formData.NombreSkin.trim(),
                    priceRP: formData.priceRP,
                    champion: formData.champion,
                    src: formData.src,
                    srcWeb: formData.srcWeb.trim()
                }
                : {
                    name: formData.name.trim(),
                    type: formData.type,
                    priceRP: formData.priceRP,
                    srcWeb: formData.srcWeb.trim(),
                    src: formData.src,
                    ...(formData.type === 'chromas' && { skin: formData.skin })
                };

            await onSubmit(submitData);
            onClose();
        } catch (error) {
            console.error('Error in form submission:', error);
            alert(error.message);
        }
    };

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Crear' : 'Editar'} {activeCategory === 'skins' ? 'Skin' : 'Item'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeCategory === 'skins' ? (
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
                                <Select
                                    value={formData.champion}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, champion: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar campeón" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {champions.map((champ) => (
                                            <SelectItem key={champ._id} value={champ._id}>
                                                {champ.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    ) : (
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
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {itemTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="priceRP">Precio RP</Label>
                        <Select
                            value={formData.priceRP}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, priceRP: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar precio" />
                            </SelectTrigger>
                            <SelectContent>
                                {rpPrices.map((price) => (
                                    <SelectItem key={price._id} value={price._id}>
                                        {price.valueRP} RP
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.type === 'chromas' && (
                        <div className="space-y-2">
                            <Label htmlFor="skin">Skin asociada</Label>
                            <Select
                                value={formData.skin}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, skin: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar skin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {skins.map((skin) => (
                                        <SelectItem key={skin._id} value={skin._id}>
                                            {skin.NombreSkin}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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