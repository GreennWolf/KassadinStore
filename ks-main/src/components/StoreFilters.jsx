import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const StoreFilters = ({
  onSortChange,
  onSearch,
  searchValue = '',
  currencies,
  selectedCurrency,
  handleCurrencySelect,
}) => {
  return (
    <div className="space-y-6 p-4 bg-card rounded-lg border border-border animate-fade-in">
      <div className="space-y-2">
        <Label>Search</Label>
        <Input
          type="search"
          placeholder="Search items..."
          onChange={(e) => onSearch(e.target.value)}
          className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
        />
      </div>

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
            <SelectValue placeholder="Select order" />
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
    </div>
  );
};