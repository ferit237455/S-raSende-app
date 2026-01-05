import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { profileService } from '../../services/profiles';
import { User, Phone, Mail, Calendar, Store, Save, CheckCircle2, AlertCircle, Lock, Settings } from 'lucide-react';

// Skeleton Components
const CardSkeleton = () => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
        <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
    </div>
);

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        email: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        fetchProfile();

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await profileService.getProfile();
            if (!isMountedRef.current) return;

            if (data) {
                setProfile(data);
                setFormData({
                    full_name: data.full_name || '',
                    phone_number: data.phone_number || '',
                    email: data.email || ''
                });
            }
        } catch (err) {
            if (isMountedRef.current) {
                console.error('Error fetching profile:', err);
                setError('Profil bilgileri yüklenirken bir hata oluştu.');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await profileService.updateProfile({
                full_name: formData.full_name,
                phone_number: formData.phone_number
            });
            if (isMountedRef.current) {
                setMessage({ type: 'success', text: 'Profil başarıyla güncellendi.' });
            }
        } catch (err) {
            if (isMountedRef.current) {
                setMessage({ type: 'error', text: 'Güncelleme hatası: ' + err?.message });
            }
        } finally {
            if (isMountedRef.current) {
                setSaving(false);
            }
        }
    }, [formData]);

    // Memoized derived values
    const userInitials = useMemo(() => {
        const name = profile?.full_name || '';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
        return name.charAt(0).toUpperCase() || 'U';
    }, [profile?.full_name]);

    const memberSince = useMemo(() => {
        if (!profile?.created_at) return 'Bilinmiyor';
        return new Date(profile.created_at).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long'
        });
    }, [profile?.created_at]);

    const isTradesman = profile?.user_type === 'tradesman';

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
                {/* Hero Skeleton */}
                <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl p-8 animate-pulse">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-gray-400/30 rounded-3xl" />
                        <div>
                            <div className="h-8 bg-gray-400/30 rounded w-48 mb-3" />
                            <div className="h-4 bg-gray-400/20 rounded w-32" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-8">
                <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-xl mb-2">Bir Sorun Oluştu!</h3>
                    <p className="text-slate-500 font-medium mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-white text-red-600 px-6 py-3 rounded-xl border border-red-200 hover:bg-red-50 transition font-bold"
                    >
                        Sayfayı Yenile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-purple-600 to-brand-secondary rounded-[2rem] p-8 text-white shadow-2xl shadow-brand-primary/20">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-tr from-white/30 to-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl font-black border border-white/20 shadow-2xl">
                        {userInitials}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                            {profile?.full_name || 'Kullanıcı'}
                        </h1>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-white/80 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                                <Calendar size={16} />
                                {memberSince}'den beri üye
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                {isTradesman ? 'Esnaf' : 'Müşteri'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success/Error Message */}
            {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-semibold text-sm animate-in fade-in duration-300 ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Bento Grid Layout - 2 columns for customers, adjusted for tradesmen */}
                <div className={`grid grid-cols-1 ${isTradesman ? 'md:grid-cols-2' : 'md:grid-cols-2'} gap-6`}>
                    {/* Personal Info Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-900">Kişisel Bilgiler</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ad Soyad</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium text-slate-900"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Telefon Numarası</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        placeholder="0555 123 45 67"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Settings Card - Only Email */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                <Settings size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-900">Hesap Ayarları</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">E-posta Adresi</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email?.toLowerCase()}
                                        disabled
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                    <Lock size={12} /> E-posta adresi değiştirilemez
                                </p>
                            </div>

                            {/* Account Status Info */}
                            <div className="pt-4 mt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                                    <CheckCircle2 size={20} className="text-green-600" />
                                    <div>
                                        <p className="font-bold text-green-800 text-sm">Hesabınız Aktif</p>
                                        <p className="text-xs text-green-600">Tüm özellikler kullanılabilir</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tradesman Shop Settings Card - Full Width */}
                    {isTradesman && (
                        <div className="md:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 shadow-sm border border-amber-100 hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                    <Store size={20} />
                                </div>
                                <h2 className="text-lg font-black text-slate-900">Dükkan Bilgileri</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-white/80 rounded-xl">
                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">İşletme Adı</p>
                                    <p className="font-black text-slate-900 text-lg">{profile?.business_name || profile?.full_name}</p>
                                </div>

                                <div className="p-4 bg-white/80 rounded-xl">
                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Kategori</p>
                                    <p className="font-bold text-slate-800">{profile?.category || 'Belirtilmemiş'}</p>
                                </div>
                            </div>

                            <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-4">
                                <Settings size={12} />
                                Dükkan ayarlarını değiştirmek için "Dükkanım" sekmesini kullanın
                            </p>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end mt-8">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-gradient-to-r from-brand-primary to-purple-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-brand-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-3"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Değişiklikleri Kaydet
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default React.memo(Profile);
