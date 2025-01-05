import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { getAllCupons, createCupon, updateCupon, deleteCupon, activeCupon } from "@/services/cuponServices";
import { CuponForm } from "./CuponForm";
import { format } from "date-fns";

export function CuponsManager() {
    const [cupons, setCupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedCupon, setSelectedCupon] = useState(null);
    const [newCupon, setNewCupon] = useState({
        cupon: '',
        type: 'percent',
        value: '',
        description: '',
        maxUses: 1,
        currentUses: 0,
        validFrom: new Date(),
        validUntil: null,
        isInfinite: false,
        isActive: true
    });

    useEffect(() => {
        fetchCupons();
    }, []);

    const fetchCupons = async () => {
        try {
            setIsLoading(true);
            const response = await getAllCupons();
            setCupons(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Error fetching coupons:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los cupones",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const validateCuponData = (cupon) => {
        if (!cupon.cupon) {
            toast({
                title: "Error",
                description: "Por favor, ingrese el código del cupón",
                variant: "destructive",
            });
            return false;
        }

        if (!cupon.value || (cupon.type === 'percent' && (cupon.value <= 0 || cupon.value > 100))) {
            toast({
                title: "Error",
                description: "El valor debe ser válido (entre 1 y 100 para porcentajes)",
                variant: "destructive",
            });
            return false;
        }

        if (!cupon.validFrom) {
            toast({
                title: "Error",
                description: "Debe especificar la fecha de inicio",
                variant: "destructive",
            });
            return false;
        }

        if (!cupon.isInfinite && !cupon.validUntil) {
            toast({
                title: "Error",
                description: "Debe especificar la fecha de finalización o marcar como indefinido",
                variant: "destructive",
            });
            return false;
        }

        return true;
    };

    const handleCreateCupon = async () => {
        if (!validateCuponData(newCupon)) return;

        try {
            const created = await createCupon(newCupon);
            setCupons(prev => [...prev, created]);
            setIsCreateModalOpen(false);
            setNewCupon({
                cupon: '',
                type: 'percent',
                value: '',
                description: '',
                maxUses: 1,
                currentUses: 0,
                validFrom: new Date(),
                validUntil: null,
                isInfinite: false,
                isActive: true
            })
            toast({
                title: "Éxito",
                description: "Cupón creado exitosamente",
            });
        } catch (error) {
            console.error("Error creating coupon:", error);
            toast({
                title: "Error",
                description: "Error al crear el cupón",
                variant: "destructive",
            });
        }
    };

    const handleUpdateCupon = async (cupon) => {
        if (!validateCuponData(cupon)) return;

        try {
            const updated = await updateCupon(cupon._id, cupon);
            setCupons(prev => prev.map(c => c._id === updated._id ? updated : c));
            toast({
                title: "Éxito",
                description: "Cupón actualizado exitosamente",
            });
        } catch (error) {
            console.error("Error updating coupon:", error);
            toast({
                title: "Error",
                description: "Error al actualizar el cupón",
                variant: "destructive",
            });
        }
    };

    const handleDeleteCupon = async (id) => {
        try {
            await deleteCupon(id);
            setCupons(prev => prev.filter(c => c._id !== id));
            toast({
                title: "Éxito",
                description: "Cupón eliminado exitosamente",
            });
        } catch (error) {
            console.error("Error deleting coupon:", error);
            toast({
                title: "Error",
                description: "Error al eliminar el cupón",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <Card className="w-full p-4">
                <div className="flex justify-center items-center h-64">
                    <p>Cargando...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="w-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gestión de Cupones</h2>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button>Agregar Cupón</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Cupón</DialogTitle>
                        </DialogHeader>
                        <CuponForm
                            data={newCupon}
                            setData={setNewCupon}
                            onSubmit={handleCreateCupon}
                            submitText="Crear Cupón"
                            onClose={() => setIsCreateModalOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Usos</TableHead>
                        <TableHead>Validez</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cupons.map((cupon) => (
                        <TableRow key={cupon._id}>
                            <TableCell>{cupon.cupon}</TableCell>
                            <TableCell>{cupon.type === 'percent' ? 'Porcentaje' : 'Valor fijo'}</TableCell>
                            <TableCell>
                                {cupon.type === 'percent' ? (
                                    `${cupon.value}%`
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        {cupon.currencyValues?.map((cv) => (
                                            <div key={cv._id} className="text-sm">
                                                {cv?.currency?.name}: {cv?.value}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                {cupon.maxUses === 0 ? 
                                    `${cupon.currentUses}/∞` : 
                                    `${cupon.currentUses}/${cupon.maxUses}`
                                }
                            </TableCell>
                            <TableCell>
                                {cupon.isInfinite ? 
                                    'Indefinido' : 
                                    format(new Date(cupon.validUntil), "PPP")
                                }
                            </TableCell>
                            <TableCell>
                                <Badge 
                                    variant={cupon.isActive ? "default" : "destructive"}
                                >
                                    {cupon.isActive ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex space-x-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            setSelectedCupon(cupon);
                                            setIsCreateModalOpen(true);
                                        }}
                                    >
                                        Editar
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => handleDeleteCupon(cupon._id)}
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}