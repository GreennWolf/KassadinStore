import React, { useState, useEffect } from "react";
import { getAllRpPrice, createRPPrice, updateRpPrice, deleteRpPrice, activeRpPrice } from "@/services/rpService";
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

export function RpPricesManager() {
    const [rpPrices, setRpPrices] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRpPrice, setSelectedRpPrice] = useState(null);
    const [newRpPrice, setNewRpPrice] = useState({ valueRP: '' });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [rpPriceToDelete, setRpPriceToDelete] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchRpPrices();
    }, []);

    const fetchRpPrices = async () => {
        try {
            const data = await getAllRpPrice();
            setRpPrices(data);
        } catch (error) {
            console.error("Error al obtener precios de RP:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los precios de RP"
            });
        }
    };

    const handleCreateRpPrice = async () => {
        const { valueRP } = newRpPrice;
        if (!valueRP || isNaN(valueRP) || valueRP <= 0) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Por favor, ingresa un valor de RP válido"
            });
            return;
        }

        try {
            const created = await createRPPrice(newRpPrice);
            setRpPrices([...rpPrices, created]);
            setNewRpPrice({ valueRP: '' });
            setIsCreateModalOpen(false);
            toast({
                title: "Éxito",
                description: "Precio de RP creado correctamente"
            });
        } catch (error) {
            console.error("Error al crear precio de RP:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo crear el precio de RP"
            });
        }
    };

    const handleUpdateRpPrice = async () => {
        const { valueRP, active } = selectedRpPrice;
        if (!valueRP || isNaN(valueRP) || valueRP <= 0) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Por favor, ingresa un valor de RP válido"
            });
            return;
        }

        try {
            const updated = await updateRpPrice(selectedRpPrice._id, { valueRP: parseInt(valueRP), active });
            setRpPrices(rpPrices.map(rp => rp._id === updated._id ? updated : rp));
            setSelectedRpPrice(null);
            setIsEditModalOpen(false);
            toast({
                title: "Éxito",
                description: "Precio de RP actualizado correctamente"
            });
        } catch (error) {
            console.error("Error al actualizar precio de RP:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo actualizar el precio de RP"
            });
        }
    };

    const handleDeleteRpPrice = async (id) => {
        try {
            await deleteRpPrice(id);
            setRpPrices(rpPrices.map(rp => 
                rp._id === id ? { ...rp, active: false } : rp
            ));
            setIsConfirmModalOpen(false);
            setRpPriceToDelete(null);
            toast({
                title: "Éxito",
                description: "Precio de RP eliminado correctamente"
            });
        } catch (error) {
            console.error("Error al eliminar precio de RP:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo eliminar el precio de RP"
            });
        }
    };

    const handleActiveRpPrice = async (id) => {
        try {
            await activeRpPrice(id);
            setRpPrices(rpPrices.map(rp => 
                rp._id === id ? { ...rp, active: true } : rp
            ));
            toast({
                title: "Éxito",
                description: "Precio de RP activado correctamente"
            });
        } catch (error) {
            console.error("Error al activar precio de RP:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo activar el precio de RP"
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestión de Precios de RP</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    Agregar Precio de RP
                </Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Valor de RP</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rpPrices.map((rpPrice) => (
                            <TableRow key={rpPrice._id}>
                                <TableCell>{rpPrice.valueRP}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        rpPrice.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {rpPrice.active ? 'Activo' : 'Inactivo'}
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
                                                    setSelectedRpPrice(rpPrice);
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                Editar
                                            </DropdownMenuItem>
                                            {rpPrice.active ? (
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        setRpPriceToDelete(rpPrice);
                                                        setIsConfirmModalOpen(true);
                                                    }}
                                                >
                                                    Desactivar
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={() => handleActiveRpPrice(rpPrice._id)}
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
                title="Agregar Nuevo Precio de RP"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="valueRP">Valor de RP</Label>
                        <Input
                            id="valueRP"
                            type="number"
                            value={newRpPrice.valueRP}
                            onChange={(e) => setNewRpPrice({ 
                                ...newRpPrice, 
                                valueRP: e.target.value 
                            })}
                            min="1"
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button onClick={handleCreateRpPrice}>
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
                title="Editar Precio de RP"
            >
                {selectedRpPrice && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-valueRP">Valor de RP</Label>
                            <Input
                                id="edit-valueRP"
                                type="number"
                                value={selectedRpPrice.valueRP}
                                onChange={(e) => setSelectedRpPrice({ 
                                    ...selectedRpPrice, 
                                    valueRP: e.target.value 
                                })}
                                min="1"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="edit-active"
                                checked={selectedRpPrice.active}
                                onCheckedChange={(checked) => 
                                    setSelectedRpPrice({ 
                                        ...selectedRpPrice, 
                                        active: checked 
                                    })
                                }
                            />
                            <Label htmlFor="edit-active">Activo</Label>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button onClick={handleUpdateRpPrice}>
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
                    setRpPriceToDelete(null);
                }}
                onConfirm={() => rpPriceToDelete && handleDeleteRpPrice(rpPriceToDelete._id)}
                title="Confirmar Desactivación"
                message={`¿Estás seguro de que quieres desactivar el precio de RP "${rpPriceToDelete?.valueRP}"?`}
            />
        </div>
    );
}