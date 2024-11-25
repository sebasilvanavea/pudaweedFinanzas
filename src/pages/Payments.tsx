import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import { User, Payment } from '../types';
import { format } from 'date-fns';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function Payments() {
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    playerId: '',
    playerName: '',
    amount: '',
    type: 'monthly',
    method: 'cash',
    description: '',
    status: 'paid',
  });

  const [globalStats, setGlobalStats] = useState({
    totalIncome: 0,
    totalPending: 0,
    monthlyIncome: 0,
    tournamentIncome: 0,
  });

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPlayersAndPayments = async () => {
      try {
        setLoading(true);

        // Obtener jugadores
        const playersQuery = query(
            collection(db, 'users'),
            where('role', 'in', ['player', 'both'])
        );
        const playersSnapshot = await getDocs(playersQuery);
        const playersData = playersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setPlayers(playersData);

        // Obtener pagos
        const paymentsQuery = query(collection(db, 'payments'));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsData = paymentsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate() || new Date(),
          };
        }) as Payment[];
        setPayments(paymentsData);
        setFilteredPayments(paymentsData); // Inicializar filtrado
        calculateGlobalStats(paymentsData);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar jugadores o pagos');
        setLoading(false);
      }
    };

    fetchPlayersAndPayments();
  }, []);

  const calculateGlobalStats = (payments: Payment[]) => {
    const paidPayments = payments.filter((p) => p.status === 'paid');
    const pendingPayments = payments.filter((p) => p.status === 'pending');
    const monthlyPayments = paidPayments.filter((p) => p.type === 'monthly');
    const tournamentPayments = paidPayments.filter((p) => p.type === 'tournament');

    setGlobalStats({
      totalIncome: paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalPending: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      monthlyIncome: monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      tournamentIncome: tournamentPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    });
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedPlayer = players.find((p) => p.id === formData.playerId);
      if (!selectedPlayer) {
        toast.error('Por favor selecciona un jugador');
        return;
      }

      const paymentData: Partial<Payment> = {
        playerId: formData.playerId,
        playerName: selectedPlayer.name,
        amount: Number(formData.amount),
        type: formData.type as 'monthly' | 'tournament',
        method: formData.method as 'cash' | 'transfer',
        date: new Date(),
        status: formData.status as 'paid' | 'pending',
        description: formData.description,
      };

      if (editingPayment) {
        const paymentRef = doc(db, 'payments', editingPayment.id);
        await updateDoc(paymentRef, paymentData);
        setPayments((prev) =>
            prev.map((p) =>
                p.id === editingPayment.id ? { ...p, ...paymentData } : p
            )
        );
        toast.success('Pago actualizado exitosamente');
        setEditingPayment(null);
      } else {
        const docRef = await addDoc(collection(db, 'payments'), paymentData);
        setPayments([...payments, { id: docRef.id, ...paymentData } as Payment]);
        toast.success('Pago registrado exitosamente');
      }

      setFormData({
        playerId: '',
        playerName: '',
        amount: '',
        type: 'monthly',
        method: 'cash',
        description: '',
        status: 'paid',
      });
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      toast.error('Error al procesar el pago');
    }
  };

  const handlePlayerChange = (playerId: string) => {
    const selectedPlayer = players.find((p) => p.id === playerId);
    if (selectedPlayer) {
      setFormData({
        ...formData,
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
      });
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      playerId: payment.playerId,
      playerName: payment.playerName,
      amount: payment.amount.toString(),
      type: payment.type,
      method: payment.method,
      description: payment.description || '',
      status: payment.status,
    });

    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
    setFormData({
      playerId: '',
      playerName: '',
      amount: '',
      type: 'monthly',
      method: 'cash',
      description: '',
      status: 'paid',
    });
  };

  const formatMoney = (amount: number) =>
      new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(amount);

  const pieChartData = {
    labels: ['Mensualidades', 'Campeonatos', 'Pendiente'],
    datasets: [
      {
        data: [
          globalStats.monthlyIncome,
          globalStats.tournamentIncome,
          globalStats.totalPending,
        ],
        backgroundColor: ['#34D399', '#3B82F6', '#F87171'],
        hoverBackgroundColor: ['#10B981', '#2563EB', '#DC2626'],
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
          },
          color: '#4B5563',
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            const dataset = tooltipItem.dataset;
            const total = dataset.data.reduce((sum: number, value: number) => sum + value, 0);
            const value = dataset.data[tooltipItem.dataIndex];
            const percentage = ((value / total) * 100).toFixed(2);
            return ` ${tooltipItem.label}: $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
      title: {
        display: true,
        text: 'Distribución de Ingresos',
        font: {
          size: 20,
        },
        color: '#1F2937',
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  };

  return (
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Selecciona un jugador para gestionar sus pagos y analizar las estadísticas.
            </p>
          </div>
        </header>

        {/* Formulario */}
        <div ref={formRef} className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingPayment ? 'Editar Pago' : 'Registrar Pago'}
          </h2>
          <form onSubmit={handleRegisterPayment} className="space-y-6">
            <div>
              <label htmlFor="playerId" className="block text-sm font-medium text-gray-700">
                Jugador
              </label>
              <select
                  id="playerId"
                  value={formData.playerId}
                  onChange={(e) => handlePlayerChange(e.target.value)}
                  className="input"
                  required
                  disabled={!!editingPayment}
              >
                <option value="">Seleccionar jugador</option>
                {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Monto
              </label>
              <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input"
                  required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Tipo de Pago
                </label>
                <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                    required
                >
                  <option value="monthly">Mensualidad</option>
                  <option value="tournament">Campeonato</option>
                </select>
              </div>
              <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                  Método de Pago
                </label>
                <select
                    id="method"
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="input"
                    required
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              {editingPayment && (
                  <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                    Cancelar
                  </button>
              )}
              <button type="submit" className="btn-primary">
                {editingPayment ? 'Actualizar Pago' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>

        {/* Gráfico */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribución de Ingresos</h2>
          <div className="relative h-96 w-full">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>

        {/* Tabla de pagos */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pagos</h2>
          {loading ? (
              <p className="text-center text-gray-500">Cargando pagos...</p>
          ) : filteredPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filteredPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.playerName}</td>
                        <td>{formatMoney(payment.amount)}</td>
                        <td>
                      <span
                          className={`px-2 py-1 rounded-full text-xs ${
                              payment.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {payment.status === 'paid' ? 'Realizado' : 'Pendiente'}
                      </span>
                        </td>
                        <td>{format(new Date(payment.date), 'dd/MM/yyyy')}</td>
                        <td>
                          <button
                              onClick={() => handleEditPayment(payment)}
                              className="btn-secondary"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-gray-500">
                          No hay pagos registrados.
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
          ) : (
              <p className="text-center text-gray-500">No hay pagos registrados.</p>
          )}
        </div>
      </div>
  );
}
