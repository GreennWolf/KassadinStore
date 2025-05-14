import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InfoIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export const RPTypeSelector = ({ onRPTypeChange , onInfoClick }) => {
  const [isSeguro, setIsSeguro] = useState(true);

  const handleChange = (checked) => {
    setIsSeguro(!checked); // Invert the checked state
    onRPTypeChange(!checked); // Pass the inverted state to maintain "Seguro" as true
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border animate-fade-in">
      <div className="flex flex-col items-center space-y-2">
        <Label className="text-lg">Tipo de RP</Label>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-bold text-muted-foreground">Seguro</span>
          <Switch 
            checked={!isSeguro}
            onCheckedChange={handleChange}
            className={`${isSeguro ? 'bg-white data-[state=checked]:bg-white' : 'bg-black data-[state=unchecked]:bg-black'}`}
          />
          <span className="text-sm font-bold text-muted-foreground">Barato</span>
        </div>
        <Link 
          onClick={onInfoClick}
          className="text-xs text-primary hover:underline flex items-center mt-1"
        >
          <InfoIcon className="w-3 h-3 mr-1" />
          ¿Qué son los tipos de RP?
        </Link>
      </div>
    </div>
  );
};