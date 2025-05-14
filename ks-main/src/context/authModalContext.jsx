// context/AuthModalContext.js
import React, { createContext, useContext, useState } from 'react';
import { AuthModal } from '../components/Login/AuthModal';


export const AuthModalContext = createContext();

export const AuthModalProvider = ({ children }) => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const openAuthModal = () => {
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    const value = {
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal
    };

    return (
        <AuthModalContext.Provider value={value}>
            {children}
            {isAuthModalOpen && (
                <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
            )}
        </AuthModalContext.Provider>
    );
};

export const useAuthModal = () => {
    const context = useContext(AuthModalContext);
    if (!context) {
        throw new Error('useAuthModal debe ser usado dentro de un AuthModalProvider');
    }
    return context;
};