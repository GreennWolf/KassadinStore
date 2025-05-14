import React, { useState, useEffect } from "react";
import { getAllStatus, createStatus, updateStatus, deleteStatus } from "../../../services/purcharseService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Check, X, Timer, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CONFIRMATION_ACTIONS = {
    NONE: "none",
    START_TIMER: "startTimer",
    CHANGE_STATUS: "changeStatus"
};

export function EstadosManager() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statuses, setStatuses] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [modalMode, setModalMode] = useState("create");
    const [formData, setFormData] = useState({
        status: "",
        description: "",
        default: false,
        active: true,
        color: "#000000",
        confirmacion: false,
        confirmacionText: "Confirmar",
        confirmationAction: {
            type: CONFIRMATION_ACTIONS.NONE,
            config: {}
        }
    });

    useEffect(() => {
        fetchStatuses();
    }, []);

    const fetchStatuses = async () => {
        try {
            const data = await getAllStatus();
            setStatuses(data);
        } catch (error) {
            toast.error("Error al cargar los estados");
        }
    };

    const convertTimeToMinutes = (days, hours, minutes, seconds) => {
        return (days * 24 * 60) + (hours * 60) + minutes + (seconds / 60);
    };

    const formatTime = (timeInMinutes) => {
        const days = Math.floor(timeInMinutes / (24 * 60));
        const hours = Math.floor((timeInMinutes % (24 * 60)) / 60);
        const minutes = Math.floor(timeInMinutes % 60);
        const seconds = Math.round((timeInMinutes % 1) * 60);
    
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);
        
        return parts.join(' ') || '0s';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const dataToSubmit = {
                ...formData,
                confirmationAction: formData.confirmacion && formData.confirmationAction.type !== CONFIRMATION_ACTIONS.NONE
                    ? formData.confirmationAction
                    : undefined
            };

            if (modalMode === "create") {
                await createStatus(dataToSubmit);
                toast.success("Estado creado exitosamente");
            } else {
                await updateStatus(selectedStatus._id, dataToSubmit);
                toast.success("Estado actualizado exitosamente");
            }
            
            fetchStatuses();
            handleCloseModal();
        } catch (error) {
            toast.error(`Error al ${modalMode === "create" ? "crear" : "actualizar"} el estado`);
        }
    };

    const handleDelete = async (status) => {
        if (window.confirm(`¿Estás seguro que deseas eliminar el estado "${status.status}"?`)) {
            try {
                await deleteStatus(status._id);
                toast.success("Estado eliminado exitosamente");
                fetchStatuses();
            } catch (error) {
                toast.error("Error al eliminar el estado");
            }
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedStatus(null);
        setFormData({
            status: "",
            description: "",
            default: false,
            active: true,
            color: "#000000",
            confirmacion: false,
            confirmacionText: "Confirmar",
            confirmationAction: {
                type: CONFIRMATION_ACTIONS.NONE,
                config: {}
            }
        });
    };

    const copyColorToClipboard = (color) => {
        navigator.clipboard.writeText(color);
        toast.success("Color copiado al portapapeles");
    };

    const renderConfirmationActionConfig = () => {
        if (!formData.confirmacion || formData.confirmationAction.type === CONFIRMATION_ACTIONS.NONE) {
            return null;
        }

        switch (formData.confirmationAction.type) {
            case CONFIRMATION_ACTIONS.START_TIMER:
                const currentTime = formData.confirmationAction.config.time || 0;
                const days = Math.floor(currentTime / (24 * 60));
                const hours = Math.floor((currentTime % (24 * 60)) / 60);
                const minutes = Math.floor(currentTime % 60);
                const seconds = Math.round((currentTime % 1) * 60);

                return (
                    <div className="space-y-4">
                        <Label>Tiempo de Espera</Label>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="-space-y-0.5">
                                <Label>Días</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={days}
                                    onChange={(e) => {
                                        const d = parseInt(e.target.value) || 0;
                                        setFormData({
                                            ...formData,
                                            confirmationAction: {
                                                ...formData.confirmationAction,
                                                config: { 
                                                    time: convertTimeToMinutes(d, hours, minutes, seconds)
                                                }
                                            }
                                        });
                                    }}
                                />
                            </div>
                            <div className="-space-y-0.5">
                                <Label>Horas</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={hours}
                                    onChange={(e) => {
                                        const h = parseInt(e.target.value) || 0;
                                        setFormData({
                                            ...formData,
                                            confirmationAction: {
                                                ...formData.confirmationAction,
                                                config: { 
                                                    time: convertTimeToMinutes(days, h, minutes, seconds)
                                                }
                                            }
                                        });
                                    }}
                                />
                            </div>
                            <div className="-space-y-0.5">
                                <Label>Minutos</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={minutes}
                                    onChange={(e) => {
                                        const m = parseInt(e.target.value) || 0;
                                        setFormData({
                                            ...formData,
                                            confirmationAction: {
                                                ...formData.confirmationAction,
                                                config: { 
                                                    time: convertTimeToMinutes(days, hours, m, seconds)
                                                }
                                            }
                                        });
                                    }}
                                />
                            </div>
                            <div className="-space-y-0.5">
                                <Label>Segundos</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={seconds}
                                    onChange={(e) => {
                                        const s = parseInt(e.target.value) || 0;
                                        setFormData({
                                            ...formData,
                                            confirmationAction: {
                                                ...formData.confirmationAction,
                                                config: { 
                                                    time: convertTimeToMinutes(days, hours, minutes, s)
                                                }
                                            }
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );

            case CONFIRMATION_ACTIONS.CHANGE_STATUS:
                return (
                    <div className="-space-y-0.5">
                        <Label>Estado Objetivo</Label>
                        <Select
                            value={formData.confirmationAction.config.targetStatus || ''}
                            onValueChange={(value) => setFormData({
                                ...formData,
                                confirmationAction: {
                                    ...formData.confirmationAction,
                                    config: { targetStatus: value }
                                }
                            })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses
                                    .filter(s => s._id !== selectedStatus?._id)
                                    .map(status => (
                                        <SelectItem key={status._id} value={status._id}>
                                            {status.status}
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>
                );

            default:
                return null;
        }
    };

    const getActionDescription = (status) => {
        if (!status.confirmationAction || status.confirmationAction.type === CONFIRMATION_ACTIONS.NONE) {
            return 'Sin acción';
        }

        switch (status.confirmationAction.type) {
            case CONFIRMATION_ACTIONS.START_TIMER:
                return `Iniciar temporizador de ${formatTime(status.confirmationAction.config.time)}`;
            case CONFIRMATION_ACTIONS.CHANGE_STATUS:
                const targetStatus = statuses.find(s => s._id === status.confirmationAction.config.targetStatus);
                return `Cambiar a estado: ${targetStatus?.status || 'Desconocido'}`;
            default:
                return 'Sin acción';
        }
    };

    const filteredStatuses = statuses.filter((status) =>
        status.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar estados..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button
                    onClick={() => {
                        setModalMode("create");
                        setModalOpen(true);
                    }}
                >
                    Crear Estado
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Estado</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead>Predeterminado</TableHead>
                                <TableHead>Requiere Confirmación</TableHead>
                                <TableHead>Texto de Confirmación</TableHead>
                                <TableHead>Acción de Confirmación</TableHead>
                                <TableHead>Activo</TableHead>
                                <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStatuses.map((status) => (
                                <TableRow key={status._id}>
                                    <TableCell>{status.status}</TableCell>
                                    <TableCell>{status.description || '-'}</TableCell>
                                    <TableCell>
                                        <TooltipProvider delayDuration={100}>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <div
                                                        className="w-6 h-6 rounded cursor-pointer"
                                                        style={{ backgroundColor: status.color }}
                                                        onClick={() => copyColorToClipboard(status.color)}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-black text-white">
                                                    <p>{status.color}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell>{status.default ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}</TableCell>
                                    <TableCell>{status.confirmacion ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}</TableCell>
                                    <TableCell>{status.confirmacion ? status.confirmacionText : '-'}</TableCell>
                                    <TableCell>
                                        <TooltipProvider delayDuration={100} >
                                            <Tooltip >
                                                <TooltipTrigger >
                                                    <div className="flex items-center gap-2 ">
                                                        {status.confirmationAction?.type === CONFIRMATION_ACTIONS.START_TIMER && 
                                                            <Timer className="w-4 h-4" />}
                                                        {status.confirmationAction?.type === CONFIRMATION_ACTIONS.CHANGE_STATUS && 
                                                            <ArrowRight className="w-4 h-4" />}
                                                        <span>{getActionDescription(status)}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className='bg-black'>
                                                    <p>{getActionDescription(status)}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell>{status.active ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className='bg-black text-white'>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedStatus(status);
                                                        setFormData({
                                                            ...status,
                                                            confirmationAction: status.confirmationAction || {
                                                                type: CONFIRMATION_ACTIONS.NONE,
                                                                config: {}
                                                            }
                                                        });
                                                        setModalMode("edit");
                                                        setModalOpen(true);
                                                    }}
                                                >
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(status)}
                                                >
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {modalMode === "create" ? "Crear Estado" : "Editar Estado"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="-space-y-0.5">
                            <Label htmlFor="status">Nombre del Estado</Label>
                            <Input
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                required
                            />
                        </div>

                        <div className="-space-y-0.5">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="-space-y-0.5">
                            <Label htmlFor="color">Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    id="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-24 h-10"
                                />
                                <Input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="default"
                                    checked={formData.default}
                                    onCheckedChange={(checked) => setFormData({ ...formData, default: checked })}
                                />
                                <Label htmlFor="default">Valor Predeterminado</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="confirmacion"
                                    checked={formData.confirmacion}
                                    onCheckedChange={(checked) => {
                                        setFormData({ 
                                            ...formData, 
                                            confirmacion: checked,
                                            confirmationAction: {
                                                type: CONFIRMATION_ACTIONS.NONE,
                                                config: {}
                                            }
                                        });
                                    }}
                                />
                                <Label htmlFor="confirmacion">Requiere Confirmación</Label>
                            </div>

                            {formData.confirmacion && (
                                <>
                                    <div className="-space-y-0.5">
                                        <Label htmlFor="confirmacionText">Texto del Botón de Confirmación</Label>
                                        <Input
                                            id="confirmacionText"
                                            value={formData.confirmacionText}
                                            onChange={(e) => setFormData({ ...formData, confirmacionText: e.target.value })}
                                            placeholder="Confirmar"
                                            required
                                        />
                                    </div>

                                    <div className="-space-y-0.5">
                                        <Label>Acción al Confirmar</Label>
                                        <Select
                                            value={formData.confirmationAction.type}
                                            onValueChange={(value) => setFormData({
                                                ...formData,
                                                confirmationAction: {
                                                    type: value,
                                                    config: {}
                                                }
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar acción" />
                                            </SelectTrigger>
                                            <SelectContent className='bg-black text-white'>
                                                <SelectItem value={CONFIRMATION_ACTIONS.NONE}>Sin acción</SelectItem>
                                                <SelectItem value={CONFIRMATION_ACTIONS.START_TIMER}>Iniciar temporizador</SelectItem>
                                                <SelectItem value={CONFIRMATION_ACTIONS.CHANGE_STATUS}>Cambiar estado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {renderConfirmationActionConfig()}
                                </>
                            )}

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                />
                                <Label htmlFor="active">Activo</Label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={handleCloseModal}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                {modalMode === "create" ? "Crear" : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}