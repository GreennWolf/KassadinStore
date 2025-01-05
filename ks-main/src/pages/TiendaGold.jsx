import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { toast } from "sonner";
import { getAllSkins } from "@/services/champsService";
import { getAllItems } from "@/services/itemService";
import { getAllRPPriceConversions } from "@/services/rpConvertionService";
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

const SKINS_SUBCATEGORIES = [
  { id: 'all', label: 'Todas las Skins' },
  { id: 'chromas', label: 'Chromas' },
  { id: 'bundles', label: 'Bundles' }
];

const TiendaGold = () => {
  const { category } = useParams();

  // Estados para manejo de productos
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [rpConversions, setRpConversions] = useState([]);
  
  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para modal de confirmación
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    product: null
  });

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

  // Función para obtener el precio en oro
  const getPrice = useCallback((product) => {
    const conversion = rpConversions.find(conv => 
      conv.rpPrice?._id === (product.priceRP._id || product.priceRP)
    );

    if (!conversion) return 'N/A';

    return conversion.gold.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true
    });
  }, [rpConversions]);

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
        type: category,
        orderByNew: true,
      };

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
      } else {
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
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage(prev => prev + 1);
          loadProducts(currentPage + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadingRef.current);
    return () => observer.disconnect();
  }, [isLoading, hasMore, currentPage, loadProducts]);

  // Manejadores de eventos
  const handleBuyClick = (product) => {
    setConfirmationModal({
      isOpen: true,
      product: product
    });
  };

  const handleConfirmPurchase = async () => {
    try {
      // Aquí iría la lógica de compra con oro
      const goldPrice = getPrice(confirmationModal.product);
      toast.success(`Compra exitosa: ${confirmationModal.product.name} por ${goldPrice} oro`);
    } catch (error) {
      toast.error("Error al realizar la compra");
    } finally {
      setConfirmationModal({ isOpen: false, product: null });
    }
  };

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
            <ProductGrid 
              products={products}
              onBuyClick={handleBuyClick}
              getPrice={getPrice}
              isGoldStore={true}
              category={category}
              subcategory={selectedSubcategory}
            />

            {/* Loading indicator */}
            {hasMore && (
              <div 
                ref={loadingRef}
                className="flex justify-center items-center py-8"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  No se encontraron productos
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
                ¿Estás seguro que deseas comprar {confirmationModal.product?.name} por{' '}
                {confirmationModal.product && getPrice(confirmationModal.product)} oro?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmPurchase}>
                Confirmar Compra
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default TiendaGold;