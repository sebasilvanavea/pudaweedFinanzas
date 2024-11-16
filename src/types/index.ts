export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'player' | 'both';
  allowed: boolean;
}

export interface Payment {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  type: 'monthly' | 'tournament';
  method: 'cash' | 'transfer';
  description?: string;
  date: Date;
  status: 'pending' | 'paid';
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}