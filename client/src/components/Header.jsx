import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth-context';
import { Flag, UserCircle, Target } from 'lucide-react';

const Header = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Flag className="text-emerald-600" size={24} />
          <span className="font-extrabold text-2xl text-emerald-900 font-serif tracking-tight">Golfy</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-gray-600 hover:text-emerald-600 font-medium">Home</Link>
          <Link to="/charities" className="text-gray-600 hover:text-emerald-600 font-medium flex gap-1 items-center">
             <Target size={16}/> Charities
          </Link>
          
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-gray-600 hover:text-blue-600 font-medium px-2 py-1 bg-red-100 text-red-700 rounded text-sm">Admin</Link>
              )}
              <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium flex gap-2"><UserCircle/> Dashboard</Link>
              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Sign In</Link>
              <Link to="/login" className="btn-primary">
                Join Platform
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
