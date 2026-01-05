import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Store, Camera, Save, Star, ChevronDown, Check, Loader2, Link, ImageOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
    'Berber',
    'Güzellik Salonu',
    'Kuaför',
    'Dövme Stüdyosu',
    'Masaj Salonu',
    'Spa & Terapi',
    'Diğer'
];

const MyShop = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageError, setImageError] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            fetchProfile();
        } else {
            // If after 3 seconds we still have no user, something is wrong
            const timer = setTimeout(() => {
                if (!user) setLoading(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user) {
            console.log('MyShop: No user object from AuthContext yet');
            return;
        }
        try {
            console.log('MyShop: Fetching profile for', user.id);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('MyShop: Profile fetch error', error);
                throw error;
            }
            console.log('MyShop: Profile fetched', data);
            setProfile(data);
            setSelectedCategory(data?.category || '');
            setBusinessName(data?.business_name || data?.full_name || '');
            setImageUrl(data?.image_url || '');
            setImageError(false);
        } catch (error) {
            console.error('Error fetching profile in MyShop:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUrlChange = (e) => {
        const url = e.target.value;
        setImageUrl(url);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const isValidUrl = (string) => {
        if (!string) return true; // Empty is allowed
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Validate URL if provided
            if (imageUrl && !isValidUrl(imageUrl)) {
                setMessage({ type: 'error', text: 'Geçersiz resim linki. Lütfen geçerli bir URL girin.' });
                setSaving(false);
                return;
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    business_name: businessName,
                    category: selectedCategory,
                    image_url: imageUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setMessage({ type: 'success', text: 'Dükkan bilgileriniz başarıyla güncellendi.' });
            fetchProfile();
        } catch (error) {
            console.error('Error updating shop:', error);
            setMessage({ type: 'error', text: 'Güncelleme sırasında bir hata oluştu: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
            <p className="text-slate-500 font-medium">Bilgiler yükleniyor...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <Store className="text-brand-primary" size={32} />
                    Dükkan Ayarları
                </h1>
                <p className="text-slate-500 mt-2">Dükkanınızın profilini ve kategorisini buradan yönetebilirsiniz.</p>
            </header>

            <div className="glass-card overflow-hidden border-transparent shadow-2xl relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-secondary/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>

                <form onSubmit={handleSave} className="p-8 md:p-12 space-y-10 relative z-10">
                    {message.text && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                            {message.type === 'success' ? <Check size={20} /> : <Star size={20} />}
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Image URL Section */}
                        <div className="space-y-4">
                            <label className="text-sm font-black text-slate-900 uppercase tracking-widest block ml-1">
                                DÜKKAN FOTOĞRAFI
                            </label>

                            {/* Preview */}
                            <div className="aspect-video w-full rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center relative transition-all">
                                {imageUrl && !imageError ? (
                                    <img
                                        src={imageUrl}
                                        alt="Dükkan Önizleme"
                                        className="w-full h-full object-cover"
                                        onError={handleImageError}
                                    />
                                ) : (
                                    <div className="text-slate-300 flex flex-col items-center gap-3">
                                        {imageError ? (
                                            <>
                                                <ImageOff size={48} strokeWidth={1.5} className="text-red-300" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-red-400">Resim Yüklenemedi</span>
                                            </>
                                        ) : (
                                            <>
                                                <Camera size={48} strokeWidth={1.5} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Görsel Linki Girin</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* URL Input */}
                            <div className="relative">
                                <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={handleImageUrlChange}
                                    className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-slate-900 font-medium focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all text-sm"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <p className="text-xs text-slate-400 text-center font-medium italic">
                                Lütfen sadece .jpg veya .png uzantılı, doğrudan bir resim bağlantısı (URL) yapıştırınız.
                            </p>
                        </div>

                        {/* Shop Details Section */}
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-900 uppercase tracking-widest block ml-1">
                                    DÜKKAN KATEGORİSİ
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled>Kategori Seçin</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-900 uppercase tracking-widest block ml-1">
                                    İŞLETME ADI
                                </label>
                                <input
                                    type="text"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                                    placeholder="İşletme adınızı girin"
                                    required
                                />
                                <p className="text-[10px] text-slate-400 font-medium px-1">Müşteriler dükkanınızı bu isimle görecektir.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary w-full md:w-auto px-12 py-4 flex items-center justify-center gap-3 text-base shadow-brand-primary/20 hover:shadow-brand-primary/40"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    KAYDEDİLİYOR...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    DEĞİŞİKLİKLERİ KAYDET
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyShop;
