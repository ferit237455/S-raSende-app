import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Helper to clear corrupted supabase storage
        const clearSupabaseAuth = () => {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (e) {
                console.error('Local storage cleanup error:', e);
            }
        };

        // Helper to get profile
        const getProfile = async (userId) => {
            try {
                if (!userId) {
                    setProfile(null);
                    return;
                }
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) throw error;
                setProfile(data);
            } catch (err) {
                console.error('Profile fetch error:', err);
                setProfile(null);
            }
        };

        // Check active sessions and sets the user
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    clearSupabaseAuth();
                    throw error;
                }

                setUser(session?.user ?? null);
                if (session?.user) {
                    await getProfile(session.user.id);
                } else {
                    setProfile(null);
                }
            } catch (error) {
                console.error('Session check error:', error);
                setUser(null);
                setProfile(null);
                clearSupabaseAuth(); // Clear on failure to prevent stuck state
            } finally {
                setLoading(false);
            }
        };

        getSession();

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            try {
                if (event === 'SIGNED_OUT') {
                    clearSupabaseAuth();
                    setUser(null);
                    setProfile(null);
                } else if (session?.user) {
                    setUser(session.user);
                    await getProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setLoading(false);
            }
        });

        // Emergency timeout to ensure app doesn't hang
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-500 font-medium">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
