import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';

const Explore = () => {
    const [tradesmen, setTradesmen] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tümü');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (isMounted) await fetchTradesmen();
        };

        loadData();

        // Acil durum zaman aşımı
        const timeout = setTimeout(() => setLoading(false), 5000);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
        };
    }, []);

    const fetchTradesmen = async () => {
        setLoading(true);
        setError(null);
        setTradesmen([]); // Eski veriyi temizle
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    services (*)
                `)
                .eq('user_type', 'tradesman');

            if (error) throw error;
            setTradesmen(data || []);
        } catch (error) {
            console.error('Error fetching tradesmen:', error);
            setError('Esnaf listesi yüklenirken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const staticCategories = ['Tümü', 'Berber', 'Güzellik Salonu', 'Diyetisyen', 'Pet Grooming', 'Diş Hekimi', 'Psikolog'];

    // Safe string helper
    const safeStr = (str) => (str || '').toString().toLowerCase().trim();

    // Intelligent category inference
    const inferCategory = (tradesman) => {
        if (!tradesman) return 'Diğer';

        const serviceNames = Array.isArray(tradesman.services)
            ? tradesman.services.map(s => safeStr(s?.name)).join(' ')
            : '';
        const businessName = safeStr(tradesman.business_name);
        const combined = `${serviceNames} ${businessName}`;

        if (combined.includes('saç') || combined.includes('sakal') || combined.includes('tıraş') || combined.includes('berber')) return 'Berber';
        if (combined.includes('manikür') || combined.includes('pedikür') || combined.includes('cilt') || combined.includes('güzellik')) return 'Güzellik Salonu';
        if (combined.includes('diyet') || combined.includes('beslenme') || combined.includes('kilo')) return 'Diyetisyen';
        if (combined.includes('köpek') || combined.includes('kedi') || combined.includes('pet') || combined.includes('pati')) return 'Pet Grooming';
        if (combined.includes('terapi') || combined.includes('psiko') || combined.includes('danışmanlık')) return 'Psikolog';
        if (combined.includes('diş')) return 'Diş Hekimi';

        return 'Diğer';
    };

    // Prepare data with categories safely
    const tradesmenWithCategory = Array.isArray(tradesmen) ? tradesmen.map(t => ({
        ...t,
        category: inferCategory(t)
    })) : [];

    // Filter
    const filteredTradesmen = tradesmenWithCategory.filter(t => {
        if (!t) return false;
        const matchesSearch = safeStr(t.business_name).includes(safeStr(searchTerm)) ||
            safeStr(t.full_name).includes(safeStr(searchTerm));

        const isAll = selectedCategory === 'Tümü' || selectedCategory === 'all';
        const matchesCategory = isAll ? true : safeStr(t.category) === safeStr(selectedCategory);

        return matchesSearch && matchesCategory;
    });

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Yükleniyor...</p>
        </div>
    );

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <div className="text-red-500 text-4xl mb-2">⚠️</div>
                    <p className="text-gray-800 mb-4">{error}</p>
                    <button onClick={fetchTradesmen} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Tekrar Dene</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-blue-600 pb-24 pt-12 px-4 shadow-lg">
                <div className="max-w-3xl mx-auto text-center text-white">
                    <h1 className="text-3xl font-bold mb-4">İhtiyacın Olan Hizmeti Bul</h1>
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Dükkan veya hizmet ara..."
                            className="w-full py-3 pl-10 pr-4 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 -mt-16 pb-12">
                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
                    {staticCategories && Array.isArray(staticCategories) && staticCategories?.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors shadow-sm ${selectedCategory === cat
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTradesmen && Array.isArray(filteredTradesmen) && filteredTradesmen.length > 0 ? (
                        filteredTradesmen?.map((tradesman) => (
                            <div key={tradesman?.id || Math.random()} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                                <div className="h-28 bg-gray-100 relative">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div className="absolute -bottom-6 left-6">
                                        <div className="w-16 h-16 bg-white rounded-lg p-1 shadow-md">
                                            <div className="w-full h-full bg-blue-50 rounded flex items-center justify-center text-blue-600 font-bold text-xl uppercase">
                                                {(tradesman?.business_name || tradesman?.full_name || '?').charAt(0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 px-6 pb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                                        {tradesman?.business_name || tradesman?.full_name || 'İsimsiz Dükkan'}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                                        <MapPin size={12} /> İstanbul
                                        <span className="mx-1">•</span>
                                        <span className="text-blue-600 font-medium">{tradesman?.category}</span>
                                    </p>

                                    <div className="space-y-2 mb-6 min-h-[60px]">
                                        <div className="flex flex-wrap gap-2">
                                            {tradesman?.services && Array.isArray(tradesman.services) && tradesman?.services?.slice(0, 3)?.map((service, idx) => (
                                                <span key={service?.id || idx} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded border border-gray-100">
                                                    {service?.name}
                                                </span>
                                            ))}
                                            {(!tradesman?.services || tradesman?.services?.length === 0) && (
                                                <span className="text-xs text-gray-400 italic">Hizmet bilgisi yok</span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/shop/${tradesman?.id}`)}
                                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                                    >
                                        Dükkanı İncele
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
                            Aradığınız kriterlere uygun dükkan bulunamadı.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Explore;
