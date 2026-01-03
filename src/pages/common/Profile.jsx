import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { profileService } from '../../services/profiles';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        business_name: '',
        email: '' // Read only
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
        // Acil durum zaman aşımı
        const timeout = setTimeout(() => setLoading(false), 5000);
        return () => clearTimeout(timeout);
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await profileService.getProfile();
            if (data) {
                setProfile(data);
                setFormData({
                    full_name: data.full_name || '',
                    phone_number: data.phone_number || '',
                    business_name: data.business_name || '',
                    email: data.email || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await profileService.updateProfile({
                full_name: formData.full_name,
                phone_number: formData.phone_number,
                business_name: profile.user_type === 'tradesman' ? formData.business_name : null
            });
            setMessage({ type: 'success', text: 'Profil başarıyla güncellendi.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Güncelleme hatası: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Profil Ayarları</h1>

            {message.text && (
                <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta Adresi</label>
                    <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                    <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numarası</label>
                    <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="0555 123 45 67"
                        className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {profile?.user_type === 'tradesman' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı</label>
                        <input
                            type="text"
                            name="business_name"
                            value={formData.business_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default Profile;
