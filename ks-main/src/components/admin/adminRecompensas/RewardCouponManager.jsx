import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    getRewardCouponPresetByType,
    createRewardCouponPreset,
    updateRewardCouponPreset,
    deleteRewardCouponPreset
} from "@/services/rewardCouponPresetService";
import { RewardCouponForm } from "./RewardCouponForm";

export function RewardCouponManager() {
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setIsLoading(true);
            const response = await getRewardCouponPresetByType("store");
            // console.log(response);
            setCoupons(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Error fetching coupons:", error);
            toast.error("No se pudieron cargar los cupones");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCoupon = async (data) => {
        try {
            const created = await createRewardCouponPreset(data);
            setCoupons(prev => [...prev, created]);
            setIsModalOpen(false);
            setSelectedCoupon(null);
            toast.success("Cupón creado exitosamente");
        } catch (error) {
            console.error("Error creating coupon:", error);
            toast.error("Error al crear el cupón");
        }
    };

    const handleUpdateCoupon = async (data) => {
        try {
            const updated = await updateRewardCouponPreset(data._id, data);
            setCoupons(prev => prev.map(c => c._id === updated._id ? updated : c));
            setIsModalOpen(false);
            setSelectedCoupon(null);
            toast.success("Cupón actualizado exitosamente");
        } catch (error) {
            console.error("Error updating coupon:", error);
            toast.error("Error al actualizar el cupón");
        }
    };

    const handleDeleteCoupon = async (id) => {
        try {
            await deleteRewardCouponPreset(id);
            // Aquí simplemente se invierte el estado de isActive para mostrar la activación/desactivación
            setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !c.isActive } : c));
            toast.success("Cupón activado / desactivado exitosamente");
        } catch (error) {
            console.error("Error deleting coupon:", error);
            toast.error("Error al eliminar el cupón");
        }
    };

    return (
        <Card className="w-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gestión de Cupones</h2>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                setSelectedCoupon(null);
                                setIsModalOpen(true);
                            }}
                        >
                            Agregar Cupón
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background text-foreground p-6 rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="text-white">
                                {selectedCoupon ? "Editar Cupón" : "Crear Nuevo Cupón"}
                            </DialogTitle>
                        </DialogHeader>
                        <RewardCouponForm
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onSubmit={selectedCoupon ? handleUpdateCoupon : handleCreateCoupon}
                            initialData={selectedCoupon}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descuento (%)</TableHead>
                        <TableHead>Usos Máximos</TableHead>
                        <TableHead>Días Válidos</TableHead>
                        <TableHead>Aplicable a</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                                Cargando...
                            </TableCell>
                        </TableRow>
                    ) : coupons.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                                No hay cupones disponibles.
                            </TableCell>
                        </TableRow>
                    ) : (
                        coupons.map((coupon) => (
                            <TableRow key={coupon._id}>
                                <TableCell>{coupon.name}</TableCell>
                                <TableCell>{coupon.percent}%</TableCell>
                                <TableCell>{coupon.maxUses}</TableCell>
                                <TableCell>{coupon.validDays}</TableCell>
                                <TableCell>{coupon.applicableTo}</TableCell>
                                <TableCell>
                                    <Badge variant={coupon.isActive ? "default" : "destructive"}>
                                        {coupon.isActive ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedCoupon(coupon);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteCoupon(coupon._id)}
                                        >
                                            {coupon.isActive ? "Desactivar" : "Activar"}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}
