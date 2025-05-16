// context/currencyContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
    const [selectedCurrency, setSelectedCurrency] = useState(null);

    useEffect(() => {
        // Cargar la moneda seleccionada del localStorage al iniciar
        const storedCurrency = localStorage.getItem('selectedCurrency');
        if (storedCurrency) {
            setSelectedCurrency(JSON.parse(storedCurrency));
        }
    }, []);

    const updateSelectedCurrency = (currency) => {
        setSelectedCurrency(currency);
        localStorage.setItem('selectedCurrency', JSON.stringify(currency));
        // // console.log(currency)
    };

    const clearSelectedCurrency = () => {
        setSelectedCurrency(null);
        localStorage.removeItem('selectedCurrency');
    };

    return (
        <CurrencyContext.Provider 
            value={{ 
                selectedCurrency, 
                updateSelectedCurrency,
                clearSelectedCurrency 
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
}

// Hook personalizado para usar el contexto
export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency debe ser usado dentro de un CurrencyProvider');
    }
    return context;
};