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
        const checkAuthAndFetch = async () => {
            setLoading(true);
            setServices([]); // Her denemede temiz başla
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate('/login');
                    return;
                }
                await fetchServices();
            } catch (error) {
                console.error('Initial check failed:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetch();

        // Acil durum zaman aşımı
        const timeout = setTimeout(() => setLoading(false), 5000);

        const sId = searchParams.get('serviceId');
        if (sId) {
            setFormData(prev => ({ ...prev, service_id: sId }));
        }

        return () => clearTimeout(timeout);
    }, [searchParams, navigate]);

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
        }
    };

    const [isWaitlist, setIsWaitlist] = useState(false);

    useEffect(() => {
        const runCheck = async () => {
            if (formData.service_id && formData.date && formData.time) {
                await checkAvailability();
            } else {
                setIsWaitlist(false);
            }
        };
        runCheck();
    }, [formData.date, formData.time, formData.service_id]);

    const checkAvailability = async () => {
        const selectedService = services.find(s => s.id === formData.service_id);
        if (!selectedService || !formData.date || !formData.time) return;

        try {
            const startTime = new Date(`${formData.date}T${formData.time}`);
            const endTime = new Date(startTime.getTime() + selectedService.duration * 60000);

            const startISO = startTime.toISOString();
            const endISO = endTime.toISOString();

            console.log('Kontrol edilen aralık:', formData.time, '-', endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

            // Aralık Sorgusu: Yeni randevunun aralığı mevcut randevularla çakışıyor mu?
            const { count, error } = await supabase
                .from('appointments')
                .select('id', { count: 'exact', head: true })
                .eq('tradesman_id', selectedService.tradesman_id)
                .eq('status', 'confirmed')
                .lt('start_time', endISO)
                .gt('end_time', startISO);

            if (error) throw error;

            const hasConflict = count > 0;
            setIsWaitlist(hasConflict);
            console.log('Saat dolu mu?:', hasConflict);
        } catch (error) {
            console.error('Müsaitlik kontrolü başarısız:', error);
        }
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

            const startTime = new Date(`${formData.date}T${formData.time}`);
            const endTime = new Date(startTime.getTime() + selectedService.duration * 60000);

            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                throw new Error('Geçersiz tarih veya saat seçimi');
            }

            // Son Kontrol: Çakışma var mı? (Aralık sorgusu ile global kontrol)
            const { count: conflictCount, error: checkError } = await supabase
                .from('appointments')
                .select('id', { count: 'exact', head: true })
                .eq('tradesman_id', selectedService.tradesman_id)
                .eq('status', 'confirmed')
                .lt('start_time', endTime.toISOString())
                .gt('end_time', startTime.toISOString());

            if (checkError) throw checkError;

            const isNowWaitlist = conflictCount > 0;

            if (isWaitlist || isNowWaitlist) {
                // Kayıt Engeli: Eğer o saat doluysa, appointments tablosuna ASLA kayıt atma.
                const { error: waitlistError } = await supabase.from('waiting_list').insert([{
                    user_id: user.id,
                    tradesman_id: selectedService.tradesman_id,
                    service_id: selectedService.id,
                    preferred_date: formData.date,
                    status: 'waiting'
                }]);

                if (waitlistError) throw waitlistError;
                alert(isNowWaitlist ? 'Bu saat az önce doldu, otomatik olarak bekleme listesine alındınız.' : 'Bekleme listesine başarıyla eklendiniz!');
            } else {
                // Randevuyu direkt onayla
                await appointmentService.createAppointment({
                    customer_id: user.id,
                    tradesman_id: selectedService.tradesman_id,
                    service_id: selectedService.id,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    notes: formData.notes,
                    status: 'confirmed'
                });
                alert('Randevunuz başarıyla oluşturuldu ve onaylandı!');
            }

            navigate('/dashboard');
        } catch (error) {
            alert('Hata: ' + error.message);
        } finally {
            setSubmitting(false);
            setLoading(false); // UI donmasını önlemek için
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
