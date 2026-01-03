import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Trash2, Plus, Clock, DollarSign } from 'lucide-react';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newService, setNewService] = useState({ name: '', duration: 30, price: 0, description: '' });

    const fetchServices = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('tradesman_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
        // Acil durum zaman aşımı
        const timeout = setTimeout(() => setLoading(false), 5000);
        return () => clearTimeout(timeout);
    }, []);

    const [submitting, setSubmitting] = useState(false);

    const handleAddService = async (e) => {
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
            fetchServices();
        } catch (error) {
            alert('Hata: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu hizmeti silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
            fetchServices();
        } catch (error) {
            alert('Silinemedi: ' + error.message);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Hizmet Yönetimi</h1>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} /> Yeni Hizmet Ekle
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-lg shadow mb-8 border border-blue-100">
                    <h2 className="text-lg font-semibold mb-4">Yeni Hizmet Bilgileri</h2>
                    <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Adı</label>
                            <input
                                type="text"
                                className="w-full border rounded p-2"
                                value={newService.name}
                                onChange={e => setNewService({ ...newService, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Dakika)</label>
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={newService.duration}
                                onChange={e => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (TL)</label>
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={newService.price}
                                onChange={e => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                            <input
                                type="text"
                                className="w-full border rounded p-2"
                                value={newService.description}
                                onChange={e => setNewService({ ...newService, description: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-10">Yükleniyor...</div>
            ) : services.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">Henüz hiç hizmet eklenmemiş.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div key={service.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border border-gray-100 relative group">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{service.name}</h3>
                            <p className="text-gray-600 text-sm mb-4 min-h-[40px]">{service.description || 'Açıklama yok.'}</p>

                            <div className="flex items-center gap-4 text-gray-500 text-sm mb-4">
                                <div className="flex items-center gap-1">
                                    <Clock size={16} /> {service.duration} dk
                                </div>
                                <div className="flex items-center gap-1 font-semibold text-green-600">
                                    <DollarSign size={16} /> {service.price} TL
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(service.id)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                title="Sil"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Services;
