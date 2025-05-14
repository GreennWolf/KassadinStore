// components/SkinCard.jsx
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Check } from 'lucide-react';

export function SkinCard({ skin, isSelected, onToggle }) {
  return (
    <div
      className={`relative flex flex-col rounded-lg overflow-hidden border transition-all cursor-pointer hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'
      }`}
      onClick={() => onToggle(skin._id)}
    >
      <div className="aspect-video bg-muted relative overflow-hidden">
        {skin.srcLocal ? (
          <img
            src={skin.srcLocal}
            alt={skin.NombreSkin}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Sin imagen
          </div>
        )}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
            <Check size={16} />
          </div>
        )}
      </div>
      <div className="p-2 space-y-1">
        <p className="font-medium text-sm truncate" title={skin.NombreSkin}>
          {skin.NombreSkin}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {skin.championData?.name || 'Sin campeón'}
        </p>
        {skin.priceRPData && (
          <Badge variant="outline" className="text-xs">
            {skin.priceRPData.valueRP} RP
          </Badge>
        )}
      </div>
    </div>
  );
}
