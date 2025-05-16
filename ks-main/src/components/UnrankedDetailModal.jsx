import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import rpIcon from '@/assets/RP_icon.webp';

/**
 * Modal para mostrar detalles de una cuenta unranked con mejor visualización
 */
const UnrankedDetailModal = ({ 
  isOpen, 
  onClose, 
  account, 
  selectedCurrency, 
  getPrice, 
  skinSearchTerm = '',
  onAddToCart
}) => {
  if (!account) return null;

  // Obtener la lista de skins de la cuenta
  const skins = Array.isArray(account.skins) ? account.skins : [];

  // Función para obtener una skin basada en la búsqueda o nada si no hay coincidencias
  const getBannerSkin = useMemo(() => {
    if (!skins.length) return null;
    
    // Si hay búsqueda de skin, intentar encontrar la skin que coincida
    if (skinSearchTerm) {
      const matchingSkins = skins.filter(skin => {
        const skinName = (skin.name || skin.NombreSkin || '').toLowerCase();
        const championName = (skin.champion?.name || skin.champion || '').toLowerCase();
        return skinName.includes(skinSearchTerm.toLowerCase()) || 
               championName.includes(skinSearchTerm.toLowerCase());
      });
      
      // Si hay coincidencias, devolver la primera; si no hay coincidencias, devolver null
      if (matchingSkins.length > 0) {
        return matchingSkins[0];
      } else {
        return null; // No mostrar ninguna imagen si no hay coincidencias
      }
    }
    
    // Si no hay búsqueda, elegir aleatoriamente
    const randomIndex = Math.floor(Math.random() * skins.length);
    return skins[randomIndex];
  }, [skins, skinSearchTerm]);

  // Filtrar skins para mostrar primero las que coinciden con la búsqueda
  const sortedSkins = useMemo(() => {
    if (!skinSearchTerm || !skins.length) return skins;
    
    return [...skins].sort((a, b) => {
      const nameA = (a.name || a.NombreSkin || '').toLowerCase();
      const nameB = (b.name || b.NombreSkin || '').toLowerCase();
      const champA = (a.champion?.name || a.champion || '').toLowerCase();
      const champB = (b.champion?.name || b.champion || '').toLowerCase();
      
      const aMatches = nameA.includes(skinSearchTerm.toLowerCase()) || 
                        champA.includes(skinSearchTerm.toLowerCase());
      
      const bMatches = nameB.includes(skinSearchTerm.toLowerCase()) || 
                        champB.includes(skinSearchTerm.toLowerCase());
      
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [skins, skinSearchTerm]);

  // Formatear el precio para una mejor visualización
  const formattedPrice = getPrice ? getPrice(account) : 
                          (account.priceRP?.valueRP || account.priceRPData?.valueRP || 'N/A');

  // Manejar clic en agregar al carrito
  const handleAddToCart = () => {
    if (onAddToCart && account) {
      onAddToCart(account);
      onClose(); // Opcionalmente cerrar el modal después de agregar al carrito
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold">Cuenta Unrankd</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge className="bg-primary/80">{account.region}</Badge>
                {account.stock !== undefined && (
                  <Badge className={`${account.stock > 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                    {account.stock > 0 ? `Stock: ${account.stock}` : 'Sin stock'}
                  </Badge>
                )}
              </DialogDescription>
            </div>
            
            {/* Sección de precio y botón de agregar al carrito */}
            <div className="flex flex-col items-end gap-2 mt-2">
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-primary">
                  {formattedPrice}
                </span>
                {selectedCurrency && (
                  <span className="text-sm font-medium text-muted-foreground ml-1">
                    {selectedCurrency.symbol}
                  </span>
                )}
              </div>
              
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                onClick={handleAddToCart}
                disabled={account.stock === 0}
              >
                <ShoppingCart className="h-4 w-4" />
                {account.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Primera sección: Imagen + Información */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 mt-2">
          {/* Imagen de skin en cuadrado - solo se muestra si getBannerSkin devuelve algo */}
          {getBannerSkin && (
            <div className="md:w-1/3 aspect-square overflow-hidden rounded-lg flex-shrink-0">
              <img 
                src={getBannerSkin.srcLocal || getBannerSkin.imageUrl || getBannerSkin.srcWeb || '/placeholder.png'} 
                alt={getBannerSkin.name || getBannerSkin.NombreSkin || 'Skin'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder.png';
                }}
              />
            </div>
          )}
          {/* Mensaje cuando no hay coincidencias de búsqueda */}
          {skinSearchTerm && !getBannerSkin && (
            <div className="md:w-1/3 aspect-square flex-shrink-0 flex items-center justify-center bg-card/60 rounded-lg border border-border">
              <p className="text-center text-muted-foreground px-4">
                No se encontraron skins que coincidan con "{skinSearchTerm}"
              </p>
            </div>
          )}

          {/* Información de la cuenta */}
          <div className="md:w-2/3 space-y-2">
            <h3 className="font-medium text-lg text-primary">Información de la cuenta</h3>
            <Separator className="my-1" />
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="font-semibold">Nivel:</div>
              <div>{account.nivel}</div>
              
              <div className="font-semibold">Esencia Azul:</div>
              <div>{account.escencia || 0}</div>
              
              <div className="font-semibold">Esencia Naranja:</div>
              <div>{account.escenciaNaranja || 0}</div>
              
              <div className="font-semibold">RP Disponibles:</div>
              <div className="flex items-center">
                {account.rpAmount || 0}
                <img src={rpIcon} alt="RP" className="w-4 h-4 ml-1" />
              </div>
              
              <div className="font-semibold">Región:</div>
              <div>{account.region}</div>
              
              <div className="font-semibold">Subida a mano:</div>
              <div>{account.handUpgrade ? "Sí" : "No"}</div>
              
              <div className="font-semibold">Stock disponible:</div>
              <div className={account.stock === 0 ? 'text-red-500 font-bold' : ''}>
                {account.stock || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Segunda sección: Skins disponibles */}
        <div className="overflow-hidden flex flex-col">
          <h3 className="font-medium text-lg text-primary">Skins disponibles ({skins.length})</h3>
          <Separator className="my-1" />
          
          {sortedSkins.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-2 flex-grow" style={{maxHeight: '280px'}}>
              {sortedSkins.map((skin, index) => {
                // Determinar si esta skin coincide con la búsqueda
                const isMatch = skinSearchTerm && 
                  ((skin.name || skin.NombreSkin || '').toLowerCase().includes(skinSearchTerm.toLowerCase()) ||
                   (skin.champion?.name || skin.champion || '').toLowerCase().includes(skinSearchTerm.toLowerCase()));
                
                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-2 rounded-md transition-colors
                      ${isMatch ? 'bg-primary/10 border border-primary/30' : 'bg-card/60 hover:bg-card/80'}`}
                  >
                    {/* Miniatura de la skin */}
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={skin.srcLocal || skin.imageUrl || skin.srcWeb || '/placeholder.png'} 
                        alt={skin.name || skin.NombreSkin || `Skin ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder.png';
                        }}
                      />
                    </div>
                    
                    {/* Nombre de la skin */}
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium text-sm">
                        {skin.name || skin.NombreSkin || `Skin ${index + 1}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Esta cuenta no tiene skins registradas
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnrankedDetailModal;