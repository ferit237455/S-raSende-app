import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Mail, Phone, Calendar as CalendarIcon } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch unique customers from appointments
                const { data, error } = await supabase
                    .from('appointments')
                    .select(`
            customer_id,
            customer:profiles!customer_id(*)
          `)
                    .eq('tradesman_id', user.id);

                if (error) throw error;

                // Deduplicate customers
                const uniqueCustomers = [];
                const map = new Map();
                for (const item of data) {
                    if (!map.has(item.customer_id)) {
                        map.set(item.customer_id, true);    // set any value to Map
                        if (item.customer) uniqueCustomers.push(item.customer);
                    }
                }

                setCustomers(uniqueCustomers);
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Müşterilerim</h1>

            {customers.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                    Henüz randevu almış bir müşteriniz bulunmuyor.
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                {customer.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{customer.full_name}</div>
                                                <div className="text-sm text-gray-500">Müşteri</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 flex items-center gap-2">
                                            <Mail size={16} className="text-gray-400" /> {customer.email}
                                        </div>
                                        {customer.phone_number && (
                                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                <Phone size={16} className="text-gray-400" /> {customer.phone_number}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Aktif
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
export default Customers;
