import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    return (
        <div className="text-center py-20">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Randevunu Kolayca Al ve Yönet</h2>
            <p className="text-xl text-gray-600 mb-8">Esnaf ve müşteriler için modern randevu sistemi.</p>
            <div className="space-x-4">
                <button
                    onClick={() => navigate('/register')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Hemen Başla
                </button>
                <button
                    onClick={() => navigate('/explore')}
                    className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition"
                >
                    Daha Fazla Bilgi
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
