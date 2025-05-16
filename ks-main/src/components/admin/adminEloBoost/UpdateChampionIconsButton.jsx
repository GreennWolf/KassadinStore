import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { startChampionIconsUpdate } from "../../../services/progressService";
import ProgressModal from '../adminProductos/ProgressModal';
import { toast } from "react-toastify";

const UpdateChampionIconsButton = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobId, setJobId] = useState(null);
  const hasShowSuccessToast = useRef(false);
  
  const handleUpdateChampionIcons = async () => {
    setIsUpdating(true);
    
    try {
      // Obtener user ID para la autenticación
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const userId = user?._id;
      
      if (!userId) {
        toast.error('Necesita iniciar sesión como administrador');
        setIsUpdating(false);
        return;
      }
      
      // Iniciar la actualización de iconos de campeones
      const response = await startChampionIconsUpdate();
      
      if (response.success && response.jobId) {
        setJobId(response.jobId);
        setIsModalOpen(true);
        // Resetear el flag de toast
        hasShowSuccessToast.current = false;
      } else {
        toast.error("No se pudo iniciar la actualización de iconos");
        setIsUpdating(false);
      }
    } catch (error) {
      console.error('Error al actualizar iconos de campeones:', error);
      toast.error("Hubo un problema al intentar actualizar los iconos");
      setIsUpdating(false);
    }
  };
  
  // Manejar cuando se completa el procesamiento
  const handleProcessingComplete = async (result) => {
    // Mostrar toast solo una vez
    if (!hasShowSuccessToast.current) {
      toast.success(`Iconos de campeones actualizados: ${result.championsUpdated || 'N/A'}`);
      hasShowSuccessToast.current = true;
    }
    setIsUpdating(false);
  };
  
  // Manejar el cierre del modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setJobId(null);
    setIsUpdating(false);
  };

  return (
    <div className="relative">
      <Button 
        onClick={handleUpdateChampionIcons} 
        variant="outline"
        disabled={isUpdating}
        className="relative"
      >
        {isUpdating && !isModalOpen ? (
          <>
            <span className="opacity-0">Actualizar Iconos de Campeones</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </>
        ) : (
          'Actualizar Iconos de Campeones'
        )}
      </Button>
      
      {/* Modal de progreso */}
      {jobId && (
        <ProgressModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          jobId={jobId}
          onComplete={handleProcessingComplete}
        />
      )}
    </div>
  );
};

export default UpdateChampionIconsButton;