import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { appointmentService } from '../../services/appointments';
import { useNavigate, useSearchParams } from 'react-router-dom';

const BookAppointment = () => {
    const [searchParams] = useSearchParams();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        service_id: searchParams.get('serviceId') || '',
        date: '',
        time: '',
        notes: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchServices();
        // If query param exists, update state (redundant if initial state works, but safe for updates)
        const sId = searchParams.get('serviceId');
        if (sId) {
            setFormData(prev => ({ ...prev, service_id: sId }));
        }
    }, [searchParams]);

    const fetchServices = async () => {
        try {
            const tradesmanId = searchParams.get('tradesmanId');

            let query = supabase
                .from('services')
                .select(`*, tradesman:profiles!tradesman_id(full_name, business_name)`);

            if (tradesmanId) {
                query = query.eq('tradesman_id', tradesmanId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const [isWaitlist, setIsWaitlist] = useState(false);

    useEffect(() => {
        if (formData.service_id && formData.date && formData.time) {
            checkAvailability();
        } else {
            setIsWaitlist(false);
        }
    }, [formData.service_id, formData.date, formData.time]);

    const checkAvailability = async () => {
        const selectedService = services.find(s => s.id === formData.service_id);
        if (!selectedService) return;

        const startTime = new Date(`${formData.date}T${formData.time}`);
        const endTime = new Date(startTime.getTime() + selectedService.duration * 60000);

        // Check for overlapping appointments
        // Note: Simple overlap logic: (StartA < EndB) and (EndA > StartB)
        const { data, error } = await supabase
            .from('appointments')
            .select('id')
            .eq('tradesman_id', selectedService.tradesman_id)
            .neq('status', 'cancelled')
            .lt('start_time', endTime.toISOString())
            .gt('end_time', startTime.toISOString());

        if (error) {
            console.error('Availability check failed:', error);
            return;
        }

        setIsWaitlist(data && data.length > 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('İşlem yapmak için giriş yapmalısınız.');
                navigate('/login');
                return;
            }

            const selectedService = services.find(s => s.id === formData.service_id);
            if (!selectedService) throw new Error('Hizmet seçilmedi');

            if (isWaitlist) {
                // Join Waiting List
                const { error } = await supabase.from('waiting_list').insert([{
                    user_id: user.id,
                    tradesman_id: selectedService.tradesman_id,
                    service_id: selectedService.id,
                    preferred_date: formData.date,
                    status: 'waiting'
                }]);

                if (error) throw error;
                alert('Bekleme listesine başarıyla eklendiniz! Randevu iptal olursa size haber vereceğiz.');
            } else {
                // Book Appointment
                const startTime = new Date(`${formData.date}T${formData.time}`);
                const endTime = new Date(startTime.getTime() + selectedService.duration * 60000);

                await appointmentService.createAppointment({
                    customer_id: user.id,
                    tradesman_id: selectedService.tradesman_id,
                    service_id: selectedService.id,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    notes: formData.notes,
                    status: 'pending'
                });
                alert('Randevunuz başarıyla oluşturuldu!');
            }

            navigate('/dashboard');
        } catch (error) {
            alert('Hata: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Randevu Oluştur</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hizmet Seçin</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.service_id}
                        onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                        required
                    >
                        <option value="">Hizmet Seçiniz...</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name} - {service.price} TL ({service.duration} dk) - {service.tradesman?.business_name || service.tradesman?.full_name}
                            </option>
                        ))}
                    </select>
                    {services.length === 0 && <p className="text-sm text-red-500 mt-1">Görünürde hiç hizmet yok. Önce bir esnaf olarak hizmet eklemelisiniz.</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                        <input
                            type="date"
                            className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Saat</label>
                        <input
                            type="time"
                            className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notlar (İsteğe bağlı)</label>
                    <textarea
                        className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                </div>

                {isWaitlist && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded text-sm flex items-center gap-2">
                        <span>⚠️ Bu saatte başka bir randevu mevcut. Ancak bekleme listesine katılarak iptal durumunda haberdar olabilirsiniz.</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting || services.length === 0}
                    className={`w-full text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 ${isWaitlist
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {submitting
                        ? 'İşleniyor...'
                        : isWaitlist
                            ? 'Sıraya Gir (Bekleme Listesi)'
                            : 'Randevuyu Onayla'
                    }
                </button>
            </form>
        </div>
    );
};
export default BookAppointment;
