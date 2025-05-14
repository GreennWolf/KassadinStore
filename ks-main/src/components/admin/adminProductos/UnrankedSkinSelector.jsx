import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X, AlertCircle } from "lucide-react";
import { getAllSkins } from "../../../services/champsService";
import { toast } from 'sonner';

/**
 * Componente para seleccionar skins para cuentas unranked.
 * Completamente rediseñado para ofrecer una experiencia fluida y estable.
 */
const UnrankedSkinSelector = ({ isOpen, onClose, selectedSkins = [], onSave }) => {
    // ==================== ESTADOS ====================
    // Estados principales
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(''); // Nuevo estado para búsqueda con debounce
    const [loading, setLoading] = useState(false);
    const [showLoader, setShowLoader] = useState(false); // Nuevo estado para controlar la visualización del loader
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    // Estados de datos
    const [availableSkins, setAvailableSkins] = useState([]);
    const [selectedSkinsMap, setSelectedSkinsMap] = useState(new Map());
    
    // Estado de error
    const [error, setError] = useState(null);
    
    // Refs
    const observer = useRef(null);
    const scrollContainerRef = useRef(null);
    const lastSkinElementRef = useRef(null);
    const searchTimeoutRef = useRef(null); // Ref para el timeout de debounce
    const loaderTimeoutRef = useRef(null); // Ref para el timeout del loader
    const searchInputRef = useRef(null); // Ref para mantener el focus en el input de búsqueda
    
    // ==================== EFECTOS ====================
    
    // Inicializar componente cuando se abre
    useEffect(() => {
        if (!isOpen) return;
        
        // Limpiar estados
        setPage(1);
        setHasMore(true);
        setError(null);
        
        console.log('Inicializando selector con skins:', selectedSkins);
        
        // Inicializar mapa de skins seleccionadas
        const initialMap = new Map();
        const API_BASE_URL = `${import.meta.env.VITE_API_URL}/images/`;
        
        if (Array.isArray(selectedSkins)) {
            // Manejar tanto arrays de objetos como de strings
            selectedSkins.forEach(skin => {
                if (typeof skin === 'string') {
                    // Si es un string (ID simple)
                    initialMap.set(skin, { 
                        id: skin, 
                        name: `Skin ${skin.slice(-6)}`,
                        champion: 'Campeón',
                        imageUrl: null
                    });
                } else if (skin && typeof skin === 'object' && skin.id) {
                    // Si es un objeto con propiedades, asegurar que la URL sea absoluta
                    let imageUrl = skin.imageUrl;
                    
                    // Si tiene URL pero parece ser relativa, construir URL absoluta
                    if (imageUrl && !imageUrl.startsWith('http')) {
                        imageUrl = `${API_BASE_URL}/images/${imageUrl.replace(/\\/g, '/')}`;
                    }
                    
                    initialMap.set(skin.id, {
                        id: skin.id,
                        name: skin.name || `Skin ${skin.id.slice(-6)}`,
                        champion: skin.champion || 'Campeón',
                        imageUrl: imageUrl
                    });
                }
            });
        }
        
        console.log(`Inicializadas ${initialMap.size} skins seleccionadas:`, initialMap);
        
        setSelectedSkinsMap(initialMap);
        
        // Cargar primera página de skins
        fetchSkins(1, debouncedSearch, true);
        
        // Cargar inmediatamente datos de las skins seleccionadas
        if (initialMap.size > 0) {
            // Uso setTimeout para asegurar que esta carga ocurra después del render inicial
            setTimeout(() => {
                loadMissingSelectedSkins();
            }, 100);
        }
        
        // Limpiar timeouts al cerrar
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            if (loaderTimeoutRef.current) clearTimeout(loaderTimeoutRef.current);
        };
        
    }, [isOpen, selectedSkins]);
    
    // Implementar debounce para la búsqueda
    useEffect(() => {
        // Limpiar timeout previo
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Establecer nuevo timeout para actualizar la búsqueda con debounce
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 400); // 400ms de debounce
        
        // Limpiar en cleanup
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);
    
    // Efecto para actualizar búsqueda cuando cambia el debouncedSearch
    useEffect(() => {
        if (!isOpen) return;
        setPage(1);
        fetchSkins(1, debouncedSearch, true);
    }, [debouncedSearch, isOpen]);
    
    // Efecto para controlar la visualización del loader
    useEffect(() => {
        // Limpiar timeout previo
        if (loaderTimeoutRef.current) {
            clearTimeout(loaderTimeoutRef.current);
            loaderTimeoutRef.current = null;
        }
        
        if (loading) {
            // Mostrar loader después de 300ms para evitar parpadeos
            loaderTimeoutRef.current = setTimeout(() => {
                setShowLoader(true);
            }, 300);
        } else {
            setShowLoader(false);
        }
        
        return () => {
            if (loaderTimeoutRef.current) {
                clearTimeout(loaderTimeoutRef.current);
            }
        };
    }, [loading]);
    
    // Configurar intersection observer para scroll infinito
    useEffect(() => {
        if (!isOpen || !hasMore || loading) return;
        
        // Desconectar observer anterior si existe
        if (observer.current) {
            observer.current.disconnect();
        }
        
        // Crear nuevo observer
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                // Cargar siguiente página cuando el elemento es visible
                setPage(prevPage => prevPage + 1);
                fetchSkins(page + 1, debouncedSearch, false);
            }
        }, { 
            root: scrollContainerRef.current,
            threshold: 0.1,
            rootMargin: '0px 0px 200px 0px' // 200px de margen para cargar con anticipación
        });
        
        // Observar el último elemento
        if (lastSkinElementRef.current) {
            observer.current.observe(lastSkinElementRef.current);
        }
        
        // Cleanup
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [isOpen, hasMore, loading, page, availableSkins, debouncedSearch]);
    
    // ==================== FUNCIONES ====================
    
    // Cargar skins desde la API
    const fetchSkins = async (pageNumber, query, resetList = false) => {
        if (loading) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Construir parámetros de búsqueda
            const params = {
                page: pageNumber, 
                limit: 20,
                search: query,
                showAll: 'true'
            };
            
            // Realizar petición
            const response = await getAllSkins(params);
            
            if (!response || !response.data) {
                throw new Error('No se recibieron datos del servidor');
            }
            
            // Procesar skins - asegurar URLs de imágenes correctas
            const API_BASE_URL = `${import.meta.env.VITE_API_URL}/images/`;
            
            const processedSkins = response.data.map(skin => ({
                ...skin,
                // Crear URL completa si es necesario
                imageUrl: skin.srcLocal ? 
                    (skin.srcLocal.startsWith('http') ? 
                        skin.srcLocal : 
                        `${API_BASE_URL}/images/${skin.srcLocal.replace(/\\/g, '/')}`) : 
                    (skin.srcWeb || null)
            }));
            
            // Actualizar estado
            setAvailableSkins(prevSkins => {
                if (resetList) {
                    return processedSkins;
                } else {
                    // Filtrar duplicados
                    const existingIds = new Set(prevSkins.map(s => s._id));
                    const newSkins = processedSkins.filter(s => !existingIds.has(s._id));
                    return [...prevSkins, ...newSkins];
                }
            });
            
            // Actualizar si hay más páginas
            setHasMore(!!response.hasMore);
            
            // También cargar datos de skins seleccionadas si son visibles
            updateSelectedSkinsData(processedSkins);
            
        } catch (error) {
            console.error('Error al cargar skins:', error);
            setError('No se pudieron cargar las skins. Intenta nuevamente.');
            setHasMore(false);
        } finally {
            setLoading(false);
            
            // Restaurar focus al input de búsqueda si existía previamente
            if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
                // Pequeño timeout para asegurar que ocurra después del re-render
                setTimeout(() => {
                    if (searchInputRef.current) {
                        // Guardar la posición del cursor
                        const cursorPosition = searchInputRef.current.selectionStart;
                        searchInputRef.current.focus();
                        // Restaurar la posición del cursor
                        searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
                    }
                }, 0);
            }
        }
    };
    
    // Actualizar datos de skins seleccionadas
    const updateSelectedSkinsData = (skins) => {
        if (!skins || !skins.length) return;
        
        setSelectedSkinsMap(prevMap => {
            const newMap = new Map(prevMap);
            
            // Para cada skin en la lista
            skins.forEach(skin => {
                // Si está seleccionada pero sin datos completos
                if (newMap.has(skin._id)) {
                    const currentData = newMap.get(skin._id);
                    
                    // Actualizar con datos completos
                    newMap.set(skin._id, {
                        ...currentData,
                        id: skin._id,
                        name: skin.NombreSkin || currentData.name,
                        champion: skin.championData?.name || 'Campeón',
                        imageUrl: skin.imageUrl || currentData.imageUrl
                    });
                }
            });
            
            return newMap;
        });
    };
    
    // Cargar datos de skins seleccionadas que no estén en la vista actual
    const loadMissingSelectedSkins = async () => {
        // Identificar skins seleccionadas que necesitamos cargar
        const selectedIds = Array.from(selectedSkinsMap.keys());
        
        // Filtrar las que ya tienen datos completos
        const idsToLoad = selectedIds.filter(id => {
            const skinData = selectedSkinsMap.get(id);
            return !skinData.name || skinData.name === `Skin ${id.slice(-6)}`;
        });
        
        if (!idsToLoad.length) return;
        
        setLoading(true);
        try {
            const response = await getAllSkins({
                ids: idsToLoad.join(','),
                showAll: 'true'
            });
            
            if (response && response.data && response.data.length) {
                // Procesar y actualizar datos
                const API_BASE_URL = `${import.meta.env.VITE_API_URL}/images/`;
                
                const processedSkins = response.data.map(skin => ({
                    ...skin,
                    imageUrl: skin.srcLocal ? 
                        (skin.srcLocal.startsWith('http') ? 
                            skin.srcLocal : 
                            `${API_BASE_URL}/images/${skin.srcLocal.replace(/\\/g, '/')}`) : 
                        (skin.srcWeb || null)
                }));
                
                updateSelectedSkinsData(processedSkins);
                
                // También añadir a la lista visible si es necesario
                setAvailableSkins(prevSkins => {
                    const existingIds = new Set(prevSkins.map(s => s._id));
                    const newSkins = processedSkins.filter(s => !existingIds.has(s._id));
                    
                    if (newSkins.length) {
                        return [...prevSkins, ...newSkins];
                    }
                    return prevSkins;
                });
            }
        } catch (error) {
            console.error('Error al cargar skins seleccionadas:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Manejar clic en skin (seleccionar/deseleccionar)
    const toggleSkin = (skin) => {
        setSelectedSkinsMap(prevMap => {
            const newMap = new Map(prevMap);
            
            if (newMap.has(skin._id)) {
                // Deseleccionar
                newMap.delete(skin._id);
            } else {
                // Seleccionar
                newMap.set(skin._id, {
                    id: skin._id,
                    name: skin.NombreSkin || `Skin ${skin._id.slice(-6)}`,
                    champion: skin.championData?.name || 'Campeón',
                    imageUrl: skin.imageUrl || null
                });
            }
            
            return newMap;
        });
    };
    
    // Limpiar selección
    const clearSelection = () => {
        setSelectedSkinsMap(new Map());
    };
    
    // Guardar selección
    const handleSave = () => {
        // Convertir mapa a array de objetos para pasar al componente padre
        const selectedSkinsArray = Array.from(selectedSkinsMap.values());
        
        onSave(selectedSkinsArray);
        onClose();
    };
    
    // Cargar datos faltantes al abrir panel de seleccionadas
    useEffect(() => {
        if (isOpen && selectedSkinsMap.size > 0) {
            loadMissingSelectedSkins();
        }
    }, [isOpen, selectedSkinsMap.size]);

    // Manejo optimizado de la búsqueda
    const handleSearchChange = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []);

    // Manejo optimizado para limpiar la búsqueda
    const clearSearch = useCallback(() => {
        setSearchQuery('');
        // Enfocar el input después de limpiar la búsqueda
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);
    
    // ==================== RENDERIZADO ====================
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Seleccionar Skins para la Cuenta</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Panel izquierdo: Búsqueda y skins disponibles */}
                    <div className="md:col-span-2">
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Buscar skins..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="pl-8 pr-8"
                                    disabled={loading}
                                    ref={searchInputRef}
                                    autoComplete="off"
                                />
                                {searchQuery && (
                                    <button 
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={clearSearch}
                                        type="button"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {debouncedSearch !== searchQuery && loading && (
                                <div className="text-xs text-muted-foreground flex items-center mt-1">
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    Buscando...
                                </div>
                            )}
                        </div>
                        
                        <div 
                            ref={scrollContainerRef}
                            className="border rounded-md h-[400px] overflow-y-auto p-4"
                        >
                            {showLoader && availableSkins.length === 0 ? (
                                <div className="flex flex-col justify-center items-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                    <span>Cargando skins...</span>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col justify-center items-center h-full text-red-500">
                                    <AlertCircle className="h-6 w-6 mb-2" />
                                    <div className="text-center mb-2">{error}</div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => fetchSkins(1, debouncedSearch, true)}
                                    >
                                        Reintentar
                                    </Button>
                                </div>
                            ) : availableSkins.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {availableSkins.map((skin, index) => {
                                        // Determinar si es el último elemento para el observer
                                        const isLastItem = index === availableSkins.length - 1;
                                        
                                        return (
                                            <div 
                                                key={skin._id}
                                                ref={isLastItem ? lastSkinElementRef : null}
                                                className={`relative rounded-lg overflow-hidden border transition-all duration-200 ${
                                                    selectedSkinsMap.has(skin._id) 
                                                        ? 'shadow-md border-primary' 
                                                        : 'shadow-sm hover:shadow border-border'
                                                }`}
                                                onClick={() => toggleSkin(skin)}
                                            >
                                                {/* Precio RP */}
                                                {skin.priceRPData && (
                                                    <div className="absolute top-2 left-2 z-10 bg-background/90 px-2 py-0.5 rounded text-xs font-medium">
                                                        {skin.priceRPData.valueRP} RP
                                                    </div>
                                                )}
                                                
                                                {/* Indicador de selección */}
                                                {selectedSkinsMap.has(skin._id) && (
                                                    <div className="absolute inset-0 bg-primary/10 pointer-events-none z-10"></div>
                                                )}
                                                
                                                {/* Imagen de la skin */}
                                                <div className="w-full aspect-[4/3] bg-muted cursor-pointer">
                                                    <img 
                                                        src={skin.imageUrl || '/placeholder.png'} 
                                                        alt={skin.NombreSkin}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = '/placeholder.png';
                                                        }}
                                                        loading="lazy"
                                                    />
                                                </div>
                                                
                                                {/* Información */}
                                                <div className="p-2">
                                                    <div className="font-medium text-sm truncate" title={skin.NombreSkin}>
                                                        {skin.NombreSkin}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {skin.championData?.name || 'Campeón'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-full text-muted-foreground">
                                    {debouncedSearch ? 'No se encontraron skins que coincidan con la búsqueda' : 'No se encontraron skins'}
                                </div>
                            )}
                            
                            {/* Indicador de carga más */}
                            {showLoader && availableSkins.length > 0 && (
                                <div className="flex justify-center items-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                                    <span className="text-sm">Cargando más skins...</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Panel derecho: Skins seleccionadas */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="font-medium">
                                Skins seleccionadas ({selectedSkinsMap.size})
                            </div>
                            
                            {selectedSkinsMap.size > 0 && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={clearSelection}
                                >
                                    Limpiar
                                </Button>
                            )}
                        </div>
                        
                        <div className="border rounded-md h-[400px] overflow-y-auto p-4">
                            {selectedSkinsMap.size > 0 ? (
                                <div className="space-y-2">
                                    {Array.from(selectedSkinsMap.values()).map((skin) => (
                                        <div 
                                            key={skin.id}
                                            className="p-2 rounded flex items-center gap-3 cursor-pointer bg-muted hover:bg-muted/80"
                                            onClick={() => toggleSkin({ _id: skin.id })}
                                        >
                                            <div className="w-12 h-12 flex-shrink-0">
                                                {skin.imageUrl ? (
                                                    <img 
                                                        src={skin.imageUrl} 
                                                        alt={skin.name}
                                                        className="w-full h-full object-cover rounded"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = '/placeholder.png';
                                                        }}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center rounded">
                                                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {skin.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {skin.champion}
                                                </div>
                                            </div>
                                            <button
                                                className="p-1 hover:bg-red-100 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSkin({ _id: skin.id });
                                                }}
                                                type="button"
                                                aria-label="Quitar skin"
                                            >
                                                <X className="h-4 w-4 text-red-500" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-full text-muted-foreground">
                                    No hay skins seleccionadas
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <DialogFooter className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        Guardar Selección ({selectedSkinsMap.size})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UnrankedSkinSelector;