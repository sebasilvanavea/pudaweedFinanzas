import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Payment } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Calendar, Receipt, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PaymentHistoryPDF from '../components/PaymentHistoryPDF';

export default function History() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    totalPaid: 0,
    monthlyTotal: 0,
    tournamentTotal: 0,
    pendingTotal: 0,
  });

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.id) {
        toast.error('El usuario no está autenticado.');
        console.error('Error: El ID del usuario no está disponible.');
        return;
      }

      try {
        const paymentsQuery = query(
            collection(db, 'payments'),
            where('playerId', '==', user.id),
            orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(paymentsQuery);

        if (querySnapshot.empty) {
          console.warn('No se encontraron pagos para el usuario:', user.id);
          toast('No hay pagos registrados para este jugador.', { icon: 'ℹ️' });
          setPayments([]);
          setLoading(false);
          return;
        }

        const paymentsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            amount: data.amount,
            date: data.date?.toDate(),
            description: data.description,
            method: data.method,
            playerId: data.playerId,
            playerName: data.playerName,
            status: data.status,
            type: data.type,
          } as Payment;
        });

        const paidPayments = paymentsData.filter((p) => p.status === 'paid');
        const pendingPayments = paymentsData.filter((p) => p.status === 'pending');
        const monthlyPayments = paidPayments.filter((p) => p.type === 'monthly');
        const tournamentPayments = paidPayments.filter((p) => p.type === 'tournament');

        setStats({
          totalPaid: paidPayments.reduce((sum, p) => sum + p.amount, 0),
          monthlyTotal: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
          tournamentTotal: tournamentPayments.reduce((sum, p) => sum + p.amount, 0),
          pendingTotal: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
        });

        setPayments(paymentsData);
      } catch (error) {
        console.error('Error al obtener los pagos:', error);
        toast.error('Hubo un error al cargar los pagos. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  const filteredPayments = payments.filter((payment) =>
      filter === 'all' ? true : payment.type === filter
  );

  const formatMoney = (amount: number) =>
      new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(amount);

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
            <h1 className="text-3xl font-bold text-gray-900">Historial de Pagos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Revisa tu historial y estado de pagos
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Receipt className="w-8 h-8 text-yellow-400" />
            <PDFDownloadLink
                document={
                  <PaymentHistoryPDF
                      payments={payments}
                      playerName={user?.name || ''}
                      stats={stats}
                  />
                }
                fileName={`historial-pagos-${format(new Date(), 'dd-MM-yyyy')}.pdf`}
                className="btn-primary flex items-center gap-2"
            >
              {({ loading }) => (
                  <>
                    <Download className="w-4 h-4" />
                    {loading ? 'Generando PDF...' : 'Descargar PDF'}
                  </>
              )}
            </PDFDownloadLink>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-gradient-to-br from-black to-gray-800 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400">Total Pagado</p>
                <p className="text-2xl font-bold mt-1">{formatMoney(stats.totalPaid)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-black to-gray-800 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400">Cuotas Mensuales</p>
                <p className="text-2xl font-bold mt-1">{formatMoney(stats.monthlyTotal)}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-black to-gray-800 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400">Campeonatos</p>
                <p className="text-2xl font-bold mt-1">{formatMoney(stats.tournamentTotal)}</p>
              </div>
              <Receipt className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Registro de Pagos</h2>
            <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input max-w-xs"
            >
              <option value="all">Todos los Pagos</option>
              <option value="monthly">Cuotas Mensuales</option>
              <option value="tournament">Campeonatos</option>
            </select>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Método</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{format(payment.date, 'dd/MM/yyyy', { locale: es })}</td>
                    <td className="capitalize">
                      {payment.type === 'monthly' ? 'Mensualidad' : 'Campeonato'}
                    </td>
                    <td className="capitalize">
                      {payment.method === 'cash' ? 'Efectivo' : 'Transferencia'}
                    </td>
                    <td>{payment.description || '-'}</td>
                    <td>{formatMoney(payment.amount)}</td>
                    <td>
                    <span
                        className={`px-2 py-1 rounded-full text-xs ${
                            payment.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                    </td>
                  </tr>
              ))}
              {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      No hay pagos registrados.
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
