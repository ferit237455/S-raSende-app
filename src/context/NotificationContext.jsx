import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { profile } = useAuth();
    const subscriptionRef = useRef(null);
    const isMountedRef = useRef(true);

    // Memoized fetch function
    const fetchUnreadCount = useCallback(async () => {
        if (!profile?.id || !isMountedRef.current) return;

        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('is_read', false);

            if (!isMountedRef.current) return;

            if (error) throw error;
            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, [profile?.id]);

    useEffect(() => {
        isMountedRef.current = true;

        if (!profile?.id) {
            setUnreadCount(0);
            return;
        }

        // Fetch initial count
        fetchUnreadCount();

        // Setup realtime subscription
        const channelName = `notification_context_${profile.id}`;

        // Remove any existing subscription first
        if (subscriptionRef.current) {
            supabase.removeChannel(subscriptionRef.current);
        }

        subscriptionRef.current = supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${profile.id}`
            }, () => {
                if (isMountedRef.current) {
                    fetchUnreadCount();
                }
            })
            .subscribe();

        return () => {
            isMountedRef.current = false;
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [profile?.id, fetchUnreadCount]);

    // Memoized update function
    const updateUnreadCount = useCallback((newCount) => {
        setUnreadCount(newCount);
    }, []);

    // Memoized refresh function
    const refreshNotifications = useCallback(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    // Memoized context value
    const contextValue = useMemo(() => ({
        unreadCount,
        updateUnreadCount,
        refreshNotifications
    }), [unreadCount, updateUnreadCount, refreshNotifications]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
