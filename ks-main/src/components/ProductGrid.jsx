import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import UnrankedDetailModal from "./UnrankedDetailModal";

export const ProductGrid = ({ 
  products, 
  onAddToCart,
  onBuyClick,
  getPrice,
  isSeguro,
  selectedCurrency,
  isGoldStore = false,
  category = '', // Nuevo prop para saber si es unranked
  subcategory = '',
  skinSearchTerm = '', // Nuevo prop para búsqueda de skins
  isHighlighted = false // Mantener compatibilidad con versión previa
}) => {
  // Estados para el modal de detalles de unrankeds
  const [selectedUnranked, setSelectedUnranked] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Manejar clic en una cuenta unranked
  const handleUnrankedClick = (product) => {
    // console.log("Clic en unranked:", product);
    if (category === 'unrankeds') {
      setSelectedUnranked(product);
      setShowDetailModal(true);
    }
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product, index) => (
          <ProductCard 
            key={product._id}
            product={product}
            onAddToCart={onAddToCart}
            onBuyClick={onBuyClick}
            onDetailClick={handleUnrankedClick}
            getPrice={getPrice}
            isSeguro={isSeguro}
            selectedCurrency={selectedCurrency}
            isGoldStore={isGoldStore}
            category={category}
            skinSearchTerm={skinSearchTerm}
          />
        ))}
      </div>

      {/* Modal de detalles para unrankeds */}
      {category === 'unrankeds' && (
        <UnrankedDetailModal 
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          account={selectedUnranked}
          selectedCurrency={selectedCurrency}
          getPrice={getPrice}
        />
      )}
    </>
  );
};

export default ProductGrid;