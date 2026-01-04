import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, Phone, Mail, Clock, DollarSign, Calendar } from 'lucide-react';

const ShopDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchShopDetails();
        // Acil durum zaman aşımı
        const timeout = setTimeout(() => setLoading(false), 5000);
        return () => clearTimeout(timeout);
    }, [id]);

    const fetchShopDetails = async () => {
        try {
            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;
            setShop(profileData);

            // Fetch services
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('*')
                .eq('tradesman_id', id)
                .order('price', { ascending: true });

            if (servicesError) throw servicesError;
            setServices(servicesData || []);

        } catch (err) {
            console.error('Error details:', err);
            setError('Dükkan detayları yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookService = (serviceId) => {
        // Navigate to book appointment page, passing state via location state if needed
        // For now, simple redirect or query param
        navigate(`/book-appointment?tradesmanId=${id}&serviceId=${serviceId}`);
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-2 text-gray-500">Yükleniyor...</p>
        </div>
    );

    if (error) return (
        <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-lg shadow my-6">
            <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-100 inline-block">
                <p className="font-bold text-lg">Bir Sorun Oluştur!</p>
                <p className="mt-2 text-sm">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-600 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition font-medium">
                    Sayfayı Yenile
                </button>
            </div>
        </div>
    );

    if (!shop) return <div className="p-8 text-center text-red-500 bg-gray-50 h-[50vh] flex items-center justify-center">Dükkan bulunamadı.</div>;

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 my-6">
            <div className="h-48 bg-blue-600 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-6 left-8 flex items-end">
                    <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg mr-4 drop-shadow-md">
                        <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl">
                            {shop.business_name?.charAt(0) || shop.full_name?.charAt(0)}
                        </div>
                    </div>
                    <div className="text-white mb-2">
                        <h1 className="text-3xl font-bold">{shop.business_name || shop.full_name}</h1>
                        <p className="opacity-90 flex items-center gap-1 text-sm bg-blue-700/50 px-2 py-0.5 rounded-full inline-flex mt-1">
                            <MapPin size={14} /> İstanbul
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="col-span-2">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Hizmetler</h2>

                        <div className="space-y-4">
                            {services && Array.isArray(services) && services?.map(service => (
                                <div key={service?.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-white hover:shadow-md transition border border-gray-100 group px-5 py-4">
                                    <div className="mb-2 sm:mb-0">
                                        <h3 className="font-bold text-gray-900 text-lg">{service?.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{service?.description}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {service?.duration} dk</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                        <span className="font-bold text-blue-600 text-lg">{service?.price} TL</span>
                                        <button
                                            onClick={() => handleBookService(service?.id)}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm opacity-90 hover:opacity-100"
                                        >
                                            Randevu Al
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!services || services?.length === 0) && (
                                <p className="text-gray-500">Bu dükkan için henüz hizmet eklenmemiş.</p>
                            )}
                        </div>
                    </div>

                    <div className="col-span-1">
                        <div className="bg-gray-50 p-6 rounded-xl space-y-4 border border-gray-100 h-fit sticky top-4">
                            <h3 className="font-bold text-gray-900 mb-2">İletişim Bilgileri</h3>

                            {shop.phone_number && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Phone size={18} className="text-blue-500" />
                                    <span>{shop.phone_number}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-gray-600">
                                <Mail size={18} className="text-blue-500" />
                                <span className="text-sm break-all">{shop.email}</span>
                            </div>

                            <hr className="border-gray-200 my-4" />

                            <div className="text-sm text-gray-500">
                                <p className="mb-2 font-medium text-gray-700">Çalışma Saatleri</p>
                                <div className="flex justify-between"><span>Pzt - Cum:</span> <span>09:00 - 18:00</span></div>
                                <div className="flex justify-between"><span>Cmt:</span> <span>10:00 - 15:00</span></div>
                                <div className="flex justify-between text-red-400"><span>Paz:</span> <span>Kapalı</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopDetail;
