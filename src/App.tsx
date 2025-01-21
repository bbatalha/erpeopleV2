import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AdminDashboard } from './pages/AdminDashboard'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Assessment } from './pages/Assessment'
import { Results } from './pages/Results'
import { History } from './pages/History'
import { Layout } from './components/Layout'
import { UserDISCReports } from './pages/UserDISCReports'
import { UserBehaviorReports } from './pages/UserBehaviorReports'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Assessment routes */}
            <Route path="/assessment/:type" element={
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            } />
            <Route path="/results/:id" element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/users/:userId/disc-reports" element={
              <AdminRoute>
                <UserDISCReports />
              </AdminRoute>
            } />
            <Route path="/admin/users/:userId/behavior-reports" element={
              <AdminRoute>
                <UserBehaviorReports />
              </AdminRoute>
            } />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}