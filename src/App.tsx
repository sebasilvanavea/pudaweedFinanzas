import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';
import Payments from './pages/Payments';
import History from './pages/History';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/manage-users"
              element={
                <AdminRoute>
                  <ManageUsers />
                </AdminRoute>
              }
            />
            
            <Route
              path="/payments"
              element={
                <AdminRoute>
                  <Payments />
                </AdminRoute>
              }
            />
            
            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <History />
                </PrivateRoute>
              }
            />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;