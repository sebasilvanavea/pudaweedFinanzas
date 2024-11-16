import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircleDot, User } from 'lucide-react';

export default function Login() {
  const { user, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const redirectPath = user.role === 'admin' || user.role === 'both' 
        ? '/manage-users' 
        : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <CircleDot className="mx-auto h-16 w-16 text-yellow-400" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Bienvenido a Pudaweed</h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión para continuar
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-colors"
          >
            <User className="w-5 h-5" />
            Iniciar sesión con Google
          </button>
        </div>

        <p className="mt-4 text-xs text-center text-gray-500">
          Solo usuarios autorizados podrán acceder al sistema
        </p>
      </div>
    </div>
  );
}