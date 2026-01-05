import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('user_type')
                    .eq('id', user.id)
                    .single();

                if (profile?.user_type === 'tradesman') {
                    navigate('/dashboard');
                } else {
                    navigate('/explore');
                }
            }
        };
        checkUser();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('user_type')
                    .eq('id', user.id)
                    .single();

                if (profile?.user_type === 'tradesman') {
                    navigate('/dashboard');
                } else {
                    navigate('/explore');
                }
            }
        } catch (err) {
            setError(err.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı.' : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 sm:px-6 py-8 bg-mesh">
            <div className="w-full max-w-md">
                <div className="text-center mb-6 sm:mb-10">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                        Tekrar Hoş Geldiniz
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">
                        SıraSende ile dilediğiniz esnaftan hızlıca randevu alın.
                    </p>
                </div>

                <div className="glass-card p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <LogIn size={80} className="text-brand-primary" />
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50/50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Giriş Yap</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-600 font-medium">
                        Hesabınız yok mu?{' '}
                        <Link to="/register" className="text-brand-primary font-bold hover:underline transition-all">
                            Ücretsiz Kayıt Olun
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

