import React, { useState, useEffect } from "react";
import { getAllCurrencies, createCurrency, updateCurrency, deleteCurrency, activeCurrency } from "@/services/currencyService";
import { Modal } from "./Modal";
import { ConfirmModal } from "./ConfirmModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export function CurrenciesManager() {
    const [currencies, setCurrencies] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [newCurrency, setNewCurrency] = useState({ 
        name: '', 
        code: '', 
        symbol: '',
        image: null,
        imagePreview: null,
        active: true
    });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [currencyToDelete, setCurrencyToDelete] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchCurrencies();
    }, []);

    const fetchCurrencies = async () => {
        try {
            const data = await getAllCurrencies();
            setCurrencies(data);
        } catch (error) {
            console.error("Error al obtener divisas:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar las divisas"
            });
        }
    };

    const handleImageChange = (e, isNewCurrency = true) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isNewCurrency) {
                    setNewCurrency(prev => ({
                        ...prev,
                        image: file,
                        imagePreview: reader.result
                    }));
                } else {
                    setSelectedCurrency(prev => ({
                        ...prev,
                        image: file,
                        imagePreview: reader.result
                    }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateCurrency = async () => {
        try {
            const formData = new FormData();
            formData.append('name', newCurrency.name);
            formData.append('code', newCurrency.code);
            formData.append('symbol', newCurrency.symbol);
            formData.append('active', newCurrency.active);
            if (newCurrency.image) {
                formData.append('image', newCurrency.image);
            }

            const created = await createCurrency(formData);
            setCurrencies([...currencies, created]);
            setNewCurrency({ name: '', code: '', symbol: '', image: null, imagePreview: null, active: true });
            setIsCreateModalOpen(false);
            toast({
                title: "Éxito",
                description: "Divisa creada correctamente"
            });
        } catch (error) {
            console.error("Error al crear divisa:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo crear la divisa"
            });
        }
    };

    const handleUpdateCurrency = async () => {
        try {
            const formData = new FormData();
            formData.append('name', selectedCurrency.name);
            formData.append('code', selectedCurrency.code);
            formData.append('symbol', selectedCurrency.symbol);
            formData.append('active', selectedCurrency.active);
            if (selectedCurrency.image) {
                formData.append('image', selectedCurrency.image);
            }

            const updated = await updateCurrency(selectedCurrency._id, formData);
            setCurrencies(currencies.map(currency => 
                currency._id === updated._id ? updated : currency
            ));
            setSelectedCurrency(null);
            setIsEditModalOpen(false);
            toast({
                title: "Éxito",
                description: "Divisa actualizada correctamente"
            });
        } catch (error) {
            console.error("Error al actualizar divisa:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo actualizar la divisa"
            });
        }
    };

    const handleDeleteCurrency = async (id) => {
        try {
            await deleteCurrency(id);
            setCurrencies(currencies.map(currency => 
                currency._id === id ? { ...currency, active: false } : currency
            ));
            setIsConfirmModalOpen(false);
            setCurrencyToDelete(null);
            toast({
                title: "Éxito",
                description: "Divisa desactivada correctamente"
            });
        } catch (error) {
            console.error("Error al desactivar divisa:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo desactivar la divisa"
            });
        }
    };

    const handleActiveCurrency = async (id) => {
        try {
            await activeCurrency(id);
            setCurrencies(currencies.map(currency => 
                currency._id === id ? { ...currency, active: true } : currency
            ));
            toast({
                title: "Éxito",
                description: "Divisa activada correctamente"
            });
        } catch (error) {
            console.error("Error al activar divisa:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo activar la divisa"
            });
        }
    };
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestión de Divisas</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    Agregar Divisa
                </Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Imagen</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Símbolo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currencies.map((currency) => (
                            <TableRow key={currency._id}>
                                <TableCell>
                                    {currency.imageUrl ? (
                                        <img 
                                            src={currency.imageUrl} 
                                            alt={currency.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            <span className="text-xs">No img</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>{currency.name}</TableCell>
                                <TableCell>{currency.code}</TableCell>
                                <TableCell>{currency.symbol}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        currency.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {currency.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-black" align="end">
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedCurrency({
                                                        ...currency,
                                                        image: null,
                                                        imagePreview: currency.imageUrl
                                                    });
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                Editar
                                            </DropdownMenuItem>
                                            {currency.active ? (
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        setCurrencyToDelete(currency);
                                                        setIsConfirmModalOpen(true);
                                                    }}
                                                >
                                                    Desactivar
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={() => handleActiveCurrency(currency._id)}
                                                >
                                                    Activar
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Agregar Nueva Divisa"
            >
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                            {newCurrency.imagePreview ? (
                                <img 
                                    src={newCurrency.imagePreview} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-gray-500">Sin imagen</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, true)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la divisa</Label>
                        <Input
                            id="name"
                            value={newCurrency.name}
                            onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                            placeholder="ej: Dólar Estadounidense"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code">Código</Label>
                        <Input
                            id="code"
                            value={newCurrency.code}
                            onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value })}
                            placeholder="ej: USD"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="symbol">Símbolo</Label>
                        <Input
                            id="symbol"
                            value={newCurrency.symbol}
                            onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                            placeholder="ej: $"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="active"
                            checked={newCurrency.active}
                            onCheckedChange={(checked) => 
                                setNewCurrency({ ...newCurrency, active: checked })
                            }
                        />
                        <Label htmlFor="active">Activa</Label>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button onClick={handleCreateCurrency}>
                            Crear
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Divisa"
            >
                {selectedCurrency && (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                                {selectedCurrency.imagePreview ? (
                                    <img 
                                        src={selectedCurrency.imagePreview} 
                                        alt="Preview" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-gray-500">Sin imagen</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageChange(e, false)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre de la divisa</Label>
                            <Input
                                id="edit-name"
                                value={selectedCurrency.name}
                                onChange={(e) => setSelectedCurrency({ 
                                    ...selectedCurrency, 
                                    name: e.target.value 
                                })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-code">Código</Label>
                            <Input
                                id="edit-code"
                                value={selectedCurrency.code}
                                onChange={(e) => setSelectedCurrency({ 
                                    ...selectedCurrency, 
                                    code: e.target.value 
                                })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-symbol">Símbolo</Label>
                            <Input
                                id="edit-symbol"
                                value={selectedCurrency.symbol}
                                onChange={(e) => setSelectedCurrency({ 
                                    ...selectedCurrency, 
                                    symbol: e.target.value 
                                })}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="edit-active"
                                checked={selectedCurrency.active}
                                onCheckedChange={(checked) => 
                                    setSelectedCurrency({ 
                                        ...selectedCurrency, 
                                        active: checked 
                                    })
                                }
                            />
                            <Label htmlFor="edit-active">Activa</Label>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button onClick={handleUpdateCurrency}>
                                Actualizar
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setCurrencyToDelete(null);
                }}
                onConfirm={() => currencyToDelete && handleDeleteCurrency(currencyToDelete._id)}
                title="Confirmar Desactivación"
                message={`¿Estás seguro de que quieres desactivar la divisa "${currencyToDelete?.name}"?`}
            />
        </div>
    );
}