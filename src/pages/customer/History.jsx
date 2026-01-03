import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Calendar, Clock, MapPin, Store, Trash2 } from 'lucide-react';

const History = () => {
    const [appointments, setAppointments] = useState([]);
    const [waitingList, setWaitingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'waiting'

    useEffect(() => {
        fetchData();
        // Acil durum zaman aşımı
        const timeout = setTimeout(() => setLoading(false), 5000);
        return () => clearTimeout(timeout);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Appointments
            const { data: aptData, error: aptError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    service:services(name),
                    tradesman:profiles!tradesman_id(business_name, full_name, phone_number)
                `)
                .eq('customer_id', user.id)
                .order('start_time', { ascending: false });

            if (aptError) throw aptError;
            setAppointments(aptData || []);

            // Fetch Waiting List
            const { data: waitData, error: waitError } = await supabase
                .from('waiting_list')
                .select(`
                    *,
                    service:services(name, duration),
                    tradesman:profiles!tradesman_id(business_name, full_name)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (waitError) throw waitError;
            setWaitingList(waitData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (id) => {
        if (!window.confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setAppointments(appointments.map(apt =>
                apt.id === id ? { ...apt, status: 'cancelled' } : apt
            ));
            alert('Randevunuz iptal edildi.');
        } catch (error) {
            console.error('İptal hatası:', error);
            alert('İptal edilemedi: ' + error.message);
        }
    };

    const handleDeleteWaitlist = async (id) => {
        if (!window.confirm('Bekleme listesinden çıkmak istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase.from('waiting_list').delete().eq('id', id);
            if (error) throw error;
            setWaitingList(waitingList.filter(item => item.id !== id));
        } catch (error) {
            alert('Silinemedi: ' + error.message);
        }
    };

    const handleClearCancelled = async () => {
        if (!window.confirm('İptal edilen tüm randevularınız silinecektir. Bu işlem geri alınamaz. Emin misiniz?')) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('customer_id', user.id)
                .eq('status', 'cancelled');

            if (error) throw error;

            setAppointments(appointments.filter(a => a.status !== 'cancelled'));
            alert('İptal edilen randevular temizlendi.');
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Silinemedi (Yetki sorunu olabilir, lütfen SQL güncellemesini yapın). Hata: ' + error.message);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center gap-6 border-b mb-8">
                <button
                    onClick={() => setActiveTab('appointments')}
                    className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'appointments' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Randevularım
                    {activeTab === 'appointments' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('waiting')}
                    className={`pb-4 px-2 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'waiting' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Bekleme Listesi
                    <span className="bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full">{waitingList.length}</span>
                    {activeTab === 'waiting' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
            </div>

            {activeTab === 'appointments' && (
                <div className="space-y-4">
                    {appointments.some(a => a.status === 'cancelled') && (
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={handleClearCancelled}
                                className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-red-100 flex items-center gap-2"
                            >
                                <Trash2 size={16} /> İptal Edilenleri Temizle
                            </button>
                        </div>
                    )}
                    {appointments.length > 0 ? (
                        appointments.map((apt) => (
                            <div key={apt.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-lg ${apt.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                                            apt.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">
                                                {apt.tradesman?.business_name || apt.tradesman?.full_name || 'Bilinmeyen İşletme'}
                                            </h3>
                                            <div className="flex items-center gap-2 text-gray-600 mt-1">
                                                <span className="font-medium text-gray-900">{apt.service?.name}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>{new Date(apt.start_time).toLocaleDateString('tr-TR')}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>{new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${apt.status === 'confirmed' ? 'bg-green-50 text-green-700 border border-green-100' :
                                        apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-100' :
                                            'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                        }`}>
                                        {apt.status === 'pending' ? 'Onay Bekliyor' :
                                            apt.status === 'confirmed' ? 'Onaylandı' :
                                                apt.status === 'cancelled' ? 'İptal Edildi' : apt.status}
                                    </span>
                                </div>
                                {apt.status !== 'cancelled' && new Date(apt.start_time) > new Date() && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                        <button
                                            onClick={() => handleCancelAppointment(apt.id)}
                                            className="text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded transition"
                                        >
                                            Randevuyu İptal Et
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <EmptyState message="Henüz randevunuz bulunmuyor." icon={<Calendar size={48} className="text-gray-300" />} />
                    )}
                </div>
            )}

            {activeTab === 'waiting' && (
                <div className="space-y-4">
                    {waitingList.length > 0 ? (
                        waitingList.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition relative group">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                                        <Clock size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                                    {item.tradesman?.business_name || item.tradesman?.full_name}
                                                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border">Esnaf</span>
                                                </h3>
                                                <p className="text-gray-600 mt-1">
                                                    <span className="font-medium text-gray-900">{item.service?.name}</span> hizmeti için sıra bekleniyor.
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    Tercih Edilen Tarih: <span className="text-gray-700 font-medium">{new Date(item.preferred_date).toLocaleDateString('tr-TR')}</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteWaitlist(item.id)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm font-medium transition opacity-0 group-hover:opacity-100"
                                            >
                                                Listeden Çık
                                            </button>
                                        </div>

                                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                            <span className="text-xs text-gray-400">
                                                Eklenme: {new Date(item.created_at).toLocaleDateString('tr-TR')}
                                            </span>
                                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${item.status === 'notified' ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-700'
                                                }`}>
                                                {item.status === 'notified' ? 'Bildirim Gönderildi' : 'Sıra Bekleniyor'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <EmptyState message="Bekleme listeniz boş." icon={<Clock size={48} className="text-gray-300" />} />
                    )}
                </div>
            )}
        </div>
    );
};

const EmptyState = ({ message, icon }) => (
    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
        <div className="flex justify-center mb-4">{icon}</div>
        <p className="text-gray-500 font-medium">{message}</p>
    </div>
);

export default History;
