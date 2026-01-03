import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [waitingList, setWaitingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get Profile Name
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();
            setProfile(profileData);

            // 2. Get Upcoming Appointments (Limit 2)
            const { data: appointments } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    start_time, 
                    status,
                    service:services(name),
                    tradesman:profiles!tradesman_id(business_name, full_name)
                `)
                .eq('customer_id', user.id)
                .neq('status', 'cancelled')
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(2);
            setUpcomingAppointments(appointments || []);

            // 3. Get Active Waiting List (Limit 2)
            const { data: waiting } = await supabase
                .from('waiting_list')
                .select(`
                    id, 
                    created_at, 
                    status,
                    service:services(name),
                    tradesman:profiles!tradesman_id(business_name, full_name)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(2);
            setWaitingList(waiting || []);

        } catch (error) {
            console.error('Dashboard data error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Greeting Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">
                    Hoş geldin, {profile?.full_name?.split(' ')[0] || 'Misafir'}! 👋
                </h1>
                <p className="text-blue-100 text-lg">
                    Bugün senin için ne yapabiliriz? Randevularını kontrol et veya yeni bir dükkan keşfet.
                </p>
                <button
                    onClick={() => navigate('/book-appointment')}
                    className="mt-6 bg-white text-blue-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition shadow-sm"
                >
                    Hemen Randevu Al
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upcoming Appointments Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Calendar className="text-blue-500" />
                            Yaklaşan Randevuların
                        </h2>
                        <button onClick={() => navigate('/my-appointments')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            Tümü <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map((apt) => (
                                <div key={apt.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="font-semibold text-gray-900">
                                        {apt.tradesman?.business_name || apt.tradesman?.full_name}
                                    </div>
                                    <div className="text-sm text-gray-600 flex justify-between mt-1">
                                        <span>{apt.service?.name}</span>
                                        <span className="font-medium text-blue-700">
                                            {new Date(apt.start_time).toLocaleDateString()} - {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">
                                Yaklaşan randevun yok.
                            </div>
                        )}
                    </div>
                </div>

                {/* Waiting List Summary Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="text-orange-500" />
                            Beklediğin Sıralar
                        </h2>
                        <button onClick={() => navigate('/my-appointments')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            Detaylar <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {waitingList.length > 0 ? (
                            waitingList.map((item) => (
                                <div key={item.id} className="p-4 bg-orange-50 rounded-lg border border-orange-100 relative">
                                    <div className="font-semibold text-gray-900 pr-16">
                                        {item.tradesman?.business_name || item.tradesman?.full_name}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {item.service?.name}
                                    </div>
                                    <span className={`absolute top-4 right-4 text-xs font-medium px-2 py-1 rounded-full ${item.status === 'notified' ? 'bg-green-100 text-green-700' : 'bg-white text-orange-600 border border-orange-200'
                                        }`}>
                                        {item.status === 'notified' ? 'Sıra Geldi!' : 'Bekleniyor'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">
                                Bekleme listesinde kaydın yok.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions / Explore Teaser */}
            <div className="bg-gray-50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-200">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Daha fazla hizmet mi arıyorsun?</h3>
                    <p className="text-gray-500 text-sm">Şehrindeki en iyi berberleri ve kuaförleri keşfet.</p>
                </div>
                <button
                    onClick={() => navigate('/explore')}
                    className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg font-medium hover:bg-gray-100 transition whitespace-nowrap"
                >
                    Dükkanları Keşfet
                </button>
            </div>
        </div>
    );
};

export default CustomerDashboard;
