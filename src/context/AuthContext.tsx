import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthContextType, User } from '../types';
import toast from 'react-hot-toast';

// List of allowed emails and their roles
const ALLOWED_USERS: { [email: string]: 'player' | 'admin' | 'both' } = {
  'sebastian.silvanavea@gmail.com': 'both',
  'silvanavea@gmail.com': 'player',
  'Aaron.jeldres.estudios@gmail.com': 'player',
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userEmail = firebaseUser.email || '';
          const allowedRole = ALLOWED_USERS[userEmail];

          if (!allowedRole) {
            // If email is not allowed, sign out and deny access
            await firebaseSignOut(auth);
            toast.error('No tienes autorización para acceder al sistema.');
            setUser(null);
            setLoading(false);
            return;
          }

          // Check Firestore for user document
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // Create a new user document
            const newUser = {
              name: firebaseUser.displayName || '',
              email: userEmail,
              role: allowedRole,
              allowed: true,
            };

            await setDoc(userDocRef, newUser);

            setUser({
              id: firebaseUser.uid,
              ...newUser,
            });

            toast.success('¡Bienvenido a Pudaweed!');
          } else {
            // Existing user
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              ...userData as Omit<User, 'id'>,
            });

            toast.success('¡Bienvenido de nuevo a Pudaweed!');
          }
        } catch (error) {
          console.error('Error processing user:', error);
          toast.error('Ocurrió un error. Por favor intenta de nuevo.');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      toast.error('Error al iniciar sesión con Google.');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Sesión cerrada exitosamente.');
    } catch (error) {
      toast.error('Error al cerrar sesión.');
    }
  };

  return (
      <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
