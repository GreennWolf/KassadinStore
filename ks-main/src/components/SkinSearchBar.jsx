// components/SkinSearchBar.jsx
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function SkinSearchBar({ value, onChange, onClear, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-grow">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar skins..."
          value={value}
          onChange={onChange}
          className="pl-8"
          disabled={disabled}
        />
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onClear}
        disabled={!value}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}