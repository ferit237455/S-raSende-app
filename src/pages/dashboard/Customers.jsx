import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Mail, Phone, Calendar as CalendarIcon } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMountedRef = useRef(true);

    const fetchCustomers = useCallback(async (signal) => {
        if (!isMountedRef.current) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || signal?.aborted || !isMountedRef.current) return;

            // Fetch unique customers from appointments
            const { data, error: fetchError } = await supabase
                .from('appointments')
                .select(`
                    customer_id,
                    customer:profiles!customer_id(*)
                `)
                .eq('tradesman_id', user.id);

            if (signal?.aborted || !isMountedRef.current) return;

            if (fetchError) throw fetchError;

            // Deduplicate customers
            const uniqueCustomers = [];
            const map = new Map();
            for (const item of data) {
                if (!map.has(item.customer_id)) {
                    map.set(item.customer_id, true);
                    if (item.customer) uniqueCustomers.push(item.customer);
                }
            }

            if (isMountedRef.current && !signal?.aborted) {
                setCustomers(uniqueCustomers);
            }
        } catch (err) {
            if (signal?.aborted || !isMountedRef.current) return;
            console.error('Error fetching customers:', err);
            if (isMountedRef.current) {
                setError('Müşterileriniz yüklenirken bir sorun oluştu.');
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
        
        fetchCustomers(abortController.signal);

        return () => {
            isMountedRef.current = false;
            abortController.abort();
        };
    }, [fetchCustomers]);

    // Skeleton Loader
    if (loading) return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="animate-pulse mb-6">
                <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
            </div>
            <div className="bg-white shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
                <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-32" />
                                <div className="h-3 bg-gray-100 rounded w-24" />
                            </div>
                            <div className="h-6 bg-gray-200 rounded-full w-16" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-gray-50 min-h-screen">
            <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-100 inline-block">
                <p className="font-bold text-lg">Bir Sorun Oluştur!</p>
                <p className="mt-2 text-sm">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-600 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition font-medium">
                    Sayfayı Yenile
                </button>
            </div>
        </div>
    );

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Müşterilerim</h1>

            {(!customers || !Array.isArray(customers) || customers?.length === 0) ? (
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
                            {customers && Array.isArray(customers) && customers?.map((customer) => (
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
