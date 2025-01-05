import React from 'react';
import { Modal } from './admin/adminPrecios/Modal';

export const CurrencySelectionModal = ({ 
    isOpen, 
    onClose, 
    currencies, 
    onSelect,
    isLoading 
}) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Selecciona tu Moneda"
        type={'currency'}
    >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto">
            <p className="text-gray-400 mb-4 text-center">
                Por favor, selecciona la moneda en la que deseas ver los precios.
            </p>
            
            {isLoading ? (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-GOLD_1"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {currencies.map(currency => (
                        <button
                            key={currency._id}
                            onClick={() => onSelect(currency._id)}
                            className="group relative p-6 border border-GOLD_3 rounded-lg hover:bg-GOLD_3 hover:bg-opacity-20 
                                     transition-all duration-300 overflow-hidden text-white"
                        >
                            {/* Background con efecto de hover */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50 
                                          group-hover:opacity-70 transition-opacity" />
                            
                            {/* Contenedor de la imagen */}
                            <div className="relative w-16 h-16 mx-auto mb-4 overflow-hidden rounded-full 
                                          border-2 border-GOLD_3 group-hover:border-GOLD_1 transition-colors">
                                {currency.imageUrl ? (
                                    <img 
                                        src={currency.imageUrl} 
                                        alt={currency.code}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-GOLD_3 bg-opacity-20">
                                        <span className="text-2xl font-bold">{currency.symbol}</span>
                                    </div>
                                )}
                            </div>

                            {/* Información de la divisa */}
                            <div className="relative text-center">
                                <span className="block text-xl font-beaufort mb-1 text-GOLD_1 
                                               group-hover:text-GOLD_2 transition-colors">
                                    {currency.code}
                                </span>
                                <span className="block text-sm text-gray-400 group-hover:text-gray-300 
                                               transition-colors">
                                    {currency.name}
                                </span>
                                <span className="block text-lg font-semibold mt-2 text-GOLD_3">
                                    {currency.symbol}
                                </span>
                            </div>

                            {/* Efecto de hover adicional */}
                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-GOLD_1 
                                          rounded-lg transition-colors pointer-events-none" />
                        </button>
                    ))}
                </div>
            )}
            
            {/* Nota informativa */}
            <p className="text-gray-500 text-sm text-center mt-6">
                Puedes cambiar tu moneda más tarde en la configuración
            </p>
        </div>
    </Modal>
);
