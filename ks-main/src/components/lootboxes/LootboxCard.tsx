import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Coins } from "lucide-react"; // Importamos el icono Coins
import { useNavigate } from "react-router-dom";

// Función para generar un color más claro (para gradientes)
const getLighterColor = (hexColor) => {
  // Si no se proporciona un color válido, devolveremos el gris predeterminado
  if (!hexColor || !hexColor.startsWith('#')) return "#9ca3af";
  
  try {
    // Convertir el color hexadecimal a RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Aclarar el color mezclándolo con blanco
    const lighterR = Math.min(r + 60, 255);
    const lighterG = Math.min(g + 60, 255);
    const lighterB = Math.min(b + 60, 255);
    
    // Convertir de nuevo a formato hexadecimal
    return `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return "#9ca3af"; // Color por defecto en caso de error
  }
};

// Función para generar un color más oscuro (para sombras)
const getDarkerColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return "#4b5563";
  
  try {
    // Convertir el color hexadecimal a RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Oscurecer el color
    const darkerR = Math.max(r - 40, 0);
    const darkerG = Math.max(g - 40, 0);
    const darkerB = Math.max(b - 40, 0);
    
    // Convertir de nuevo a formato hexadecimal
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return "#4b5563"; // Color por defecto en caso de error
  }
};

/**
 * Componente LootboxCard 
 * @param {Object} props
 * @param {string} props.title - Título de la lootbox
 * @param {number} props.price - Precio de la lootbox
 * @param {string} props.color - Color en formato hexadecimal (ej: "#FF5733")
 * @param {string} props.image - URL de la imagen
 * @param {string} props.rarity - Rareza de la lootbox
 * @param {Function} props.onClick - Función para manejar el click
 */
export const LootboxCard = ({ title, price, color, image, rarity, onClick }) => {
  const navigate = useNavigate();
  
  // Asegúrate de que el color sea un formato hexadecimal
  const mainColor = color && color.startsWith('#') ? color : "#808080";
  const lighterColor = getLighterColor(mainColor);
  const darkerColor = getDarkerColor(mainColor);
  
  // Determinar si es una rareza alta para aplicar efectos especiales
  const isHighRarity = rarity === "Legendary" || rarity === "Mythical" || rarity === "Epic";

  const handleClick = () => {
    // Si se pasa una función onClick, la ejecutamos
    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="relative group cursor-pointer"
      onClick={handleClick}
    >
      <div 
        className="relative p-6 rounded-lg overflow-hidden border"
        style={{
          background: `linear-gradient(145deg, #0a0a0a, #1a1a1a)`,
          borderColor: `${mainColor}40`,
          boxShadow: `0 8px 20px -4px rgba(0, 0, 0, 0.5), 0 0 15px ${mainColor}20`
        }}
      >
        {/* Glow Bar en la parte superior */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
          style={{
            background: `linear-gradient(to right, ${mainColor}, ${lighterColor})`,
            boxShadow: `0 0 8px ${mainColor}60`
          }}
        />
          
        {/* Efecto Glow al hacer hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div 
            className="absolute inset-0 blur-xl"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${mainColor}20, transparent 70%)`,
              opacity: 0.5
            }}
          />
        </div>
                
        {/* Contenido */}
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{
                background: `linear-gradient(to right, ${mainColor}90, ${darkerColor}90)`,
                boxShadow: `0 0 8px ${mainColor}40`
              }}
            >
              {rarity}
            </span>
          </div>
          
          <motion.div 
            className="relative h-48 mb-6 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Efecto de resplandor detrás de la imagen */}
            <div 
              className="absolute inset-0 rounded-lg blur-lg"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${mainColor}20, transparent 70%)`,
                opacity: isHighRarity ? 0.7 : 0.3
              }}
            />
            
            {/* Imagen */}
            <img
              src={image}
              alt={title}
              className="relative z-10 w-full h-full object-contain drop-shadow-xl"
            />
          </motion.div>
          
          <div className="flex items-center justify-between">
            {/* Sección de precio con icono Coins */}
            <div className="flex items-center space-x-2">
              <Coins 
                className="h-5 w-5" 
                style={{ 
                  color: 'gold',
                }} 
              />
              <span className="text-2xl font-bold text-white">
                {price.toLocaleString()}
              </span>
            </div>
            
            <Button
              className="text-white border-none transition-all duration-300"
              style={{
                background: `linear-gradient(to right, ${mainColor}, ${darkerColor})`,
                boxShadow: `0 4px 10px ${mainColor}40`
              }}
              onClick={handleClick}
            >
              <Play className="w-4 h-4 mr-2" />
              Abrir Caja
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};