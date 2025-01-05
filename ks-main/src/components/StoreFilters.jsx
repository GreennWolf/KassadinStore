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
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
            <SelectItem value="name-desc">Name: Z to A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};