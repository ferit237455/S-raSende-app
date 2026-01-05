import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Trash2, Plus, Clock, DollarSign, Tag, AlignLeft, X, Sparkles, CheckCircle2 } from 'lucide-react';

// Skeleton Card
const ServiceCardSkeleton = () => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-full mb-4" />
        <div className="flex gap-4">
            <div className="h-8 bg-gray-100 rounded-full w-20" />
            <div className="h-8 bg-gray-200 rounded-full w-24" />
        </div>
    </div>
);

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newService, setNewService] = useState({ name: '', duration: 30, price: 0, description: '' });
    const [successMessage, setSuccessMessage] = useState('');
    const isMountedRef = useRef(true);

    const fetchServices = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!isMountedRef.current) return;

            if (!session?.user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('tradesman_id', session.user.id)
                .order('created_at', { ascending: false });

            if (!isMountedRef.current) return;

            if (error) throw error;
            setServices(data || []);
        } catch (err) {
            if (isMountedRef.current) {
                console.error('Error fetching services:', err);
                setError('Hizmetler yüklenirken bir hata oluştu.');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        fetchServices();

        return () => {
            isMountedRef.current = false;
        };
    }, [fetchServices]);

    const handleAddService = useCallback(async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('services').insert([{
                ...newService,
                tradesman_id: user.id
            }]);

            if (error) throw error;

            setNewService({ name: '', duration: 30, price: 0, description: '' });
            setIsAdding(false);
            setSuccessMessage('Hizmet başarıyla eklendi!');
            setTimeout(() => setSuccessMessage(''), 3000);
            fetchServices();
        } catch (err) {
            alert('Hata: ' + err?.message);
        } finally {
            setSubmitting(false);
        }
    }, [newService, fetchServices]);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('Bu hizmeti silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
            fetchServices();
        } catch (err) {
            alert('Silinemedi: ' + err?.message);
        }
    }, [fetchServices]);

    const handleInputChange = useCallback((field, value) => {
        setNewService(prev => ({ ...prev, [field]: value }));
    }, []);

    if (loading) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
                        <div className="h-4 bg-gray-100 rounded w-64" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ServiceCardSkeleton />
                    <ServiceCardSkeleton />
                    <ServiceCardSkeleton />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <X size={32} />
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
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hizmet Yönetimi</h1>
                    <p className="text-slate-500 font-medium mt-1">Sunduğunuz hizmetleri ekleyin ve yönetin</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${isAdding
                            ? 'bg-slate-100 text-slate-600 shadow-none hover:bg-slate-200'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:-translate-y-0.5'
                        }`}
                >
                    {isAdding ? (
                        <>
                            <X size={20} /> Formu Kapat
                        </>
                    ) : (
                        <>
                            <Plus size={20} /> Yeni Hizmet Ekle
                        </>
                    )}
                </button>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 font-semibold animate-in fade-in slide-in-from-top-4 duration-300">
                    <CheckCircle2 size={20} />
                    {successMessage}
                </div>
            )}

            {/* Add Service Form */}
            {isAdding && (
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white">
                            <Sparkles size={20} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">Yeni Hizmet Bilgileri</h2>
                    </div>

                    <form onSubmit={handleAddService}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Hizmet Adı</label>
                                    <div className="relative">
                                        <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Örn: Saç Kesimi"
                                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                                            value={newService.name}
                                            onChange={e => handleInputChange('name', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Açıklama</label>
                                    <div className="relative">
                                        <AlignLeft size={18} className="absolute left-4 top-4 text-slate-400" />
                                        <textarea
                                            placeholder="Hizmet hakkında kısa bir açıklama..."
                                            rows={3}
                                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 resize-none"
                                            value={newService.description}
                                            onChange={e => handleInputChange('description', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Fiyat (TL)</label>
                                    <div className="relative">
                                        <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                                            value={newService.price}
                                            onChange={e => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Süre (Dakika)</label>
                                    <div className="relative">
                                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            min="5"
                                            step="5"
                                            placeholder="30"
                                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                                            value={newService.duration}
                                            onChange={e => handleInputChange('duration', parseInt(e.target.value) || 30)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} />
                                                Hizmeti Kaydet
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Services List */}
            {!services || !Array.isArray(services) || services.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Tag size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Henüz Hizmet Eklenmemiş</h3>
                    <p className="text-slate-500 mb-6">İlk hizmetinizi ekleyerek başlayın</p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                        <Plus size={18} className="inline mr-2" />
                        Hizmet Ekle
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div
                            key={service?.id}
                            className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 relative group hover:shadow-2xl hover:shadow-slate-300/50 hover:scale-[1.02] transition-all duration-300"
                        >
                            {/* Delete Button */}
                            <button
                                onClick={() => handleDelete(service?.id)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                title="Sil"
                            >
                                <Trash2 size={18} />
                            </button>

                            {/* Service Name */}
                            <h3 className="text-xl font-black text-slate-900 mb-2 pr-10">{service?.name}</h3>

                            {/* Description */}
                            <p className="text-slate-500 text-sm mb-5 min-h-[40px] line-clamp-2">
                                {service?.description || 'Açıklama eklenmemiş.'}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold">
                                    <Clock size={14} />
                                    {service?.duration} dk
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-black">
                                    <DollarSign size={14} />
                                    {service?.price} TL
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(Services);
