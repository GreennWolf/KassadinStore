import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { useStore } from "@/context/StoreContext";
import { toast } from "sonner";
import { StoreFilters } from "@/components/StoreFilters";
import { RPTypeSelector } from "@/components/RPTypeSelector";
import { ProductGrid } from "@/components/ProductGrid";
import { getAllSkins, getAllDestacadosSkins } from "../services/champsService";
import { getAllItems, getAllDestacadosItems } from "../services/itemService";
import { getAllRPPriceConversions } from "../services/rpConvertionService";
import { useCurrency } from '../context/currencyContext';
import { CurrencySelectionModal } from '../components/CurrencySelectionModal';
import { getAllCurrencies } from '../services/currencyService';
import { RPInfoModal } from "../components/RPInfoModal";

const ITEMS_PER_PAGE = 20;

const SKINS_SUBCATEGORIES = [
  { id: 'all', label: 'Todas las Skins' },
  { id: 'chromas', label: 'Chromas' },
  { id: 'bundles', label: 'Bundles' }
];

const Tienda = () => {
  const { category } = useParams();
  const { addToCart } = useStore();
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();

  // Estados esenciales
  const [products, setProducts] = useState([]);
  const [destacadosProducts, setDestacadosProducts] = useState([]);
  const [rpConversions, setRpConversions] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  
  // Estados de carga y UI
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDestacados, setIsLoadingDestacados] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  
  // Estados de filtrado y paginación
  const [searchQuery, setSearchQuery] = useState("");
  const [skinSearchQuery, setSkinSearchQuery] = useState(""); // Nuevo estado para búsqueda de skins
  const [selectedRegion, setSelectedRegion] = useState("all"); // Nuevo estado para filtro de región
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("");
  const [isSeguroRP, setIsSeguroRP] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Referencias
  const loadingRef = useRef(null);
  const infiniteScrollRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const skinSearchTimeoutRef = useRef(null); // Nuevo ref para búsqueda de skins
  const [showRPInfoModal, setShowRPInfoModal] = useState(false);

  const handleInfoClick = () => {
    setShowRPInfoModal(true);
  };

  // Cargar conversiones RP
  useEffect(() => {
    const loadRPConversions = async () => {
      try {
        const conversions = await getAllRPPriceConversions();
        if (Array.isArray(conversions)) {
          setRpConversions(conversions);
        }
      } catch (error) {
        console.error('Error loading RP conversions:', error);
      }
    };
    loadRPConversions();
  }, []);

  // Cargar divisas
  useEffect(() => {
    const loadCurrencies = async () => {
      setIsLoadingCurrencies(true);
      try {
        const currencyData = await getAllCurrencies();
        if (Array.isArray(currencyData)) {
          const activeCurrencies = currencyData.filter(currency => currency.active);
          setCurrencies(activeCurrencies);
          
          if (!selectedCurrency && activeCurrencies.length > 0) {
            setShowCurrencyModal(true);
          }
        }
      } catch (error) {
        console.error('Error loading currencies:', error);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };
    loadCurrencies();
  }, []);

  // Cargar productos destacados
  useEffect(() => {
    const loadDestacados = async () => {
      if (searchQuery || skinSearchQuery) {
        // Si hay una búsqueda activa, no mostramos productos destacados
        setDestacadosProducts([]);
        return;
      }

      setIsLoadingDestacados(true);
      try {
        let destacados = [];
        
        if (category === 'skins' && selectedSubcategory === 'all') {
          // Para skins destacadas
          destacados = await getAllDestacadosSkins();
        } else if (category !== 'skins' && category !== 'unrankeds') {
          // Para ítems destacados de otras categorías
          const params = { type: category };
          const response = await getAllDestacadosItems(params);
          destacados = response || [];
        }
        
        setDestacadosProducts(destacados);
      } catch (error) {
        console.error('Error loading destacados:', error);
      } finally {
        setIsLoadingDestacados(false);
      }
    };
    
    loadDestacados();
  }, [category, selectedSubcategory, searchQuery, skinSearchQuery]);

  // Función principal de carga de productos
  const loadProducts = useCallback(async (pageNum) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
  
    setIsLoading(true);
    try {
      const params = {
        page: pageNum,
        limit: ITEMS_PER_PAGE,
        search: searchQuery,
        sort: sortOrder,
        type: category,
        orderByNew: true,
      };
  
      // Agregar lógica de ordenamiento
      if (sortOrder) {
        const [field, direction] = sortOrder.split('-');
        params.sortField = field;
        params.sortDirection = direction;
      }

      // Agregar búsqueda de skins para unrankeds
      if (category === 'unrankeds' && skinSearchQuery) {
        params.skinSearch = skinSearchQuery;
      }

      // Agregar filtro de región para unrankeds
      if (category === 'unrankeds' && selectedRegion !== "all") {
        params.region = selectedRegion;
      }
  
      if (category === 'skins' && selectedSubcategory === 'chromas') {
        params.type = 'chromas';
        const response = await getAllItems(params, abortControllerRef.current.signal);
        
        if (response?.data) {
          let validChromas = response.data.filter(item => 
            item && item.type === 'chromas' && item.skin
          );
  
          // Ordenar localmente si es necesario
          if (sortOrder && !response.sorted) {
            validChromas = sortProducts(validChromas, sortOrder);
          }
  
          setProducts(prev => pageNum === 1 ? validChromas : [...prev, ...validChromas]);
          setHasMore(response.hasMore);
        }
      } else {
        if (category === 'skins') {
          params.subcategory = selectedSubcategory === 'all' ? null : selectedSubcategory;
        }
        
        const service = category === 'skins' ? getAllSkins : getAllItems;
        const response = await service(params, abortControllerRef.current.signal);
  
        if (response?.data) {
          let sortedData = response.data;
  
          // Ordenar localmente si es necesario
          if (sortOrder && !response.sorted) {
            sortedData = sortProducts(sortedData, sortOrder);
          }
  
          setProducts(prev => pageNum === 1 ? sortedData : [...prev, ...sortedData]);
          setHasMore(response.hasMore);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading products:', error);
        toast.error("Error al cargar productos");
      }
    } finally {
      setIsLoading(false);
    }
  }, [category, searchQuery, skinSearchQuery, selectedRegion, selectedSubcategory, sortOrder]);

  // Efecto para cargar productos al inicio y cuando cambian filtros
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      setProducts([]);
      loadProducts(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [category, selectedSubcategory, searchQuery, sortOrder, selectedRegion, loadProducts]);

  // Efecto para búsqueda de skins en unrankeds
  useEffect(() => {
    if (category !== 'unrankeds') return;
    
    if (skinSearchTimeoutRef.current) {
      clearTimeout(skinSearchTimeoutRef.current);
    }

    skinSearchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      setProducts([]);
      loadProducts(1);
    }, 300);

    return () => {
      if (skinSearchTimeoutRef.current) {
        clearTimeout(skinSearchTimeoutRef.current);
      }
    };
  }, [skinSearchQuery, category]);

  // Observador para infinite scroll
  useEffect(() => {
    if (!infiniteScrollRef.current || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && hasMore) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          loadProducts(nextPage);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(infiniteScrollRef.current);
    return () => observer.disconnect();
  }, [isLoading, hasMore, currentPage, loadProducts]);

  // Handlers
  const handleCurrencySelect = useCallback((currency) => {
    const selectedCurrency = currencies.find(c => c._id === currency);
    if (selectedCurrency) {
      updateSelectedCurrency(selectedCurrency);
      setShowCurrencyModal(false);
    }
  }, [currencies, updateSelectedCurrency]);

  const handleAddToCart = useCallback((product) => {
    const isSkin = category === 'skins' && selectedSubcategory !== 'chromas';
    addToCart(product, isSkin, isSeguroRP);
  }, [category, selectedSubcategory, addToCart, isSeguroRP]);

  const handleRPTypeChange = useCallback((isSeguro) => {
    setIsSeguroRP(isSeguro);
  }, []);

  // Búsqueda de skin para unrankeds
  const handleSkinSearch = useCallback((value) => {
    setSkinSearchQuery(value);
  }, []);

  // Filtro de región para unrankeds
  const handleRegionChange = useCallback((value) => {
    setSelectedRegion(value);
  }, []);

  const getPrice = useCallback((product) => {
    if (!selectedCurrency || !rpConversions.length) return 'N/A';
    
    const conversion = rpConversions.find(conv => 
      conv.rpPrice?._id === (product.priceRP._id || product.priceRP) && 
      conv.currency._id === selectedCurrency._id
    );
    
    if (!conversion) return 'N/A';

    const price = isSeguroRP ? conversion.priceSeguro : conversion.priceBarato;

    return price.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true
    });
  }, [rpConversions, isSeguroRP, selectedCurrency]);


  const sortProducts = useCallback((products, sortOrder) => {
    const [field, direction] = sortOrder.split('-');
    
    return [...products].sort((a, b) => {
      if (field === 'price') {
        const priceA = parseFloat(getPrice(a).replace(/[^0-9.-]+/g, "")) || 0;
        const priceB = parseFloat(getPrice(b).replace(/[^0-9.-]+/g, "")) || 0;
        return direction === 'asc' ? priceA - priceB : priceB - priceA;
      }
      
      if (field === 'name') {
        // Obtener el nombre correcto según el tipo de producto
        const nameA = (a.NombreSkin || a.name || a.titulo || '').toString().toLowerCase();
        const nameB = (b.NombreSkin || b.name || b.titulo || '').toString().toLowerCase();
        
        // Usar localeCompare para ordenamiento correcto de caracteres especiales
        return direction === 'asc' ? 
          nameA.localeCompare(nameB, 'es', {sensitivity: 'base'}) : 
          nameB.localeCompare(nameA, 'es', {sensitivity: 'base'});
      }
  
      if (field === 'new') {
        // Usar el campo new existente
        if (a.new === b.new) {
          // Si ambos son nuevos o ambos no son nuevos, ordenar por nombre
          const nameA = (a.NombreSkin || a.name || a.titulo || '').toString().toLowerCase();
          const nameB = (b.NombreSkin || b.name || b.titulo || '').toString().toLowerCase();
          return nameA.localeCompare(nameB, 'es', {sensitivity: 'base'});
        }
        return direction === 'desc' ? 
          (a.new ? -1 : 1) : 
          (a.new ? 1 : -1);
      }
      
      return 0;
    });
  }, [getPrice]);

  // Filtra productos destacados para asegurar que no se dupliquen en la lista principal
  const filteredProducts = useCallback(() => {
    if (!destacadosProducts.length || searchQuery || skinSearchQuery) return products;
    
    // Obtiene los IDs de productos destacados
    const destacadosIds = destacadosProducts.map(p => p._id);
    
    // Filtra productos regulares para eliminar duplicados
    return products.filter(p => !destacadosIds.includes(p._id));
  }, [products, destacadosProducts, searchQuery, skinSearchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <TopNav />
      
      <div className="flex flex-col lg:flex-row p-4 sm:p-8 gap-8 mt-20">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
          {/* Filters */}
          <StoreFilters
            onSortChange={setSortOrder}
            onSearch={setSearchQuery}
            searchValue={searchQuery}
            category={category}
            onSkinSearch={handleSkinSearch}
            skinSearchValue={skinSearchQuery}
            onRegionChange={handleRegionChange}
            currencies={currencies}
            selectedCurrency={selectedCurrency}
            handleCurrencySelect={handleCurrencySelect}
          />
          
          {/* RP Type Selector */}
          <RPTypeSelector 
            onRPTypeChange={handleRPTypeChange}
            isSeguroRP={isSeguroRP}
            onInfoClick={handleInfoClick}
          />

          {/* Categories - Only show for skins */}
          {category === 'skins' && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Categorías</h3>
              <div className="flex flex-col gap-1">
                {SKINS_SUBCATEGORIES.map(subcat => (
                  <button
                    key={subcat.id}
                    onClick={() => setSelectedSubcategory(subcat.id)}
                    className={`text-left py-2 px-4 rounded transition-colors ${
                      selectedSubcategory === subcat.id
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-primary/10'
                    }`}
                  >
                    {subcat.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Destacados Section */}
          {destacadosProducts.length > 0 && !searchQuery && !skinSearchQuery && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">Destacados</h2>
              <ProductGrid 
                products={destacadosProducts}
                onAddToCart={handleAddToCart}
                getPrice={getPrice}
                isSeguro={isSeguroRP}
                category={category}
                subcategory={selectedSubcategory}
                selectedCurrency={selectedCurrency}
                isHighlighted={true}
                skinSearchTerm={skinSearchQuery}
              />
              <div className="border-b border-gray-200 dark:border-gray-800 my-6"></div>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts().length > 0 && (
            <>
              <h2 className="text-2xl font-bold">
                {searchQuery || skinSearchQuery 
                  ? 'Resultados de búsqueda' 
                  : category === 'unrankeds' 
                    ? 'Todas las cuentas' 
                    : 'Todos los productos'
                }
              </h2>
              <ProductGrid 
                products={filteredProducts()}
                onAddToCart={handleAddToCart}
                getPrice={getPrice}
                isSeguro={isSeguroRP}
                category={category}
                subcategory={selectedSubcategory}
                selectedCurrency={selectedCurrency}
                skinSearchTerm={skinSearchQuery}
              />
            </>
          )}

          {/* Initial Loading State */}
          {(isLoading && products.length === 0) || isLoadingDestacados && (
            <div 
              className="flex justify-center items-center py-8"
              ref={loadingRef}
            >
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Infinite Scroll Trigger and Loading State */}
          {products.length > 0 && (
            <div ref={infiniteScrollRef} className="w-full">
              {hasMore && (
                <div className="flex justify-center items-center py-8">
                  {isLoading && (
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No Results Message */}
          {!isLoading && !isLoadingDestacados && products.length === 0 && destacadosProducts.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">
              {skinSearchQuery 
                ? 'No se encontraron cuentas con las skins especificadas'
                : searchQuery 
                  ? 'No se encontraron productos que coincidan con tu búsqueda'
                  : category === 'unrankeds' && selectedRegion !== 'all'
                    ? `No hay cuentas disponibles en la región ${selectedRegion}`
                    : 'No hay productos disponibles en esta categoría'
              }
            </div>
          )}
        </div>
      </div>

      <RPInfoModal 
        isOpen={showRPInfoModal}
        onClose={() => setShowRPInfoModal(false)}
      />

      {/* Currency Selection Modal */}
      <CurrencySelectionModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        currencies={currencies}
        onSelect={handleCurrencySelect}
        isLoading={isLoadingCurrencies}
      />
    </div>
  );
};

export default Tienda;