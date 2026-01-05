import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { Calendar, Clock, ArrowRight, Sparkles, TrendingUp, Search } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

// Skeleton Components
const HeroSkeleton = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-300 to-gray-400 rounded-[2.5rem] p-8 md:p-12 animate-pulse">
        <div className="relative z-10 max-w-xl">
            <div className="h-6 bg-white/30 rounded-full w-32 mb-6" />
            <div className="h-12 bg-white/30 rounded-xl w-3/4 mb-4" />
            <div className="h-6 bg-white/20 rounded-lg w-full mb-8" />
            <div className="flex gap-4">
                <div className="h-12 bg-white/40 rounded-2xl w-40" />
                <div className="h-12 bg-white/20 rounded-2xl w-32" />
            </div>
        </div>
    </div>
);

const CardSkeleton = () => (
    <div className="glass-card p-8">
        <div className="flex justify-between items-center mb-8">
            <div>
                <div className="h-7 bg-gray-200 rounded-lg w-36 mb-2 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="space-y-4">
            {[1, 2].map(i => (
                <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-28 mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-20" />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1" />
                        <div className="h-3 bg-gray-100 rounded w-12" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const CustomerDashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        profile: null,
        upcomingAppointments: [],
        waitingList: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const isMountedRef = useRef(true);

    // Memoized fetch function with AbortController
    const fetchDashboardData = useCallback(async (signal) => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (signal?.aborted || !isMountedRef.current) return;

            if (authError || !user) {
                navigate('/login');
                return;
            }

            // Parallel fetching for better performance
            const [profileResult, appointmentsResult, waitingResult] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single(),

                supabase
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
                    .limit(2),

                supabase
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
                    .limit(2)
            ]);

            if (signal?.aborted || !isMountedRef.current) return;

            // Single state update for all data
            setDashboardData({
                profile: profileResult.data || null,
                upcomingAppointments: appointmentsResult.data || [],
                waitingList: waitingResult.data || []
            });

        } catch (err) {
            if (signal?.aborted || !isMountedRef.current) return;
            console.error('Dashboard data error:', err);
            setError(err?.message || 'Veri yüklenirken bir hata oluştu');
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

        return () => {
            isMountedRef.current = false;
            abortController.abort();
        };
    }, [fetchDashboardData]);

    // Memoized navigation handlers
    const handleExploreClick = useCallback(() => navigate('/explore'), [navigate]);
    const handleAppointmentsClick = useCallback(() => navigate('/my-appointments'), [navigate]);

    // Memoized derived values
    const firstName = useMemo(() => {
        return dashboardData.profile?.full_name?.split(' ')[0] || 'Dostum';
    }, [dashboardData.profile?.full_name]);

    // Extract data for cleaner JSX
    const { profile, upcomingAppointments, waitingList } = dashboardData;

    // Show skeleton during loading
    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10">
                <HeroSkeleton />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <p className="text-gray-800 font-medium mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 lg:space-y-10 animate-in fade-in duration-500">
            {/* Greeting Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 text-white shadow-2xl shadow-brand-primary/20 group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-slate-900/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/30 text-[10px] sm:text-xs font-black tracking-widest uppercase mb-4 sm:mb-6">
                            <Sparkles size={12} className="sm:w-3.5 sm:h-3.5" /> HOŞ GELDİNİZ
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 sm:mb-4 tracking-tight leading-tight">
                            Merhaba, {firstName}!
                        </h1>
                        <p className="text-white/80 text-sm sm:text-base md:text-lg lg:text-xl font-medium max-w-lg mb-6 sm:mb-8 leading-relaxed">
                            SıraSende ile vaktin sana kalsın. Bugün senin için hangi hizmeti planlayalım?
                        </p>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                            <button
                                onClick={handleExploreClick}
                                className="bg-white text-brand-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 sm:gap-3"
                            >
                                <Search size={16} className="sm:w-4 sm:h-4" /> Keşfetmeye Başla
                            </button>
                            <button
                                onClick={handleAppointmentsClick}
                                className="bg-brand-primary/20 backdrop-blur-md border border-white/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm hover:bg-white/10 transition-all"
                            >
                                Randevularım
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Upcoming Appointments Card */}
                <div className="glass-card p-4 sm:p-6 lg:p-8 group hover:shadow-2xl transition-shadow duration-300 border-transparent hover:border-brand-primary/10">
                    <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
                        <div>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
                                <Calendar className="text-brand-primary w-5 h-5 sm:w-6 sm:h-6" />
                                <span>Yaklaşanlar</span>
                            </h2>
                            <p className="text-slate-400 text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-widest">ONAYLI RANDEVULARIN</p>
                        </div>
                        <Link to="/my-appointments" className="flex items-center gap-2 text-sm font-black text-brand-primary hover:gap-3 transition-all">
                            TÜMÜ <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {upcomingAppointments && upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map((apt) => (
                                <div key={apt?.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all flex justify-between items-center group/item">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-primary font-bold text-xl border border-slate-50 group-hover/item:scale-110 transition-transform">
                                            {apt?.tradesman?.business_name?.charAt(0) || apt?.tradesman?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 leading-tight">
                                                {apt?.tradesman?.business_name || apt?.tradesman?.full_name || 'İsimsiz'}
                                            </div>
                                            <div className="text-xs font-bold text-brand-primary opacity-80 mt-1 uppercase">
                                                {apt?.service?.name || 'Hizmet'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-slate-900 text-sm">
                                            {apt?.start_time ? new Date(apt.start_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''}
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 mt-0.5">
                                            {apt?.start_time ? new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                <Calendar size={40} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-bold mb-6">Henüz bir randevunuz yok.</p>
                                <button onClick={handleExploreClick} className="btn-primary py-2 text-xs">Şimdi Randevu Al</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Waiting List Summary Card */}
                <div className="glass-card p-4 sm:p-6 lg:p-8 group hover:shadow-2xl transition-shadow duration-300 border-transparent hover:border-brand-primary/10">
                    <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
                        <div>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
                                <Clock className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6" />
                                <span>Beklediklerim</span>
                            </h2>
                            <p className="text-slate-400 text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-widest">AKTİF SIRALAMALARIN</p>
                        </div>
                        <Link to="/my-appointments" className="flex items-center gap-2 text-sm font-black text-brand-primary hover:gap-3 transition-all">
                            DETAYLAR <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {waitingList && waitingList.length > 0 ? (
                            waitingList.map((item) => (
                                <div key={item?.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all flex justify-between items-center group/item relative overflow-hidden">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500 font-bold text-xl border border-slate-50 group-hover/item:scale-110 transition-transform">
                                            {item?.tradesman?.business_name?.charAt(0) || item?.tradesman?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 leading-tight">
                                                {item?.tradesman?.business_name || item?.tradesman?.full_name || 'İsimsiz'}
                                            </div>
                                            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tight">
                                                {item?.service?.name || 'Hizmet'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${item?.status === 'notified'
                                            ? 'bg-green-100 text-green-600 border border-green-200'
                                            : 'bg-amber-100 text-amber-600 border border-amber-200'
                                            }`}>
                                            {item?.status === 'notified' ? 'SIRAN GELDİ!' : 'BEKLENİYOR'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                <Clock size={40} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-bold">Herhangi bir sırada değilsiniz.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions Footer Card */}
            <div className="glass-card p-10 bg-slate-50 shadow-none border-transparent flex flex-col md:flex-row items-center justify-between gap-8 rounded-[3rem]">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-slate-200 flex items-center justify-center text-brand-primary">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">En Popüler İşletmeleri Gör</h3>
                        <p className="text-slate-500 font-medium">Haftanın en çok tercih edilen esnaflarına göz atın.</p>
                    </div>
                </div>
                <button
                    onClick={handleExploreClick}
                    className="btn-primary whitespace-nowrap px-10"
                >
                    ŞİMDİ KEŞFET
                </button>
            </div>
        </div>
    );
};

export default React.memo(CustomerDashboard);
