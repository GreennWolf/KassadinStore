// src/context/notificationsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUnreadCount } from '../services/purcharseService';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchUnreadCount = async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error al obtener conteo de notificaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const updateNotifications = () => {
        fetchUnreadCount();
    };

    return (
        <NotificationsContext.Provider value={{ unreadCount, loading, updateNotifications }}>
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotifications debe ser usado dentro de un NotificationsProvider');
    }
    return context;
};