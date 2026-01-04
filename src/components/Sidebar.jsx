import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Scissors, Clock, User, LogOut, Compass, History, Bell } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const tradesmanItems = [
        { name: 'Genel Bakış', path: '/dashboard', icon: <LayoutDashboard size={20} />, end: true },
        { name: 'Takvim', path: '/dashboard/calendar', icon: <Calendar size={20} /> },
        { name: 'Müşteriler', path: '/dashboard/customers', icon: <Users size={20} /> },
        { name: 'Hizmetler', path: '/dashboard/services', icon: <Scissors size={20} /> },
        { name: 'Bekleme Listesi', path: '/dashboard/waiting-list', icon: <Clock size={20} /> },
        { name: 'Profil', path: '/profile', icon: <User size={20} /> },
    ];

    const customerItems = [
        { name: 'Dükkan Keşfet', path: '/explore', icon: <Compass size={20} /> },
        { name: 'Randevularım', path: '/my-appointments', icon: <History size={20} /> },
        { name: 'Profil', path: '/profile', icon: <User size={20} /> },
    ];

    // Default to customer items if no profile yet, or empty? 
    // Better to show nothing or default items while loading? 
    // AuthContext handles loading, but sidebar is inside Main Layout which might render.
    // We'll fallback to customer items or empty.
    const navItems = profile?.user_type === 'tradesman' ? tradesmanItems : customerItems;

    return (
        <div className="w-64 bg-white border-r h-full flex flex-col">
            <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                    <Scissors className="text-blue-600" /> SıraSende
                </h2>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems?.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        {item.icon}
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    Çıkış Yap
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
