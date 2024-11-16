import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { UserCheck, UserX, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', 'in', ['player', 'both'])
        );
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Error al cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleUserAccess = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        allowed: !currentStatus
      });
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, allowed: !currentStatus }
          : user
      ));
      
      toast.success(`Acceso ${!currentStatus ? 'habilitado' : 'deshabilitado'}`);
    } catch (error) {
      console.error('Error updating user access:', error);
      toast.error('Error al actualizar el acceso del usuario');
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'active') return user.allowed;
    return !user.allowed;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionar Usuarios</h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra el acceso de los usuarios
          </p>
        </div>
        <Users className="w-8 h-8 text-yellow-400" />
      </header>

      <div className="card">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Total: {users.length} usuarios
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input max-w-xs"
          >
            <option value="all">Todos los usuarios</option>
            <option value="active">Usuarios activos</option>
            <option value="inactive">Usuarios inactivos</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td className="capitalize">
                    {user.role === 'both' ? 'Admin y Jugador' : 
                     user.role === 'admin' ? 'Administrador' : 'Jugador'}
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.allowed 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.allowed ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleUserAccess(user.id, user.allowed)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title={user.allowed ? 'Deshabilitar acceso' : 'Habilitar acceso'}
                    >
                      {user.allowed ? (
                        <UserX className="w-5 h-5 text-red-600" />
                      ) : (
                        <UserCheck className="w-5 h-5 text-green-600" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No hay usuarios para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}