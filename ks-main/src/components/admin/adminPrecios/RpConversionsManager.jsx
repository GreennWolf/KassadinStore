import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import {
    getAllRPPriceConversions,
    createRPPriceConversion,
    updateRPPriceConversion,
    deleteRPPriceConversion,
    activeRPPriceConversion,
} from "../../../services/rpConvertionService";
import { getAllCurrencies } from "../../../services/currencyService";
import { getAllRpPrice } from "../../../services/rpService";
import { toast } from "react-toastify";

export function RpConversionsManager() {
    const [conversions, setConversions] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [rpPrices, setRpPrices] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedConversion, setSelectedConversion] = useState(null);
    const [newConversion, setNewConversion] = useState({
        rpPrice: "",
        currency: "",
        priceSeguro: "",
        priceBarato: "",
        active: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [conversionsData, currenciesData, rpPricesData] = await Promise.all([
                getAllRPPriceConversions(),
                getAllCurrencies(),
                getAllRpPrice(),
            ]);
            setConversions(conversionsData);
            setCurrencies(currenciesData);
            setRpPrices(rpPricesData);
        } catch (error) {
            console.error("Error al obtener conversiones de RP:", error);
            toast.error("Error al obtener conversiones de RP");
        }
    };

    const handleCreateConversion = async () => {
        const { rpPrice, currency, priceSeguro, priceBarato } = newConversion;
        if (!rpPrice || !currency || !priceSeguro || isNaN(priceSeguro) || priceSeguro <= 0 || !priceBarato || isNaN(priceBarato) || priceBarato <= 0) {
            toast.error("Por favor, completa todos los campos con valores válidos");
            return;
        }

        try {
            await createRPPriceConversion(rpPrice, currency, parseFloat(priceSeguro), parseFloat(priceBarato));
            await fetchData();
            setNewConversion({ rpPrice: "", currency: "", priceSeguro: "", priceBarato: "", active: true });
            setIsCreateModalOpen(false);
            toast.success("Conversión de RP creada exitosamente");
        } catch (error) {
            console.error("Error al crear conversión de RP:", error);
            toast.error("Error al crear la conversión de RP");
        }
    };

    const handleEditConversion = async (editedData) => {
        if (!editedData) return;

        try {
            await updateRPPriceConversion(editedData._id, {
                rpPrice: editedData.rpPrice,
                currency: editedData.currency,
                priceSeguro: parseFloat(editedData.priceSeguro),
                priceBarato: parseFloat(editedData.priceBarato),
                active: editedData.active,
            });
            await fetchData();
            setSelectedConversion(null);
            setIsEditModalOpen(false);
            toast.success("Conversión de RP actualizada exitosamente");
        } catch (error) {
            console.error("Error al actualizar conversión de RP:", error);
            toast.error("Error al actualizar la conversión de RP");
        }
    };

    const handleDeleteConversion = async (id) => {
        if (window.confirm("¿Estás seguro que deseas eliminar esta conversión?")) {
            try {
                await deleteRPPriceConversion(id);
                await fetchData();
                toast.success("Conversión de RP eliminada exitosamente");
            } catch (error) {
                console.error("Error al eliminar conversión de RP:", error);
                toast.error("Error al eliminar la conversión de RP");
            }
        }
    };

    const handleActiveConversion = async (id) => {
        try {
            await activeRPPriceConversion(id);
            await fetchData();
            toast.success("Estado de la conversión actualizado exitosamente");
        } catch (error) {
            console.error("Error al actualizar estado de la conversión:", error);
            toast.error("Error al actualizar el estado de la conversión");
        }
    };

    const resetNewConversion = () => {
        setNewConversion({
            rpPrice: "",
            currency: "",
            priceSeguro: "",
            priceBarato: "",
            active: true,
        });
    };

    const resetSelectedConversion = () => {
        setSelectedConversion(null);
    };

    return (
        <Card className="w-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gestión de Conversiones RP</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    Agregar Conversión
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>RP</TableHead>
                        <TableHead>Divisa</TableHead>
                        <TableHead>Precio Seguro</TableHead>
                        <TableHead>Precio Barato</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {conversions.map((conversion) => (
                        <TableRow key={conversion._id}>
                            <TableCell>{conversion.rpPrice.valueRP} RP</TableCell>
                            <TableCell>{conversion.currency.code}</TableCell>
                            <TableCell>{conversion.priceSeguro}</TableCell>
                            <TableCell>{conversion.priceBarato}</TableCell>
                            <TableCell>
                                <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                        conversion.active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {conversion.active ? 'Activo' : 'Inactivo'}
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
                                                // console.log(conversion)
                                                setSelectedConversion(conversion);
                                                setIsEditModalOpen(true);
                                            }}
                                        >
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => {
                                                if(!conversion.active){
                                                    handleActiveConversion(conversion._id);
                                                }else{
                                                    handleDeleteConversion(conversion._id)
                                                }
                                            }}
                                        >
                                            {conversion.active ? 'Desactivar' : 'Activar'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={isCreateModalOpen} onOpenChange={(isOpen) => {
                setIsCreateModalOpen(isOpen);
                if (!isOpen) {
                    setNewConversion({
                        rpPrice: '',
                        currency: '',
                        priceSeguro: 0,
                        priceBarato: 0,
                        active: true,
                    });
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Conversión</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rpPrice">Cantidad RP</Label>
                            <Select
                                value={newConversion.rpPrice}
                                onValueChange={(value) =>
                                    setNewConversion((prev) => ({ ...prev, rpPrice: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cantidad RP" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rpPrices.map((rp) => (
                                        <SelectItem key={rp._id} value={rp._id}>
                                            {rp.valueRP} RP
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="currency">Divisa</Label>
                            <Select
                                value={newConversion.currency}
                                onValueChange={(value) =>
                                    setNewConversion((prev) => ({ ...prev, currency: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar divisa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((currency) => (
                                        <SelectItem key={currency._id} value={currency._id}>
                                            {currency.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="priceSeguro">Precio Seguro</Label>
                            <Input
                                id="priceSeguro"
                                type="number"
                                value={newConversion.priceSeguro}
                                onChange={(e) =>
                                    setNewConversion((prev) => ({
                                        ...prev,
                                        priceSeguro: e.target.value,
                                    }))
                                }
                                placeholder="Precio seguro en la divisa seleccionada"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="priceBarato">Precio Barato</Label>
                            <Input
                                id="priceBarato"
                                type="number"
                                value={newConversion.priceBarato}
                                onChange={(e) =>
                                    setNewConversion((prev) => ({
                                        ...prev,
                                        priceBarato: e.target.value,
                                    }))
                                }
                                placeholder="Precio barato en la divisa seleccionada"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="active"
                                checked={newConversion.active}
                                onCheckedChange={(checked) =>
                                    setNewConversion((prev) => ({
                                        ...prev,
                                        active: checked,
                                    }))
                                }
                            />
                            <Label htmlFor="active">Activo</Label>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button onClick={handleCreateConversion}>Crear</Button>
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => {
                setIsEditModalOpen(isOpen);
                if (!isOpen) {
                    setSelectedConversion(null);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Conversión</DialogTitle>
                    </DialogHeader>
                    {selectedConversion && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="rpPrice">Cantidad RP</Label>
                                <Select
                                    value={selectedConversion.rpPrice._id}
                                    onValueChange={(value) =>
                                        setSelectedConversion((prev) => ({
                                            ...prev,
                                            rpPrice: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cantidad RP" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rpPrices.map((rp) => (
                                            <SelectItem key={rp._id} value={rp._id}>
                                                {rp.valueRP} RP
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="currency">Divisa</Label>
                                <Select
                                    value={selectedConversion.currency._id}
                                    onValueChange={(value) =>
                                        setSelectedConversion((prev) => ({
                                            ...prev,
                                            currency: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue className="text-white" placeholder="Seleccionar divisa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((currency) => (
                                            <SelectItem key={currency._id} value={currency._id}>
                                                {currency.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="priceSeguro">Precio Seguro</Label>
                                <Input
                                    id="priceSeguro"
                                    type="number"
                                    value={selectedConversion.priceSeguro}
                                    onChange={(e) =>
                                        setSelectedConversion((prev) => ({
                                            ...prev,
                                            priceSeguro: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="priceBarato">Precio Barato</Label>
                                <Input
                                    id="priceBarato"
                                    type="number"
                                    value={selectedConversion.priceBarato}
                                    onChange={(e) =>
                                        setSelectedConversion((prev) => ({
                                            ...prev,
                                            priceBarato: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="active"
                                    checked={selectedConversion.active}
                                    onCheckedChange={(checked) =>
                                        setSelectedConversion((prev) => ({
                                            ...prev,
                                            active: checked,
                                        }))
                                    }
                                />
                                <Label htmlFor="active">Activo</Label>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button onClick={()=>{
                                    handleEditConversion(selectedConversion)
                                }}>Guardar</Button>
                                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}