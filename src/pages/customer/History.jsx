import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Calendar, Clock, MapPin, Store, Trash2, ChevronRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const History = () => {
    const [appointments, setAppointments] = useState([]);
    const [waitingList, setWaitingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'waiting'

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Appointments with a small delay if needed to ensure DB consistency
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
    }, []);

    useEffect(() => {
        const abortController = new AbortController();
        let isMounted = true;

        const loadData = async () => {
            await fetchData();
            if (isMounted && !abortController.signal.aborted) {
                // Data loaded, no need for timeout
            }
        };

        loadData();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [fetchData]);

    const handleCancelAppointment = async (id) => {
        if (!window.confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) return;
        setLoading(true);

        try {
            const { data: apt, error: fetchError } = await supabase
                .from('appointments')
                .select('start_time, tradesman_id, customer_id')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const { error: cancelError } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (cancelError) throw cancelError;

            const cancelDate = apt.start_time.split('T')[0];
            const { data: waitingQueue, error: queueError } = await supabase
                .from('waiting_list')
                .select('id, user_id')
                .eq('tradesman_id', apt.tradesman_id)
                .eq('preferred_date', cancelDate)
                .eq('status', 'waiting');

            if (!queueError && waitingQueue?.length > 0) {
                const idsToNotify = waitingQueue.map(w => w.id);
                await supabase
                    .from('waiting_list')
                    .update({ status: 'notified' })
                    .in('id', idsToNotify);

                const notifications = waitingQueue.map(w => ({
                    user_id: w.user_id,
                    message: 'Beklediğiniz tarihte bir boşluk oluştu! Randevu alabilirsiniz.',
                    is_read: false
                }));
                await supabase.from('notifications').insert(notifications);
            }

            await supabase
                .from('waiting_list')
                .delete()
                .eq('user_id', apt.customer_id)
                .eq('tradesman_id', apt.tradesman_id)
                .eq('preferred_date', cancelDate);

            // Fetch fresh data instead of just updating local state for consistency
            await fetchData();

        } catch (error) {
            console.error('İptal hatası:', error);
            alert('İptal edilemedi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteWaitlist = async (id) => {
        if (!window.confirm('Bekleme listesinden çıkmak istediğinize emin misiniz?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('waiting_list').delete().eq('id', id);
            if (error) throw error;
            await fetchData();
        } catch (error) {
            alert('Silinemedi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClearCancelled = async () => {
        if (!window.confirm('İptal edilen tüm randevularınız silinecektir. Emin misiniz?')) return;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('customer_id', user.id)
                .eq('status', 'cancelled');

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Silinemedi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && appointments.length === 0) return (
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Randevularınız Hazırlanıyor...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto py-10 px-4 animate-in fade-in duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Geçmiş ve Randevular</h1>
                <p className="text-slate-500 mt-2">Tüm randevularınızı ve bekleme listesi başvurularınızı buradan yönetebilirsiniz.</p>
            </header>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 bg-slate-100/50 p-1 rounded-2xl w-fit">
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'appointments'
                            ? 'bg-white shadow-sm text-brand-primary'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Calendar size={18} />
                        Randevularım
                    </button>
                    <button
                        onClick={() => setActiveTab('waiting')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'waiting'
                            ? 'bg-white shadow-sm text-brand-primary'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Clock size={18} />
                        Bekleme Listesi
                        {waitingList.length > 0 && (
                            <span className="bg-brand-primary/10 text-brand-primary text-[10px] px-2 py-0.5 rounded-full border border-brand-primary/20">
                                {waitingList.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'appointments' && (
                <div className="space-y-6">
                    {appointments.some(a => a.status === 'cancelled') && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleClearCancelled}
                                className="text-sm font-semibold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition flex items-center gap-2 border border-red-100/50"
                            >
                                <Trash2 size={16} /> İptal Edilenleri Temizle
                            </button>
                        </div>
                    )}

                    {appointments && appointments.length > 0 ? (
                        <div className="grid gap-4">
                            {appointments.map((apt) => (
                                <div key={apt.id} className="glass-card p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all group border-transparent hover:border-brand-primary/10">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex gap-5">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${apt.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                                                apt.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                    'bg-brand-primary/10 text-brand-primary'
                                                }`}>
                                                {apt.status === 'confirmed' ? <CheckCircle2 size={28} /> :
                                                    apt.status === 'cancelled' ? <XCircle size={28} /> :
                                                        <Clock size={28} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-slate-900 group-hover:text-brand-primary transition-colors">
                                                    {apt.tradesman?.business_name || apt.tradesman?.full_name}
                                                </h3>
                                                <p className="font-semibold text-brand-primary/80 mt-1">{apt.service?.name}</p>
                                                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                        <Calendar size={14} className="text-slate-400" />
                                                        {new Date(apt.start_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                        <Clock size={14} className="text-slate-400" />
                                                        {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {apt.tradesman?.phone_number && (
                                                        <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                            <AlertCircle size={14} className="text-slate-400" />
                                                            {apt.tradesman.phone_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${apt.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border border-green-200' :
                                                apt.status === 'cancelled' ? 'bg-red-500/10 text-red-600 border border-red-200' :
                                                    'bg-amber-500/10 text-amber-600 border border-amber-200'
                                                }`}>
                                                {apt.status === 'pending' ? 'BİLDİRİM BEKLENİYOR' :
                                                    apt.status === 'confirmed' ? 'RANDEVU ONAYLANDI' :
                                                        apt.status === 'cancelled' ? 'İPTAL EDİLDİ' : apt.status}
                                            </span>

                                            {apt.status !== 'cancelled' && new Date(apt.start_time) > new Date() && (
                                                <button
                                                    onClick={() => handleCancelAppointment(apt.id)}
                                                    className="text-red-500 hover:text-red-600 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition border border-transparent hover:border-red-100"
                                                >
                                                    Randevuyu İptal Et
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            message="Henüz planlanmış bir randevunuz bulunmuyor."
                            icon={<Calendar size={60} className="text-slate-200" />}
                            actionText="Esnafları Keşfet"
                            onAction={() => window.location.href = '/explore'}
                        />
                    )}
                </div>
            )}

            {activeTab === 'waiting' && (
                <div className="space-y-4">
                    {waitingList && waitingList.length > 0 ? (
                        <div className="grid gap-4">
                            {waitingList.map((item) => (
                                <div key={item.id} className="glass-card p-6 border-l-4 border-l-amber-400 group relative">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
                                                <Clock size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-primary transition-colors flex items-center gap-2">
                                                    {item.tradesman?.business_name || item.tradesman?.full_name}
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">ESNAF</span>
                                                </h3>
                                                <p className="text-slate-500 font-medium text-sm mt-1">
                                                    <span className="text-brand-primary">{item.service?.name}</span> hizmeti için sıradasınız.
                                                </p>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                                        <Calendar size={12} />
                                                        Tercih: {new Date(item.preferred_date).toLocaleDateString('tr-TR')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                                        <Clock size={12} />
                                                        Sıra: Bekleniyor
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                                            <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${item.status === 'notified'
                                                ? 'bg-green-500/10 text-green-600 border border-green-200'
                                                : 'bg-amber-500/10 text-amber-600 border border-amber-200'
                                                }`}>
                                                {item.status === 'notified' ? 'YER AÇILDI!' : 'SIRADASINIZ'}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteWaitlist(item.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold text-sm border border-red-100"
                                                title="Sıradan Çık"
                                            >
                                                <Trash2 size={16} />
                                                <span>Sıradan Çık</span>
                                            </button>
                                        </div>
                                    </div>
                                    {item.status === 'notified' && (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-bold flex items-center gap-2 animate-pulse">
                                            <AlertCircle size={18} />
                                            Bu tarih için bir boşluk oluştu! Hemen randevu alabilirsiniz.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            message="Herhangi bir bekleme listeniz bulunmuyor."
                            icon={<Clock size={60} className="text-slate-200" />}
                            actionText="Esnafları Keşfet"
                            onAction={() => window.location.href = '/explore'}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

const EmptyState = ({ message, icon, actionText, onAction }) => (
    <div className="text-center py-20 glass-card bg-slate-50/50 border-dashed border-2 border-slate-200 shadow-none rounded-3xl animate-in zoom-in duration-300">
        <div className="flex justify-center mb-6 opacity-50">{icon}</div>
        <p className="text-slate-500 font-bold text-lg mb-8">{message}</p>
        {actionText && (
            <button
                onClick={onAction}
                className="btn-primary"
            >
                {actionText}
            </button>
        )}
    </div>
);

export default History;

