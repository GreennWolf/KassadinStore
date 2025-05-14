import React, { useState, useEffect, useRef, useCallback } from "react";
import { getAllItems, deleteItem, editItem, createItem, activeItem, getAllDestacadosItems, toggleDestacadoItem } from "../../services/itemService";
import { getAllSkins, createSkin, updateSkin, deleteSkin, obtenerActualizaciones, activeSkin, getAllDestacadosSkins, toggleDestacadoSkin } from "../../services/champsService";
import { getAllRpPrice } from "../../services/rpService";
import { getAllUnrankeds, createUnranked, updateUnranked, deactivateUnranked, activateUnranked } from "../../services/unrankedService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { ProductModal } from "./adminProductos/ProductModal";
import rpLogo from '@/assets/RP_icon.webp';
import UpdateCatalogButton from "./adminProductos/UpdateCatalogButton";

const ITEMS_PER_PAGE = 20;

export const AdminProducts = ({isUpdating, setIsUpdating}) => {
  // States
  const [activeCategory, setActiveCategory] = useState("skins");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [skins, setSkins] = useState([]);
  const [rpPrice, setRpPrice] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [updatingPatch, setUpdatingPatch] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Refs
  const loadingRef = useRef(null);
  const abortControllerRef = useRef(null);
  const tableRef = useRef(null);

  // Categories
  const categories = [
    { value: "skins", label: "Skins" },
    { value: "loot", label: "Botín" },
    { value: "icon", label: "Iconos" },
    { value: "chromas", label: "Chromas" },
    { value: "presale", label: "Preventa" },
    { value: "tft", label: "TFT" },
    { value: "bundle", label: "Bundles" },
    { value: "unrankeds", label: "Unrankeds" }
  ];

  // Fetch data with pagination
  const fetchData = useCallback(async (shouldReset = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      if (shouldReset) {
        setPage(1);
        setHasMore(true);
        setSkins([]);
        setItems([]);
      }

      const params = {
        page: shouldReset ? 1 : page,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        type: activeCategory !== 'skins' && activeCategory !== 'unrankeds' ? activeCategory : undefined,
        showAll: true
      };

      let response;
      if (activeCategory === 'unrankeds') {
        response = await getAllUnrankeds(params);
        if (shouldReset) {
          setItems(response.data || []);
        } else {
          setItems(prev => [...prev, ...(response.data || [])]);
        }
        setHasMore(response.hasMore);
      } else {
        const [skinsData, rpData, itemsData] = await Promise.all([
          getAllSkins(params),
          getAllRpPrice(),
          getAllItems(params)
        ]);

        if (shouldReset) {
          setSkins(skinsData.data || []);
          setItems(itemsData.data || []);
        } else {
          setSkins(prev => [...prev, ...(skinsData.data || [])]);
          setItems(prev => [...prev, ...(itemsData.data || [])]);
        }

        setRpPrice(rpData || []);
        setHasMore(activeCategory === 'skins' ? skinsData.hasMore : itemsData.hasMore);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading data:', error);
        toast.error('Error al cargar los datos');
      }
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, searchTerm]);

  // Filtered products based on category and search
  const filteredProducts = React.useMemo(() => {
    const products = activeCategory === "skins" ? skins : items;
    return products.filter(product => {
      const searchField = product.NombreSkin || product.name || product.titulo;
      return searchField?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [activeCategory, searchTerm, items, skins]);

  // Effects
  useEffect(() => {
    fetchData(true);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [activeCategory, searchTerm]);

  useEffect(() => {
    if (page > 1) {
      fetchData(false);
    }
  }, [page]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadingRef.current || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading && hasMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadingRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  // Handlers
  const handleToggleDestacado = async (product) => {
    try {
      setLoading(true);
      if (activeCategory === 'skins') {
        await toggleDestacadoSkin(product._id);
      } else if (activeCategory !== 'unrankeds') {
        await toggleDestacadoItem(product._id);
      }
      // No hay toggle destacado para unrankeds, si se implementara se añadiría aquí
      
      toast.success('Estado destacado actualizado exitosamente');
      await fetchData(true);
    } catch (error) {
      console.error('Error al cambiar estado destacado:', error);
      toast.error('Error al actualizar el estado destacado');
    } finally {
      setLoading(false);
    }
  };

  // Función simplificada para crear productos
  const handleCreateProduct = async (productData) => {
    setLoading(true);
    try {
      if (activeCategory === 'unrankeds') {
        // Verificar que sea un FormData
        if (!(productData instanceof FormData)) {
          throw new Error('Se requiere FormData para crear una cuenta unranked');
        }
        
        console.log("Creando cuenta unranked");
        const response = await createUnranked(productData);
        setItems(prev => [response, ...prev]);
        toast.success('Cuenta unranked creada con éxito');
      } else if (activeCategory === 'skins') {
        console.log("Creando skin");
        const response = await createSkin(productData);
        setSkins(prev => [response, ...prev]);
        toast.success('Skin creada con éxito');
      } else {
        console.log("Creando item");
        const response = await createItem(productData);
        setItems(prev => [response, ...prev]);
        toast.success('Producto creado con éxito');
      }
      
      // Refrescar datos después de crear
      fetchData(true);
      setModalOpen(false);
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  // Función simplificada para editar productos
  const handleEditProduct = async (productData) => {
    try {
      setLoading(true);
      
      if (activeCategory === 'skins') {
        await updateSkin(selectedProduct._id, productData);
        toast.success('Skin actualizada exitosamente');
      } else if (activeCategory === 'unrankeds') {
        // Para unrankeds, usar directamente el formData
        if (productData instanceof FormData) {
          await updateUnranked(selectedProduct._id, productData);
        } else {
          // Si no es FormData, convertirlo a FormData
          const formData = new FormData();
          Object.entries(productData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (key === 'src' && value instanceof File) {
                formData.append('image', value);
              } else if (key === 'selectedSkins' && Array.isArray(value)) {
                // Manejar skins seleccionadas
                value.forEach(skin => {
                  if (skin && skin.id) {
                    formData.append('skins[]', skin.id);
                  }
                });
              } else {
                formData.append(key, value);
              }
            }
          });
          
          await updateUnranked(selectedProduct._id, formData);
        }
        
        toast.success('Cuenta unranked actualizada exitosamente');
      } else {
        // Para items
        if (productData instanceof FormData) {
          await editItem(selectedProduct._id, productData);
        } else {
          const formData = new FormData();
          Object.entries(productData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (key === 'src' && value instanceof File) {
                formData.append('image', value);
              } else {
                formData.append(key, value);
              }
            }
          });
          
          await editItem(selectedProduct._id, formData);
        }
        
        toast.success('Item actualizado exitosamente');
      }
      
      // Refrescar datos después de editar
      await fetchData(true);
      setModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error editing product:', error);
      toast.error(`Error al actualizar el producto: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar "${product.name || product.NombreSkin || product.titulo}"?`)) {
      try {
        setLoading(true);
        if (activeCategory === 'skins') {
          await deleteSkin(product._id);
        } else if (activeCategory === 'unrankeds') {
          await deactivateUnranked(product._id);
        } else {
          await deleteItem(product._id);
        }
        toast.success('Producto eliminado exitosamente');
        await fetchData(true);
      } catch (error) {
        toast.error('Error al eliminar el producto');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleActive = async (product) => {
    try {
      setLoading(true);
      if (activeCategory === 'skins') {
        await activeSkin(product._id);
      } else if (activeCategory === 'unrankeds') {
        await activateUnranked(product._id);
      } else {
        await activeItem(product._id);
      }
      toast.success('Estado del producto actualizado exitosamente');
      await fetchData(true);
    } catch (error) {
      toast.error('Error al actualizar el estado del producto');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${activeCategory === 'skins' ? 'skins' : activeCategory === 'unrankeds' ? 'cuentas' : 'productos'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem className="bg-black text-white" key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {activeCategory === 'skins' && (
            <UpdateCatalogButton fetchData={fetchData} isUpdating={isUpdating} setIsUpdating={setIsUpdating}/>
          )}  
          <Button
            onClick={() => {
              setModalMode("create");
              setSelectedProduct(null);
              setModalOpen(true);
            }}
          >
            Crear {activeCategory === 'skins' ? 'Skin' : activeCategory === 'unrankeds' ? 'Cuenta' : 'Producto'}
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div ref={tableRef} className="max-h-[calc(100vh-240px)] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagen</TableHead>
                <TableHead>{activeCategory === 'unrankeds' ? 'Título' : 'Nombre'}</TableHead>
                <TableHead>RP</TableHead>
                {activeCategory === 'unrankeds' && (
                  <>
                    <TableHead>Región</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Esencia Azul</TableHead>
                    <TableHead>Esencia Naranja</TableHead>
                    <TableHead>Skins</TableHead>
                  </>
                )}
                <TableHead>Estado</TableHead>
                {activeCategory !== 'unrankeds' && (
                  <>
                    <TableHead>Recompensa</TableHead>
                    <TableHead>Destacado</TableHead>
                  </>
                )}
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <img
                      src={product.srcLocal || product.srcWeb || '/placeholder.png'}
                      alt={product.name || product.NombreSkin || product.titulo}
                      className="h-16 w-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder.png';
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {product.type === 'chromas' && product.skin 
                      ? `${product.name} [${product.skin.NombreSkin}]` 
                      : product.name || product.NombreSkin || product.titulo}
                  </TableCell>
                  <TableCell className="gap-2">
                    <span className="flex gap-2 items-center">
                      {product.priceRP?.valueRP ? product.priceRP?.valueRP : product.priceRPData?.valueRP}
                      <img src={rpLogo} alt="RP" className="w-6 h-6" />
                    </span>
                  </TableCell>
                  {activeCategory === 'unrankeds' && (
                    <>
                      <TableCell>{product.region}</TableCell>
                      <TableCell>{product.nivel}</TableCell>
                      <TableCell>{product.escencia}</TableCell>
                      <TableCell>{product.escenciaNaranja}</TableCell>
                      <TableCell>
                        {product.skins && Array.isArray(product.skins) ? product.skins.length : 0}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  {activeCategory !== 'unrankeds' && (
                    <>
                      <TableCell>{product.reward ? "SI" : "NO"}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleToggleDestacado(product)}
                        >
                          <Star 
                            className={`h-5 w-5 ${product.destacado ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} 
                          />
                        </Button>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className='bg-black' align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProduct(product);
                            setModalMode("edit");
                            setModalOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if(product.active){
                              handleDelete(product);
                            } else {
                              handleActive(product);
                            }
                          }}
                        >
                          {product.active ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* No results message */}
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">
              No se encontraron productos que coincidan con tu búsqueda
            </div>
          )}

          {/* Infinite scroll trigger */}
          {hasMore && !loading && (
            <div ref={loadingRef} className="h-10 w-full" />
          )}
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSubmit={modalMode === "create" ? handleCreateProduct : handleEditProduct}
          mode={modalMode}
          activeCategory={activeCategory}
        />
      )}
    </div>
  );
}

export default AdminProducts