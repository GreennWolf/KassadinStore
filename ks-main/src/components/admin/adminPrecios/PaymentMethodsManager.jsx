import React, { useState , useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CreatePaymentMethodModal } from './paymentMethod/CreatePaymentMethodModal';
import { EditPaymentMethodModal } from './paymentMethod/EditPaymentMethodModal';
import { toast } from "react-toastify";
import { getAllCurrencies } from '../../../services/currencyService';
import { MoreVertical } from "lucide-react";
import {

    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    getAllPaymentMethods, 
    createPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod, 
    activePaymentMethod
} from '../../../services/payMethodService';
import { 
    setPaymentMethodCurrencies, 
    getAvailableCurrencies, 
    getAllPaymentMethodCurrencies,
    removeRestrictions 
} from '../../../services/paymentMethodCurrencyService';


export function PaymentMethodsManager() {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [newMethod, setNewMethod] = useState({ 
        method: '', 
        details: [{ title: '', description: '' }],
        currencies: [],
        isRestricted: false
    });
    const [availableCurrencies, setAvailableCurrencies] = useState([]);
    const [methodCurrencies, setMethodCurrencies] = useState({});
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, method: null });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [methodToDelete, setMethodToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchInitialData();
        
        const handleClick = () => {
            if (contextMenu.visible) {
                setContextMenu(prev => ({ ...prev, visible: false }));
            }
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const fetchInitialData = async () => {
        try {
            const [methodsData, allCurrencies, relationsData] = await Promise.all([
                getAllPaymentMethods(),
                getAllCurrencies(),
                getAllPaymentMethodCurrencies()
            ]);

            setPaymentMethods(methodsData);
            setAvailableCurrencies(allCurrencies);

            const currencyMap = {};
            relationsData.forEach(relation => {
                if (relation.paymentMethod) {
                    currencyMap[relation.paymentMethod._id] = {
                        currencies: relation.currencies || [],
                        isRestricted: relation.isRestricted || false
                    };
                }
            });
            setMethodCurrencies(currencyMap);
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
            toast.error("Error al cargar los datos");
        }
    };

    const handleContextMenu = (event, method) => {
        event.preventDefault();
        setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            method: method,
        });
    };

    const handleEdit = (methodToEdit) => {
        const currencyData = methodCurrencies[methodToEdit._id] || {
            currencies: [],
            isRestricted: false
        };
    
        // Asegurarse de que currencies sea un array de IDs
        const selectedCurrencyIds = currencyData.currencies.map(currency => 
            typeof currency === 'object' ? currency._id : currency
        );
    
        setSelectedMethod({ 
            ...methodToEdit,
            currencies: selectedCurrencyIds,
            isRestricted: currencyData.isRestricted,
        });
        setIsEditModalOpen(true);
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleDelete = () => {
        setMethodToDelete(contextMenu.method);
        setIsConfirmModalOpen(true);
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleActive = () => {
        handleActiveMethod(contextMenu.method._id);
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleDetailChange = (index, field, value, isEditing) => {
        const updateState = isEditing ? setSelectedMethod : setNewMethod;
        const currentMethod = isEditing ? selectedMethod : newMethod;

        const updatedDetails = currentMethod.details.map((detail, i) => 
            i === index ? { ...detail, [field]: value } : detail
        );

        updateState(prev => ({
            ...prev,
            details: updatedDetails
        }));
    };

    const handleCurrencyChange = (currencyId, isChecked, isEditing) => {
        const updateState = isEditing ? setSelectedMethod : setNewMethod;
        const currentMethod = isEditing ? selectedMethod : newMethod;
    
        // Asegurarse de que currencies sea un array
        const currentCurrencies = Array.isArray(currentMethod.currencies) 
            ? currentMethod.currencies 
            : [];
    
        updateState(prev => ({
            ...prev,
            currencies: isChecked 
                ? [...currentCurrencies, currencyId]
                : currentCurrencies.filter(id => id !== currencyId)
        }));
    };

    const addDetail = (isEditing) => {
        const updateState = isEditing ? setSelectedMethod : setNewMethod;
        updateState(prev => ({
            ...prev,
            details: [...prev.details, { title: '', description: '' }]
        }));
    };

    const removeDetail = (index, isEditing) => {
        const updateState = isEditing ? setSelectedMethod : setNewMethod;
        updateState(prev => {
            const updatedDetails = prev.details.filter((_, i) => i !== index);
            return {
                ...prev,
                details: updatedDetails.length > 0 ? updatedDetails : [{ title: '', description: '' }]
            };
        });
    };

    const validateMethod = (method) => {
        if (!method.method || !method.details || method.details.length === 0) {
            toast.error("Por favor, completa todos los campos y agrega al menos un detalle.");
            return false;
        }

        for (const detail of method.details) {
            if (!detail.title || !detail.description) {
                toast.error("Cada detalle debe tener un título y una descripción.");
                return false;
            }
        }
        return true;
    };

    const handleCreateMethod = async () => {
        if (!validateMethod(newMethod)) return;

        setIsLoading(true);
        try {
            const created = await createPaymentMethod(newMethod.method, newMethod.details);

            if (newMethod.isRestricted) {
                await setPaymentMethodCurrencies(
                    created._id,
                    newMethod.currencies,
                    newMethod.isRestricted
                );
            }

            await fetchInitialData();
            setNewMethod({
                method: '',
                details: [{ title: '', description: '' }],
                currencies: [],
                isRestricted: false
            });
            setIsCreateModalOpen(false);
            toast.success("Método de pago creado exitosamente");
        } catch (error) {
            console.error("Error al crear método de pago:", error);
            toast.error("Error al crear el método de pago");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateMethod = async () => {
        if (!validateMethod(selectedMethod)) return;

        setIsLoading(true);
        try {
            await updatePaymentMethod(selectedMethod._id, {
                method: selectedMethod.method,
                details: selectedMethod.details,
                active: selectedMethod.active
            });

            if (selectedMethod.isRestricted) {
                await setPaymentMethodCurrencies(
                    selectedMethod._id,
                    selectedMethod.currencies,
                    selectedMethod.isRestricted
                );
            } else {
                await removeRestrictions(selectedMethod._id);
            }

            await fetchInitialData();
            setSelectedMethod(null);
            setIsEditModalOpen(false);
            toast.success("Método de pago actualizado exitosamente");
        } catch (error) {
            console.error("Error al actualizar método de pago:", error);
            toast.error("Error al actualizar el método de pago");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteMethod = async (id) => {
        setIsLoading(true);
        try {
            await deletePaymentMethod(id);
            await fetchInitialData();
            setIsConfirmModalOpen(false);
            setMethodToDelete(null);
            toast.success("Método de pago eliminado exitosamente");
        } catch (error) {
            console.error("Error al eliminar método de pago:", error);
            toast.error("Error al eliminar el método de pago");
        } finally {
            setIsLoading(false);
        }
    };

    const handleActiveMethod = async (id) => {
        setIsLoading(true);
        try {
            await activePaymentMethod(id);
            await fetchInitialData();
            toast.success("Método de pago activado exitosamente");
        } catch (error) {
            console.error("Error al activar método de pago:", error);
            toast.error("Error al activar el método de pago");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gestión de Métodos de Pago</h2>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button>Agregar Método de Pago</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Método de Pago</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" placeholder="Nombre del método de pago" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="active" />
                                <Label htmlFor="active">Activo</Label>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="text-center">Método</TableHead>
                    <TableHead className="text-center">Detalles</TableHead>
                    <TableHead className="text-center">Divisas Disponibles</TableHead>
                    <TableHead className="text-center">Activo</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paymentMethods.map((method) => (
                    <TableRow 
                        key={method._id}
                        className="cursor-pointer"
                        onContextMenu={(e) => onContextMenu(e, method)}
                    >
                        <TableCell className="text-center">{method.method}</TableCell>
                        <TableCell className="text-center">
                        {method.details.map((detail, index) => (
                            <div key={index} className="mb-2">
                            <strong>{detail.title}:</strong> {detail.description}
                            </div>
                        ))}
                        </TableCell>
                        <TableCell className="text-center">
                        {methodCurrencies[method._id] ? (
                            methodCurrencies[method._id].isRestricted ? (
                            methodCurrencies[method._id].currencies?.map(currency => (
                                <span 
                                key={currency._id} 
                                className="mr-2 px-2 py-1 bg-primary rounded text-primary-foreground"
                                >
                                {currency.code}
                                </span>
                            ))
                            ) : (
                            <span className="text-center text-muted-foreground">
                                Todas las divisas
                            </span>
                            )
                        ) : (
                            <span className="text-center text-muted-foreground">
                            Todas las divisas
                            </span>
                        )}
                        </TableCell>
                        <TableCell className="text-center">
                        {method.active ? 'SI' : 'NO'}
                        </TableCell>
                        <TableCell className="text-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-black" align="end">
                                        <DropdownMenuItem
                                            onClick={() => {
                                                handleEdit(method);
                                                setIsEditModalOpen(true);
                                            }}
                                        >
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => {
                                                if(!method.active){
                                                    handleActiveMethod(method._id);
                                                }else{
                                                    handleDeleteMethod(method._id)
                                                }
                                            }}
                                        >
                                            {method.active ? 'Desactivar' : 'Activar'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
            <CreatePaymentMethodModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                newMethod={newMethod}
                onMethodChange={(value) => setNewMethod(prev => ({ ...prev, method: value }))}
                onDetailChange={handleDetailChange}
                onRemoveDetail={removeDetail}
                onAddDetail={addDetail}
                availableCurrencies={availableCurrencies}
                onCurrencyChange={handleCurrencyChange}
                onRestrictionChange={(checked) => setNewMethod(prev => ({ ...prev, isRestricted: checked }))}
                onSubmit={handleCreateMethod}
                isLoading={isLoading}
            />

            <EditPaymentMethodModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                selectedMethod={selectedMethod}
                onMethodChange={(value) => setSelectedMethod(prev => ({ ...prev, method: value }))}
                onDetailChange={handleDetailChange}
                onRemoveDetail={removeDetail}
                onAddDetail={addDetail}
                onActiveChange={(value) => setSelectedMethod(prev => ({ ...prev, active: value }))}
                availableCurrencies={availableCurrencies}
                onCurrencyChange={handleCurrencyChange}
                onRestrictionChange={(checked) => setSelectedMethod(prev => ({ ...prev, isRestricted: checked }))}
                onSubmit={handleUpdateMethod}
                isLoading={isLoading}
            />
        </Card>
    );
}