import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { appointmentService } from '../../services/appointments';
import { Calendar, Clock, User, Scissors, ChevronRight, CalendarDays, List, LayoutGrid, ChevronLeft, Trash2 } from 'lucide-react';

// Skeleton Components
const DaySkeleton = () => (
    <div className="animate-pulse">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-1 h-12 bg-gray-200 rounded-full" />
            <div className="h-6 bg-gray-200 rounded-lg w-40" />
        </div>
        <div className="space-y-3 ml-5">
            {[1, 2].map(i => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100">
                    <div className="flex gap-6">
                        <div className="w-20">
                            <div className="h-6 bg-gray-200 rounded w-16 mb-2" />
                            <div className="h-4 bg-gray-100 rounded w-12" />
                        </div>
                        <div className="flex-1">
                            <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                            <div className="h-4 bg-gray-100 rounded w-24" />
                        </div>
                        <div className="h-6 bg-gray-100 rounded-full w-20" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Grid Skeleton
const GridSkeleton = () => (
    <div className="animate-pulse">
        <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded" />
            ))}
            {[...Array(35)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl" />
            ))}
        </div>
    </div>
);

// Format date helper using Intl.DateTimeFormat
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        weekday: 'long'
    }).format(date);
};

// Check if date is today
const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

// Check if appointment time has passed
const isPast = (startTime) => {
    return new Date(startTime) < new Date();
};

// Calculate duration in minutes
const getDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const diff = new Date(endTime) - new Date(startTime);
    return Math.round(diff / 60000);
};

// Get days in month
const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert to Monday = 0
};

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const CalendarPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'grid'
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const isMountedRef = useRef(true);

    const loadAppointments = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!isMountedRef.current) return;
            if (!user) return;

            const data = await appointmentService.getAppointments({ tradesman_id: user.id });
            if (!isMountedRef.current) return;

            setAppointments(data || []);
        } catch (err) {
            if (isMountedRef.current) {
                console.error(err);
                setError('Randevular yüklenirken bir hata oluştu.');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        loadAppointments();

        return () => {
            isMountedRef.current = false;
        };
    }, [loadAppointments]);

    // Group appointments by date and sort
    const grouped = useMemo(() => {
        if (!Array.isArray(appointments)) return {};

        const groups = appointments.reduce((acc, apt) => {
            if (!apt?.start_time) return acc;
            const dateKey = new Date(apt.start_time).toDateString();
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(apt);
            return acc;
        }, {});

        // Sort appointments within each day by time
        Object.keys(groups).forEach(date => {
            groups[date].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        });

        return groups;
    }, [appointments]);

    // Sort dates
    const sortedDates = useMemo(() => {
        return Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
    }, [grouped]);

    // Calendar grid data
    const calendarData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];

        // Add empty cells for days before the first day of month
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null, appointments: [] });
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = date.toDateString();
            days.push({
                day,
                date,
                dateKey,
                appointments: grouped[dateKey] || [],
                isToday: isToday(dateKey)
            });
        }

        return days;
    }, [currentMonth, grouped]);

    // Get status badge styles
    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed':
                return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', label: 'Onaylandı', dot: 'bg-green-500' };
            case 'cancelled':
                return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', label: 'İptal Edildi', dot: 'bg-red-500' };
            case 'pending':
            default:
                return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Bekliyor', dot: 'bg-amber-500' };
        }
    };

    const handlePrevMonth = useCallback(() => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const handleNextMonth = useCallback(() => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const handleTodayClick = useCallback(() => {
        setCurrentMonth(new Date());
    }, []);

    // Handle delete cancelled appointment
    const handleDeleteAppointment = useCallback(async (appointmentId, e) => {
        e.stopPropagation(); // Prevent card click
        
        const confirmed = window.confirm('Bu iptal edilmiş randevuyu geçmişten tamamen silmek istediğinize emin misiniz?');
        if (!confirmed) return;

        try {
            await appointmentService.deleteAppointment(appointmentId);
            // Optimistic update - remove from list immediately
            setAppointments(prev => prev.filter(apt => apt?.id !== appointmentId));
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('Randevu silinirken bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
            // Reload appointments on error
            loadAppointments();
        }
    }, [loadAppointments]);

    if (loading) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <div className="mb-8 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-64" />
                </div>
                {viewMode === 'timeline' ? (
                    <div className="space-y-10">
                        <DaySkeleton />
                        <DaySkeleton />
                    </div>
                ) : (
                    <GridSkeleton />
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Calendar size={32} />
                    </div>
                    <p className="font-bold text-lg text-slate-900 mb-2">Bir Hata Oluştu!</p>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-white px-6 py-3 rounded-xl border border-red-200 hover:bg-red-50 transition font-bold text-red-600"
                    >
                        Sayfayı Yenile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <CalendarDays className="text-brand-primary" size={32} />
                        Randevu Takvimi
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">
                        {viewMode === 'timeline'
                            ? 'Tüm randevularınızı günlük akış şeklinde görüntüleyin'
                            : 'Aylık takvim görünümünde randevularınız'
                        }
                    </p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'timeline'
                                ? 'bg-white text-brand-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <List size={18} />
                        Liste
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'grid'
                                ? 'bg-white text-brand-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <LayoutGrid size={18} />
                        Takvim
                    </button>
                </div>
            </div>

            {/* Grid View Month Navigation */}
            {viewMode === 'grid' && (
                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-slate-900">
                            {new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(currentMonth)}
                        </h2>
                        <button
                            onClick={handleTodayClick}
                            className="px-3 py-1 text-xs font-bold text-brand-primary bg-brand-primary/10 rounded-full hover:bg-brand-primary/20 transition-colors"
                        >
                            Bugün
                        </button>
                    </div>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>
            )}

            {/* Timeline View */}
            {viewMode === 'timeline' && (
                <div className="space-y-10">
                    {sortedDates.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <CalendarDays size={40} className="text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Randevu Bulunmuyor</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                Henüz planlanmış bir randevunuz yok. Müşterileriniz randevu aldığında burada görünecek.
                            </p>
                        </div>
                    ) : (
                        sortedDates.map((dateKey) => {
                            const dayAppointments = grouped[dateKey];
                            const isTodayDate = isToday(dateKey);

                            return (
                                <div key={dateKey} className="animate-in fade-in slide-in-from-left-4 duration-500">
                                    {/* Day Header */}
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className={`w-1.5 h-14 rounded-full ${isTodayDate ? 'bg-gradient-to-b from-brand-primary to-purple-500' : 'bg-slate-300'}`} />
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-xl font-black text-slate-900 capitalize">
                                                    {formatDate(dateKey)}
                                                </h2>
                                                {isTodayDate && (
                                                    <span className="px-3 py-1 bg-gradient-to-r from-brand-primary to-purple-500 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-lg shadow-brand-primary/25">
                                                        Bugün
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-400 font-medium mt-0.5">
                                                {dayAppointments.length} randevu
                                            </p>
                                        </div>
                                    </div>

                                    {/* Appointments */}
                                    <div className="space-y-3 ml-6 border-l-2 border-slate-100 pl-6">
                                        {dayAppointments.map((apt) => {
                                            const statusBadge = getStatusBadge(apt?.status);
                                            const pastAppointment = isPast(apt?.start_time) && apt?.status !== 'cancelled';
                                            const duration = getDuration(apt?.start_time, apt?.end_time);

                                            return (
                                                <div
                                                    key={apt?.id}
                                                    className={`bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 flex items-center gap-6 group hover:shadow-2xl hover:shadow-slate-300/50 hover:translate-x-1 transition-all duration-300 cursor-pointer ${pastAppointment ? 'opacity-60' : ''}`}
                                                >
                                                    {/* Time Column */}
                                                    <div className="w-24 shrink-0">
                                                        <div className="text-xl font-black text-slate-900">
                                                            {apt?.start_time
                                                                ? new Date(apt.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                                                                : '--:--'}
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                                                            <Clock size={12} />
                                                            {duration} dk
                                                        </div>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className="w-px h-12 bg-slate-200" />

                                                    {/* Info Column */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <User size={16} className="text-slate-400 shrink-0" />
                                                            <span className="font-bold text-slate-900 truncate">
                                                                {apt?.customer?.full_name || 'Müşteri'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Scissors size={14} className="text-brand-primary shrink-0" />
                                                            <span className="text-sm font-medium text-brand-primary truncate">
                                                                {apt?.service?.name || 'Hizmet'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className={`px-4 py-2 rounded-full text-xs font-black ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border} shrink-0`}>
                                                        {statusBadge.label}
                                                    </div>

                                                    {/* Delete Button - Only for cancelled appointments */}
                                                    {apt?.status === 'cancelled' && (
                                                        <button
                                                            onClick={(e) => handleDeleteAppointment(apt?.id, e)}
                                                            className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 shrink-0"
                                                            title="İptal edilmiş randevuyu sil"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}

                                                    {/* Arrow */}
                                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all shrink-0" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 overflow-hidden">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="text-center text-sm font-bold text-slate-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {calendarData.map((cell, index) => (
                            <div
                                key={index}
                                className={`min-h-[100px] p-2 rounded-xl border transition-all ${cell.day === null
                                        ? 'bg-slate-50 border-transparent'
                                        : cell.isToday
                                            ? 'bg-brand-primary/5 border-brand-primary/20'
                                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                    }`}
                            >
                                {cell.day !== null && (
                                    <>
                                        <div className={`text-sm font-bold mb-2 ${cell.isToday ? 'text-brand-primary' : 'text-slate-700'
                                            }`}>
                                            {cell.day}
                                        </div>
                                        <div className="space-y-1">
                                            {cell.appointments.slice(0, 3).map(apt => {
                                                const statusBadge = getStatusBadge(apt?.status);
                                                return (
                                                    <div
                                                        key={apt?.id}
                                                        className={`text-[10px] font-bold px-2 py-1 rounded-md ${statusBadge.bg} ${statusBadge.text} truncate cursor-pointer hover:opacity-80 transition-opacity relative group/item flex items-center justify-between gap-1`}
                                                        title={`${apt?.customer?.full_name} - ${apt?.service?.name}`}
                                                    >
                                                        <span className="truncate flex-1">
                                                            {new Date(apt?.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {apt?.status === 'cancelled' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteAppointment(apt?.id, e);
                                                                }}
                                                                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100 shrink-0"
                                                                title="İptal edilmiş randevuyu sil"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {cell.appointments.length > 3 && (
                                                <div className="text-[10px] font-bold text-slate-400 text-center">
                                                    +{cell.appointments.length - 3} daha
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(CalendarPage);
