import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X, AlertCircle } from "lucide-react";
import { getAllSkins } from "../../../services/champsService";
import { getAllUnrankeds } from "../../../services/unrankedService";
import { toast } from 'sonner';

/**
 * Componente para seleccionar skins para cuentas unranked.
 * Mejorado para evitar cambios constantes en las imágenes durante la búsqueda.
 */
const UnrankedSkinSelector = ({ isOpen, onClose, selectedSkins = [], onSave }) => {
    // ==================== ESTADOS ====================
    // Estados principales
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    // Estados de datos
    const [availableSkins, setAvailableSkins] = useState([]);
    const [selectedSkinsMap, setSelectedSkinsMap] = useState(new Map());
    const [displayedSkins, setDisplayedSkins] = useState([]); // Nuevo estado para separar visualización de datos
    const [lastSearchTerm, setLastSearchTerm] = useState(""); // Último término que causó un cambio visual
    const [shouldUpdateDisplay, setShouldUpdateDisplay] = useState(false); // Flag para controlar actualizaciones visuales
    
    // Estado de error
    const [error, setError] = useState(null);
    
    // Refs
    const observer = useRef(null);
    const scrollContainerRef = useRef(null);
    const lastSkinElementRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const loaderTimeoutRef = useRef(null);
    const searchInputRef = useRef(null);
    const lastSearchRef = useRef("");
    
    // ==================== EFECTOS ====================
    
    // Inicializar componente cuando se abre
    useEffect(() => {
        if (!isOpen) return;
        
        // Limpiar estados
        setPage(1);
        setHasMore(true);
        setError(null);
        
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
        
        // Normalizar texto de búsqueda (quitar acentos, convertir a minúsculas)
        const normalizeText = (text) => {
            return text
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Eliminar acentos
        };
        
        // Para ciertos campeones, agregar variaciones comunes al término de búsqueda
        let searchTerms = [searchQuery.trim()];
        const normalizedSearch = normalizeText(searchQuery);
        
        // Manejar términos de búsqueda comunes y sus variaciones
        const searchMappings = {
            'aa': ['aatrox'],
            'aatro': ['aatrox'],
            'aatrox': ['aatrox'],
            'wuk': ['wukong', 'monkeyking'],
            'monkey': ['wukong', 'monkeyking'],
            'nunu': ['nunu', 'willump', 'nunu & willump'],
            'aure': ['aurelion', 'aurelionsol', 'aurelion sol', 'asol'],
            'sol': ['aurelion', 'aurelionsol', 'aurelion sol', 'asol'],
            'bel': ['belveth', "bel'veth"],
            'cho': ['chogath', "cho'gath"]
        };
        
        // Buscar coincidencias para términos de búsqueda comunes
        for (const [key, values] of Object.entries(searchMappings)) {
            if (normalizedSearch.includes(key)) {
                searchTerms = [...searchTerms, ...values];
                break;
            }
        }
        
        // Solo actualizar si hay un término de búsqueda
        if (searchQuery.trim()) {
            // console.log(`Términos de búsqueda: ${searchTerms.join(', ')}`);
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
    
    // Efecto para actualizar búsqueda en segundo plano cuando cambia el debouncedSearch
    // IMPORTANTE: Este efecto ahora SOLO actualiza availableSkins, pero NO displayedSkins
    useEffect(() => {
        if (!isOpen) return;
        
        // console.log(`Término de búsqueda debounced cambiado a: "${debouncedSearch}"`);
        
        // Guardar los IDs anteriores antes de actualizar la página
        const previousIds = availableSkins.map(skin => skin._id);
        
        // Resetear la página para la búsqueda en segundo plano
        setPage(1);
        
        // El flag indica que NO queremos actualizar displayedSkins
        // Solo queremos precargar los resultados en segundo plano
        const forceDisplayUpdate = false;
        
        // Realizar la búsqueda en segundo plano (actualiza availableSkins pero no displayedSkins)
        fetchSkins(1, debouncedSearch, true, {forceDisplayUpdate});
        
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
    }, [isOpen, hasMore, loading, page, displayedSkins, debouncedSearch]);
    
    // Efecto para actualizar las skins mostradas de manera controlada
    // Evita cambios constantes en la interfaz durante la búsqueda
    useEffect(() => {
        // Si es la primera carga de la página, siempre actualizar
        if (page === 1 && !loading && availableSkins.length > 0) {
            setDisplayedSkins(availableSkins);
            return;
        }
        
        // Si estamos cargando la página 1, no actualizar para evitar parpadeos
        if (loading && page === 1) {
            return;
        }
        
        // Si estamos cargando más páginas (scroll infinito), agregar nuevos resultados
        if (!loading && page > 1) {
            setDisplayedSkins(prev => {
                // Si no hay displayedSkins previos, usar availableSkins directamente
                if (prev.length === 0) return availableSkins;
                
                // Obtener los IDs existentes para evitar duplicados
                const existingIds = new Set(prev.map(s => s._id));
                
                // Filtrar nuevos elementos y agregarlos al final
                const newItems = availableSkins.filter(s => !existingIds.has(s._id));
                
                return [...prev, ...newItems];
            });
        }
        
        // No actualizamos displayedSkins durante cambios de búsqueda
        // Solo actualizamos cuando se completa la carga inicial o al cargar más páginas
    }, [availableSkins, loading, page, debouncedSearch]);
    
    // ==================== FUNCIONES ====================
    
    // Cargar skins desde la API
    const fetchSkins = async (pageNumber, query, resetList = false, userActions = {}) => {
        if (loading) return;
        
        // Extraer acciones del usuario (objeto o valor booleano simple para compatibilidad)
        const isSearchBeingErased = typeof userActions === 'object' ? userActions.isSearchBeingErased : userActions;
        const isAddingSpace = typeof userActions === 'object' ? userActions.isAddingSpace : false;
        const isContinuingSpacedSearch = typeof userActions === 'object' ? userActions.isContinuingSpacedSearch : false;
        
        setLoading(true);
        setError(null);
        
        try {
            // Log de depuración para ver qué términos de búsqueda se están utilizando
            // console.log(`Buscando con término: "${query}", página: ${pageNumber}, resetList: ${resetList}
            Acciones: Borrado=${isSearchBeingErased}, Espacio=${isAddingSpace}, Continuando=${isContinuingSpacedSearch}`);
            
            // Preparar el término de búsqueda para hacerlo más inclusivo
            let processedQuery = query;
            
            // Con la mejora en el backend, ya no necesitamos procesar las búsquedas con espacios
            // El backend ahora maneja directamente los espacios como búsquedas inclusivas
            if (query.includes(' ')) {
                // Simplemente normalizar eliminando espacios múltiples y recortando
                processedQuery = query.trim().replace(/\s+/g, ' ');
                // console.log(`Búsqueda con espacios - original: "${query}", normalizada: "${processedQuery}"`);
            }
            
            // Decidir qué endpoint usar según el tipo de búsqueda
            let response;
            
            // Si hay un término de búsqueda, es más efectivo buscar en el endpoint de unrankeds
            // que maneja mejor la búsqueda por skins dentro de una cuenta
            if (processedQuery && processedQuery.trim().length > 0) {
                // console.log("Usando endpoint de unrankeds para búsqueda por skin:", processedQuery);
                
                const unrankedParams = {
                    page: pageNumber,
                    limit: 20,
                    skinSearch: processedQuery, // Usar skinSearch para búsqueda específica de skins
                    showAll: 'true',
                    includeSearch: 'true' // Habilitar búsqueda inclusiva
                };
                
                // Obtener cuentas unranked que tengan skins coincidentes
                const unrankedResponse = await getAllUnrankeds(unrankedParams);
                
                if (!unrankedResponse || !unrankedResponse.data) {
                    throw new Error('No se recibieron datos del servidor');
                }
                
                // Extraer skins de las cuentas encontradas
                const allSkins = [];
                const skinsMap = new Map(); // Para evitar duplicados
                
                // Procesar cada cuenta y sus skins
                unrankedResponse.data.forEach(account => {
                    if (account.skins && Array.isArray(account.skins)) {
                        account.skins.forEach(skin => {
                            // Evitar duplicados usando un Map con el ID como clave
                            if (skin && skin._id && !skinsMap.has(skin._id)) {
                                skinsMap.set(skin._id, skin);
                                allSkins.push(skin);
                            }
                        });
                    }
                });
                
                // Construir respuesta en formato compatible con el código existente
                response = {
                    data: allSkins,
                    total: allSkins.length,
                    currentPage: 1,
                    totalPages: 1,
                    hasMore: false
                };
                
                // console.log(`Encontradas ${allSkins.length} skins únicas en las cuentas unranked`);
            } else {
                // Para búsquedas vacías o carga inicial, usar el endpoint original de skins
                // console.log("Usando endpoint de skins para búsqueda general");
                
                const skinParams = {
                    page: pageNumber, 
                    limit: 20,
                    search: processedQuery,
                    showAll: 'true',
                    includeSearch: 'true' // Siempre utilizamos búsqueda inclusiva
                };
                
                // Realizar petición original
                response = await getAllSkins(skinParams);
            }
            
            if (!response || !response.data) {
                throw new Error('No se recibieron datos del servidor');
            }
            
            // console.log(`Resultados de búsqueda para "${query}":`, response.data.length);
            
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
            
            // Actualizar estado de availableSkins (datos en segundo plano)
            setAvailableSkins(prevSkins => {
                let newState;
                if (resetList) {
                    // Si estamos reseteando, actualizar completamente
                    newState = processedSkins;
                } else {
                    // En caso de scroll infinito, agregar sin duplicados
                    const existingIds = new Set(prevSkins.map(s => s._id));
                    const newSkins = processedSkins.filter(s => !existingIds.has(s._id));
                    newState = [...prevSkins, ...newSkins];
                }
                
                // console.log(`Actualizando availableSkins: ${newState.length} skins después de buscar "${query}"`);
                return newState;
            });
            
            // LÓGICA SIMPLIFICADA:
            // Ahora solo actualizamos displayedSkins en estos casos:
            // 1. Cuando el usuario hace clic en botón de búsqueda (forceDisplayUpdate)
            // 2. Cuando el usuario presiona Enter (forceDisplayUpdate)
            // 3. En la carga inicial cuando no hay skins mostradas
            
            // Extraer el flag para forzar la actualización de la visualización
            const forceDisplayUpdate = typeof userActions === 'object' && userActions.forceDisplayUpdate;
            
            // Verificar si hay resultados actuales y previos
            const hasCurrentResults = processedSkins.length > 0;
            const hasPreviousResults = displayedSkins.length > 0;
            
            // Esta es la carga inicial (sin displayedSkins aún)
            const isInitialLoad = !hasPreviousResults && hasCurrentResults;
            
            // console.log(`Análisis para decisión:
            - forceDisplayUpdate: ${forceDisplayUpdate ? 'SÍ' : 'NO'}
            - isInitialLoad: ${isInitialLoad ? 'SÍ' : 'NO'}
            - hasCurrentResults: ${hasCurrentResults} (${processedSkins.length})
            - hasPreviousResults: ${hasPreviousResults} (${displayedSkins.length})`);
            
            // DECISIÓN SENCILLA:
            
            if (forceDisplayUpdate && hasCurrentResults) {
                // 1. Si se fuerza la actualización (clic en botón/Enter) y hay resultados, actualizar
                // console.log(`✅ Actualizando displayedSkins forzadamente con ${processedSkins.length} skins para "${query}"`);
                setDisplayedSkins(processedSkins);
                
                // Guardar el término que causó este cambio visual
                setLastSearchTerm(query);
                
            } else if (isInitialLoad) {
                // 2. Carga inicial - mostrar todo cuando no hay nada mostrado aún
                // console.log("🔄 Carga inicial - mostrando todas las skins");
                setDisplayedSkins(processedSkins);
                
            } else {
                // 3. En todos los demás casos, mantener la visualización actual
                // console.log("ℹ️ Conservando visualización actual - sin cambios en displayedSkins");
                
                // Opcional: Si se fuerza pero no hay resultados, mostrar mensaje específico
                if (forceDisplayUpdate && !hasCurrentResults) {
                    // console.log("⚠️ Búsqueda forzada sin resultados");
                    // Se podría mostrar algún mensaje o notificación específica
                }
            }
            
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
        const newValue = e.target.value;
        
        // Detectar si se está borrando texto (para mejorar aún más la detección)
        // Comparamos con searchQuery en vez de debouncedSearch para tener una detección más inmediata
        if (searchQuery.length > newValue.length && searchQuery.startsWith(newValue)) {
            // console.log("🔍 Detectado borrado en handleSearchChange - manteniendo visualización");
            // Se está borrando - no necesitamos hacer nada especial aquí,
            // la lógica principal está en el efecto de debouncedSearch
        } else if (newValue.length > searchQuery.length) {
            // console.log("🔍 Detectada escritura en handleSearchChange");
            // Se está escribiendo
        }
        
        // Actualizar el valor de búsqueda (el comportamiento normal)
        setSearchQuery(newValue);
    }, [searchQuery]);

    // Manejo optimizado para limpiar la búsqueda
    const clearSearch = useCallback(() => {
        setSearchQuery('');
        
        // Limpiar también el término de búsqueda que causó la última actualización visual
        if (lastSearchTerm !== "") {
            // Solo activar una búsqueda si habíamos buscado algo antes
            setShouldUpdateDisplay(true);
            setLastSearchTerm("");
            
            // Realizar una búsqueda vacía para mostrar todos los resultados
            fetchSkins(1, "", true, {forceDisplayUpdate: true});
        }
        
        // Enfocar el input después de limpiar la búsqueda
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [lastSearchTerm]);
    
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
                                    className="pl-8 pr-20"
                                    disabled={loading}
                                    ref={searchInputRef}
                                    autoComplete="off"
                                    onKeyDown={(e) => {
                                        // Actualizar al presionar Enter
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            setShouldUpdateDisplay(true);
                                            setLastSearchTerm(searchQuery);
                                            // Usar directamente el término sin procesamiento especial, 
                                            // el backend ahora maneja correctamente las búsquedas con espacios
                                            fetchSkins(1, searchQuery, true, {forceDisplayUpdate: true});
                                        }
                                    }}
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                                    <button 
                                        className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                        onClick={() => {
                                            setShouldUpdateDisplay(true);
                                            setLastSearchTerm(searchQuery);
                                            // Usar directamente el término de búsqueda, el backend maneja espacios correctamente
                                            fetchSkins(1, searchQuery, true, {forceDisplayUpdate: true});
                                        }}
                                        type="button"
                                        disabled={loading}
                                        title="Buscar"
                                    >
                                        Buscar
                                    </button>
                                    
                                    {searchQuery && (
                                        <button 
                                            className="text-muted-foreground hover:text-foreground"
                                            onClick={clearSearch}
                                            type="button"
                                            aria-label="Limpiar búsqueda"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
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
                            ) : displayedSkins.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {displayedSkins.map((skin, index) => {
                                        // Determinar si es el último elemento para el observer
                                        const isLastItem = index === displayedSkins.length - 1;
                                        
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
                            ) : loading && debouncedSearch ? (
                                <div className="flex flex-col justify-center items-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                                    <span>Buscando "{debouncedSearch}"...</span>
                                </div>
                            ) : debouncedSearch && availableSkins.length === 0 ? (
                                <div className="flex flex-col justify-center items-center h-full text-muted-foreground py-8">
                                    <div className="text-center mb-3">
                                        No se encontraron skins que coincidan con "{debouncedSearch}"
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => {
                                            setSearchQuery("");
                                            if (searchInputRef.current) {
                                                searchInputRef.current.focus();
                                            }
                                        }}
                                    >
                                        Limpiar búsqueda
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-full text-muted-foreground">
                                    No se encontraron skins
                                </div>
                            )}
                            
                            {/* Indicador de carga más */}
                            {showLoader && displayedSkins.length > 0 && hasMore && (
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