import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { appointmentService } from '../../services/appointments';

const CalendarPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAppointments = async () => {
            try {
                const data = await appointmentService.getAppointments();
                setAppointments(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadAppointments();
    }, []);

    // Simple day grouping
    const grouped = appointments.reduce((acc, apt) => {
        const date = new Date(apt.start_time).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(apt);
        return acc;
    }, {});

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Randevu Takvimi</h1>
            {loading ? <div>Yükleniyor...</div> : (
                <div className="space-y-6">
                    {Object.keys(grouped).length === 0 && <p className="text-gray-500">Görüntülenecek randevu yok.</p>}
                    {Object.entries(grouped).map(([date, apts]) => (
                        <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="bg-gray-100 px-6 py-3 font-semibold text-gray-700 border-b">
                                {date}
                            </div>
                            <div className="divide-y divide-gray-200">
                                {apts.map(apt => (
                                    <div key={apt.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(apt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {apt.service?.name} - {apt.customer?.full_name}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                apt.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
