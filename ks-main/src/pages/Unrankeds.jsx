import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/context/StoreContext";
import { Star, AlertTriangle, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from '../context/currencyContext';
import { CurrencySelectionModal } from '../components/CurrencySelectionModal';
import { getAllCurrencies } from '../services/currencyService';
import { getAllRPPriceConversions } from "../services/rpConvertionService";
import { getAllUnrankeds } from '../services/unrankedService';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import UnrankedDetailModal from '@/components/UnrankedDetailModal'; // Ajusta la ruta según tu estructura

const REGIONS = ['LAS', 'LAN', 'NA', 'EUW', 'EUNE', 'OCE', 'BR', 'KR', 'JP', 'TR', 'RU'];

const Unrankeds = () => {
  const { addToCart } = useStore();
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();
  const [sortOrder, setSortOrder] = useState("new-desc");

  // Estados para filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [skinSearchQuery, setSkinSearchQuery] = useState(""); // Nueva búsqueda por skins
  const [selectedRegion, setSelectedRegion] = useState("all");
  
  // Estados para datos
  const [accounts, setAccounts] = useState([]);
  const [rpConversions, setRpConversions] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false); // Nuevo estado para controlar la visualización del loader
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  
  // Estados para modal de detalles
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Efecto para manejar el retardo del loader
  useEffect(() => {
    let loaderTimeout;
    
    if (isLoading) {
      // Mostrar el loader solo después de 300ms de carga
      loaderTimeout = setTimeout(() => {
        setShowLoader(true);
      }, 300);
    } else {
      setShowLoader(false);
    }
    
    // Limpiar el timeout al desmontar o cuando isLoading cambie
    return () => {
      if (loaderTimeout) clearTimeout(loaderTimeout);
    };
  }, [isLoading]);

  // Cargar datos iniciales con debounce para evitar múltiples peticiones al escribir
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      const loadInitialData = async () => {
        setIsLoading(true);
        try {
          // Usar parámetros de búsqueda con el backend mejorado
          // No es necesario filtrar en el frontend ya que el backend se encarga de la búsqueda
          const params = {
            search: searchQuery, // Búsqueda por título
            region: selectedRegion !== "all" ? selectedRegion : undefined,
            skinSearch: skinSearchQuery || undefined, // Búsqueda específica por skins
            includeSearch: true // Habilitar búsqueda inclusiva para términos con espacios
          };
          
          console.log("Búsqueda con parámetros:", params);
          
          const [accountsData, rpConversionsData] = await Promise.all([
            getAllUnrankeds(params),
            getAllRPPriceConversions()
          ]);
          
          console.log(`Cuentas encontradas: ${accountsData.data?.length || 0}`);
          setAccounts(accountsData.data || []);
          setRpConversions(rpConversionsData || []);
        } catch (error) {
          console.error('Error loading accounts:', error);
          toast.error("Error al cargar las cuentas");
        } finally {
          setIsLoading(false);
        }
      };

      loadInitialData();
    }, 300); // Esperar 300ms después de la última pulsación de tecla

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, selectedRegion, skinSearchQuery]); // Añadir skinSearchQuery como dependencia

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
  }, [selectedCurrency]);

  const getPrice = (account) => {
    if (!selectedCurrency || !rpConversions.length) return 'N/A';
    
    const conversion = rpConversions.find(conv => 
      conv.rpPrice?._id === account.priceRP._id && 
      conv.currency._id === selectedCurrency._id
    );
    
    if (!conversion) return 'N/A';

    const price = conversion.priceSeguro;

    return price.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true
    });
  };

  const handleAddToCart = (account) => {
    const priceConverted = getPrice(account);
    addToCart({...account, priceConverted}, false, false, true);
  };

  const handleCurrencySelect = (currency) => {
    const selectedCurrency = currencies.find(c => c._id === currency);
    if (selectedCurrency) {
      updateSelectedCurrency(selectedCurrency);
      setShowCurrencyModal(false);
    }
  };
  
  // Manejar clic para mostrar detalles
  const handleShowDetails = (account) => {
    setSelectedAccount(account);
    setShowDetailModal(true);
  };

  const getSortedAccounts = (accounts) => {
    return [...accounts].sort((a, b) => {
      const [field, direction] = sortOrder.split('-');
      
      if (field === 'price') {
        const priceA = parseFloat(getPrice(a).replace(/[^0-9.-]+/g, "")) || 0;
        const priceB = parseFloat(getPrice(b).replace(/[^0-9.-]+/g, "")) || 0;
        return direction === 'asc' ? priceA - priceB : priceB - priceA;
      }
      
      if (field === 'name') {
        return direction === 'asc' ? 
          a.titulo.localeCompare(b.titulo) : 
          b.titulo.localeCompare(a.titulo);
      }

      if (field === 'new') {
        return direction === 'desc' ? 
          new Date(b.createdAt) - new Date(a.createdAt) : 
          new Date(a.createdAt) - new Date(b.createdAt);
      }
      
      return 0;
    });
  };
  
  // Función para obtener una imagen aleatoria de las skins o priorizar las que coinciden con la búsqueda
  const getRandomSkinImage = (account, searchTerm = '') => {
    // Si no hay skins, devuelve la imagen de la cuenta
    if (!account.skins || !Array.isArray(account.skins) || account.skins.length === 0) {
      return account.srcLocal || account.srcWeb || '/placeholder.png';
    }

    // Si hay búsqueda de skins, intentar encontrar coincidencia
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      const terms = lowercaseSearch.split(/\s+/); // Dividir por espacios
      
      // Array para guardar las coincidencias con su puntuación (mayor = mejor coincidencia)
      const scoredSkins = account.skins.map(skin => {
        let score = 0;
        
        // Normalizar nombres para la comparación
        const skinName = (skin.name || skin.NombreSkin || '').toLowerCase();
        const championName = (skin.champion?.name || skin.championData?.name || '').toLowerCase();
        
        // Verificar coincidencia exacta - mayor puntuación
        if (skinName === lowercaseSearch || championName === lowercaseSearch) {
          score += 100;
        }
        
        // Verificar si contiene la búsqueda completa - puntuación alta
        if (skinName.includes(lowercaseSearch) || championName.includes(lowercaseSearch)) {
          score += 50;
        }
        
        // Verificar coincidencia con términos individuales - puntuación menor
        for (const term of terms) {
          if (term.length > 1) { // Ignorar términos muy cortos
            if (skinName.includes(term)) {
              score += 10;
            }
            if (championName.includes(term)) {
              score += 10;
            }
          }
        }
        
        return { skin, score };
      });
      
      // Ordenar por puntuación (mayor a menor)
      scoredSkins.sort((a, b) => b.score - a.score);
      
      // Si tenemos skins con puntuación positiva, mostrar la de mayor puntuación
      const matchingSkins = scoredSkins.filter(item => item.score > 0);
      
      if (matchingSkins.length > 0) {
        console.log(`Encontradas ${matchingSkins.length} skins coincidentes para "${searchTerm}"`);
        
        // Tomar la mejor coincidencia o una aleatoria entre las mejores si hay varias con la misma puntuación
        const topScore = matchingSkins[0].score;
        const bestMatches = matchingSkins.filter(item => item.score === topScore);
        
        // Seleccionar una aleatoriamente entre las mejores
        const selectedMatch = bestMatches[Math.floor(Math.random() * bestMatches.length)];
        
        console.log(`Mostrando skin ${selectedMatch.skin.NombreSkin || 'sin nombre'}`);
        
        return selectedMatch.skin.srcLocal || 
               selectedMatch.skin.imageUrl || 
               selectedMatch.skin.srcWeb || 
               '/placeholder.png';
      }
    }
    
    // Si no hay búsqueda o no se encontraron coincidencias, elegir aleatoriamente
    const randomIndex = Math.floor(Math.random() * account.skins.length);
    const randomSkin = account.skins[randomIndex];
    return randomSkin.srcLocal || randomSkin.imageUrl || randomSkin.srcWeb || '/placeholder.png';
  };

  // Ya no es necesario filtrar aquí, el backend se encarga de filtrar por skins
  // Simplemente ordenamos las cuentas según lo seleccionado
  const filteredAccounts = getSortedAccounts(accounts);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <div className="flex flex-col lg:flex-row p-4 lg:p-8 gap-4 lg:gap-8 mt-20">
        {/* Filters Section - Full width on mobile, sidebar on desktop */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
            <h2 className="text-xl font-semibold">Filtros</h2>
            <div className="space-y-6 p-4 bg-card rounded-lg border border-border animate-fade-in">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar cuentas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 transition-all duration-200 hover:border-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              {/* Búsqueda por skins */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Buscar por skin</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar skins específicas..."
                    value={skinSearchQuery}
                    onChange={(e) => setSkinSearchQuery(e.target.value)}
                    className="w-full pl-10 transition-all duration-200 hover:border-primary/50 focus:border-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Encuentra cuentas que contengan skins específicas
                </p>
                
                <Separator className="my-2" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Divisa</Label>
                <Select 
                  value={selectedCurrency?._id || ''} 
                  onValueChange={handleCurrencySelect}
                >
                  <SelectTrigger className="w-full transition-all duration-200 hover:border-primary/50">
                    <SelectValue placeholder="Seleccionar Divisa" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-border">
                    {currencies.map(currency => (
                      <SelectItem key={currency._id} value={currency._id}>
                        {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Región</Label>
                <Select
                  value={selectedRegion}
                  onValueChange={setSelectedRegion}
                >
                  <SelectTrigger className="w-full transition-all duration-200 hover:border-primary/50">
                    <SelectValue placeholder="Seleccionar región" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-border">
                    <SelectItem value="all">Todas las regiones</SelectItem>
                    {REGIONS.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Ordenar por</Label>
                <Select onValueChange={setSortOrder} value={sortOrder}>
                  <SelectTrigger className="w-full transition-all duration-200 hover:border-primary/50">
                    <SelectValue placeholder="Seleccionar orden" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-border">
                    <SelectItem value="new-desc">Más recientes</SelectItem>
                    <SelectItem value="name-asc">Nombre: A a Z</SelectItem>
                    <SelectItem value="name-desc">Nombre: Z a A</SelectItem>
                    <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                    <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

        {/* Products Grid */}
        <div className="flex-1">
          {showLoader ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((account) => (
                <Card key={account._id} className="bg-card border-border overflow-hidden">
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => handleShowDetails(account)}
                  >
                    <img 
                      src={getRandomSkinImage(account, skinSearchQuery)} 
                      alt={account.titulo}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder.png';
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`${
                        account.handUpgrade 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-red-500 text-white'
                        } px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1`}>
                        {account.handUpgrade ? (
                          <>Safe <Star className="w-4 h-4" /></>
                        ) : (
                          <>Unsafe <AlertTriangle className="w-4 h-4" /></>
                        )}
                      </span>
                    </div>
                    
                    {/* Badges para skins y región */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <Badge className="bg-white">{account.region}</Badge>
                      {account.skins && Array.isArray(account.skins) && (
                        <Badge className="bg-white">{account.skins.length} skins</Badge>
                      )}
                      {account.stock !== undefined && (
                        <Badge className={`${account.stock > 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                          {account.stock > 0 ? `Stock: ${account.stock}` : 'Sin stock'}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Overlay para "Ver detalles" */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="flex items-center gap-2 bg-black px-3 py-1.5 rounded-md text-white text-sm font-medium">
                        <Eye size={16} />
                        Ver detalles
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-foreground font-medium">{account.titulo}</p>
                        <p className="text-foreground font-bold">
                          {selectedCurrency?.symbol} {getPrice(account)}
                        </p>
                      </div>
                      <p className="text-foreground">Nivel: {account.nivel}+</p>
                      <p className="text-foreground">Esencia Azul: {account.escencia.toLocaleString()}+</p>
                      <p className="text-foreground">Esencia Naranja: {account.escenciaNaranja.toLocaleString()}+</p>
                      {account.rpAmount > 0 && (
                        <p className="text-foreground">RP: { account.rpAmount.toLocaleString()}</p>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleAddToCart(account)}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={account.stock === 0}
                    >
                      {account.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
                    </Button>
                  </div>
                </Card>
              ))}

              {filteredAccounts.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {skinSearchQuery 
                    ? 'No se encontraron cuentas con las skins especificadas'
                    : 'No se encontraron cuentas que coincidan con tu búsqueda'
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Currency Selection Modal */}
      <CurrencySelectionModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        currencies={currencies}
        onSelect={handleCurrencySelect}
        isLoading={isLoadingCurrencies}
      />
      
      {/* Modal de detalles */}
      <UnrankedDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        account={selectedAccount}
        selectedCurrency={selectedCurrency}
        getPrice={getPrice}
        skinSearchTerm={skinSearchQuery} // Pasar el término de búsqueda para que la imagen coincida
        onAddToCart={handleAddToCart} // Pasar la función para manejar el carrito
      />
    </div>
  );
}

export default Unrankeds;