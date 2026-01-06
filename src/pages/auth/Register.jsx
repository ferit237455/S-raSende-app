import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Briefcase, UserPlus, ArrowRight } from 'lucide-react';

const Register = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('customer'); // Default user type
    const [businessName, setBusinessName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Önce email kontrolü yap - kullanıcı zaten var mı?
            const { data: existingUsers } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('email', email)
                .maybeSingle();

            if (existingUsers) {
                setError('Bu e-posta adresiyle zaten bir hesap mevcut. Lütfen giriş yapmayı deneyin.');
                setLoading(false);
                return;
            }

            // Auth kaydı oluştur
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                // E-posta zaten kayıtlı hatası için özel mesaj
                if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
                    throw new Error('Bu e-posta adresiyle zaten bir hesap mevcut. Lütfen giriş yapmayı deneyin.');
                }
                throw authError;
            }

            if (authData.user) {
                // Profil kaydı için önce kontrol et, sonra upsert kullan
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', authData.user.id)
                    .maybeSingle();

                // Upsert kullan: varsa güncelle, yoksa ekle
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert(
                        {
                            id: authData.user.id,
                            full_name: fullName,
                            email: email,
                            user_type: userType,
                            business_name: userType === 'tradesman' ? businessName : null,
                        },
                        {
                            onConflict: 'id',
                            ignoreDuplicates: false, // Mevcut kaydı güncelle
                        }
                    );

                if (profileError) {
                    // Duplicate key hatası için özel kontrol
                    if (profileError.code === '23505' || profileError.message?.includes('duplicate key')) {
                        // Profil zaten var, sadece güncellemeyi dene
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({
                                full_name: fullName,
                                email: email,
                                user_type: userType,
                                business_name: userType === 'tradesman' ? businessName : null,
                            })
                            .eq('id', authData.user.id);

                        if (updateError) throw updateError;
                    } else {
                        throw profileError;
                    }
                }

                alert('Kayıt başarılı! Giriş yapabilirsiniz.');
                navigate('/login');
            }
        } catch (err) {
            // Kullanıcı dostu hata mesajları
            let errorMessage = err.message;
            
            if (err.message?.includes('already registered') || err.message?.includes('already exists')) {
                errorMessage = 'Bu e-posta adresiyle zaten bir hesap mevcut. Lütfen giriş yapmayı deneyin.';
            } else if (err.message?.includes('duplicate key') || err.code === '23505') {
                errorMessage = 'Bu hesap zaten oluşturulmuş. Lütfen giriş yapmayı deneyin.';
            } else if (err.message?.includes('Password')) {
                errorMessage = 'Şifre çok kısa. Lütfen en az 6 karakter girin.';
            } else if (err.message?.includes('Invalid email')) {
                errorMessage = 'Geçersiz e-posta adresi. Lütfen doğru bir e-posta adresi girin.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 sm:px-6 py-8 sm:py-12 bg-mesh">
            <div className="w-full max-w-lg">
                <div className="text-center mb-6 sm:mb-10">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                        Aramıza Katılın
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">
                        Hızlıca hesabınızı oluşturun ve SıraSende'nin keyfini çıkarın.
                    </p>
                </div>

                <div className="glass-card p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <UserPlus size={80} className="text-brand-primary" />
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50/50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100/50 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setUserType('customer')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold text-sm ${userType === 'customer'
                                    ? 'bg-white shadow-sm text-brand-primary'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <User size={18} />
                                Müşteri
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType('tradesman')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold text-sm ${userType === 'tradesman'
                                    ? 'bg-white shadow-sm text-brand-primary'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Briefcase size={18} />
                                Esnaf
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Ad Soyad</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="glass-input w-full pl-12 pr-4 py-3 text-slate-900 placeholder:text-slate-400"
                                        placeholder="Mehmet Yılmaz"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Email Adresi</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="glass-input w-full pl-12 pr-4 py-3 text-slate-900 placeholder:text-slate-400"
                                        placeholder="ornek@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {userType === 'tradesman' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 transition-all">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">İşletme Adı</label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                                        <input
                                            type="text"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            className="glass-input w-full pl-12 pr-4 py-3 text-slate-900 placeholder:text-slate-400"
                                            placeholder="Yılmaz Berber"
                                            required={userType === 'tradesman'}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Şifre</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="glass-input w-full pl-12 pr-4 py-3 text-slate-900 placeholder:text-slate-400"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Kayıt Ol</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-600 font-medium">
                        Zaten hesabınız var mı?{' '}
                        <Link to="/login" className="text-brand-primary font-bold hover:underline transition-all">
                            Giriş Yapın
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
