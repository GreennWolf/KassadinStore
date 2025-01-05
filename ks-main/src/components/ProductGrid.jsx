// ProductGrid.jsx
import { ProductCard } from "@/components/ProductCard";

export const ProductGrid = ({ 
  products, 
  onAddToCart,
  onBuyClick,
  getPrice,
  isSeguro,
  selectedCurrency,
  isGoldStore = false
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product._id}
          product={product}
          onAddToCart={onAddToCart}
          onBuyClick={onBuyClick}
          getPrice={getPrice}
          isSeguro={isSeguro}
          selectedCurrency={selectedCurrency}
          isGoldStore={isGoldStore}
        />
      ))}
    </div>
  );
};