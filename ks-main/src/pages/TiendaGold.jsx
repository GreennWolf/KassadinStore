import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { toast } from "sonner";
import { getAllSkins } from "@/services/champsService";
import { getAllItems } from "@/services/itemService";
import { getAllGoldConvertions } from "@/services/goldConvertionService";
import { purchaseItem } from "@/services/inventoryService";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductGrid } from "@/components/ProductGrid";

const ITEMS_PER_PAGE = 12;

const VALID_TYPES = [
  { id: "loot", label: "Cofres" },
  { id: "icon", label: "Iconos" },
  { id: "presale", label: "Preventa" },
  { id: "tft", label: "TFT" },
  { id: "bundle", label: "Bundles" },
  { id: "unrankeds", label: "Sin Clasificar" }
];

const SKINS_SUBCATEGORIES = [
  { id: 'all', label: 'Todas las Skins' },
  { id: 'chromas', label: 'Chromas' },
  { id: 'bundles', label: 'Bundles' }
];

const TiendaGold = () => {
  const { category } = useParams();
  const navigate = useNavigate();

  // Estados esenciales
  const [products, setProducts] = useState([]);
  const [goldConversions, setGoldConversions] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // Estados de carga y UI
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // Estados de filtrado y paginación
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("asc");
  const [hasMore, setHasMore] = useState(true);

  // Estado para modal
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    product: null
  });

  // Referencias
  const loadingRef = useRef(null);
  const infiniteScrollRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const loadAvailableCategories = useCallback(async () => {
    try {
      const availableCats = [];
      for (const type of VALID_TYPES) {
        const response = await getAllItems({ 
          type: type.id, 
          limit: 1, 
          reward: true 
        });
        if (response?.data?.length > 0) {
          availableCats.push(type);
        }
      }
      setAvailableCategories(availableCats);
      
      if (!category && availableCats.length > 0) {
        navigate(`/tiendaOro/${availableCats[0].id}`);
      }
    } catch (error) {
      console.error('Error loading available categories:', error);
    }
  }, [navigate, category]);

  useEffect(() => {
    loadAvailableCategories();
  }, [loadAvailableCategories]);

  useEffect(() => {
    const loadGoldConversions = async () => {
      try {
        const conversions = await getAllGoldConvertions();
        if (Array.isArray(conversions)) {
          setGoldConversions(conversions);
        }
      } catch (error) {
        console.error('Error loading gold conversions:', error);
      }
    };
    loadGoldConversions();
  }, []);

  const getPrice = useCallback((product) => {
    if (!product.priceRP) return 'N/A';
    
    const conversion = goldConversions.find(conv => 
      conv.rpPrice?._id === (product.priceRP._id || product.priceRP)
    );

    if (!conversion) return 'N/A';

    return conversion.gold.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true
    });
  }, [goldConversions]);

  const sortProducts = useCallback((products, order) => {
    return [...products].sort((a, b) => {
      const priceA = parseInt(getPrice(a).replace(/\D/g, '')) || 0;
      const priceB = parseInt(getPrice(b).replace(/\D/g, '')) || 0;
      
      return order === 'asc' ? priceA - priceB : priceB - priceA;
    });
  }, [getPrice]);

  const handleCategoryChange = useCallback((newCategory) => {
    navigate(`/tienda-gold/${newCategory}`);
    setCurrentPage(1);
    setProducts([]);
    setSearchQuery("");
  }, [navigate]);

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
        reward: true,
        orderByNew: true,
      };

      if (category === 'skins' && selectedSubcategory === 'chromas') {
        params.type = 'chromas';
        const response = await getAllItems(params, abortControllerRef.current.signal);
        
        if (response?.data) {
          let validChromas = response.data.filter(item => 
            item && 
            item.type === 'chromas' && 
            item.skin &&
            item.reward
          );

          validChromas = sortProducts(validChromas, sortOrder);
          
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
          let filteredData = response.data.filter(item => item.reward);
          let sortedData = sortProducts(filteredData, sortOrder);
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
  }, [category, searchQuery, selectedSubcategory, sortOrder, sortProducts]);

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
  }, [category, selectedSubcategory, searchQuery, sortOrder, loadProducts]);

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

  const handleBuyClick = useCallback((product) => {
    setConfirmationModal({
      isOpen: true,
      product: product
    });
  }, []);

  const handleConfirmPurchase = useCallback(async () => {
    if (!confirmationModal.product) return;

    setIsPurchasing(true);
    try {
        const goldPrice = getPrice(confirmationModal.product);
        if (goldPrice === 'N/A') {
            throw new Error('No se pudo determinar el precio del item');
        }

        const itemType = confirmationModal.product.NombreSkin ? 'Skin' : 'Item';
        
        // Crear objeto de detalles según el tipo de producto
        const details = {
            name: confirmationModal.product.name || confirmationModal.product.NombreSkin || "Sin nombre",
            obtainedFrom: "purchase",
            fullInfo: true
        };
        
        // Si es skin, agregar campos específicos
        if (itemType === 'Skin') {
            details.src = confirmationModal.product.src || "";
            details.srcLocal = confirmationModal.product.srcLocal || "";
            if (confirmationModal.product.champion) {
                details.champion = typeof confirmationModal.product.champion === 'object' ? 
                    confirmationModal.product.champion._id : confirmationModal.product.champion;
            }
        } else {
            // Si es item, agregar campos específicos
            details.src = confirmationModal.product.srcWeb || "";
            details.srcLocal = confirmationModal.product.srcLocal || "";
        }
        
        await purchaseItem({
            itemType,
            itemId: confirmationModal.product._id,
            quantity: 1,
            details: details // Enviamos los detalles completos del producto
        });

        toast.success(`Has comprado ${confirmationModal.product.name || confirmationModal.product.NombreSkin} por ${goldPrice} oro`);
        
        loadProducts(currentPage);
    } catch (error) {
        toast.error(error.message || "Error al realizar la compra");
    } finally {
        setIsPurchasing(false);
        setConfirmationModal({ isOpen: false, product: null });
    }
  }, [confirmationModal.product, getPrice, loadProducts, currentPage]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar con filtros */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Ordenamiento */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Oro: Menor a Mayor</SelectItem>
                <SelectItem value="desc">Oro: Mayor a Menor</SelectItem>
              </SelectContent>
            </Select>

            {/* Categorías para items que no son skins */}
            {category !== 'skins' && availableCategories.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Categorías</h3>
                <div className="flex flex-col gap-1">
                  {availableCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`text-left py-2 px-4 rounded transition-colors ${
                        category === cat.id
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-primary/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subcategorías para skins */}
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

          {/* Contenido principal */}
          <div className="flex-1 space-y-6">
            {/* Products Grid */}
            {products.length > 0 && (
              <ProductGrid 
                products={products}
                onBuyClick={handleBuyClick}
                getPrice={getPrice}
                isGoldStore={true}
                category={category}
                subcategory={selectedSubcategory}
              />
            )}

            {/* Loading States */}
            {/* Initial Loading */}
            {isLoading && products.length === 0 && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Infinite Scroll Loading */}
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

            {/* Empty State */}
            {!isLoading && products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  No se encontraron productos disponibles para comprar con oro
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal de confirmación */}
        <AlertDialog 
          open={confirmationModal.isOpen} 
          onOpenChange={(isOpen) => !isOpen && setConfirmationModal({ isOpen: false, product: null })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Compra</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro que deseas comprar{' '}
                {confirmationModal.product?.name || confirmationModal.product?.NombreSkin} por{' '}
                {confirmationModal.product && getPrice(confirmationModal.product)} oro?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmPurchase} disabled={isPurchasing}>
                {isPurchasing ? 'Procesando...' : 'Confirmar Compra'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

export default TiendaGold;