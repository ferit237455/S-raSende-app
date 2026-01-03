import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Header = () => {
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const { profile } = useAuth();

    return (
        <header className="bg-white border-b h-16 flex items-center justify-between px-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
                {profile?.user_type === 'tradesman' ? 'Esnaf Paneli' : 'Müşteri Paneli'}
            </h2>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/notifications')}
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
                >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </button>

                <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">
                        {profile?.full_name || 'Kullanıcı'}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
