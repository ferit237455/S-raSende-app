import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Store, ChevronRight, Sparkles } from 'lucide-react';

// Skeleton Card Component
const SkeletonCard = () => (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
        <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded-lg animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-1/2" />
            <div className="flex gap-2 mt-4">
                <div className="h-6 bg-gray-100 rounded-full animate-pulse w-16" />
                <div className="h-6 bg-gray-100 rounded-full animate-pulse w-20" />
            </div>
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse mt-4" />
        </div>
    </div>
);

// Main categories list
const MAIN_CATEGORIES = ['Berber', 'Kuaför', 'Güzellik Salonu', 'Diyetisyen', 'Pet Grooming', 'Diş Hekimi', 'Psikolog'];

const Explore = () => {
    const [tradesmen, setTradesmen] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tümü');
    const [error, setError] = useState(null);
    const [imageLoaded, setImageLoaded] = useState({});
    const navigate = useNavigate();
    const isMountedRef = useRef(true);

    // Memoized fetch function with AbortController
    const fetchTradesmen = useCallback(async (signal) => {
        if (!isMountedRef.current) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    services (*)
                `)
                .eq('user_type', 'tradesman');

            if (signal?.aborted || !isMountedRef.current) return;

            if (fetchError) throw fetchError;
            
            if (isMountedRef.current) {
                setTradesmen(data || []);
            }
        } catch (err) {
            if (signal?.aborted || !isMountedRef.current) return;
            console.error('Error fetching tradesmen:', err);
            if (isMountedRef.current) {
                setError('Esnaf listesi yüklenirken bir sorun oluştu.');
            }
        } finally {
            if (isMountedRef.current && !signal?.aborted) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        const abortController = new AbortController();

        fetchTradesmen(abortController.signal);

        return () => {
            isMountedRef.current = false;
            abortController.abort();
        };
    }, [fetchTradesmen]);

    // Memoized filter functions
    const safeStr = useCallback((str) => (str || '').toString().toLowerCase().trim(), []);

    const inferCategory = useCallback((tradesman) => {
        if (!tradesman) return 'Diğer';

        // First check if category is set directly in profile
        if (tradesman?.category) {
            // Check if it's a main category
            const isMainCategory = MAIN_CATEGORIES.some(cat => safeStr(cat) === safeStr(tradesman.category));
            return isMainCategory ? tradesman.category : 'Diğer';
        }

        const serviceNames = Array.isArray(tradesman?.services)
            ? tradesman.services.map(s => safeStr(s?.name)).join(' ')
            : '';
        const businessName = safeStr(tradesman?.business_name);
        const combined = `${serviceNames} ${businessName}`;

        if (combined.includes('saç') || combined.includes('sakal') || combined.includes('tıraş') || combined.includes('berber')) return 'Berber';
        if (combined.includes('kuaför')) return 'Kuaför';
        if (combined.includes('manikür') || combined.includes('pedikür') || combined.includes('cilt') || combined.includes('güzellik')) return 'Güzellik Salonu';
        if (combined.includes('diyet') || combined.includes('beslenme') || combined.includes('kilo')) return 'Diyetisyen';
        if (combined.includes('köpek') || combined.includes('kedi') || combined.includes('pet') || combined.includes('pati')) return 'Pet Grooming';
        if (combined.includes('terapi') || combined.includes('psiko') || combined.includes('danışmanlık')) return 'Psikolog';
        if (combined.includes('diş')) return 'Diş Hekimi';

        return 'Diğer';
    }, [safeStr]);

    const tradesmenWithCategory = useMemo(() => {
        return Array.isArray(tradesmen) ? tradesmen.map(t => ({
            ...t,
            displayCategory: inferCategory(t)
        })) : [];
    }, [tradesmen, inferCategory]);

    const filteredTradesmen = useMemo(() => {
        return tradesmenWithCategory.filter(t => {
            if (!t) return false;
            const matchesSearch = safeStr(t?.business_name).includes(safeStr(searchTerm)) ||
                safeStr(t?.full_name).includes(safeStr(searchTerm));

            if (selectedCategory === 'Tümü') {
                return matchesSearch;
            }

            if (selectedCategory === 'Diğer') {
                // Show shops that don't match any main category
                const isMainCategory = MAIN_CATEGORIES.some(cat => safeStr(cat) === safeStr(t?.displayCategory));
                return matchesSearch && !isMainCategory;
            }

            return matchesSearch && safeStr(t?.displayCategory) === safeStr(selectedCategory);
        });
    }, [tradesmenWithCategory, searchTerm, selectedCategory, safeStr]);

    const handleImageLoad = useCallback((id) => {
        setImageLoaded(prev => ({ ...prev, [id]: true }));
    }, []);

    // Filter button styles
    const getFilterButtonClass = useCallback((cat) => {
        const isSelected = selectedCategory === cat;
        const baseClass = "px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-semibold transition-all duration-300 border";

        if (isSelected) {
            return `${baseClass} bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white border-transparent shadow-lg shadow-purple-500/30`;
        }
        return `${baseClass} bg-white/80 backdrop-blur-sm text-gray-700 border-white/50 hover:bg-white hover:shadow-md hover:border-indigo-200 hover:text-indigo-600`;
    }, [selectedCategory]);

    // Filter categories including "Diğer"
    const filterCategories = useMemo(() => ['Tümü', ...MAIN_CATEGORIES, 'Diğer'], []);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl text-center max-w-md border border-white/50">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <p className="text-gray-800 font-medium mb-4">{error}</p>
                    <button 
                        onClick={() => {
                            const abortController = new AbortController();
                            fetchTradesmen(abortController.signal);
                        }} 
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:opacity-90 font-semibold transition-all hover:shadow-lg"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mesh relative overflow-hidden">
            {/* Mesh Gradient Background Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -translate-y-1/2" />
                <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px] translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Hero Section - Clean White with Subtle Texture */}
            <div className="relative pt-12 sm:pt-16 pb-6 sm:pb-8 px-4">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-100 shadow-sm mb-4 sm:mb-6">
                        <Sparkles size={14} className="sm:w-4 sm:h-4 text-indigo-600" />
                        <span className="text-xs sm:text-sm font-semibold text-indigo-700">Profesyonel Hizmetler</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight mb-3 sm:mb-4 px-2 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                        İhtiyacın Olan Hizmeti Bul
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-10 px-4 max-w-2xl mx-auto">
                        Binlerce profesyonel arasından size en uygun olanı keşfedin
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto px-2">
                        <Search className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input
                            type="text"
                            placeholder="Dükkan veya hizmet ara..."
                            className="w-full py-3 sm:py-4 pl-10 sm:pl-14 pr-4 sm:pr-6 rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-300 shadow-lg text-sm sm:text-base lg:text-lg font-medium placeholder:text-gray-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
                {/* Category Filters */}
                <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide mb-8">
                    {filterCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={getFilterButtonClass(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : filteredTradesmen.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTradesmen.map((tradesman) => (
                            <div
                                key={tradesman?.id || Math.random()}
                                className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 overflow-hidden hover:shadow-2xl hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer"
                                onClick={() => navigate(`/shop/${tradesman?.id}`)}
                            >
                                {/* Image Section with Gradient Overlay */}
                                <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-50 relative overflow-hidden">
                                    {/* Skeleton pulse while loading */}
                                    {!imageLoaded[tradesman?.id] && tradesman?.image_url && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
                                    )}

                                    {tradesman?.image_url ? (
                                        <img
                                            src={tradesman.image_url}
                                            alt={tradesman?.business_name || 'Dükkan'}
                                            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded[tradesman?.id] ? 'opacity-100' : 'opacity-0'
                                                }`}
                                            onLoad={() => handleImageLoad(tradesman?.id)}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Store size={48} className="text-indigo-300" />
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                                    {/* Category Badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold rounded-full shadow-lg border border-white/50">
                                            {tradesman?.displayCategory}
                                        </span>
                                    </div>

                                    {/* Shop Name on Image */}
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl font-bold text-white truncate drop-shadow-lg">
                                            {tradesman?.business_name || tradesman?.full_name || 'İsimsiz Dükkan'}
                                        </h3>
                                        <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                                            <MapPin size={14} />
                                            İstanbul
                                        </p>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-5">
                                    {/* Services */}
                                    <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                                        {tradesman?.services && Array.isArray(tradesman.services) && tradesman.services.slice(0, 3).map((service, idx) => (
                                            <span key={service?.id || idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                                                {service?.name}
                                            </span>
                                        ))}
                                        {(!tradesman?.services || tradesman.services.length === 0) && (
                                            <span className="text-xs text-gray-400 italic">Hizmet bilgisi yok</span>
                                        )}
                                    </div>

                                    {/* CTA Button */}
                                    <button className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20">
                                        Dükkanı İncele
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-indigo-200">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                            <Store size={40} className="text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Bu kategoride henüz dükkan bulunmuyor</h3>
                        <p className="text-gray-500 mb-6">Farklı bir kategori veya arama terimi deneyin</p>
                        <button
                            onClick={() => { setSelectedCategory('Tümü'); setSearchTerm(''); }}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg"
                        >
                            Tüm Dükkanları Göster
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(Explore);
