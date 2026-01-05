import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <main className="flex-grow">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
