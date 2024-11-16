import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Payment } from '../types';
import { DollarSign, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPaid: 0,
    monthlyDue: 15000,
    nextDueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5),
    pendingTotal: 0,
    monthlyTotal: 0,
    tournamentTotal: 0
  });

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      maximumFractionDigits: 0 
    }).format(amount);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!user?.id) return;

      try {
        // Fetch all player's payments
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('playerId', '==', user.id),
          orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(paymentsQuery);
        const payments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        })) as Payment[];

        // Calculate statistics
        const paidPayments = payments.filter(p => p.status === 'paid');
        const pendingPayments = payments.filter(p => p.status === 'pending');
        const monthlyPayments = paidPayments.filter(p => p.type === 'monthly');
        const tournamentPayments = paidPayments.filter(p => p.type === 'tournament');

        setStats({
          totalPaid: paidPayments.reduce((sum, p) => sum + p.amount, 0),
          monthlyDue: 15000,
          nextDueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5),
          pendingTotal: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
          monthlyTotal: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
          tournamentTotal: tournamentPayments.reduce((sum, p) => sum + p.amount, 0)
        });

        setRecentPayments(payments.slice(0, 5));
      } catch (error) {
        console.error('Error fetching player data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Gestiona tus pagos y revisa tu estado
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-black to-gray-800 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400">Cuota Mensual</p>
              <p className="text-2xl font-bold mt-1">{formatMoney(stats.monthlyDue)}</p>
              <p className="text-sm text-gray-400 mt-1">Total Pagado: {formatMoney(stats.monthlyTotal)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-black to-gray-800 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400">Próximo Vencimiento</p>
              <p className="text-2xl font-bold mt-1">
                {format(stats.nextDueDate, "d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Campeonatos: {formatMoney(stats.tournamentTotal)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-black to-gray-800 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400">Pagos Pendientes</p>
              <p className="text-2xl font-bold mt-1">{formatMoney(stats.pendingTotal)}</p>
              <p className="text-sm text-gray-400 mt-1">
                Total Pagado: {formatMoney(stats.totalPaid)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Método</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{format(payment.date, 'dd/MM/yyyy', { locale: es })}</td>
                  <td className="capitalize">
                    {payment.type === 'monthly' ? 'Mensualidad' : 'Campeonato'}
                  </td>
                  <td className="capitalize">
                    {payment.method === 'cash' ? 'Efectivo' : 'Transferencia'}
                  </td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      payment.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status === 'paid' ? 'Realizado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No hay actividad reciente para mostrar
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