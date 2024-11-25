import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, CircleDot, DollarSign, Users, History } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Get first name only
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-black text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-3 md:py-0">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center space-x-2">
                <CircleDot className="w-8 h-8 text-yellow-400" />
                <span className="font-bold text-xl text-yellow-400">Pudaweed</span>
              </Link>
              {user && (
                <span className="md:hidden text-sm text-yellow-400">
                  ¡Bienvenido, {firstName}!
                </span>
              )}
            </div>
            
            {user && (
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mt-3 md:mt-0">
                <span className="hidden md:inline-block text-sm text-yellow-400 mr-4">
                  ¡Bienvenido, {firstName}!
                </span>
                
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard') ? 'text-yellow-400' : ''}`}
                >
                  Inicio
                </Link>
                
                {(user.role === 'admin' || user.role === 'both') && (
                  <>
                    <Link
                      to="/manage-users"
                      className={`nav-link flex items-center space-x-1 ${isActive('/manage-users') ? 'text-yellow-400' : ''}`}
                    >
                      Gestionar Usuarios
                      <Users className="w-5 h-5" />
                    </Link>
                    <Link
                      to="/payments"
                      className={`nav-link flex items-center space-x-1 ${isActive('/payments') ? 'text-yellow-400' : ''}`}
                    >
                      Registrar Pagos
                      <DollarSign className="w-5 h-5" />
                    </Link>
                  </>
                )}
                
                <Link
                  to="/history"
                  className={`nav-link flex items-center space-x-1 ${isActive('/history') ? 'text-yellow-400' : ''}`}
                >
                  Historial
                  <History className="w-5 h-5" />
                </Link>
                
                <button
                  onClick={signOut}
                  className="nav-link flex items-center space-x-1"
                  title="Cerrar Sesión"
                >
                  Cerrar Sesión

                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}