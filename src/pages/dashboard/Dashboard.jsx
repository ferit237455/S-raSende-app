import React, { useEffect, useState } from 'react';
import { appointmentService } from '../../services/appointments';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const Dashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchAppointments = async () => {
        setLoading(true);
        setError(null);
        setAppointments([]); // Eski veriyi temizle
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }
            const data = await appointmentService.getAppointments({ tradesman_id: user.id });
            setAppointments(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
        // Emergency checkout
        const timeout = setTimeout(() => {
            if (loading) setLoading(false);
        }, 5000);
        return () => clearTimeout(timeout);
    }, []);

    const handleCancel = async (id) => {
        if (!window.confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) return;
        setLoading(true);
        try {
            // İptal edilmeden önce randevu bilgilerini al (bildirim için tarih ve esnaf lazım)
            const { data: appointment } = await supabase
                .from('appointments')
                .select('*')
                .eq('id', id)
                .single();

            await appointmentService.cancelAppointment(id);

            // Bekleme listesi bildirimi - SADECE İLK KİŞİYİ BİLGİLENDİR (Kullanıcı Talebi)
            if (appointment) {
                const dateOnly = appointment.start_time.split('T')[0];
                const { data: waitlistFirst } = await supabase
                    .from('waiting_list')
                    .select('*')
                    .eq('tradesman_id', appointment.tradesman_id)
                    .eq('preferred_date', dateOnly)
                    .eq('status', 'waiting')
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .single();

                if (waitlistFirst) {
                    // Sadece bu kişiyi güncelle
                    await supabase
                        .from('waiting_list')
                        .update({ status: 'notified' })
                        .eq('id', waitlistFirst.id);

                    // Bildirimler tablosuna bu kişiye özel ekle
                    await supabase.from('notifications').insert({
                        user_id: waitlistFirst.user_id,
                        message: `Beklediğiniz tarihte (${dateOnly}) bir boşluk oluştu! Hemen randevu alabilirsiniz.`,
                        is_read: false
                    });

                    alert(`Randevu iptal edildi. Bekleme listesindeki ilk kişi (${dateOnly}) bilgilendirildi.`);
                } else {
                    alert('Randevu iptal edildi.');
                }
            }

            await fetchAppointments();
        } catch (err) {
            alert('İptal işlemi başarısız: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClearCancelled = async () => {
        if (!window.confirm('İptal edilen tüm randevular listenizden kalıcı olarak silinecektir. Emin misiniz?')) return;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('tradesman_id', user.id)
                .eq('status', 'cancelled');

            if (error) throw error;

            setAppointments(appointments?.filter(a => a.status !== 'cancelled') || []);
            alert('İptal edilen randevular temizlendi.');
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Silinemedi (Yetki sorunu olabilir, lütfen SQL güncellemesini yapın). Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-2 text-gray-500">Yükleniyor...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center">
            <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block border border-red-100">
                <p className="font-semibold">Bir hata oluştu!</p>
                <p className="text-sm mt-1">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-3 text-sm bg-white px-3 py-1 rounded border border-red-200 hover:bg-red-100 transition">
                    Sayfayı Yenile
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Randevu Paneli</h1>

            </div>

            {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

            {appointments?.some(a => a.status === 'cancelled') && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleClearCancelled}
                        className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-red-100 flex items-center gap-2"
                    >
                        <Trash2 size={16} /> İptal Edilen Geçmişi Temizle
                    </button>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden rounded-md">
                {!appointments || !Array.isArray(appointments) || appointments?.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">Henüz hiç randevunuz yok.</div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {appointments?.map((apt) => (
                            <li key={apt?.id} className="p-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-lg font-medium text-gray-900">
                                            {apt?.service?.name || 'Hizmet Silinmiş'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {apt?.start_time ? new Date(apt.start_time).toLocaleString('tr-TR') : ''} - {apt?.end_time ? new Date(apt.end_time).toLocaleTimeString('tr-TR') : ''}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Müşteri: {apt?.customer?.full_name || 'Bilinmiyor'} | Esnaf: {apt?.tradesman?.business_name || apt?.tradesman?.full_name || 'Bilinmiyor'}
                                        </div>
                                        <div className="mt-1">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${apt?.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                    apt?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                {apt?.status === 'pending' ? 'Bekliyor' :
                                                    apt?.status === 'confirmed' ? 'Onaylandı' :
                                                        apt?.status === 'cancelled' ? 'İptal Edildi' : apt?.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        {apt?.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleCancel(apt?.id)}
                                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                                            >
                                                İptal Et
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
export default Dashboard;
