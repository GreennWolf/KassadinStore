import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const timeRangeOptions = [
  { value: "week", label: "Última semana" },
  { value: "month", label: "Último mes" },
  { value: "year", label: "Último año" },
  { value: "all", label: "Todo el tiempo" },
  { value: "custom", label: "Personalizado" }
];

export const DateRangeSelector = ({ onRangeChange, initialValue = "month" }) => {
  const [timeRange, setTimeRange] = useState(initialValue);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: new Date() });

  const handleRangeChange = (value) => {
    if (value === "custom") {
      setIsCustomDateOpen(true);
    } else {
      setTimeRange(value);
      onRangeChange(value);
    }
  };

  const handleCustomDateSelect = (newDateRange) => {
    setDateRange(newDateRange);
    
    // Solo aplicar el rango cuando tenemos fecha de inicio y fin
    if (newDateRange.from && newDateRange.to) {
      // Cerrar el popover
      setTimeout(() => {
        setIsCustomDateOpen(false);
        
        // Notificar al componente padre con las fechas seleccionadas
        onRangeChange('custom', {
          startDate: newDateRange.from,
          endDate: newDateRange.to
        });
      }, 500);
    }
  };

  const getDisplayValue = () => {
    if (timeRange === "custom" && dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yy", { locale: es })} - ${format(dateRange.to, "dd/MM/yy", { locale: es })}`;
    }
    return timeRangeOptions.find(option => option.value === timeRange)?.label || "Último mes";
  };

  return (
    <div className="flex items-center space-x-2">
      {timeRange === "custom" ? (
        <Popover open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-8 px-3 text-xs"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{getDisplayValue()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={dateRange.from || new Date()}
              selected={dateRange}
              onSelect={handleCustomDateSelect}
              numberOfMonths={2}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Select value={timeRange} onValueChange={handleRangeChange}>
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue>{getDisplayValue()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};