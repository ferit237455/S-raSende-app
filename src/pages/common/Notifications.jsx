import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { updateUnreadCount, refreshNotifications } = useNotifications();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
            // Sync count on page load
            refreshNotifications();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            // Local update
            const updated = notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            );
            setNotifications(updated);
            refreshNotifications(); // Trigger global refresh
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            // Local update
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));

            // Instant global update logic as requested by user
            updateUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleClearRead = async () => {
        if (!confirm('Okunmuş bildirimler kalıcı olarak silinecektir. Emin misiniz?')) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id)
                .eq('is_read', true);

            if (error) throw error;

            // Update UI
            setNotifications(notifications.filter(n => !n.is_read));
            alert('Okunmuş bildirimler temizlendi.');
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Hata: ' + error.message);
        }
    };

    if (loading) return <div className="p-8 text-center bg-gray-50 min-h-screen">Yükleniyor...</div>;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Bell className="text-blue-600" />
                    Bildirimler
                </h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                        {notifications.filter(n => !n.is_read).length} Okunmamış
                    </span>
                    <div className="flex gap-2">
                        {notifications.some(n => !n.is_read) && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                                Hepsini Okundu İşaretle
                            </button>
                        )}
                        {notifications.some(n => n.is_read) && (
                            <button
                                onClick={handleClearRead}
                                className="text-sm text-red-600 hover:text-red-800 font-medium hover:underline ml-2"
                            >
                                Okunmuşları Temizle
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`p-5 rounded-xl border transition-all ${notif.is_read
                                ? 'bg-white border-gray-200 text-gray-500'
                                : 'bg-blue-50 border-blue-100 shadow-sm'
                                }`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className={`text-sm ${notif.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                        {notif.message}
                                    </p>
                                    <span className="text-xs text-gray-400 mt-2 block">
                                        {new Date(notif.created_at).toLocaleString()}
                                    </span>
                                </div>
                                {!notif.is_read && (
                                    <button
                                        onClick={() => markAsRead(notif.id)}
                                        className="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition"
                                        title="Okundu olarak işaretle"
                                    >
                                        <Check size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <Bell size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-500">Henüz bildiriminiz yok.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
