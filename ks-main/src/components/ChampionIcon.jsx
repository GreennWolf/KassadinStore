import React, { useState, useEffect } from 'react';
import { getChampionImageUrl, updateMissingChampions } from '../services/champsService';

// Componente para mostrar íconos de campeones con manejo de respaldo
const ChampionIcon = ({ 
  championName, 
  fallbackName = 'default',
  className = '', 
  size = 40,
  autoUpdate = false,
  onError = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    if (!championName) return;
    
    // Obtener la URL de la imagen con respaldo
    const imageUrl = getChampionImageUrl(championName, fallbackName);
    setImageSrc(imageUrl);
  }, [championName, fallbackName]);
  
  // Manejar errores de carga de imagen
  const handleImageError = async () => {
    setHasError(true);
    
    // Si tenemos autoUpdate activado, intentar actualizar la imagen
    if (autoUpdate && championName) {
      try {
        // Intentar actualizar la imagen del campeón
        const result = await updateMissingChampions([championName]);
        
        if (result.results[championName]?.exists) {
          // Si se actualizó correctamente, intentar cargar la nueva imagen
          setImageSrc(`${import.meta.env.VITE_API_URL}/champions/${championName}.png?t=${Date.now()}`);
          setHasError(false);
        } else {
          // Si no se pudo actualizar, usar la imagen de respaldo
          setImageSrc(`${import.meta.env.VITE_API_URL}/champions/${fallbackName}.png`);
        }
      } catch (error) {
        console.error(`Error al actualizar el icono de ${championName}:`, error);
        // En caso de error, usar la imagen de respaldo
        setImageSrc(`${import.meta.env.VITE_API_URL}/champions/${fallbackName}.png`);
      }
    } else {
      // Si no está activado autoUpdate, usar la imagen de respaldo
      setImageSrc(`${import.meta.env.VITE_API_URL}/champions/${fallbackName}.png`);
    }
    
    // Llamar al callback de error si se proporcionó
    if (onError) {
      onError(championName);
    }
  };
  
  return (
    <img
      src={imageSrc}
      alt={`${championName || 'Unknown'} champion icon`}
      className={`champion-icon ${className} ${hasError ? 'champion-icon-error' : ''}`}
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%' }}
      onError={handleImageError}
      {...props}
    />
  );
};

export default ChampionIcon;