// components/PaymentMethods/CurrencySelector.js
import React from 'react';

export const CurrencySelector = ({ 
    currencies, 
    selectedCurrencies, 
    onCurrencyChange, 
    isRestricted, 
    onRestrictionChange 
}) => {

    return (
        <div className="border p-4 rounded mt-4 bg-gray-800">
            <h3 className="text-lg font-semibold text-GOLD_2 mb-4">Divisas Disponibles</h3>
            <div className="mb-4">
                <label className="flex items-center text-white">
                    <input
                        type="checkbox"
                        checked={isRestricted}
                        
                        onChange={(e) => onRestrictionChange(e.target.checked)}
                        className="mr-2"
                    />
                    Restringir divisas disponibles
                </label>
            </div>
            {isRestricted && (
                <div className="grid grid-cols-2 gap-4">
                    {currencies.map(currency => (
                        <label key={currency._id} className="flex items-center text-white">
                            <input
                                type="checkbox"
                                checked={Array.isArray(selectedCurrencies) && selectedCurrencies.includes(currency._id)}
                                onChange={(e) => onCurrencyChange(currency._id, e.target.checked)}
                                className="mr-2"
                            />
                            {currency.code} - {currency.name}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};