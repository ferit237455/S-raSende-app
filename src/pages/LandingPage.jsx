import { useNavigate } from 'react-router-dom';
import { Scissors, Sparkles, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 via-blue-400/20 to-purple-600/20" />
                <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/30 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-blue-400/30 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="max-w-7xl mx-auto flex items-center">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                <Scissors className="text-white w-4 h-4 sm:w-6 sm:h-6" />
                            </div>
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight">SıraSende</h1>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
                    <div className="max-w-5xl mx-auto text-center space-y-8 sm:space-y-10 lg:space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        {/* Main Heading */}
                        <div className="space-y-4 sm:space-y-6">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 tracking-tighter leading-none px-2">
                                Randevunu
                                <br />
                                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    Kolayca Al
                                </span>
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium px-4">
                                Esnaf ve müşteriler için modern, hızlı ve güvenilir randevu yönetim sistemi. 
                                Sıranı al, zamanını yönet.
                            </p>
                        </div>

                        {/* CTA Button */}
                        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000" style={{ animationDelay: '200ms' }}>
                            <button
                                onClick={() => navigate('/explore')}
                                className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-300"
                            >
                                <Sparkles size={20} className="sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
                                <span>Şimdi Sıranı Al</span>
                                <ArrowRight size={20} className="sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </main>

                {/* Minimalist Footer */}
                <footer className="p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-10 duration-1000" style={{ animationDelay: '600ms' }}>
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <Scissors className="text-white w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <span className="text-sm sm:text-base text-slate-500 font-medium">SıraSende</span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-400">
                            &copy; 2026 Tüm hakları saklıdır.
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
