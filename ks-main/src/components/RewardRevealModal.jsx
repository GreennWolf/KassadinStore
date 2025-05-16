import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, X } from "lucide-react";
import confetti from 'canvas-confetti';

// Constantes para URLs base
const API_BASE_ITEMS = `${import.meta.env.VITE_API_URL}/items`;
const API_BASE_CHROMAS = `${import.meta.env.VITE_API_URL}/api/chromas`;
const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}/images/`;
const API_BASE_LOOTBOX = `${import.meta.env.VITE_API_URL}/lootbox`;

// Imágenes de respaldo
import couponImage from "../assets/Cupones.png";
import skinFragmentImage from "../assets/Skin.png";
import placeholderImage from "../assets/Skin.png";

// Función para determinar la URL correcta de la imagen basada en el tipo y detalles
// Movida fuera del componente para evitar recreaciones innecesarias
const getImageUrl = (reward) => {
  if (!reward) return placeholderImage;

  // Para oro, usamos un placeholder
  if (reward.itemType === "Gold") {
    return placeholderImage;
  }
  
  // Para cupones, usamos la imagen por defecto o la proporcionada
  if (reward.itemType === "RewardCouponPreset") {
    return reward.details?.image || couponImage;
  }
  
  // Para fragmentos, usamos la imagen por defecto o la proporcionada
  if (reward.itemType === "FragmentsPreset") {
    return reward.details?.image || skinFragmentImage;
  }
  
  // Para skins, comprobamos varias posibles ubicaciones
  if (reward.itemType === "Skin") {
    // Primero, intentamos con details.srcLocal o details.image
    if (reward.details?.srcLocal) {
      // Aseguramos que la URL sea absoluta
      const cleanPath = reward.details.srcLocal.replace(/\\/g, '/');
      if (cleanPath.startsWith('http')) return cleanPath;
      return `${API_BASE_IMAGE}${cleanPath}`;
    }
    
    if (reward.details?.image) {
      return reward.details.image;
    }
    
    // Luego comprobamos itemId
    if (reward.itemId?.srcLocal) {
      const cleanPath = reward.itemId.srcLocal.replace(/\\/g, '/');
      if (cleanPath.startsWith('http')) return cleanPath;
      return `${API_BASE_IMAGE}${cleanPath}`;
    }
    
    // Por último, intentamos con src
    if (reward.itemId?.src || reward.details?.src) {
      return reward.itemId?.src || reward.details?.src;
    }
  }
  
  // Para otros tipos, intentamos diferentes opciones
  if (reward.details?.srcLocal) {
    const cleanPath = reward.details.srcLocal.replace(/\\/g, '/');
    if (cleanPath.startsWith('http')) return cleanPath;
    // Determinamos la base URL según el tipo
    const baseUrl = reward.details.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
    return `${baseUrl}/${cleanPath}`;
  }
  
  if (reward.details?.image) {
    return reward.details.image;
  }
  
  if (reward.itemId?.srcLocal) {
    const cleanPath = reward.itemId.srcLocal.replace(/\\/g, '/');
    if (cleanPath.startsWith('http')) return cleanPath;
    const baseUrl = reward.itemId?.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
    return `${baseUrl}/${cleanPath}`;
  }
  
  // Imagen por defecto
  return placeholderImage;
};

const RewardRevealModal = ({ isOpen, onClose, reward }) => {
  // ¡IMPORTANTE! Todos los hooks DEBEN definirse antes de cualquier return
  const [revealState, setRevealState] = useState("initial"); // initial, revealing, revealed
  const [imageLoaded, setImageLoaded] = useState(false);
  const [rewardImage, setRewardImage] = useState("");
  const confettiCanvasRef = useRef(null);
  
  // Extraer información de la recompensa de forma segura
  const rewardName = reward?.details?.name || reward?.itemId?.name || "Recompensa";
  
  // Determinar el tipo de recompensa
  const rewardType = !reward ? "" : 
                     reward.itemType === "Skin" ? "skin" : 
                     reward.itemType === "RewardCouponPreset" ? "cupón" : 
                     reward.itemType === "FragmentsPreset" ? "fragmento" : "item";

  // Obtener información adicional según el tipo
  const additionalInfo = !reward ? "" :
                         reward.details?.obtainedFrom === "fragment_claim" 
                         ? "Recompensa de fragmentos" 
                         : reward.details?.obtainedFrom === "reward" 
                         ? "Recompensa de lootbox" 
                         : "";
  
  // Manejar la carga de la imagen
  const handleImageLoad = () => {
    // console.log("Imagen cargada correctamente");
    setImageLoaded(true);
  };

  // Manejar errores de carga de la imagen
  const handleImageError = (e) => {
    console.error("Error al cargar la imagen:", e.target.src);
    
    // Intentamos con una imagen alternativa
    if (reward?.itemType === "Skin") {
      e.target.src = skinFragmentImage;
    } else if (reward?.itemType === "RewardCouponPreset") {
      e.target.src = couponImage;
    } else {
      e.target.src = placeholderImage;
    }
    
    // Indicamos que ya se ha "cargado" (aunque sea el fallback)
    setImageLoaded(true);
    e.target.onerror = null; // Evitar bucles de error
  };

  // Efecto para precargar la imagen cuando cambia la recompensa
  useEffect(() => {
    if (reward && isOpen) {
      // Obtenemos la URL
      const imageUrl = getImageUrl(reward);
      setRewardImage(imageUrl);
      setImageLoaded(false);
      
      // Precargamos la imagen
      const img = new Image();
      img.onload = handleImageLoad;
      img.onerror = () => {
        console.error("Error en precarga de imagen:", imageUrl);
        setImageLoaded(true); // Consideramos cargada aunque sea con error
      };
      img.src = imageUrl;
    }
  }, [reward, isOpen]);

  const triggerConfetti = () => {
    const myCanvas = confettiCanvasRef.current;
    if (!myCanvas) return;

    const myConfetti = confetti.create(myCanvas, {
      resize: true,
      useWorker: true
    });

    // Disparar confetti de colores dorados y azules
    myConfetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F8D568', '#0397AB', '#C89B3C', '#0A323C', '#785A28'],
    });

    // Disparo adicional para más efecto
    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#F8D568', '#0397AB', '#C89B3C'],
      });
    }, 250);

    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#785A28', '#0A323C', '#0397AB'],
      });
    }, 400);
  };

  // Manejar el cierre correctamente
  const handleClose = () => {
    // Resetear estados
    setRevealState("initial");
    setImageLoaded(false);
    // Llamar al callback de cierre
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  // Iniciar secuencia de revelación
  useEffect(() => {
    if (isOpen && reward) {
      // Resetear el estado cuando se abre el modal
      setRevealState("initial");
      
      // Iniciar la secuencia de revelación después de un breve retraso
      const initialTimer = setTimeout(() => {
        setRevealState("revealing");
        triggerConfetti();
        
        // Después de la animación, marcar como revelado
        const revealTimer = setTimeout(() => {
          setRevealState("revealed");
        }, 2000);
        
        return () => clearTimeout(revealTimer);
      }, 1000);
      
      return () => clearTimeout(initialTimer);
    }
  }, [isOpen, reward]);

  // Si no hay recompensa o no está abierto, no renderizamos el contenido
  if (!isOpen || !reward) {
    return null;
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={() => handleClose()}
    >
      <DialogContent 
        className="p-0 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 border-2 border-yellow-600 rounded-lg max-h-[90vh] w-[90vw] max-w-xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Canvas para confetti */}
        <canvas
          ref={confettiCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-50"
        ></canvas>

        {/* Botón de cierre */}
        <button
          onClick={() => handleClose()}
          className="absolute top-3 right-3 text-gray-400 hover:text-white z-50"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Contenido principal */}
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
          {revealState === "initial" && (
            <div className="animate-pulse flex flex-col items-center">
              <Gift className="h-16 w-16 text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {reward.itemType === "FragmentsPreset" 
                  ? "¡Has completado los fragmentos!" 
                  : "¡Has obtenido una recompensa!"}
              </h2>
              <p className="text-lg text-slate-300">
                Preparando tu recompensa...
              </p>
            </div>
          )}

          {revealState === "revealing" && (
            <div className="flex flex-col items-center">
              <Sparkles className="h-12 w-12 text-yellow-400 animate-bounce mb-4" />
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                ¡Recompensa Desbloqueada!
              </h2>
              
              {/* Contenedor para la imagen con efecto de brillo */}
              <div className="relative w-64 h-64 mb-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/50 to-yellow-500/50 rounded-lg animate-pulse"></div>
                
                {/* Imagen de la recompensa */}
                <div className="w-full h-full relative z-10 flex items-center justify-center">
                  {reward.itemType === "Gold" ? (
                    <Gift className="w-3/4 h-3/4 text-yellow-500" />
                  ) : (
                    <img
                      src={rewardImage}
                      alt={rewardName}
                      className="max-w-full max-h-full object-cover p-4"
                      onError={handleImageError}
                    />
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white">
                {rewardName}
              </h3>
            </div>
          )}

          {revealState === "revealed" && (
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                ¡Recompensa Desbloqueada!
              </h2>
              
              {/* Contenedor para la imagen */}
              <div className="relative w-64 h-64 mb-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/30 to-yellow-500/30 rounded-lg animate-pulse"></div>
                
                {/* Imagen con estado "revelado" */}
                <div className="w-full h-full relative z-10 flex items-center justify-center">
                  {reward.itemType === "Gold" ? (
                    <Gift className="w-3/4 h-3/4 text-yellow-500" />
                  ) : (
                    <img
                      src={rewardImage}
                      alt={rewardName}
                      className="max-w-full max-h-full object-contain p-4"
                      onError={handleImageError}
                    />
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                {rewardName}
              </h3>
              <p className="text-slate-300 mb-2">
                {rewardType === "skin" 
                  ? "¡Has desbloqueado una skin exclusiva!" 
                  : rewardType === "cupón"
                    ? "¡Has obtenido un cupón de recompensa!"
                    : rewardType === "fragmento"
                      ? "¡Has obtenido un fragmento especial!"
                      : "¡Has obtenido un item especial!"}
              </p>
              {additionalInfo && (
                <p className="text-slate-400 text-sm mb-4">{additionalInfo}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RewardRevealModal;