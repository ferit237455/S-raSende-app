import React, { useCallback, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Scissors, Clock, User, LogOut, Compass, History, Store, AlertTriangle, X, Menu } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Logout Confirmation Modal
const LogoutModal = ({ isOpen, onClose, onConfirm, isLoggingOut }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-2">Çıkış Yapmak İstiyor musunuz?</h3>
                    <p className="text-gray-500 text-sm font-medium mb-8">
                        Oturumunuz sonlandırılacak ve giriş sayfasına yönlendirileceksiniz.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoggingOut}
                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Vazgeç
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoggingOut}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoggingOut ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Çıkılıyor...
                                </>
                            ) : (
                                <>
                                    <LogOut size={18} />
                                    Çıkış Yap
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Memoized logout handler with try-catch for safety
    const handleLogout = useCallback(async () => {
        setIsLoggingOut(true);
        try {
            // Clear local storage first for immediate UI response
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('supabase') || key.startsWith('sb-'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Sign out from Supabase
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
            setShowLogoutModal(false);
            // Always navigate to login, even if signOut fails
            navigate('/login');
        }
    }, [navigate]);

    const openLogoutModal = useCallback(() => {
        setShowLogoutModal(true);
    }, []);

    const closeLogoutModal = useCallback(() => {
        if (!isLoggingOut) {
            setShowLogoutModal(false);
        }
    }, [isLoggingOut]);

    // Memoized nav items to prevent recreation on every render
    const tradesmanItems = useMemo(() => [
        { name: 'Genel Bakış', path: '/dashboard', icon: <LayoutDashboard size={20} />, end: true },
        { name: 'Takvim', path: '/dashboard/calendar', icon: <Calendar size={20} /> },
        { name: 'Hizmetler', path: '/dashboard/services', icon: <Scissors size={20} /> },
        { name: 'Bekleme Listesi', path: '/dashboard/waiting-list', icon: <Clock size={20} /> },
        { name: 'Dükkanım', path: '/dashboard/my-shop', icon: <Store size={20} /> },
        { name: 'Profil', path: '/profile', icon: <User size={20} /> },
    ], []);

    const customerItems = useMemo(() => [
        { name: 'Dükkan Keşfet', path: '/explore', icon: <Compass size={20} /> },
        { name: 'Randevularım', path: '/my-appointments', icon: <History size={20} /> },
        { name: 'Profil', path: '/profile', icon: <User size={20} /> },
    ], []);

    // Memoized nav items selection
    const navItems = useMemo(() => {
        return profile?.user_type === 'tradesman' ? tradesmanItems : customerItems;
    }, [profile?.user_type, tradesmanItems, customerItems]);

    const handleNavClick = useCallback(() => {
        // Close mobile menu when nav item is clicked
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-slate-50/50 h-full flex flex-col shadow-sm
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-4 lg:p-6 flex items-center justify-between">
                    <h2 className="text-xl lg:text-2xl font-bold text-blue-600 flex items-center gap-2">
                        <Scissors className="text-blue-600" /> SıraSende
                    </h2>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="text-sm lg:text-base">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Logout Button - mt-auto pushes it to bottom */}
                <div className="p-4 mt-auto">
                    <button
                        onClick={openLogoutModal}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 font-semibold group"
                    >
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm lg:text-base">Çıkış Yap</span>
                    </button>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={closeLogoutModal}
                onConfirm={handleLogout}
                isLoggingOut={isLoggingOut}
            />
        </>
    );
};

export default React.memo(Sidebar);
