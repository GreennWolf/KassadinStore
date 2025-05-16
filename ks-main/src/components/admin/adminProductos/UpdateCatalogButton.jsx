import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { startScraping } from "../../../services/progressService";
import ProgressModal from './ProgressModal';
import { toast } from "react-toastify";

const UpdateCatalogButton = ({ fetchData, isUpdating, setIsUpdating }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobId, setJobId] = useState(null);
  const hasShowSuccessToast = useRef(false);

  const handleUpdateCatalog = async () => {
    setIsUpdating(true);
    try {
      // Iniciar el scraping y obtener el ID del trabajo
      const response = await startScraping();
      
      if (response.success && response.jobId) {
        setJobId(response.jobId);
        setIsModalOpen(true);
        // Resetear el flag de toast
        hasShowSuccessToast.current = false;
      } else {
        toast.error("No se pudo iniciar la actualización del catálogo");
        setIsUpdating(false);
      }
    } catch (error) {
      console.error("Error al actualizar catálogo:", error);
      toast.error("Hubo un problema al intentar actualizar el catálogo");
      setIsUpdating(false);
    }
  };
  
  // Manejar cuando se completa el procesamiento
  const handleProcessingComplete = async (result) => {
    try {
      // Recargar los datos de la aplicación
      await fetchData(true);
      
      // Mostrar toast solo una vez
      if (!hasShowSuccessToast.current) {
        toast.success("Catálogo actualizado exitosamente");
        hasShowSuccessToast.current = true;
      }
    } catch (error) {
      console.error("Error al recargar datos:", error);
    } finally {
      setIsUpdating(false);
    }
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
        onClick={handleUpdateCatalog} 
        variant="outline"
        disabled={isUpdating}
        className="relative"
      >
        {isUpdating && !isModalOpen ? (
          <>
            <span className="opacity-0">Actualizar Catálogo</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </>
        ) : (
          'Actualizar Catálogo'
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

export default UpdateCatalogButton;