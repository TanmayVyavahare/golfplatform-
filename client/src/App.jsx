import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import LoginSignup from './pages/LoginSignup';
import Dashboard from './pages/Dashboard';
import Subscribe from './pages/Subscribe';
import AdminDashboard from './pages/AdminDashboard';
import Charities from './pages/Charities';
import api from './api';
import { AuthContext } from './auth-context';
//creates gloabal storage for user data 

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        if (token.startsWith('fake-demo-jwt-token')) {
          const role = token.split('-').pop();
          setUser({
              id: `demo-uuid-${role}`,
              email: `${role}@demo.com`,
              full_name: role === 'admin' ? 'Admin Reviewer' : role === 'paid' ? 'Paid Subscriber' : 'Free Visitor',
              role: role === 'admin' ? 'admin' : 'user',
              subscription_status: role === 'viewer' ? 'inactive' : 'active',
              subscription_plan: role === 'viewer' ? 'free' : 'yearly'
          });
        } else {
          try {
            const res = await api.get('/profile');
            setUser(res.data);
          } catch {
            localStorage.removeItem('token');
          }
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
          <Header />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/charities" element={<Charities />} />
              <Route path="/login" element={<LoginSignup />} />
              <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/*" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <footer className="border-t border-gray-200 py-6 text-center text-gray-500 text-sm bg-white">
            <p>&copy; {new Date().getFullYear()} TargetImpact Platforms. Sample take-home assignment.</p>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
