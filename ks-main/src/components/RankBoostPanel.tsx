import { useState, useEffect, useContext } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ChampionIcon from "./ChampionIcon";
import { useToast } from "@/hooks/use-toast";
import { getEloBoostRanks, getEloBoostConfig, calculateBoostCost, getAvailableChampions, createEloBoostOrder, getEloBoostPriceConversions } from "../services/eloBoostService";
import { useNavigate } from "react-router-dom";
import { AuthModalContext } from "../context/authModalContext";
import { useCurrency } from "../context/currencyContext.jsx";

// Tipos de datos para TypeScript
interface RPPrice {
  _id: string;
  name: string;
  valueRP: number;
}

interface Rank {
  _id: string;
  name: string;
  icon: string;
  order: number;
  divisions: { name: string; order: number }[];
  rankUpPriceRP: RPPrice;
  divisionPriceRP: RPPrice;
}

interface Currency {
  _id: string;
  name: string;
  code: string;
  symbol: string;
}

interface PriceConversion {
  rpPrice: RPPrice;
  priceSeguro: number;
  priceBarato: number;
}

interface CurrencyConversions {
  currency: Currency;
  conversions: {
    [rpPriceId: string]: PriceConversion;
  };
}

interface PriceConversionsData {
  currencies: Currency[];
  conversions: {
    [currencyId: string]: CurrencyConversions;
  };
}

interface BoostConfig {
  specificRolePricePercent: number;
  specificChampionPricePercent: number;
  duoQueuePricePercent: number;
  availableRoles: { name: string; active: boolean }[];
}

interface Champion {
  _id: string;
  name: string;
  icon: string;
}

interface CalculationResult {
  baseRPPrice: number;
  additionalRPCost: number;
  totalRPCost: number;
  basePrice?: number;
  additionalCost?: number;
  totalCost?: number;
  currency?: Currency;
  details: {
    currentRank: {
      _id: string;
      name: string;
      division: string;
    };
    targetRank: {
      _id: string;
      name: string;
      division: string;
    };
  };
}

export function RankBoostPanel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { openAuthModal } = useContext(AuthModalContext);
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [config, setConfig] = useState<BoostConfig | null>(null);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [priceConversions, setPriceConversions] = useState<PriceConversionsData | null>(null);
  
  // Estados para el formulario
  const [currentRankId, setCurrentRankId] = useState<string>('');
  const [currentDivision, setCurrentDivision] = useState<string>('IV');
  const [targetRankId, setTargetRankId] = useState<string>('');
  const [targetDivision, setTargetDivision] = useState<string>('IV');
  const [currencyId, setCurrencyId] = useState<string>('');
  
  // Opciones adicionales
  const [specificRole, setSpecificRole] = useState<boolean>(false);
  const [specificRoleValue, setSpecificRoleValue] = useState<string>('');
  const [specificChampion, setSpecificChampion] = useState<boolean>(false);
  const [specificChampionId, setSpecificChampionId] = useState<string>('');
  const [duoQueue, setDuoQueue] = useState<boolean>(false);
  const [flexQueue, setFlexQueue] = useState<boolean>(false);
  
  // Resultado del cálculo
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  
  // Estados para modal de campeón
  const [showChampionModal, setShowChampionModal] = useState<boolean>(false);
  const [championsFilter, setChampionsFilter] = useState<string>('');
  
  // Estados para modal de rol
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  
  // Estado para modal de moneda
  const [showCurrencyModal, setShowCurrencyModal] = useState<boolean>(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ranksData, configData, championsData, priceConversionsData] = await Promise.all([
          getEloBoostRanks(),
          getEloBoostConfig(),
          getAvailableChampions(),
          getEloBoostPriceConversions()
        ]);
        
        setRanks(ranksData);
        setConfig(configData);
        setChampions(championsData);
        setPriceConversions(priceConversionsData);
        setCurrencies(priceConversionsData.currencies);
        
        // Si hay una moneda seleccionada en el contexto global, usarla
        if (selectedCurrency?._id) {
          setCurrencyId(selectedCurrency._id);
        }
        // Si no hay moneda seleccionada pero hay monedas disponibles, seleccionar la primera
        else if (priceConversionsData.currencies.length > 0) {
          setCurrencyId(priceConversionsData.currencies[0]._id);
          updateSelectedCurrency(priceConversionsData.currencies[0]);
        }
        
        // Establecer valores iniciales
        if (ranksData.length > 0) {
          setCurrentRankId(ranksData[0]._id);
          // Establecer el rango objetivo como el siguiente al actual
          if (ranksData.length > 1) {
            setTargetRankId(ranksData[1]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Intente de nuevo más tarde.",
          variant: "destructive"
        });
      }
    };
    
    fetchData();
  }, [toast, selectedCurrency, updateSelectedCurrency]);
  
  // Efecto para ajustar la división objetivo cuando cambia la división actual o los rangos
  useEffect(() => {
    if (currentRankId && targetRankId && currentRankId === targetRankId) {
      // Cuando es el mismo rango, ajustar la división objetivo si es necesario
      const currentDivIndex = getDivisionOrder(currentDivision);
      const targetDivIndex = getDivisionOrder(targetDivision);
      
      if (targetDivIndex <= currentDivIndex) {
        // Establecer la división objetivo para que sea mayor que la actual
        const currentRank = ranks.find(rank => rank._id === currentRankId);
        if (currentRank && currentRank.divisions) {
          // Buscar la siguiente división disponible
          const nextDivIndex = currentDivIndex + 1;
          if (nextDivIndex < currentRank.divisions.length) {
            const nextDiv = currentRank.divisions.find(div => div.order === nextDivIndex);
            if (nextDiv) {
              setTargetDivision(nextDiv.name);
            }
          } else if (currentRank.divisions.length > 0) {
            // Si no hay siguiente división, usar la más alta
            const highestDiv = [...currentRank.divisions].sort((a, b) => b.order - a.order)[0];
            setTargetDivision(highestDiv.name);
          }
        }
      }
    }
  }, [currentRankId, targetRankId, currentDivision, ranks]);

  // Función auxiliar para obtener el orden de una división
  const getDivisionOrder = (division: string): number => {
    switch (division) {
      case 'IV': return 0;
      case 'III': return 1;
      case 'II': return 2;
      case 'I': return 3;
      default: return 0;
    }
  };

  // Efecto para calcular el precio cuando cambian las selecciones
  useEffect(() => {
    const calculatePrice = async () => {
      // Solo calcular si tenemos los datos necesarios
      if (!currentRankId || !targetRankId) return;
      
      // Verificar que la selección sea válida antes de hacer la solicitud
      if (currentRankId === targetRankId) {
        const currentDivIndex = getDivisionOrder(currentDivision);
        const targetDivIndex = getDivisionOrder(targetDivision);
        
        if (targetDivIndex <= currentDivIndex) {
          // No hacer la solicitud si la combinación es inválida
          return;
        }
      }
      
      try {
        // Incluir el currencyId en el cálculo si está disponible
        const result = await calculateBoostCost({
          currentRankId,
          currentDivision,
          targetRankId,
          targetDivision,
          specificRole,
          specificChampion,
          duoQueue,
          currencyId // Incluir la moneda seleccionada
        });
        
        setCalculationResult(result);
        
        // Si el resultado incluye información de moneda y es diferente a la seleccionada en el contexto global,
        // actualizar la selección global
        if (result.currency && result.currency._id !== selectedCurrency?._id) {
          updateSelectedCurrency(result.currency);
        }
      } catch (error) {
        console.error("Error calculating price:", error);
        toast({
          title: "Error de cálculo",
          description: "No se pudo calcular el precio. Verifique sus selecciones.",
          variant: "destructive"
        });
      }
    };
    
    calculatePrice();
  }, [
    currentRankId, currentDivision,
    targetRankId, targetDivision,
    specificRole, specificChampion, duoQueue,
    currencyId, // Añadir currencyId a las dependencias
    toast, selectedCurrency, updateSelectedCurrency
  ]);
  
  // Handler para proceder al formulario de checkout
  const handleProceedToCheckout = async () => {
    if (!calculationResult) return;
    
    try {
      // Comprobar si el usuario está logueado verificando si existe en localStorage
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      
      if (!user || !user._id) {
        // Abrir el modal de login usando el contexto
        openAuthModal();
        
        toast({
          title: "Sesión no iniciada",
          description: "Debe iniciar sesión para realizar esta acción.",
          variant: "destructive"
        });
        return;
      }
      
      // Obtener referencias a rangos y campeón para mostrar nombres en el checkout
      const currentRankData = ranks.find(r => r._id === currentRankId);
      const targetRankData = ranks.find(r => r._id === targetRankId);
      const champData = specificChampion && specificChampionId ? 
                         champions.find(c => c._id === specificChampionId) : null;
      
      // Verificar que haya una moneda seleccionada
      if (!currencyId) {
        toast({
          title: "Moneda no seleccionada",
          description: "Por favor, selecciona una moneda para continuar.",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar que haya una conversión de precio disponible
      if (!calculationResult?.totalCost || calculationResult?.totalCost === 0) {
        toast({
          title: "Conversión no disponible",
          description: "No hay conversión de precio disponible para la moneda seleccionada.",
          variant: "destructive"
        });
        return;
      }
      
      // Preparar los datos a enviar a la página de checkout
      const boostData = {
        currentRankId,
        currentDivision,
        targetRankId,
        targetDivision,
        queueType: flexQueue ? 'flex' : 'solo',
        specificRole,
        specificRoleValue: specificRole ? specificRoleValue : '',
        specificChampion,
        specificChampionId: specificChampion ? specificChampionId : '',
        duoQueue,
        // Datos de precios en RP
        baseRPPrice: calculationResult.baseRPPrice,
        totalRPPrice: calculationResult.totalRPCost,
        additionalRPCost: calculationResult.additionalRPCost,
        // Datos de precios convertidos
        basePrice: calculationResult.basePrice || 0,
        totalPrice: calculationResult.totalCost || 0,
        additionalCost: calculationResult.additionalCost || 0,
        currencyId: currencyId, // ID de la moneda seleccionada
        // Datos para visualización
        displayData: {
          currentRankName: currentRankData?.name || '',
          targetRankName: targetRankData?.name || '',
          championName: champData?.name || '',
          currencySymbol: calculationResult.currency?.symbol || selectedCurrency?.symbol || '$',
          currencyName: calculationResult.currency?.name || selectedCurrency?.name || 'USD'
        }
      };
      
      // Guardar los datos en sessionStorage para recuperarlos en la página de checkout
      sessionStorage.setItem('eloBoostData', JSON.stringify(boostData));
      
      // Redirigir al checkout sin crear la orden aún
      navigate('/eloboost-checkout');
      
    } catch (error) {
      console.error("Error proceeding to checkout:", error);
      toast({
        title: "Error",
        description: "No se pudo proceder al checkout. Intente de nuevo más tarde.",
        variant: "destructive"
      });
    }
  };
  
  // Obtener los roles disponibles
  const availableRoles = config?.availableRoles.filter(role => role.active) || [];
  
  // Filtrar campeones por búsqueda
  const filteredChampions = champions.filter(champion => 
    champion.name.toLowerCase().includes(championsFilter.toLowerCase())
  );
  
  // Encontrar el rango y campeón seleccionados
  const currentRank = ranks.find(rank => rank._id === currentRankId);
  const targetRank = ranks.find(rank => rank._id === targetRankId);
  const selectedChampion = champions.find(champ => champ._id === specificChampionId);
  
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="col-span-2 p-6 bg-card border-border">
        <div className="space-y-8">
          {/* Current Rank Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src={currentRank?.icon ? import.meta.env.VITE_API_URL + currentRank.icon : "/placeholder.svg"} 
                alt="current rank" 
                className="w-8 h-8" 
              />
              <h3 className="text-lg font-semibold">Rango Actual</h3>
            </div>
            <div className="grid gap-4">
              {/* Tier Selection */}
              <div className="grid grid-cols-4 gap-0.5">
                {ranks.map((rank) => (
                  <Button
                    key={rank._id}
                    variant={currentRankId === rank._id ? "default" : "outline"}
                    className="aspect-square p-0 border-muted h-20"
                    onClick={() => setCurrentRankId(rank._id)}
                  >
                    <img
                      src={rank.icon ? import.meta.env.VITE_API_URL + rank.icon : "/placeholder.svg"}
                      alt={rank.name}
                      className={`w-full h-full object-cover transition-opacity ${currentRankId === rank._id ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                    />
                  </Button>
                ))}
              </div>
              
              {/* Division Selection */}
              <div className="grid grid-cols-4 gap-2">
                {currentRank?.divisions.map((division) => (
                  <Button
                    key={division.name}
                    variant={currentDivision === division.name ? "default" : "outline"}
                    className="border-muted"
                    onClick={() => setCurrentDivision(division.name)}
                  >
                    {division.name}
                  </Button>
                ))}
              </div>
              
            </div>
          </div>

          {/* Desired Rank Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src={targetRank?.icon ? import.meta.env.VITE_API_URL + targetRank.icon : "/placeholder.svg"} 
                alt="target rank" 
                className="w-8 h-8" 
              />
              <h3 className="text-lg font-semibold">Rango Deseado</h3>
            </div>
            <div className="grid gap-4">
              {/* Tier Selection */}
              <div className="grid grid-cols-4 gap-0.5">
                {ranks.map((rank) => (
                  <Button
                    key={rank._id}
                    variant={targetRankId === rank._id ? "default" : "outline"}
                    className="aspect-square p-0 border-muted h-20"
                    onClick={() => setTargetRankId(rank._id)}
                    disabled={currentRank && rank.order < (currentRank?.order || 0)}
                  >
                    <img
                      src={rank.icon ? import.meta.env.VITE_API_URL + rank.icon : "/placeholder.svg"}
                      alt={rank.name}
                      className={`w-full h-full object-cover transition-opacity ${
                        currentRank && rank.order < (currentRank?.order || 0) 
                          ? 'opacity-30' 
                          : targetRankId === rank._id 
                            ? 'opacity-100' 
                            : 'opacity-50 hover:opacity-80'
                      }`}
                    />
                  </Button>
                ))}
              </div>
              
              {/* Division Selection */}
              <div className="grid grid-cols-4 gap-2">
                {targetRank?.divisions.map((division) => {
                  // Determinar si la división debe estar deshabilitada
                  // (si es el mismo rango y la división es menor o igual a la actual)
                  const isDisabled = targetRank._id === currentRankId && 
                                    division.order <= currentRank?.divisions.find(d => d.name === currentDivision)?.order!;
                  
                  return (
                    <Button
                      key={division.name}
                      variant={targetDivision === division.name ? "default" : "outline"}
                      className="border-muted"
                      onClick={() => setTargetDivision(division.name)}
                      disabled={isDisabled}
                    >
                      {division.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Checkout Section */}
      <Card className="p-6 bg-card border-border">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Resumen</h3>
            <p className="text-sm text-muted-foreground mb-4">Opciones adicionales para su Boost</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {calculationResult ? (
                    <>
                      {calculationResult.details.currentRank.name} {calculationResult.details.currentRank.division} 
                      {' → '} 
                      {calculationResult.details.targetRank.name} {calculationResult.details.targetRank.division}
                    </>
                  ) : (
                    'Calculando...'
                  )}
                </span>
              </div>
              
              {/* Seleccionador de Moneda */}
              <div className="flex items-center justify-between p-2 bg-secondary/20 rounded-md">
                <div className="text-sm">Moneda:</div>
                <div className="flex gap-2">
                  {currencies.map(currency => (
                    <Button
                      key={currency._id}
                      size="sm"
                      variant={currencyId === currency._id ? "default" : "outline"}
                      className="h-8 px-2 py-0"
                      onClick={() => {
                        setCurrencyId(currency._id);
                        updateSelectedCurrency(currency);
                      }}
                    >
                      {currency.symbol} {currency.code}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="flex" 
                      checked={flexQueue} 
                      onCheckedChange={(checked) => setFlexQueue(!!checked)}
                    />
                    <label htmlFor="flex" className="text-sm">Realizarlo en cola Flexible</label>
                  </div>
                  <span className="text-sm text-muted-foreground">Gratis</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="champion" 
                      checked={specificChampion}
                      onCheckedChange={(checked) => {
                        setSpecificChampion(!!checked);
                        if (checked && !specificChampionId) {
                          setShowChampionModal(true);
                        }
                      }}
                    />
                    <label 
                      htmlFor="champion" 
                      className="text-sm flex items-center"
                      onClick={() => specificChampion && setShowChampionModal(true)}
                    >
                      Campeón específico
                      {specificChampion && selectedChampion && (
                        <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full flex items-center">
                          <ChampionIcon 
                            championName={selectedChampion.name}
                            size={16}
                            className="mr-1"
                          />
                          {selectedChampion.name}
                        </span>
                      )}
                    </label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    +{config?.specificChampionPricePercent || 10}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="role" 
                      checked={specificRole}
                      onCheckedChange={(checked) => {
                        setSpecificRole(!!checked);
                        if (checked && !specificRoleValue) {
                          setShowRoleModal(true);
                        }
                      }}
                    />
                    <label 
                      htmlFor="role" 
                      className="text-sm flex items-center"
                      onClick={() => specificRole && setShowRoleModal(true)}
                    >
                      Rol específico
                      {specificRole && specificRoleValue && (
                        <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
                          {specificRoleValue}
                        </span>
                      )}
                    </label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    +{config?.specificRolePricePercent || 10}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="duo" 
                      checked={duoQueue}
                      onCheckedChange={(checked) => setDuoQueue(!!checked)}
                    />
                    <label htmlFor="duo" className="text-sm">Jugar duo con el booster</label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    +{config?.duoQueuePricePercent || 35}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {/* Mostrar tanto el precio en RP como el precio convertido */}
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Precio en RP:</span>
                <span>
                  {calculationResult ? calculationResult.totalRPCost.toLocaleString() : '...'} RP
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>
                  {calculationResult && calculationResult.currency ? (
                    `${calculationResult.currency.symbol}${(calculationResult.totalCost || 0).toFixed(2)}`
                  ) : (
                    '$...'
                  )}
                </span>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={handleProceedToCheckout}
              disabled={!calculationResult || !currencyId || !calculationResult?.totalCost || calculationResult?.totalCost === 0}
            >
              {!calculationResult?.totalCost || calculationResult?.totalCost === 0 
                ? "Conversión no disponible" 
                : "Continuar al Checkout"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Champion Selection Modal */}
      <Dialog open={showChampionModal} onOpenChange={setShowChampionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Campeón</DialogTitle>
            <DialogDescription>
              Elige el campeón con el que deseas que juegue el booster
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Buscar campeón..."
              className="w-full border rounded p-2 text-black"
              value={championsFilter}
              onChange={(e) => setChampionsFilter(e.target.value)}
            />
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {filteredChampions.map((champion) => (
                <Button
                  key={champion._id}
                  variant={specificChampionId === champion._id ? "default" : "outline"}
                  className="p-1 h-auto flex flex-col items-center"
                  onClick={() => {
                    setSpecificChampionId(champion._id);
                    setShowChampionModal(false);
                  }}
                >
                  <ChampionIcon
                    championName={champion.name}
                    size={40}
                    className="mb-1"
                    onError={() => // console.log("Error cargando imagen de campeón:", champion.name)}
                  />
                  <span className="text-xs">{champion.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Selection Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Rol</DialogTitle>
            <DialogDescription>
              Elige el rol que prefieres para el boost
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {availableRoles.map((role) => (
                <Button
                  key={role.name}
                  variant={specificRoleValue === role.name ? "default" : "outline"}
                  className="p-2 h-auto"
                  onClick={() => {
                    setSpecificRoleValue(role.name);
                    setShowRoleModal(false);
                  }}
                >
                  {role.name}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}