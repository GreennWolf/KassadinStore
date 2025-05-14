import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Coins, Eye } from "lucide-react";

export const ProductCard = ({ 
  product, 
  onAddToCart, 
  onBuyClick,
  onDetailClick,  // Nuevo prop para mostrar detalles (unrankeds)
  getPrice, 
  isSeguro,
  selectedCurrency,
  isGoldStore = false,
  category = '', // Nuevo prop para saber si es unranked
  skinSearchTerm = '' // Nuevo prop para búsqueda de skins
}) => {
  const [price, setPrice] = useState('N/A');
  console.log(category)
  // Log para depuración
  console.log("ProductCard props:", { 
    category, 
    productType: category === 'unrankeds' ? 'unranked' : (product.NombreSkin ? 'skin' : 'item'),
    hasDetailClick: !!onDetailClick,
    skinSearchTerm
  });
  
  useEffect(() => {
    const p = getPrice(product);
    if (!isGoldStore) {
      setPrice(p ? p : 'N/A');
    } else {
      setPrice(p ? p : 'N/A');
    }
  }, [product, isSeguro, selectedCurrency, isGoldStore, getPrice]);

  const getProductType = () => {
    if (category === 'unrankeds') return 'unranked';
    if (product.type === 'chromas') return 'chroma';
    if (product.skin) return 'chroma';
    if (product.NombreSkin) return 'skin';
    return 'item';
  };

  const getProductName = () => {
    if (getProductType() === 'unranked') return product.titulo;
    if (getProductType() === 'chroma' && product.skin) {
      return `${product.name} [${product.skin.NombreSkin}]`;
    }
    return product.NombreSkin || product.name;
  };

  // Selecciona una imagen aleatoria de skins para unrankeds o la skinSearchTerm si existe
  const getUnrankedImageSrc = () => {
    if (!product.skins || !Array.isArray(product.skins) || product.skins.length === 0) {
      console.log("Sin skins o array inválido:", product.skins);
      return product.srcLocal || product.srcWeb || '/placeholder.png';
    }
    
    console.log("Skins array:", product.skins.length, "skins disponibles");
    
    // Si hay búsqueda de skin, intentar encontrar la skin que coincida
    if (skinSearchTerm) {
      const matchingSkins = product.skins.filter(skin => {
        const skinName = skin.name || skin.NombreSkin || '';
        const championName = skin.champion?.name || skin.champion || '';
        return skinName.toLowerCase().includes(skinSearchTerm.toLowerCase()) || 
               championName.toLowerCase().includes(skinSearchTerm.toLowerCase());
      });
      
      console.log("Coincidencias con búsqueda:", matchingSkins.length);
      
      if (matchingSkins.length > 0) {
        // Usar la primera skin que coincida
        return matchingSkins[0].srcLocal || matchingSkins[0].imageUrl || matchingSkins[0].srcWeb || '/placeholder.png';
      }
    }
    
    // Si no hay búsqueda o no se encontró coincidencia, seleccionar aleatoriamente
    const randomIndex = Math.floor(Math.random() * product.skins.length);
    const randomSkin = product.skins[randomIndex];
    return randomSkin.srcLocal || randomSkin.imageUrl || randomSkin.srcWeb || '/placeholder.png';
  };

  const getImageSrc = () => {
    if (getProductType() === 'unranked') {
      const src = getUnrankedImageSrc();
      console.log("Imagen seleccionada para unranked:", src);
      return src;
    }
    return product.srcLocal || product.srcWeb;
  };

  const getImageStyles = () => {
    const baseStyles = "transition-transform duration-500 group-hover:scale-110 object-cover";
    
    if (getProductType() === 'chroma') {
      return `${baseStyles} h-[calc(100%-50px)] w-[calc(70%-50px)] object-contain m-6`;
    }
    return `${baseStyles} w-full h-36 sm:h-48`;
  };

  const handleAction = () => {
    if (isGoldStore) {
      onBuyClick(product);
    } else {
      const productWithPrice = {
        ...product,
        priceConverted: price
      };
      onAddToCart(productWithPrice, getProductType() === 'skin');
    }
  };

  // Determinar si mostrar información adicional para unrankeds
  const isUnranked = getProductType() === 'unranked';

  return (
    <Card className="overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:border-primary/20 bg-gradient-to-br from-card to-background animate-fade-in group">
      <CardContent className="p-3 sm:p-4 relative">
        {getProductType() === 'skin' && product?.new && 
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="backdrop-blur-sm bg-black/50">
              <Sparkles className="w-3 h-3 mr-1" />
              Nuevo
            </Badge>
          </div>
        }

        {product?.destacado && 
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="backdrop-blur-sm bg-black/50">
              <Sparkles className="w-3 h-3 mr-1" />
              Destacado
            </Badge>
          </div>
        } 
        
        {/* Mostrar badges para unrankeds */}
        {isUnranked && (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            <Badge variant="secondary" className="backdrop-blur-sm bg-black/50">
              {product.region}
            </Badge>
            <Badge variant="secondary" className="backdrop-blur-sm bg-black/50">
              Nivel {product.nivel}
            </Badge>
            {product.skins && Array.isArray(product.skins) && (
              <Badge variant="secondary" className="backdrop-blur-sm bg-black/50">
                {product.skins.length} skins
              </Badge>
            )}
          </div>
        )}
        
        <div 
          className="relative group overflow-hidden rounded-md cursor-pointer"
          onClick={() => isUnranked && onDetailClick && onDetailClick(product)}
        >
          <img
            src={getImageSrc()}
            alt={getProductName()}
            className={getImageStyles()}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder.png';
            }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Overlay para unrankeds con texto "Ver detalles" */}
          {isUnranked && onDetailClick && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-primary/90 px-3 py-1.5 rounded-md text-white text-sm font-medium">
                <Eye size={16} />
                Ver detalles
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
          <h3 className="font-semibold text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {getProductName()}
          </h3>

          <div className="flex justify-between items-center">
            {isGoldStore ? (
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-medium text-yellow-500">
                  {price || 'N/A'}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground font-medium">
                ${price}
              </p>
            )}
            
            <Button 
              onClick={handleAction}
              variant="outline"
              size="sm"
              className="transition-all duration-300 hover:bg-primary hover:text-primary-foreground relative overflow-hidden group"
            >
              <span className="relative z-10">
                {isGoldStore ? 'Comprar' : 'Agregar'} 
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;