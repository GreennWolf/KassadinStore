import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const REGIONS = ['NA', 'EUW', 'EUNE', 'KR', 'JP', 'LAN', 'LAS', 'BR', 'OCE'];

const Filters = ({ filters, onFilterChange, statuses }) => {
    const handleReset = () => {
        onFilterChange({
            fechaInicio: "",
            fechaFin: "",
            estado: "all",
            region: "all",
            precioMin: "",
            precioMax: "",
            nombre: ""
        });
    };

    return (
        <div className="space-y-6">
            {/* Fecha Inicio */}
            <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                    type="date"
                    value={filters.fechaInicio}
                    onChange={(e) => onFilterChange({ fechaInicio: e.target.value })}
                />
            </div>

            {/* Fecha Fin */}
            <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                    type="date"
                    value={filters.fechaFin}
                    onChange={(e) => onFilterChange({ fechaFin: e.target.value })}
                />
            </div>

            {/* Estado */}
            <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                    value={filters.estado || "all"}
                    onValueChange={(value) => onFilterChange({ estado: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {statuses.map((status) => (
                            <SelectItem key={status._id} value={status._id}>
                                {status.status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Región */}
            <div className="space-y-2">
                <Label>Región</Label>
                <Select
                    value={filters.region || "all"}
                    onValueChange={(value) => onFilterChange({ region: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar región" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las regiones</SelectItem>
                        {REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                                {region}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Rango de Precios */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Precio Mínimo</Label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={filters.precioMin}
                        onChange={(e) => onFilterChange({ precioMin: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Precio Máximo</Label>
                    <Input
                        type="number"
                        placeholder="1000"
                        value={filters.precioMax}
                        onChange={(e) => onFilterChange({ precioMax: e.target.value })}
                    />
                </div>
            </div>

            {/* Buscar por nombre */}
            <div className="space-y-2">
                <Label>Nombre de Invocador</Label>
                <Input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={filters.nombre}
                    onChange={(e) => onFilterChange({ nombre: e.target.value })}
                />
            </div>

            {/* Reset Button */}
            <div className="pt-4">
                <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleReset}
                >
                    Limpiar Filtros
                </Button>
            </div>
        </div>
    );
};

export default Filters;