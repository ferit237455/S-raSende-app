import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, Phone, Mail, Clock, DollarSign, Calendar, ChevronRight, Star, Heart, AlertCircle } from 'lucide-react';

const ShopDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMountedRef = useRef(true);

    const fetchShopDetails = useCallback(async (signal) => {
        if (!isMountedRef.current) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const [profileResult, servicesResult] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, full_name, business_name, email, phone_number, category, image_url')
                    .eq('id', id)
                    .single(),
                supabase
                    .from('services')
                    .select('id, name, description, price, duration')
                    .eq('tradesman_id', id)
                    .order('price', { ascending: true })
            ]);

            if (signal?.aborted || !isMountedRef.current) return;

            if (profileResult.error) throw profileResult.error;
            if (servicesResult.error) throw servicesResult.error;

            if (isMountedRef.current) {
                setShop(profileResult.data);
                setServices(servicesResult.data || []);
            }
        } catch (err) {
            if (signal?.aborted || !isMountedRef.current) return;
            console.error('Error details:', err);
            if (isMountedRef.current) {
                setError('Dükkan detayları yüklenirken bir hata oluştu.');
            }
        } finally {
            if (isMountedRef.current && !signal?.aborted) {
                setLoading(false);
            }
        }
    }, [id]);

    useEffect(() => {
        isMountedRef.current = true;
        const abortController = new AbortController();
        
        fetchShopDetails(abortController.signal);

        return () => {
            isMountedRef.current = false;
            abortController.abort();
        };
    }, [fetchShopDetails]);

    const handleBookService = (serviceId) => {
        navigate(`/book-appointment?tradesmanId=${id}&serviceId=${serviceId}`);
    };

    // Skeleton Components
    const ShopDetailSkeleton = useMemo(() => (
        <div className="max-w-6xl mx-auto my-10 px-4 animate-pulse">
            <div className="glass-card shadow-2xl overflow-hidden border-transparent">
                {/* Hero Skeleton */}
                <div className="relative h-72 md:h-96 bg-gradient-to-br from-gray-200 to-gray-300">
                    <div className="absolute bottom-10 left-6 md:left-10 flex flex-col md:flex-row items-end md:items-center gap-6">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-300 rounded-3xl"></div>
                        <div className="space-y-3">
                            <div className="h-6 bg-gray-300 rounded w-32"></div>
                            <div className="h-10 bg-gray-300 rounded w-48"></div>
                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Main Content Skeleton */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="h-8 bg-gray-200 rounded w-48"></div>
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                                        <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                                        <div className="h-4 bg-gray-100 rounded w-2/3 mb-4"></div>
                                        <div className="flex gap-4">
                                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                                            <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Skeleton */}
                        <div className="lg:col-span-4">
                            <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-[2rem] space-y-5">
                                <div className="h-6 bg-gray-200 rounded w-40"></div>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                                            <div className="h-4 bg-gray-100 rounded w-32"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ), []);

    if (loading) return ShopDetailSkeleton;

    if (error) return (
        <div className="max-w-4xl mx-auto p-8 text-center mt-10">
            <div className="bg-red-50/50 border border-red-100 p-8 rounded-3xl inline-block max-w-md">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                <h3 className="font-bold text-slate-900 text-xl mb-2">Eyvah! Bir Sorun Var</h3>
                <p className="text-slate-500 font-medium mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                >
                    Tekrar Dene
                </button>
            </div>
        </div>
    );

    if (!shop) return (
        <div className="p-8 text-center text-slate-500 bg-slate-50 h-[50vh] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 m-6">
            <MapPin size={48} className="text-slate-300 mb-4" />
            <p className="font-bold text-lg">İşletme bulunamadı.</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto my-10 px-4">
            <div className="glass-card shadow-2xl overflow-hidden border-transparent group animate-in slide-in-from-bottom-4 duration-700">
                {/* Hero Section */}
                <div className="relative h-72 md:h-96">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/90 to-brand-secondary/90"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2070&auto=format&fit=crop" 
                        alt="Shop background" 
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                    <div className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-all border border-white/20"
                        >
                            <ChevronRight size={20} className="rotate-180" />
                        </button>
                    </div>

                    <div className="absolute top-6 right-6 flex gap-2">
                        <button className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-all border border-white/20 shadow-lg">
                            <Heart size={20} />
                        </button>
                    </div>

                    <div className="absolute bottom-10 left-6 md:left-10 flex flex-col md:flex-row items-end md:items-center gap-6">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl p-1.5 shadow-2xl relative">
                            <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center text-white font-extrabold text-4xl md:text-5xl shadow-inner">
                                {shop.business_name?.charAt(0) || shop.full_name?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-lg shadow-green-500/50"></div>
                        </div>
                        <div className="text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 tracking-widest uppercase">
                                    PROFESYONEL ESNAF
                                </span>
                                <div className="flex items-center gap-1 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-1 rounded-md shadow-lg shadow-amber-400/20">
                                    <Star size={10} fill="currentColor" /> 5.0
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{shop.business_name || shop.full_name}</h1>
                            <div className="flex items-center gap-4 mt-3 opacity-90 text-sm font-medium">
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={16} /> İstanbul, Türkiye
                                </span>
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full"></span>
                                <span className="flex items-center gap-1.5">
                                    <Clock size={16} /> 09:00 - 18:00
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-8">
                            <section className="mb-12">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                        Sunulan Hizmetler
                                        <span className="text-sm font-bold bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full">{services.length} Hizmet</span>
                                    </h2>
                                </div>

                                <div className="grid gap-4">
                                    {services && services.length > 0 ? (
                                        services.map(service => (
                                            <div
                                                key={service.id}
                                                className="group/item flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-brand-primary/10 transition-all cursor-pointer"
                                                onClick={() => handleBookService(service.id)}
                                            >
                                                <div className="mb-4 sm:mb-0">
                                                    <h3 className="font-bold text-slate-900 text-xl mb-1 group-hover/item:text-brand-primary transition-colors">{service.name}</h3>
                                                    <p className="text-slate-500 font-medium text-sm max-w-md">{service.description || 'Henüz açıklama girilmemiş.'}</p>
                                                    <div className="flex items-center gap-4 mt-4 text-xs font-bold text-slate-400 bg-white shadow-sm border border-slate-50 w-fit px-3 py-1.5 rounded-xl">
                                                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-brand-primary" /> {service.duration} Dakika</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-between">
                                                    <span className="font-black text-brand-primary text-2xl tracking-tighter">{service.price} TL</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBookService(service.id);
                                                        }}
                                                        className="px-6 py-3 bg-brand-primary text-white text-sm font-bold rounded-2xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/25 group-hover/item:scale-105"
                                                    >
                                                        Hemen Randevu
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold">Bu dükkan için henüz hizmet eklenmemiş.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4">
                            <div className="space-y-6 sticky top-10">
                                <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-[2rem] shadow-sm">
                                    <h3 className="font-black text-slate-900 text-xl mb-6 tracking-tight">İletişim Bilgileri</h3>

                                    <div className="space-y-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                                                <Phone size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TELEFON</p>
                                                <p className="font-bold text-slate-800">{shop.phone_number || 'Belirtilmemiş'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                                                <Mail size={18} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">E-POSTA</p>
                                                <p className="font-bold text-slate-800 truncate text-sm lowercase">{shop.email?.toLowerCase() || 'Belirtilmemiş'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ADRES</p>
                                                <p className="font-bold text-slate-800 text-sm">İstanbul, Türkiye</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-8 border-t border-slate-200/50">
                                        <h4 className="font-black text-slate-900 text-sm mb-4 tracking-tight">ÇALIŞMA SAATLERİ</h4>
                                        <div className="space-y-3 font-bold text-xs">
                                            <div className="flex justify-between text-slate-500">
                                                <span>Pazartesi - Cuma</span>
                                                <span className="text-slate-800">09:00 - 18:00</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500">
                                                <span>Cumartesi</span>
                                                <span className="text-slate-800">10:00 - 15:00</span>
                                            </div>
                                            <div className="flex justify-between text-red-400">
                                                <span>Pazar</span>
                                                <span>Kapalı</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopDetail;
