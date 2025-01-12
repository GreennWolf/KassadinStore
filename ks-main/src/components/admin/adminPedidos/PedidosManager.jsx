import React, { useState, useEffect } from "react";
import { getAllPurchases, getAllStatus ,deletePurchase} from "../../../services/purcharseService";
import { toast } from 'react-toastify';
import { FiFilter, FiX } from 'react-icons/fi';
import { Loader2, Timer, ArrowRight } from 'lucide-react';
import OrderDetailsModal from '../../OrderDetailsModal';
import Filters from "../../Filters";
import {FaTrash} from 'react-icons/fa'


export const PedidosManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statuses, setStatuses] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        fechaInicio: "",
        fechaFin: "",
        estado: "",
        region: "",
        precioMin: "",
        precioMax: "",
        nombre: ""
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [orders, filters]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [ordersData, statusesData] = await Promise.all([
                getAllPurchases(),
                getAllStatus()
            ]);
            
            const sortedOrders = ordersData.sort((a, b) => 
                new Date(b.purchaseDate) - new Date(a.purchaseDate)
            );
            
            setOrders(sortedOrders);
            setFilteredOrders(sortedOrders);
            setStatuses(statusesData);
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const handleOrderUpdated = async () => {
        await fetchInitialData();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusFromOrder = (order) => {
        if (!order?.status?.statusId) return null;
        return statuses.find(s => s._id === (order.status.statusId._id || order.status.statusId));
    };

    const applyFilters = () => {
        let tempOrders = [...orders];

        if (filters.fechaInicio) {
            tempOrders = tempOrders.filter(order => 
                new Date(order.purchaseDate) >= new Date(filters.fechaInicio)
            );
        }
        if (filters.fechaFin) {
            tempOrders = tempOrders.filter(order => 
                new Date(order.purchaseDate) <= new Date(filters.fechaFin)
            );
        }
        if (filters.estado) {
            tempOrders = tempOrders.filter(order => 
                order.status?.statusId?._id === filters.estado ||
                order.status?.statusId === filters.estado
            );
        }
        if (filters.region) {
            tempOrders = tempOrders.filter(order => order.region === filters.region);
        }
        if (filters.precioMin) {
            tempOrders = tempOrders.filter(order => 
                order.Total >= parseFloat(filters.precioMin)
            );
        }
        if (filters.precioMax) {
            tempOrders = tempOrders.filter(order => 
                order.Total <= parseFloat(filters.precioMax)
            );
        }
        if (filters.nombre) {
            tempOrders = tempOrders.filter(order => 
                order.riotName.toLowerCase().includes(filters.nombre.toLowerCase())
            );
        }

        setFilteredOrders(tempOrders);
    };

    const handleFilterChange = (newFilters) => {
        setFilters({ ...filters, ...newFilters });
    };


    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span>Cargando pedidos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full px-6 py-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Gestión de Pedidos</h2>
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-black rounded-lg transition-all duration-300"
                >
                    {isFilterOpen ? (
                        <>
                            <FiX size={20} />
                            <span>Cerrar filtros</span>
                        </>
                    ) : (
                        <>
                            <FiFilter size={20} />
                            <div className="font-bold">Filtrar</div>
                        </>
                    )}
                </button>
            </div>

            <div 
                className={`fixed right-0 top-0 h-full w-80 bg-background shadow-2xl transform transition-transform duration-300 ease-in-out z-20 ${
                    isFilterOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Filtros</h3>
                        <button
                            onClick={() => setIsFilterOpen(false)}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                    <Filters 
                        filters={filters} 
                        onFilterChange={handleFilterChange} 
                        statuses={statuses} 
                    />
                </div>
            </div>

            {isFilterOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-10"
                    onClick={() => setIsFilterOpen(false)}
                />
            )}

            <div className={`transition-all duration-300 ${isFilterOpen ? 'mr-80' : ''}`}>
                <div className="rounded-lg overflow-hidden bg-card">
                    <div className="relative overflow-hidden">
                        <div className="overflow-x-auto">
                            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                                <table className="w-full ">
                                    <thead className="sticky top-0 bg-primary/10 text-primary-foreground z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-left">ID</th>
                                            <th className="px-4 py-3 text-left">Usuario</th>
                                            <th className="px-4 py-3 text-left">Riot Name</th>
                                            <th className="px-4 py-3 text-left">Región</th>
                                            <th className="px-4 py-3 text-left">Estado</th>
                                            <th className="px-4 py-3 text-left">Confirmación</th>
                                            <th className="px-4 py-3 text-left">Timer</th>
                                            <th className="px-4 py-3 text-left">Total (RP)</th>
                                            <th className="px-4 py-3 text-left">Total</th>
                                            <th className="px-4 py-3 text-left">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredOrders.length > 0 ? (
                                            filteredOrders.map(order => {
                                                const status = getStatusFromOrder(order);
                                                return (
                                                    <tr 
                                                        key={order._id}
                                                        className="hover:bg-accent/50 cursor-pointer"
                                                        onClick={() => handleOrderClick(order)}
                                                    >
                                                        <td className="px-4 text-sm py-3 truncate">{order._id}</td>
                                                        <td className="px-4 py-3">{order.userId?.username}</td>
                                                        <td className="px-4 py-3">{order.riotName}</td>
                                                        <td className="px-4 py-3">{order.region}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" 
                                                                    style={{ backgroundColor: status?.color }} />
                                                                <span>{status?.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {status?.confirmacion && (
                                                                order.status?.estadoConfirmado ? (
                                                                    <span className="text-green-500">Confirmado</span>
                                                                ) : (
                                                                    <span className="text-yellow-500">Pendiente</span>
                                                                )
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {order.timerEndTime && (
                                                                <Timer className="h-4 w-4" />
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">{order.totalRP}</td>
                                                        <td className="px-4 py-3">{order.Total}</td>
                                                        <td className="px-4 py-3">{formatDate(order.purchaseDate)}</td>
                                                        
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="10" className="text-center p-8 text-muted-foreground">
                                                    No hay pedidos que coincidan con los filtros.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedOrder && (
                <OrderDetailsModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    order={selectedOrder}
                    onOrderUpdated={handleOrderUpdated}
                    statuses={statuses}
                    admin={true}
                />
            )}
        </div>
    );
};