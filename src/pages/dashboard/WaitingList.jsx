import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Calendar, Clock, User, Phone, Mail, Trash2 } from 'lucide-react';

const WaitingList = () => {
    const [waitingItems, setWaitingItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWaitingList();
        // Acil durum zaman aşımı
        const timeout = setTimeout(() => setLoading(false), 5000);
        return () => clearTimeout(timeout);
    }, []);

    const fetchWaitingList = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('waiting_list')
                .select(`
                    *,
                    customer:profiles!user_id(full_name, phone_number, email),
                    service:services(name, duration)
                `)
                .eq('tradesman_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWaitingItems(data || []);
        } catch (error) {
            console.error('Error fetching waiting list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kişiyi bekleme listesinden çıkarmak istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase.from('waiting_list').delete().eq('id', id);
            if (error) throw error;
            setWaitingItems(waitingItems?.filter(item => item?.id !== id) || []);
        } catch (error) {
            alert('Silinemedi: ' + error?.message);
        }
    };



    // Group items by service name
    const groupedItems = waitingItems?.reduce((acc, item) => {
        const serviceName = item?.service?.name || 'Diğer Hizmetler';
        if (!acc[serviceName]) acc[serviceName] = [];
        acc[serviceName].push(item);
        return acc;
    }, {}) || {};


    const handleCleanup = async () => {
        if (!confirm('Bildirim gönderilmiş veya tarihi geçmiş tüm kayıtlar silinecek. Emin misiniz?')) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date().toISOString().split('T')[0];

            // 1. Delete notified items
            const { error: err1 } = await supabase
                .from('waiting_list')
                .delete()
                .eq('tradesman_id', user.id)
                .eq('status', 'notified');

            if (err1) throw err1;

            // 2. Delete past items (preferred_date < today)
            const { error: err2 } = await supabase
                .from('waiting_list')
                .delete()
                .eq('tradesman_id', user.id)
                .lt('preferred_date', today);

            if (err2) throw err2;

            fetchWaitingList();
            alert('Liste temizlendi.');
        } catch (error) {
            console.error('Temizleme hatası:', error);
            alert('Hata: ' + error.message);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-2 text-gray-500">Yükleniyor...</p>
        </div>
    );

    if (!waitingItems) return (
        <div className="p-8 text-center text-gray-500">Bekleme listesi yüklenemedi.</div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bekleme Listesi</h1>
                    <p className="text-gray-500 mt-1">Dolu saatleriniz için sıra bekleyen müşteriler</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCleanup}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2"
                        title="Eski ve bildirim gönderilmiş kayıtları temizle"
                    >
                        <Trash2 size={18} />
                        <span>Eski Sıraları Temizle</span>
                    </button>
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
                        Toplam: {waitingItems.length} Kişi
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {Object.keys(groupedItems || {}).length > 0 ? (
                    Object.entries(groupedItems || {}).map(([serviceName, items]) => (
                        <div key={serviceName} className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-blue-600 rounded-full inline-block"></span>
                                    {serviceName}
                                </h3>
                                <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border">
                                    {items.length} Kişi
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white text-gray-600 text-sm border-b">
                                            <th className="p-4 font-semibold w-1/4">Müşteri</th>
                                            <th className="p-4 font-semibold">İletişim</th>
                                            <th className="p-4 font-semibold">Tarih</th>
                                            <th className="p-4 font-semibold">Durum</th>
                                            <th className="p-4 font-semibold text-right">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items && Array.isArray(items) && items?.map((item) => (
                                            <tr key={item?.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                                            {item?.customer?.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{item?.customer?.full_name || 'İsimsiz'}</div>
                                                            <div className="text-xs text-gray-400">{item?.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        {item?.customer?.phone_number && (
                                                            <a href={`tel:${item.customer.phone_number}`} className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                                                                <Phone size={14} /> {item.customer.phone_number}
                                                            </a>
                                                        )}
                                                        {item?.customer?.email && (
                                                            <a href={`mailto:${item.customer.email}`} className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                                                                <Mail size={14} /> {item.customer.email}
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-gray-700 font-medium bg-gray-50 px-3 py-1 rounded-lg w-fit">
                                                        <Calendar size={16} className="text-gray-400" />
                                                        {item?.preferred_date ? new Date(item.preferred_date).toLocaleDateString('tr-TR') : ''}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item?.status === 'notified'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-orange-100 text-orange-800'
                                                        }`}>
                                                        {item?.status === 'notified' ? 'Bildirildi' : 'Bekliyor'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">

                                                        <button
                                                            onClick={() => handleDelete(item?.id)}
                                                            className="text-gray-400 hover:text-red-600 p-2 rounded-lg transition hover:bg-red-50"
                                                            title="Listeden Çıkar"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-16 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Bekleme Listeniz Boş</h3>
                        <p className="text-gray-500 mt-1">Dolu saatleriniz için sıra bekleyen müşteri henüz bulunmuyor.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default WaitingList;
