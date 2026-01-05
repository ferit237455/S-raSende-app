import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import LandingPage from './pages/LandingPage';
import Explore from './pages/Explore';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import CalendarPage from './pages/dashboard/Calendar';
import WaitingList from './pages/dashboard/WaitingList';
import Services from './pages/dashboard/Services';
import Customers from './pages/dashboard/Customers';
import MyShop from './pages/dashboard/MyShop';
import BookAppointment from './pages/appointment/BookAppointment';
import History from './pages/customer/History';
import ShopDetail from './pages/customer/ShopDetail';
import Notifications from './pages/common/Notifications';
import Profile from './pages/common/Profile';

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './routes/ProtectedRoute';

import DashboardLayout from './layouts/DashboardLayout';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          // If session is problematic or missing, clear specific auth keys to avoid corrupted states
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch (error) {
        console.error('Initial session check error:', error);
        localStorage.clear(); // Extreme recovery: clear everything
      } finally {
        setIsInitializing(false);
      }
    };
    checkSession();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<LandingPage />} />

              {/* Auth Routes */}
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                {/* Tradesman Routes */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="dashboard/calendar" element={<CalendarPage />} />
                <Route path="dashboard/waiting-list" element={<WaitingList />} />
                <Route path="dashboard/services" element={<Services />} />
                <Route path="dashboard/customers" element={<Customers />} />
                <Route path="dashboard/my-shop" element={<MyShop />} />

                {/* Customer Routes */}
                <Route path="customer-dashboard" element={<Explore />} />
                <Route path="explore" element={<Explore />} />
                <Route path="shop/:id" element={<ShopDetail />} />
                <Route path="book-appointment" element={<BookAppointment />} />
                <Route path="my-appointments" element={<History />} />
                <Route path="notifications" element={<Notifications />} />

                {/* Common */}
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
