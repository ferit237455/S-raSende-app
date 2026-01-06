import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null); // 'connecting' | null
    const isInitialLoadingRef = useRef(true);
    const profileFetchInProgressRef = useRef(false);

    // Memoized helper to clear corrupted supabase storage - ONLY for critical auth errors
    const clearSupabaseAuth = useCallback(() => {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('supabase.auth.token') || key.startsWith('sb-'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.error('Local storage cleanup error:', e);
        }
    }, []);

    // Memoized profile fetcher with abort controller
    const getProfile = useCallback(async (userId, signal, skipIfInProgress = false) => {
        if (!userId) {
            setProfile(null);
            return;
        }

        // Prevent duplicate profile fetches
        if (skipIfInProgress && profileFetchInProgressRef.current) {
            return;
        }

        profileFetchInProgressRef.current = true;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, user_type, business_name, category, image_url, phone_number')
                .eq('id', userId)
                .single();

            // Check if request was aborted
            if (signal?.aborted) {
                profileFetchInProgressRef.current = false;
                return;
            }

            if (error) {
                console.error('AuthProvider: profile fetch error', error);
                setProfile(null);
                profileFetchInProgressRef.current = false;
                return;
            }

            setProfile(data || null);
        } catch (err) {
            if (signal?.aborted) {
                profileFetchInProgressRef.current = false;
                return;
            }
            console.error('Profile fetch error:', err);
            setProfile(null);
        } finally {
            profileFetchInProgressRef.current = false;
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error) {
                    // Only clear storage on critical auth errors
                    if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('expired')) {
                        clearSupabaseAuth();
                    }
                    throw error;
                }

                const currentUser = session?.user ?? null;
                setUser(currentUser);

                // Aggressively set loading to false once session check is done
                if (isMounted) {
                    setLoading(false);
                    setInitialized(true);
                    setConnectionStatus(null);
                }

                // Fetch profile if user exists
                if (currentUser) {
                    await getProfile(currentUser.id, abortController.signal, false);
                } else {
                    setProfile(null);
                }
            } catch (error) {
                if (!isMounted) return;
                console.error('Session check error:', error);
                setUser(null);
                setProfile(null);
                // Only clear on critical errors
                if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('expired')) {
                    clearSupabaseAuth();
                }
                // Still set loading to false even on error
                setLoading(false);
                setInitialized(true);
                setConnectionStatus(null);
            }
        };

        // Start session check
        getSession();

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            // Skip profile fetch on INITIAL_SESSION to prevent duplicate requests
            // getSession already handles the initial profile fetch
            if (event === 'INITIAL_SESSION') {
                isInitialLoadingRef.current = false;
                return;
            }

            // Mark that initial loading is done
            if (isInitialLoadingRef.current) {
                isInitialLoadingRef.current = false;
            }

            try {
                if (event === 'SIGNED_OUT') {
                    // Only clear storage on explicit sign out
                    clearSupabaseAuth();
                    setUser(null);
                    setProfile(null);
                } else if (session?.user) {
                    setUser(session.user);
                    // Only fetch profile if it's a real state change (not initial)
                    await getProfile(session.user.id, abortController.signal, true);
                } else {
                    setUser(null);
                    setProfile(null);
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                // Don't clear storage on minor errors
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        });

        // Smart emergency timeout with user feedback
        let finalTimeout = null;
        const timeout = setTimeout(() => {
            if (isMounted && loading && !initialized) {
                console.warn('AuthProvider: Connection taking longer than expected');
                setConnectionStatus('connecting');
                // Give it a bit more time before forcing initialization
                finalTimeout = setTimeout(() => {
                    if (isMounted && loading) {
                        console.warn('AuthProvider: Emergency timeout reached, forcing initialization');
                        setLoading(false);
                        setInitialized(true);
                        setConnectionStatus(null);
                    }
                }, 1500); // Additional 1.5s for slow connections
            }
        }, 1500); // Reduced from 2500ms to 1500ms

        return () => {
            isMounted = false;
            abortController.abort();
            subscription.unsubscribe();
            clearTimeout(timeout);
            if (finalTimeout) clearTimeout(finalTimeout);
        };
    }, [clearSupabaseAuth, getProfile]);

    // Memoized context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        user,
        profile,
        loading,
        initialized
    }), [user, profile, loading, initialized]);

    // Show loading only on initial load, not on subsequent updates
    if (loading && !initialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <div className="text-gray-500 font-medium">
                        {connectionStatus === 'connecting' ? 'Bağlantı bekleniyor...' : 'Yükleniyor...'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
