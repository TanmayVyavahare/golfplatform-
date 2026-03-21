import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DUMMY_CHARITIES = [
    { id: '1', name: 'Fore The Kids Foundation (Demo)' },
    { id: '2', name: 'Green Drives Initiative (Demo)' },
    { id: '3', name: 'Golfers Against Hunger (Demo)' }
];

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [charities, setCharities] = useState([]);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', charity_id: '' });
  const [error, setError] = useState('');
  
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLogin) {
      api.get('/charities').then(res => {
         if (res.data && res.data.length > 0) setCharities(res.data);
         else setCharities(DUMMY_CHARITIES);
      }).catch(() => setCharities(DUMMY_CHARITIES));
    }
  }, [isLogin]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        navigate('/dashboard');
      } else {
        if (!formData.charity_id) { setError('Selecting a charity is mandatory'); return; }
        const res = await api.post('/auth/signup', formData);
        alert(res.data.message || 'Complete! Please login now.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication Failed');
    }
  };

  const handleDemoLogin = (role = 'viewer') => {
      // Bypasses actual DB login and simulates a session for testing
      localStorage.setItem('token', `fake-demo-jwt-token-${role}`);
      setUser({
          id: `demo-uuid-${role}`,
          email: `${role}@demo.com`,
          full_name: role === 'admin' ? 'Admin Reviewer' : role === 'paid' ? 'Paid Subscriber' : 'Free Visitor',
          role: role === 'admin' ? 'admin' : 'user',
          subscription_status: role === 'viewer' ? 'inactive' : 'active',
          subscription_plan: role === 'viewer' ? 'free' : 'yearly'
      });
      navigate(role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="max-w-md mx-auto pt-10 pb-20">
      
      {/* DEMO ACCESS QUICK LOGIN */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-8 shadow-sm">
         <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-3 flex items-center gap-2">⭐ Demo Access</h2>
         <p className="text-xs text-blue-600 mb-4 font-medium">Click to instantly bypass database authentication and review the platform views:</p>
         <div className="flex flex-col gap-2">
            <button onClick={() => handleDemoLogin('viewer')} className="w-full bg-white hover:bg-gray-50 border border-red-300 text-red-700 font-bold py-2 px-3 rounded text-sm transition-colors shadow-sm">Login as Unpaid/Free User</button>
            <button onClick={() => handleDemoLogin('paid')} className="w-full bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-800 font-bold py-2 px-3 rounded text-sm transition-colors shadow-sm">Login as Fully Paid Subscriber (Unlocked)</button>
            <button onClick={() => handleDemoLogin('admin')} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded text-sm transition-colors shadow-sm">Login as System Admin</button>
         </div>
      </div>

      <div className="card space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center font-medium">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" required onChange={e => setFormData({...formData, full_name: e.target.value})} className="input-field" placeholder="John Doe" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" required onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required onChange={e => setFormData({...formData, password: e.target.value})} className="input-field" placeholder="••••••••" />
          </div>

          {!isLogin && (
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Support a Charity (Mandatory)</label>
               <select required onChange={e => setFormData({...formData, charity_id: e.target.value})} className="input-field bg-white">
                 <option value="">-- Choose a cause --</option>
                 {charities.map(c => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
               </select>
               <p className="text-xs text-gray-500 mt-1">10% of your future subscription goes directly here.</p>
            </div>
          )}

          <button type="submit" className="w-full btn-primary py-3">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:text-blue-700 font-medium">
             {isLogin ? 'Create one' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginSignup;
