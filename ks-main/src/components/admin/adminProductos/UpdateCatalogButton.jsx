import React, { useState } from 'react';
import { obtenerActualizaciones } from "../../../services/champsService";
import { Button } from "@/components/ui/button";

const UpdateCatalogButton = ({fetchData , isUpdating, setIsUpdating}) => {
  

  const handleUpdateCatalog = async () => {
    setIsUpdating(true);
    try {
      await obtenerActualizaciones();
      await fetchData(true)
      toast.success('Catálogo actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar el catálogo');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <Button 
        onClick={()=>{
            handleUpdateCatalog()
            console.log("isUpdating", isUpdating)
        }} 
        variant="outline"
        disabled={isUpdating}
        className="relative"
      >
        {isUpdating ? (
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
    </div>
  );
};

export default UpdateCatalogButton;