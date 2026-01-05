import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, CheckCircle2, AlertCircle, Info, ArrowLeft, ArrowRight, Users } from 'lucide-react';

const BookAppointment = () => {
    const [searchParams] = useSearchParams();
    const tradesmanId = searchParams.get('tradesmanId');
    const initialServiceId = searchParams.get('serviceId');

    const [tradesman, setTradesman] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [isSlotAvailable, setIsSlotAvailable] = useState(true);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    const [formData, setFormData] = useState({
        service_id: initialServiceId || '',
        date: '',
        time: '',
    });

    const navigate = useNavigate();
    const isMountedRef = useRef(true);
    const availabilityCheckRef = useRef(null);

    useEffect(() => {
        isMountedRef.current = true;

        if (!tradesmanId) {
            navigate('/explore');
            return;
        }

        fetchData();

        return () => {
            isMountedRef.current = false;
            if (availabilityCheckRef.current) {
                clearTimeout(availabilityCheckRef.current);
            }
        };
    }, [tradesmanId, navigate]);

    // Check availability when date, time, or service changes
    useEffect(() => {
        if (formData.date && formData.time && formData.service_id) {
            // Debounce the availability check
            if (availabilityCheckRef.current) {
                clearTimeout(availabilityCheckRef.current);
            }
            availabilityCheckRef.current = setTimeout(() => {
                checkAvailability();
            }, 300);
        } else {
            setIsSlotAvailable(true);
        }

        return () => {
            if (availabilityCheckRef.current) {
                clearTimeout(availabilityCheckRef.current);
            }
        };
    }, [formData.date, formData.time, formData.service_id]);

    const fetchData = async () => {
        try {
            const [profileResult, servicesResult] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', tradesmanId)
                    .single(),
                supabase
                    .from('services')
                    .select('*')
                    .eq('tradesman_id', tradesmanId)
            ]);

            if (!isMountedRef.current) return;

            if (profileResult.error) throw profileResult.error;
            setTradesman(profileResult.data);

            if (servicesResult.error) throw servicesResult.error;
            setServices(servicesResult.data || []);
        } catch (err) {
            if (isMountedRef.current) {
                setError('Veriler yüklenemedi.');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    // Check availability in background
    const checkAvailability = useCallback(async () => {
        if (!formData.date || !formData.time || !formData.service_id) return;

        setCheckingAvailability(true);

        try {
            const selectedService = services.find(s => s.id === formData.service_id);
            if (!selectedService) return;

            const startTime = new Date(`${formData.date}T${formData.time}`);
            const endTime = new Date(startTime.getTime() + selectedService.duration * 60000);

            const { data: existing, error: checkError } = await supabase
                .from('appointments')
                .select('id')
                .eq('tradesman_id', tradesmanId)
                .eq('status', 'confirmed')
                .filter('start_time', 'lt', endTime.toISOString())
                .filter('end_time', 'gt', startTime.toISOString());

            if (!isMountedRef.current) return;

            if (checkError) throw checkError;

            setIsSlotAvailable(!existing || existing.length === 0);
        } catch (err) {
            console.error('Availability check error:', err);
            // Default to available on error
            setIsSlotAvailable(true);
        } finally {
            if (isMountedRef.current) {
                setCheckingAvailability(false);
            }
        }
    }, [formData.date, formData.time, formData.service_id, services, tradesmanId]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const selectedService = services.find(s => s.id === formData.service_id);
            if (!selectedService) throw new Error('Lütfen bir hizmet seçin.');

            const startTime = new Date(`${formData.date}T${formData.time}`);
            const endTime = new Date(startTime.getTime() + selectedService.duration * 60000);

            if (isSlotAvailable) {
                // Book appointment directly
                const { error: bookError } = await supabase
                    .from('appointments')
                    .insert([{
                        customer_id: user.id,
                        tradesman_id: tradesmanId,
                        service_id: formData.service_id,
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString(),
                        status: 'confirmed'
                    }]);

                if (bookError) throw bookError;
            } else {
                // Add to waiting list directly (no confirmation needed)
                const { error: waitError } = await supabase
                    .from('waiting_list')
                    .insert([{
                        user_id: user.id,
                        tradesman_id: tradesmanId,
                        service_id: formData.service_id,
                        preferred_date: formData.date
                    }]);

                if (waitError) throw waitError;
            }

            if (isMountedRef.current) {
                setSuccess(true);
                setTimeout(() => navigate('/my-appointments'), 2000);
            }
        } catch (err) {
            if (isMountedRef.current) {
                setError(err?.message || 'Bir hata oluştu');
            }
        } finally {
            if (isMountedRef.current) {
                setSubmitting(false);
            }
        }
    }, [formData, services, tradesmanId, isSlotAvailable, navigate]);

    // Memoized button styles
    const buttonStyles = useMemo(() => {
        if (isSlotAvailable) {
            return {
                className: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
                text: 'Randevu Onayla',
                icon: <ArrowRight size={20} />
            };
        }
        return {
            className: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
            text: 'Sıraya Gir',
            icon: <Users size={20} />
        };
    }, [isSlotAvailable]);

    if (loading) return (
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Randevu Bilgileri Hazırlanıyor...</p>
        </div>
    );

    if (success) return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
            <div className="glass-card p-12 text-center max-w-md shadow-2xl border-green-100">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3">İşlem Başarılı!</h2>
                <p className="text-slate-500 font-medium mb-8">
                    {isSlotAvailable
                        ? 'Randevunuz başarıyla oluşturuldu.'
                        : 'Bekleme listesine eklendiniz. Sıra size gelince bildirim alacaksınız.'
                    }
                </p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full animate-[progress_2s_ease-in-out]" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-brand-primary hover:border-brand-primary/20 transition-all group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Randevu Oluştur</h1>
                    <p className="text-slate-500 font-medium">Lütfen uygun bir hizmet ve tarih seçin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-12">
                    <div className="glass-card p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Calendar size={120} />
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50/50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-3">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Service Selection */}
                            <section>
                                <label className="text-sm font-black text-slate-600 uppercase tracking-widest ml-1 mb-4 block">HİZMET SEÇİMİ</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {services.map(service => (
                                        <div
                                            key={service.id}
                                            onClick={() => setFormData({ ...formData, service_id: service.id })}
                                            className={`cursor-pointer p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden group/card ${formData.service_id === service.id
                                                ? 'border-brand-primary bg-brand-primary/5 shadow-xl shadow-brand-primary/5'
                                                : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className={`font-bold text-lg ${formData.service_id === service.id ? 'text-brand-primary' : 'text-slate-900'}`}>{service.name}</h3>
                                                {formData.service_id === service.id && (
                                                    <div className="w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center">
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase">
                                                    <Clock size={14} /> {service.duration} dk
                                                </div>
                                                <span className={`font-black text-xl tracking-tighter ${formData.service_id === service.id ? 'text-brand-primary' : 'text-slate-700'}`}>
                                                    {service.price} TL
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Date & Time Selection */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                                <div className="space-y-4">
                                    <label className="text-sm font-black text-slate-600 uppercase tracking-widest ml-1 block">TARİH</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                                        <input
                                            type="date"
                                            value={formData.date}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="glass-input w-full pl-12 pr-4 py-4 text-slate-900 font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-black text-slate-600 uppercase tracking-widest ml-1 block">SAAT</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                                        <input
                                            type="time"
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="glass-input w-full pl-12 pr-4 py-4 text-slate-900 font-bold"
                                            required
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Availability Status Indicator */}
                            {formData.date && formData.time && formData.service_id && (
                                <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 ${checkingAvailability
                                        ? 'bg-slate-100 text-slate-500'
                                        : isSlotAvailable
                                            ? 'bg-green-50 text-green-700 border border-green-100'
                                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                                    }`}>
                                    {checkingAvailability ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                            <span className="font-medium">Müsaitlik kontrol ediliyor...</span>
                                        </>
                                    ) : isSlotAvailable ? (
                                        <>
                                            <CheckCircle2 size={20} />
                                            <span className="font-semibold">Bu saat müsait! Randevu alabilirsiniz.</span>
                                        </>
                                    ) : (
                                        <>
                                            <Users size={20} />
                                            <span className="font-semibold">Bu saat dolu. Sıraya girerek bekleyebilirsiniz.</span>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="pt-10 flex flex-col md:flex-row items-center gap-6">
                                <button
                                    type="submit"
                                    disabled={submitting || checkingAvailability}
                                    className={`w-full md:w-auto md:min-w-[240px] flex items-center justify-center gap-3 py-4 text-lg font-black rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-50 ${buttonStyles.className}`}
                                >
                                    {submitting ? (
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>{buttonStyles.text}</span>
                                            {buttonStyles.icon}
                                        </>
                                    )}
                                </button>
                                <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                                    <Info size={16} />
                                    <span>Buton rengi müsaitlik durumuna göre değişir.</span>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(BookAppointment);
