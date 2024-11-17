import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import { User, Payment } from '../types';
import { DollarSign, Search, Edit2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Payments() {
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<User[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);
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
    status: 'paid',
  });

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
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
      } catch (error) {
        toast.error('Error al cargar jugadores');
      }
    };

    fetchPlayers();
  }, []);

  const fetchPayments = async (playerId: string) => {
    try {
      setLoading(true);
      const paymentsQuery = query(
          collection(db, 'payments'),
          where('playerId', '==', playerId)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as Payment[];
      setPayments(paymentsData);
    } catch (error) {
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSelection = (player: User) => {
    setSelectedPlayer(player);
    fetchPayments(player.id);
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
      status: payment.status,
    });
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    try {
      await updateDoc(doc(db, 'payments', editingPayment.id), {
        amount: Number(formData.amount),
        type: formData.type,
        method: formData.method,
        status: formData.status,
        description: formData.description,
      });

      setPayments(
          payments.map((p) =>
              p.id === editingPayment.id ? { ...p, ...formData, amount: Number(formData.amount) } : p
          )
      );

      toast.success('Pago actualizado exitosamente');
      setEditingPayment(null);
    } catch (error) {
      toast.error('Error al actualizar el pago');
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedPlayer = players.find((p) => p.id === formData.playerId);
      if (!selectedPlayer) {
        toast.error('Jugador no encontrado');
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

      const docRef = await addDoc(collection(db, 'payments'), paymentData);
      setPayments([...payments, { id: docRef.id, ...paymentData } as Payment]);

      toast.success('Pago registrado exitosamente');
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
      toast.error('Error al registrar el pago');
    }
  };

  const filteredPlayers = players.filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter((payment) => {
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
        maximumFractionDigits: 0,
      }).format(amount);

  return (
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Selecciona un jugador para gestionar sus pagos
            </p>
          </div>

        </header>

        {/* Formulario de Registro/Edición */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingPayment ? 'Editar Pago' : 'Registrar Pago'}
          </h2>
          <form
              onSubmit={editingPayment ? handleUpdatePayment : handleRegisterPayment}
              className="space-y-6"
          >
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
                <option value="paid">Pagado</option>
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
              />
            </div>

            <div className="flex justify-end gap-4">
              {editingPayment && (
                  <button
                      type="button"
                      onClick={() => setEditingPayment(null)}
                      className="btn-secondary"
                  >
                    Cancelar
                  </button>
              )}
              <button type="submit" className="btn-primary">
                {editingPayment ? 'Actualizar Pago' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>

        <div className="">
          {/* Lista de Jugadores */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Jugadores</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {filteredPlayers.map((player) => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>{player.email}</td>
                      <td>
                        <button
                            onClick={() => handlePlayerSelection(player)}
                            className="btn-primary"
                        >
                          Ver Pagos
                        </button>
                      </td>
                    </tr>
                ))}
                {filteredPlayers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-gray-500">
                        No se encontraron jugadores
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagos del Jugador Seleccionado */}
          {selectedPlayer && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Pagos de {selectedPlayer.name}
                </h2>
                {loading ? (
                    <div className="text-center py-4">Cargando pagos...</div>
                ) : (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Monto</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredPayments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{format(payment.date, 'dd/MM/yyyy', { locale: es })}</td>
                              <td>{formatMoney(payment.amount)}</td>
                              <td>{payment.status === 'paid' ? 'Pagado' : 'Pendiente'}</td>
                              <td>
                                <button
                                    onClick={() => handleEdit(payment)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-gray-600" />
                                </button>
                              </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-gray-500">
                                No hay pagos para mostrar
                              </td>
                            </tr>
                        )}
                        </tbody>
                      </table>
                    </div>
                )}
              </div>
          )}
        </div>
      </div>
  );
}
