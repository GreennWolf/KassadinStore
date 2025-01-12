import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/context/StoreContext";
import { Star, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from '../context/currencyContext';
import { CurrencySelectionModal } from '../components/CurrencySelectionModal';
import { getAllCurrencies } from '../services/currencyService';
import { getAllRPPriceConversions } from "../services/rpConvertionService";
import { getAllUnrankeds } from '../services/unrankedService';
import {Label} from "@/components/ui/label";

const REGIONS = ['LAS', 'LAN', 'NA', 'EUW', 'EUNE', 'OCE', 'BR', 'KR', 'JP', 'TR', 'RU'];

const Unrankeds = () => {
  const { addToCart } = useStore();
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();
  const [sortOrder, setSortOrder] = useState("new-desc");

  // Estados para filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  
  // Estados para datos
  const [accounts, setAccounts] = useState([]);
  const [rpConversions, setRpConversions] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [accountsData, rpConversionsData] = await Promise.all([
          getAllUnrankeds(),
          getAllRPPriceConversions()
        ]);
        
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
    const priceConverted = getPrice(account)
    addToCart({...account,priceConverted}, false, false, true);
  };

  const handleCurrencySelect = (currency) => {
    const selectedCurrency = currencies.find(c => c._id === currency);
    if (selectedCurrency) {
      updateSelectedCurrency(selectedCurrency);
      setShowCurrencyModal(false);
    }
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

  const filteredAccounts = getSortedAccounts(
    accounts.filter((account) => {
      const matchesSearch = account.titulo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === "all" || account.region === selectedRegion;
      return matchesSearch && matchesRegion;
    })
  );

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
                <Input
                  type="search"
                  placeholder="Buscar cuentas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full transition-all duration-200 hover:border-primary/50 focus:border-primary"
                />
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
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((account) => (
                <Card key={account._id} className="bg-card border-border overflow-hidden">
                  <div className="relative">
                    <img 
                      src={account.srcLocal || account.srcWeb} 
                      alt={account.titulo}
                      className="w-full h-48 object-cover"
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
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-foreground font-medium">Región: {account.region}</p>
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
                    >
                      Agregar al carrito
                    </Button>
                  </div>
                </Card>
              ))}

              {filteredAccounts.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No se encontraron cuentas que coincidan con tu búsqueda
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
    </div>
  );
}

export default Unrankeds;