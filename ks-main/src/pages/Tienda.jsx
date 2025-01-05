import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { useStore } from "@/context/StoreContext";
import { toast } from "sonner";
import { StoreFilters } from "@/components/StoreFilters";
import { RPTypeSelector } from "@/components/RPTypeSelector";
import { ProductGrid } from "@/components/ProductGrid";
import { getAllSkins } from "../services/champsService";
import { getAllItems } from "../services/itemService";
import { getAllRPPriceConversions } from "../services/rpConvertionService";
import {useCurrency} from '../context/currencyContext'
import {CurrencySelectionModal} from '../components/CurrencySelectionModal'
import {getAllCurrencies} from '../services/currencyService'

const ITEMS_PER_PAGE = 8;

const SKINS_SUBCATEGORIES = [
  { id: 'all', label: 'Todas las Skins' },
  { id: 'chromas', label: 'Chromas' },
  { id: 'bundles', label: 'Bundles' }
];

const Tienda = () => {
  const { category } = useParams();
  const { addToCart } = useStore();

  const { selectedCurrency, updateSelectedCurrency } = useCurrency();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);

  // Estados principales
  const [products, setProducts] = useState([]);
  const [rpConversions, setRpConversions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados de filtrado y paginación
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("");
  const [isSeguroRP, setIsSeguroRP] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Referencias
  const loadingRef = useRef(null);
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cargar conversiones de RP
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

  useEffect(() => {
    const loadCurrencies = async () => {
        setIsLoadingCurrencies(true);
        try {
            const currencyData = await getAllCurrencies();
            if (Array.isArray(currencyData)) {
              setCurrencies(currencyData.filter(currency => currency.active));
              console.log(currencies)
                if (!selectedCurrency) {
                    console.log(selectedCurrency)
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
}, [selectedCurrency]);

const handleCurrencySelect = useCallback((currency) => {
  const c = currencies.find(c => c._id === currency)
  if (c) {
      updateSelectedCurrency(c);
  }
  setShowCurrencyModal(false);
}, [updateSelectedCurrency , currencies]);

  // Función principal para cargar productos
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
        type:category,
        orderByNew:true,
      };

      // Lógica específica para chromas cuando es una subcategoría de skins
      if (category === 'skins' && selectedSubcategory === 'chromas') {
        params.type = 'chromas';
        const response = await getAllItems(params, abortControllerRef.current.signal);
        
        if (response?.data) {
          const validChromas = response.data.filter(item => 
            item && item.type === 'chromas' && item.skin
          );
          setProducts(prev => pageNum === 1 ? validChromas : [...prev, ...validChromas]);
          setHasMore(response.hasMore);
        }
      } 
      // Lógica para skins (incluyendo bundles) o items normales
      else {
        if (category === 'skins') {
          params.subcategory = selectedSubcategory === 'all' ? null : selectedSubcategory;
        }
        
        const service = category === 'skins' ? getAllSkins : getAllItems;
        const response = await service(params, abortControllerRef.current.signal);

        if (response?.data) {
          setProducts(prev => pageNum === 1 ? response.data : [...prev, ...response.data]);
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
  }, [category, searchQuery, selectedSubcategory, sortOrder]);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      setProducts([]);
      setHasMore(true);
      loadProducts(1);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, loadProducts]);

  // Efecto para cambios de categoría/subcategoría
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    setHasMore(true);
    // Reset subcategory when changing main category
    if (category !== 'skins') {
      setSelectedSubcategory('all');
    }
    loadProducts(1);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [category, selectedSubcategory, loadProducts]);

  // Observer para infinite scroll
  useEffect(() => {
    if (!loadingRef.current || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && hasMore) {
          setCurrentPage(prev => prev + 1);
          loadProducts(currentPage + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadingRef.current);
    return () => observer.disconnect();
  }, [isLoading, hasMore, currentPage, loadProducts]);

  const handleAddToCart = useCallback((product) => {
    // Determine if the product is a skin based on the category and subcategory
    const isSkin = category === 'skins' && selectedSubcategory !== 'chromas';
    addToCart(product, isSkin,isSeguroRP);
    
    toast(product.name, {
      description: "Added to cart",
      position: "bottom-right",
      duration: 2000,
      className: "bg-background border border-border",
    });
  }, [category, selectedSubcategory, addToCart,isSeguroRP]);

  const handleRPTypeChange = (isSeguro) => {
    setIsSeguroRP(isSeguro);
  };

  const getPrice = useCallback((product) => {
    const conversion = rpConversions.find(conv => 
      conv.rpPrice?._id === (product.priceRP._id || product.priceRP) && conv.currency._id === selectedCurrency._id
    );

    console.log(rpConversions)
    
    // console.log(rpConversions)

    if (!conversion) return 'N/A';

    const price = isSeguroRP ? conversion.priceSeguro : conversion.priceBarato

    const formattedPrice = price.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true
  });

    return formattedPrice;
  }, [rpConversions, isSeguroRP , selectedCurrency]);

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <TopNav />
      
      <div className="flex flex-col lg:flex-row p-4 sm:p-8 gap-8 mt-20">
        <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
          <StoreFilters
            onSortChange={setSortOrder}
            onSearch={setSearchQuery}
            searchValue={searchQuery}
            currencies={currencies}
            selectedCurrency={selectedCurrency}
            handleCurrencySelect={handleCurrencySelect}
          />
          
          <RPTypeSelector 
            onRPTypeChange={handleRPTypeChange}
            isSeguroRP={isSeguroRP}
          />

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

        <div className="flex-1 space-y-6">
          <ProductGrid 
            products={products}
            onAddToCart={handleAddToCart}
            getPrice={getPrice}
            isSeguro={isSeguroRP}
            category={category}
            subcategory={selectedSubcategory}
            selectedCurrency={selectedCurrency}
          />

          {hasMore && (
            <div 
              ref={loadingRef}
              className="flex justify-center items-center py-8"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="text-center p-4">
              No se encontraron productos que coincidan con tu búsqueda
            </div>
          )}
        </div>
      </div>
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