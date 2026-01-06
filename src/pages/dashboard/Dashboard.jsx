import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Store, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { appointmentService } from '../../services/appointments';

// Skeleton Components for better UX during loading
const StatCardSkeleton = () => (
    <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center justify-between">
            <div>
                <div className="h-4 bg-gray-400/30 rounded w-24 mb-3" />
                <div className="h-10 bg-gray-400/30 rounded w-16" />
            </div>
            <div className="w-14 h-14 bg-gray-400/20 rounded-2xl" />
        </div>
    </div>
);

const AppointmentSkeleton = () => (
    <div className="px-6 py-4 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-16" />
    </div>
);

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        waitingCustomers: 0
    });
    const [todayAppointments, setTodayAppointments] = useState([]);
    const navigate = useNavigate();
    const isMountedRef = useRef(true);

    // Memoized fetch function with abort support
    const fetchDashboardData = useCallback(async (signal) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (signal?.aborted || !isMountedRef.current) return;

            if (!user) {
                navigate('/login');
                return;
            }

            // Parallel fetching for better performance
            const [profileResult, appointmentCountResult, waitingCountResult, todayResult] = await Promise.all([
                // Fetch profile
                supabase
                    .from('profiles')
                    .select('id, business_name, full_name, category')
                    .eq('id', user.id)
                    .single(),

                // Fetch total appointments count
                supabase
                    .from('appointments')
                    .select('*', { count: 'exact', head: true })
                    .eq('tradesman_id', user.id),

                // Fetch waiting list count
                supabase
                    .from('waiting_list')
                    .select('*', { count: 'exact', head: true })
                    .eq('tradesman_id', user.id)
                    .eq('status', 'waiting'),

                // Fetch today's appointments
                (() => {
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const todayEnd = new Date();
                    todayEnd.setHours(23, 59, 59, 999);

                    return supabase
                        .from('appointments')
                        .select(`
                            id, 
                            start_time, 
                            end_time, 
                            status,
                            service:services(name),
                            customer:profiles!customer_id(full_name)
                        `)
                        .eq('tradesman_id', user.id)
                        .gte('start_time', todayStart.toISOString())
                        .lte('start_time', todayEnd.toISOString())
                        .neq('status', 'cancelled')
                        .order('start_time', { ascending: true });
                })()
            ]);

            if (signal?.aborted || !isMountedRef.current) return;

            // Update state with results
            setProfile(profileResult.data || null);
            setStats({
                totalAppointments: appointmentCountResult.count || 0,
                waitingCustomers: waitingCountResult.count || 0
            });
            setTodayAppointments(todayResult.data || []);

        } catch (error) {
            if (signal?.aborted || !isMountedRef.current) return;
            console.error('Dashboard fetch error:', error);
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [navigate]);

    useEffect(() => {
        isMountedRef.current = true;
        const abortController = new AbortController();

        fetchDashboardData(abortController.signal);

        // Emergency timeout
        const timeout = setTimeout(() => {
            if (isMountedRef.current && loading) {
                setLoading(false);
            }
        }, 5000);

        return () => {
            isMountedRef.current = false;
            abortController.abort();
            clearTimeout(timeout);
        };
    }, [fetchDashboardData]);

    // Handle delete cancelled appointment
    const handleDeleteAppointment = useCallback(async (appointmentId, e) => {
        e.stopPropagation(); // Prevent card click
        
        const confirmed = window.confirm('Bu iptal edilmiş randevuyu geçmişten tamamen silmek istediğinize emin misiniz?');
        if (!confirmed) return;

        try {
            await appointmentService.deleteAppointment(appointmentId);
            // Optimistic update - remove from list immediately
            setTodayAppointments(prev => prev.filter(apt => apt?.id !== appointmentId));
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('Randevu silinirken bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
            // Reload appointments on error
            const abortController = new AbortController();
            fetchDashboardData(abortController.signal);
        }
    }, [fetchDashboardData]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <header className="mb-6 sm:mb-8">
                {loading ? (
                    <div className="animate-pulse">
                        <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-72 mb-2" />
                        <div className="h-3 sm:h-4 bg-gray-100 rounded w-32 sm:w-48" />
                    </div>
                ) : (
                    <>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Hoş Geldiniz, {profile?.business_name || profile?.full_name || 'Esnaf'}!
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 mt-1">İşletmenizin günlük özeti</p>
                    </>
                )}
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
                {loading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        {/* Total Appointments */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-blue-500/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-xs sm:text-sm font-medium uppercase tracking-wider">Toplam Randevu</p>
                                    <p className="text-3xl sm:text-4xl font-black mt-2">{stats.totalAppointments}</p>
                                </div>
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <CalendarDays size={24} className="sm:w-7 sm:h-7" />
                                </div>
                            </div>
                        </div>

                        {/* Waiting Customers */}
                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-amber-500/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-amber-100 text-xs sm:text-sm font-medium uppercase tracking-wider">Bekleyen Müşteri</p>
                                    <p className="text-3xl sm:text-4xl font-black mt-2">{stats.waitingCustomers}</p>
                                </div>
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Users size={24} className="sm:w-7 sm:h-7" />
                                </div>
                            </div>
                        </div>

                        {/* Shop Status */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-emerald-500/20 sm:col-span-2 lg:col-span-1">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-emerald-100 text-xs sm:text-sm font-medium uppercase tracking-wider">Dükkan Durumu</p>
                                    <p className="text-base sm:text-lg font-bold mt-2 truncate">{profile?.business_name || 'Belirtilmemiş'}</p>
                                    <p className="text-emerald-100 text-xs sm:text-sm truncate">{profile?.category || 'Kategori yok'}</p>
                                </div>
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 ml-2">
                                    <Store size={24} className="sm:w-7 sm:h-7" />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Clock size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                        <span>Bugünün Randevuları</span>
                    </h2>
                    <span className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                </div>

                {loading ? (
                    <div className="divide-y divide-gray-50">
                        <AppointmentSkeleton />
                        <AppointmentSkeleton />
                        <AppointmentSkeleton />
                    </div>
                ) : todayAppointments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <CalendarDays size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Bugün için randevu bulunmuyor.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {todayAppointments.map((apt) => (
                            <li key={apt?.id} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                                        {new Date(apt?.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{apt?.service?.name || 'Hizmet'}</p>
                                        <p className="text-sm text-gray-500">{apt?.customer?.full_name || 'Müşteri'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${apt?.status === 'confirmed'
                                        ? 'bg-green-100 text-green-700'
                                        : apt?.status === 'cancelled'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {apt?.status === 'confirmed' ? 'Onaylı' : apt?.status === 'cancelled' ? 'İptal Edildi' : 'Bekliyor'}
                                    </span>
                                    {apt?.status === 'cancelled' && (
                                        <button
                                            onClick={(e) => handleDeleteAppointment(apt?.id, e)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                            title="İptal edilmiş randevuyu sil"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <ChevronRight size={18} className="text-gray-300" />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default React.memo(Dashboard);
