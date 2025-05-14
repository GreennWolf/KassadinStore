import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator"; 
import { Search } from "lucide-react";

export const StoreFilters = ({
  onSortChange,
  onSearch,
  searchValue = '',
  currencies,
  selectedCurrency,
  handleCurrencySelect,
  category = '',
  onSkinSearch = () => {}, // Nuevo prop para la búsqueda de skins
  skinSearchValue = '',
  onRegionChange = () => {} // Prop para filtrado por región
}) => {
  // Determinar si es la categoría unrankeds para mostrar el buscador de skins
  const isUnrankeds = category === 'unrankeds';

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg border border-border animate-fade-in">
      <div className="space-y-2">
        <Label>Buscar {isUnrankeds ? 'cuentas' : 'productos'}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={`Buscar ${isUnrankeds ? 'cuentas' : 'productos'}...`}
            onChange={(e) => onSearch(e.target.value)}
            value={searchValue}
            className="transition-all duration-200 hover:border-primary/50 focus:border-primary pl-10"
          />
        </div>
      </div>

      {/* Búsqueda específica de skins para unrankeds */}
      {isUnrankeds && (
        <div className="space-y-2">
          <Label>Buscar por skin</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar skins específicas..."
              onChange={(e) => onSkinSearch(e.target.value)}
              value={skinSearchValue}
              className="transition-all duration-200 hover:border-primary/50 focus:border-primary pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Encuentra cuentas que contengan skins específicas
          </p>
          
          <Separator className="my-2" />
        </div>
      )}

      <div className="space-y-2">
        <Label>Divisa</Label>
        <Select onValueChange={handleCurrencySelect} value={selectedCurrency?._id || ''}>
          <SelectTrigger className="transition-all duration-200 hover:border-primary/50">
            <SelectValue placeholder="Seleccionar Divisa" />
          </SelectTrigger>
          <SelectContent className="bg-black border border-border">
              {currencies.map(currency => (
                <SelectItem key={currency._id} value={currency._id}>{currency.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Ordenar de</Label>
        <Select onValueChange={onSortChange}>
          <SelectTrigger className="transition-all duration-200 hover:border-primary/50">
            <SelectValue placeholder="Seleccionar Orden" />
          </SelectTrigger>
          <SelectContent className="bg-black border border-border">
            <SelectItem value="new-desc">Nuevos Primero</SelectItem>
            <SelectItem value="name-asc">Nombre: de A a Z</SelectItem>
            <SelectItem value="name-desc">Nombre: de Z a A</SelectItem>
            <SelectItem value="price-asc">Precio: Mas Bajo a Mas Alto</SelectItem>
            <SelectItem value="price-desc">Precio: Mas Alto a Mas Bajo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtros adicionales específicos para unrankeds */}
      {isUnrankeds && (
        <div className="space-y-2">
          <Label>Filtrar por Región</Label>
          <Select onValueChange={onRegionChange} defaultValue="all">
            <SelectTrigger className="transition-all duration-200 hover:border-primary/50">
              <SelectValue placeholder="Todas las regiones" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-border">
              <SelectItem value="all">Todas las regiones</SelectItem>
              <SelectItem value="LAS">LAS</SelectItem>
              <SelectItem value="LAN">LAN</SelectItem>
              <SelectItem value="NA">NA</SelectItem>
              <SelectItem value="EUW">EUW</SelectItem>
              <SelectItem value="EUNE">EUNE</SelectItem>
              <SelectItem value="OCE">OCE</SelectItem>
              <SelectItem value="BR">BR</SelectItem>
              <SelectItem value="KR">KR</SelectItem>
              <SelectItem value="JP">JP</SelectItem>
              <SelectItem value="TR">TR</SelectItem>
              <SelectItem value="RU">RU</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default StoreFilters;