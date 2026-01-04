import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { appointmentService } from '../../services/appointments';

const CalendarPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAppointments = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const data = await appointmentService.getAppointments({ tradesman_id: user.id });
                setAppointments(data || []);
            } catch (err) {
                console.error(err);
                setError('Randevular yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };
        loadAppointments();
        // Acil durum zaman aşımı
        const timeout = setTimeout(() => setLoading(false), 5000);
        return () => clearTimeout(timeout);
    }, []);

    // Simple day grouping
    const grouped = appointments?.reduce((acc, apt) => {
        if (!apt?.start_time) return acc;
        const date = new Date(apt.start_time).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(apt);
        return acc;
    }, {}) || {};

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
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Randevu Takvimi</h1>
            <div className="space-y-6">
                {!grouped || !Object.keys(grouped || {}).length === 0 ? (
                    <p className="text-gray-500">Görüntülenecek randevu yok.</p>
                ) : (
                    Object.entries(grouped || {}).map(([date, apts]) => (
                        <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="bg-gray-100 px-6 py-3 font-semibold text-gray-700 border-b">
                                {date}
                            </div>
                            <div className="divide-y divide-gray-200">
                                {apts?.map(apt => (
                                    <div key={apt?.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {apt?.start_time ? new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} -
                                                {apt?.end_time ? new Date(apt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {apt?.service?.name} - {apt?.customer?.full_name}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${apt?.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            apt?.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {apt?.status === 'pending' ? 'Bekliyor' :
                                                apt?.status === 'confirmed' ? 'Onaylandı' :
                                                    apt?.status === 'cancelled' ? 'İptal Edildi' : apt?.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CalendarPage;
