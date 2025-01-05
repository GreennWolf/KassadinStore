import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { toast } from "sonner";

export function SimulationModal({ isOpen, onClose, lootbox }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const spinnerRef = useRef(null);
  const spinSound = useRef(null);
  const winSound = useRef(null);
  
  useEffect(() => {
    // Importar los archivos de audio usando import.meta.url para asegurar las rutas correctas
    const rollAudioPath = new URL('../../../assets/audio/Roll.mp3', import.meta.url).href;
    const inspectAudioPath = new URL('../../../assets/audio/inspect_weapon_01.mp3', import.meta.url).href;

    // Precargar los audios
    spinSound.current = new Audio(rollAudioPath);
    winSound.current = new Audio(inspectAudioPath);

    // Precargar los audios
    spinSound.current.load();
    winSound.current.load();
    
    return () => {
      if (spinSound.current) {
        spinSound.current.pause();
        spinSound.current = null;
      }
      if (winSound.current) {
        winSound.current.pause();
        winSound.current = null;
      }
    };
  }, []);

  const generateItems = () => {
    let items = [];
    // Aumentamos significativamente el número de items para un giro más largo
    for (let i = 0; i < 200; i++) {
      items = [...items, ...lootbox.items];
    }
    return items;
  };

  const simulateItemDrop = () => {
    const random = Math.random() * 100;
    let accumulator = 0;
    
    for (const item of lootbox.items) {
      accumulator += item.dropRate;
      if (random <= accumulator) {
        return item;
      }
    }
    
    return lootbox.items[lootbox.items.length - 1];
  };

  const handleSimulate = useCallback(() => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    const spinDuration = 15000; // 15 segundos de animación
    const itemWidth = 200;
    const targetItem = simulateItemDrop();
    
    // Resetear la posición del spinner antes de empezar
    if (spinnerRef.current) {
      spinnerRef.current.style.transition = 'none';
      spinnerRef.current.style.transform = 'translateX(0)';
      // Forzar un reflow para que el navegador procese el reset
      spinnerRef.current.offsetHeight;
    }
    
    // Calcular posición final con más precisión
    const totalItems = lootbox.items.length;
    const itemIndex = lootbox.items.findIndex(i => 
      i.itemId._id === targetItem.itemId._id && i.itemType === targetItem.itemType
    );
    
    // Asegurar al menos 15 vueltas completas antes de llegar al item objetivo
    const minRotations = 15;
    const extraRotations = Math.random() * 2; // Añadir entre 0 y 2 vueltas extra
    const totalRotations = minRotations + extraRotations;
    const scrollItems = (Math.floor(totalRotations * totalItems)) + itemIndex;
    const finalPosition = -(scrollItems * itemWidth);
    
    // Configurar el intervalo para reproducir el sonido
    const containerWidth = document.querySelector('.relative.w-full.h-64')?.offsetWidth || 0;
    const centerPosition = containerWidth / 2;
    let lastSoundTime = 0;
    
    const soundInterval = setInterval(() => {
      if (!spinnerRef.current) return;
      
      const currentTransform = spinnerRef.current.style.transform;
      const currentPosition = Math.abs(parseFloat(currentTransform.replace('translateX(', '').replace('px)', '')));
      
      // Calcular la posición relativa al centro para cada item
      const itemPositions = Array.from({ length: generateItems().length }).map((_, index) => 
        currentPosition + (index * itemWidth)
      );
      
      // Encontrar si algún item está exactamente en el centro (con un margen de error)
      const margin = 10; // margen de error de 10px
      const itemInCenter = itemPositions.some(pos => 
        Math.abs(pos - centerPosition) < margin
      );
      
      // Solo reproducir si hay un item en el centro y ha pasado suficiente tiempo desde el último sonido
      const now = Date.now();
      if (itemInCenter && (now - lastSoundTime) > 100) { // mínimo 100ms entre sonidos
        const sound = new Audio(rollSound);
        sound.volume = 0.15; // Reducir volumen a 15%
        sound.play().catch(e => console.error('Error playing sound:', e));
        lastSoundTime = now;
      }
    }, 16); // 60 FPS aproximadamente
    
    if (spinnerRef.current) {
      // Usar una curva de animación personalizada para simular la física de CS:GO
      spinnerRef.current.style.transition = `transform ${spinDuration}ms cubic-bezier(0.21, 0.53, 0.29, 0.99)`;
      spinnerRef.current.style.transform = `translateX(${finalPosition}px)`;
    }
    
    // Limpiar el intervalo de sonido y reproducir sonido de victoria
    setTimeout(() => {
      clearInterval(soundInterval);
      if (winSound.current) {
        winSound.current.volume = 0.15; // Mismo volumen que el roll sound
        winSound.current.play();
      }

      setIsSpinning(false);
      setSelectedItem(targetItem);
      
      // Mostrar toast con animación especial según la rareza
      const rarity = getRarityClass(targetItem.dropRate);
      toast.success(
        <div className="flex items-center gap-3">
          <img 
            src={targetItem.itemId.srcLocal} 
            alt={targetItem.itemId.NombreSkin || targetItem.itemId.name}
            className="w-12 h-12 object-cover rounded"
          />
          <div>
            <div className={`text-lg font-bold ${rarity.textColor}`}>
              ¡{targetItem.itemId.NombreSkin || targetItem.itemId.name}!
            </div>
            <div className="text-sm opacity-80">
              {targetItem.dropRate}% chance
            </div>
          </div>
        </div>,
        {
          duration: 5000,
          className: rarity.bgColor
        }
      );
    }, spinDuration);
  }, [isSpinning, lootbox]);

  const handleCloseSimulation = () => {
    setSelectedItem(null);
    setIsSpinning(false);
    if (spinnerRef.current) {
      spinnerRef.current.style.transition = 'none';
      spinnerRef.current.style.transform = 'translateX(0)';
      // Forzar un reflow
      spinnerRef.current.offsetHeight;
    }
    // Detener sonidos
    if (spinSound.current) {
      spinSound.current.pause();
      spinSound.current.currentTime = 0;
    }
    if (winSound.current) {
      winSound.current.pause();
      winSound.current.currentTime = 0;
    }
  };

  const getRarityClass = (rate) => {
    if (rate <= 1) return {
      border: 'border-yellow-500',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-500',
      glow: 'shadow-yellow-500/50'
    };
    if (rate <= 5) return {
      border: 'border-purple-500',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-500',
      glow: 'shadow-purple-500/50'
    };
    if (rate <= 20) return {
      border: 'border-blue-500',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-500',
      glow: 'shadow-blue-500/50'
    };
    return {
      border: 'border-gray-500',
      bgColor: 'bg-gray-500/20',
      textColor: 'text-gray-500',
      glow: 'shadow-gray-500/50'
    };
  };

  const ItemCard = ({ item }) => {
    const rarity = getRarityClass(item.dropRate);
    const imageSrc = item.itemType === 'Skin' ? item.itemId.srcLocal : item.itemId.srcLocal;
    const name = item.itemType === 'Skin' ? item.itemId.NombreSkin : item.itemId.name;

    return (
      <div className={`flex-shrink-0 w-48 h-48 bg-black rounded-lg overflow-hidden border-2
        ${rarity.border} ${rarity.glow} shadow-lg transition-all duration-300`}>
        <div className="w-full h-full flex flex-col">
          <div className="w-full h-32 overflow-hidden bg-gradient-to-b from-black/50 to-transparent">
            <img 
              src={imageSrc} 
              alt={name}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className={`p-2 flex-1 flex flex-col justify-center items-center ${rarity.bgColor}`}>
            <div className={`text-sm font-bold text-center mb-1 line-clamp-1 ${rarity.textColor}`}>
              {name}
            </div>
            <div className="text-xs text-muted-foreground">{item.dropRate}%</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      handleCloseSimulation();
      onClose();
    }}>
      <DialogContent className="max-w-4xl bg-black/95 backdrop-blur-xl border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {lootbox.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative w-full h-64 overflow-hidden bg-black rounded-xl border border-gray-800">
            {/* Marker con animación */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary z-10 animate-pulse">
              <div className="absolute top-0 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 
                rotate-45 bg-primary" />
              <div className="absolute bottom-0 left-1/2 w-4 h-4 -translate-x-1/2 translate-y-1/2 
                rotate-45 bg-primary" />
            </div>
            
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
            
            <div
              ref={spinnerRef}
              className="absolute flex items-center gap-4 left-0 top-0 -translate-y-1/2"
              style={{
                transform: 'translateX(0)',
                willChange: 'transform'
              }}
            >
              {generateItems().map((item, index) => (
                <ItemCard 
                  key={`${item.itemId._id}-${index}`} 
                  item={item} 
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              onClick={handleSimulate}
              disabled={isSpinning}
              className={`relative overflow-hidden transition-all duration-300 
                ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              <Play className="w-5 h-5 mr-2" />
              {isSpinning ? 'Girando...' : 'Simular Apertura'}
              {isSpinning && (
                <div className="absolute inset-0 bg-primary/20 animate-pulse" />
              )}
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Contenido de la caja:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {lootbox.items.map((item) => {
                const rarity = getRarityClass(item.dropRate);
                return (
                  <div
                    key={`${item.itemId._id}-${item.itemType}`}
                    className={`p-4 rounded-lg bg-black/50 flex items-center gap-3 
                      ${rarity.border} ${rarity.bgColor} hover:scale-102 transition-all duration-300`}
                  >
                    <img 
                      src={item.itemType === 'Skin' ? item.itemId.srcLocal : item.itemId.srcLocal} 
                      alt={item.itemId.NombreSkin || item.itemId.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <div className={`font-medium text-sm ${rarity.textColor}`}>
                        {item.itemId.NombreSkin || item.itemId.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Probabilidad: {item.dropRate}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}