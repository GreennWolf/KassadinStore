import React from 'react';

const LoadingModal = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-HEXTECH_BLACK border-2 border-GOLD_2 rounded-lg p-6 max-w-md mx-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-GOLD_2 border-t-transparent rounded-full animate-[spin_1s_linear_infinite]" />
          <p className="text-GOLD_2 text-lg font-medium text-center">
            Obteniendo actualizaciones del parche...
          </p>
          <p className="text-GOLD_3 text-sm text-center">
            Este proceso puede tardar unos minutos
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;