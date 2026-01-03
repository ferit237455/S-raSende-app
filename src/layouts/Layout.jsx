import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-4 px-6">
                    <h1 className="text-2xl font-bold text-gray-900">SıraSende</h1>
                </div>
            </header>

            <main className="flex-grow">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Outlet />
                </div>
            </main>

            <footer className="bg-white border-t mt-auto">
                <div className="max-w-7xl mx-auto py-4 px-6 text-center text-gray-500">
                    &copy; 2026 SıraSende. Tüm hakları saklıdır.
                </div>
            </footer>
        </div>
    );
};

export default Layout;
