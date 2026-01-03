import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { profile } = useAuth();

    useEffect(() => {
        if (!profile?.id) return;

        fetchUnreadCount();

        // Realtime subscription
        const subscription = supabase
            .channel('notification_context')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${profile.id}`
            }, () => {
                fetchUnreadCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [profile?.id]);

    const fetchUnreadCount = async () => {
        if (!profile?.id) return;
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('is_read', false);

            if (error) throw error;
            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const updateUnreadCount = (newCount) => {
        setUnreadCount(newCount);
    };

    const refreshNotifications = () => {
        fetchUnreadCount();
    };

    return (
        <NotificationContext.Provider value={{ unreadCount, updateUnreadCount, refreshNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    return useContext(NotificationContext);
};
