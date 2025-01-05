// ProductCard.jsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Coins } from "lucide-react";

export const ProductCard = ({ 
  product, 
  onAddToCart, 
  onBuyClick,
  getPrice, 
  isSeguro,
  selectedCurrency,
  isGoldStore = false
}) => {
  const [price, setPrice] = useState('N/A');
  
  useEffect(() => {
    const p = getPrice(product);
    if (!isGoldStore) {
      setPrice(p ? p : 'N/A');
    }else{
      setPrice(p ? p: 'N/A');
      console.log(p)
    }
  }, [product, isSeguro, selectedCurrency, isGoldStore, getPrice]);

  useEffect(()=>{console.log(product)}, [product]);

  const getProductType = () => {
    if (product.type === 'chromas') return 'chroma';
    if (product.skin) return 'chroma';
    if (product.NombreSkin) return 'skin';
    return 'item';
  };

  const getProductName = () => {
    if (getProductType() === 'chroma' && product.skin) {
      return `${product.name} [${product.skin.NombreSkin}]`;
    }
    return product.NombreSkin || product.name;
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
        
        <div className="relative group overflow-hidden rounded-md">
          <img
            src={product.srcLocal || product.srcWeb}
            alt={getProductName()}
            className={getImageStyles()}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = product.srcWeb || product.srcLocal;
            }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                {isGoldStore ? 'Comprar' : 'Add to Cart'}
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