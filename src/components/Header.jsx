import React, { useMemo, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Header = () => {
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const { profile } = useAuth();

    // Memoized navigation handler
    const handleNotificationClick = useCallback(() => {
        navigate('/notifications');
    }, [navigate]);

    // Memoized profile click handler
    const handleProfileClick = useCallback(() => {
        navigate('/profile');
    }, [navigate]);

    // Memoized panel title
    const panelTitle = useMemo(() => {
        return profile?.user_type === 'tradesman' ? 'Esnaf Paneli' : 'Müşteri Paneli';
    }, [profile?.user_type]);

    // Memoized user initial
    const userInitial = useMemo(() => {
        return profile?.full_name?.charAt(0)?.toUpperCase() || 'U';
    }, [profile?.full_name]);

    // Memoized user name
    const userName = useMemo(() => {
        return profile?.full_name || 'Kullanıcı';
    }, [profile?.full_name]);

    return (
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md h-14 lg:h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">
                {panelTitle}
            </h2>

            <div className="flex items-center gap-3">
                {/* Notification Button */}
                <button
                    onClick={handleNotificationClick}
                    className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-200"
                >
                    <Bell size={20} strokeWidth={1.5} />
                    {(unreadCount || 0) > 0 && (
                        <span className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Separator */}
                <div className="w-px h-6 bg-slate-200" />

                {/* Profile Section */}
                <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 hover:shadow-sm hover:scale-105 transition-all duration-200 group"
                >
                    <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
                        {userInitial}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 hidden md:block">
                        {userName}
                    </span>
                </button>
            </div>
        </header>
    );
};

export default React.memo(Header);
