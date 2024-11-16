import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import { User, Payment } from '../types';
import { DollarSign, Search, Edit2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Payments() {
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [formData, setFormData] = useState({
    playerId: '',
    playerName: '',
    amount: '',
    type: 'monthly',
    method: 'cash',
    description: '',
    status: 'paid'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch players
        const playersQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['player', 'both'])
        );
        const playersSnapshot = await getDocs(playersQuery);
        const playersData = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        setPlayers(playersData);

        // Fetch payments
        const paymentsQuery = query(collection(db, 'payments'));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsData = paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        } as Payment));
        setPayments(paymentsData);
      } catch (error) {
        toast.error('Error al cargar los datos');
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedPlayer = players.find(p => p.id === formData.playerId);
      if (!selectedPlayer) {
        throw new Error('Jugador no encontrado');
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
        // Update existing payment
        await updateDoc(doc(db, 'payments', editingPayment.id), paymentData);
        setPayments(payments.map(p => 
          p.id === editingPayment.id ? { ...p, ...paymentData } : p
        ));
        toast.success('Pago actualizado exitosamente');
      } else {
        // Create new payment
        const docRef = await addDoc(collection(db, 'payments'), paymentData);
        setPayments([...payments, { id: docRef.id, ...paymentData } as Payment]);
        toast.success('Pago registrado exitosamente');
      }

      // Reset form
      setFormData({
        playerId: '',
        playerName: '',
        amount: '',
        type: 'monthly',
        method: 'cash',
        description: '',
        status: 'paid'
      });
      setEditingPayment(null);
    } catch (error) {
      toast.error(editingPayment ? 'Error al actualizar el pago' : 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      playerId: payment.playerId,
      playerName: payment.playerName,
      amount: payment.amount.toString(),
      type: payment.type,
      method: payment.method,
      description: payment.description || '',
      status: payment.status
    });
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: 'paid' | 'pending') => {
    try {
      await updateDoc(doc(db, 'payments', paymentId), { status: newStatus });
      setPayments(payments.map(p => 
        p.id === paymentId ? { ...p, status: newStatus } : p
      ));
      toast.success('Estado del pago actualizado');
    } catch (error) {
      toast.error('Error al actualizar el estado del pago');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!dateFilter) return matchesSearch;

    const paymentDate = format(payment.date, 'yyyy-MM-dd');
    return matchesSearch && paymentDate === dateFilter;
  });

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      maximumFractionDigits: 0 
    }).format(amount);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p className="mt-1 text-sm text-gray-600">
            {editingPayment ? 'Editar pago existente' : 'Registrar nuevos pagos'}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar pagos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingPayment ? 'Editar Pago' : 'Registrar Pago'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="playerId" className="block text-sm font-medium text-gray-700">
                Jugador
              </label>
              <select
                id="playerId"
                value={formData.playerId}
                onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                className="input"
                required
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
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input pl-7"
                  placeholder="15000"
                  required
                  min="0"
                  step="1"
                />
              </div>
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
                  <option value="monthly">Cuota Mensual</option>
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
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Estado del Pago
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
                required
              >
                <option value="paid">Realizado</option>
                <option value="pending">Pendiente</option>
              </select>
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
                placeholder="Agregar notas adicionales sobre el pago..."
              />
            </div>

            <div className="flex justify-end gap-4">
              {editingPayment && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPayment(null);
                    setFormData({
                      playerId: '',
                      playerName: '',
                      amount: '',
                      type: 'monthly',
                      method: 'cash',
                      description: '',
                      status: 'paid'
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : editingPayment ? 'Actualizar Pago' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pagos Recientes</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.playerName}</td>
                    <td>{format(payment.date, 'dd/MM/yyyy', { locale: es })}</td>
                    <td>{formatMoney(payment.amount)}</td>
                    <td>
                      <select
                        value={payment.status}
                        onChange={(e) => handleUpdateStatus(payment.id, e.target.value as 'paid' | 'pending')}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="paid">Pagado</option>
                        <option value="pending">Pendiente</option>
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => handleEdit(payment)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Editar pago"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      No hay pagos para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}