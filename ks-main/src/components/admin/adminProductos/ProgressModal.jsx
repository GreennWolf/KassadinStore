import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getJobInfo, cancelJob } from '../../../services/progressService';

/**
 * Modal que muestra el progreso de una tarea mediante polling HTTP
 */
const ProgressModal = ({ isOpen, onClose, jobId, onComplete }) => {
  // Estado para la información de progreso
  const [progressInfo, setProgressInfo] = useState({
    percentage: 0,
    currentStep: 0,
    totalSteps: 100,
    currentStepDescription: 'Iniciando...',
    status: 'pending',
    estimatedEndTime: null
  });
  
  // Estado para saber si el usuario está cancelando la tarea
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Estado para mostrar el resultado final después de completado
  const [completionResult, setCompletionResult] = useState(null);
  
  // Flag para controlar que onComplete solo se llame una vez
  const hasCalledOnComplete = useRef(false);
  
  // Intervalo para polling
  const intervalRef = useRef(null);
  
  // Calcular tiempo restante estimado
  const getRemainingTime = () => {
    if (!progressInfo.estimatedEndTime) return 'Calculando...';
    
    const now = new Date();
    const endTime = new Date(progressInfo.estimatedEndTime);
    const diffMs = endTime - now;
    
    if (diffMs <= 0) return 'Finalizando...';
    
    const diffMins = Math.round(diffMs / 60000);
    const diffSecs = Math.round((diffMs % 60000) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins} min ${diffSecs} seg`;
    } else {
      return `${diffSecs} segundos`;
    }
  };
  
  // Monitorear progreso usando polling HTTP
  useEffect(() => {
    if (!jobId || !isOpen) return;
    
    // Función para obtener el estado del trabajo
    const fetchJobInfo = async () => {
      try {
        const jobInfo = await getJobInfo(jobId);
        
        // Actualizar el estado solo si hay un cambio
        setProgressInfo(prevInfo => {
          if (JSON.stringify(prevInfo) === JSON.stringify(jobInfo)) {
            return prevInfo;
          }
          return jobInfo;
        });
        
        // Si el trabajo está completo, mostrar el resultado y detener el polling
        if (jobInfo.status === 'completed') {
          setCompletionResult(jobInfo.result);
          
          // Asegurarnos de que onComplete solo se llame una vez
          if (!hasCalledOnComplete.current && onComplete) {
            hasCalledOnComplete.current = true;
            onComplete(jobInfo.result);
          }
          
          // Limpiar intervalo
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        
        // Si el trabajo ha fallado, mostrar el error y detener el polling
        if (jobInfo.status === 'failed' || jobInfo.status === 'cancelled') {
          if (jobInfo.error) {
            setCompletionResult({ error: jobInfo.error });
          }
          
          // Limpiar intervalo
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Error al obtener información del trabajo:', error);
      }
    };
    
    // Obtener estado inicial
    fetchJobInfo();
    
    // Configurar intervalo para polling
    intervalRef.current = setInterval(fetchJobInfo, 2000);
    
    // Limpiar intervalo al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId, isOpen, onComplete]);
  
  // Manejar cancelación de trabajo
  const handleCancel = async () => {
    if (!jobId) return;
    
    setIsCancelling(true);
    
    try {
      await cancelJob(jobId);
      setProgressInfo(prev => ({ ...prev, status: 'cancelled' }));
      
      // Limpiar intervalo al cancelar
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error('Error al cancelar tarea:', error);
    } finally {
      setIsCancelling(false);
    }
  };
  
  // Determinar si el modal puede cerrarse
  const canClose = ['completed', 'failed', 'cancelled'].includes(progressInfo.status);
  
  // Formatear la fecha estimada de finalización
  const formatEstimatedEndTime = () => {
    if (!progressInfo.estimatedEndTime) return 'Calculando...';
    
    const endTime = new Date(progressInfo.estimatedEndTime);
    return endTime.toLocaleTimeString();
  };
  
  // Traducir estado
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'running': 'En progreso',
      'completed': 'Completado',
      'failed': 'Fallido',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || 'Pendiente';
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Solo permitir cerrar si ha completado, fallado o cancelado
      if (!open && canClose) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {progressInfo.status === 'completed' ? '¡Proceso Completado!' : 
             progressInfo.status === 'failed' ? 'Proceso Fallido' : 
             progressInfo.status === 'cancelled' ? 'Proceso Cancelado' : 
             'Procesando Actualización'}
          </DialogTitle>
          <DialogDescription>
            {progressInfo.currentStepDescription || 'Procesando...'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-2 flex justify-between text-sm text-gray-500">
            <span>{`${progressInfo.currentStep || 0} de ${progressInfo.totalSteps || 100} pasos`}</span>
            <span>{`${progressInfo.percentage || 0}%`}</span>
          </div>
          
          <Progress value={progressInfo.percentage || 0} className="h-2" />
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado:</span>
              <span className={`font-medium ${
                progressInfo.status === 'completed' ? 'text-green-600' : 
                progressInfo.status === 'failed' ? 'text-red-600' : 
                progressInfo.status === 'cancelled' ? 'text-orange-600' : 
                'text-blue-600'
              }`}>
                {getStatusText(progressInfo.status)}
              </span>
            </div>
            
            {['pending', 'running'].includes(progressInfo.status) && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiempo restante estimado:</span>
                  <span className="font-medium">{getRemainingTime()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Finalización estimada:</span>
                  <span className="font-medium">{formatEstimatedEndTime()}</span>
                </div>
              </>
            )}
          </div>
          
          {/* Mostrar resultado cuando se completa */}
          {completionResult && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-black">
              <h4 className="font-medium mb-2">Resultado:</h4>
              {completionResult.error ? (
                <div className="text-red-600">
                  Error: {completionResult.error.message}
                </div>
              ) : (
                <ul className="space-y-1">
                  {completionResult.message && (
                    <li><span className="font-medium">Mensaje:</span> {completionResult.message}</li>
                  )}
                  {completionResult.championsProcessed && (
                    <li><span className="font-medium">Campeones procesados:</span> {completionResult.championsProcessed}</li>
                  )}
                  {completionResult.skinsProcessed && (
                    <li><span className="font-medium">Skins procesadas:</span> {completionResult.skinsProcessed}</li>
                  )}
                  {completionResult.newSkinsDetected && (
                    <li><span className="font-medium">Skins nuevas detectadas:</span> {completionResult.newSkinsDetected}</li>
                  )}
                  {completionResult.newSkinsMarked && (
                    <li><span className="font-medium">Skins marcadas como nuevas:</span> {completionResult.newSkinsMarked}</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          {/* Botón de cancelar durante el proceso */}
          {['pending', 'running'].includes(progressInfo.status) && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-24"
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar'}
            </Button>
          )}
          
          {/* Botón para cerrar después de completado/fallido/cancelado */}
          {canClose && (
            <Button onClick={onClose} className="w-24">
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressModal;