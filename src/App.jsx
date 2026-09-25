import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'

// Auth pages
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Public pages
import Blog from './pages/blog/Blog'

// Admin pages
import Dashboard from './pages/dashboard/Dashboard'
import Products from './pages/products/Products'
import Categories from './pages/categories/Categories'
import Inventory from './pages/inventory/Inventory'
import StockAdjustments from './pages/inventory/StockAdjustments'
import Purchases from './pages/purchases/Purchases'
import Suppliers from './pages/suppliers/Suppliers'
import Sales from './pages/sales/Sales'
import Customers from './pages/customers/Customers'
import SalesReport from './pages/reports/SalesReport'
import PurchaseReport from './pages/reports/PurchaseReport'
import StockReport from './pages/reports/StockReport'
import ProfitReport from './pages/reports/ProfitReport'
import UserManagement from './pages/users/Users'
import AuditLogs from './pages/audit/AuditLogs'
import Notifications from './pages/notifications/Notifications'
import SettingsPage from './pages/settings/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />

          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/blog" element={<Blog />} />

            {/* Protected admin routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Inventory */}
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/stock-adjustments" element={<StockAdjustments />} />

                {/* Purchases */}
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/suppliers" element={<Suppliers />} />

                {/* Sales */}
                <Route path="/sales" element={<Sales />} />
                <Route path="/customers" element={<Customers />} />

                {/* Reports */}
                <Route path="/reports/sales" element={<SalesReport />} />
                <Route path="/reports/purchases" element={<PurchaseReport />} />
                <Route path="/reports/stock" element={<StockReport />} />
                <Route path="/reports/profit" element={<ProfitReport />} />

                {/* Administration */}
                <Route path="/users" element={<UserManagement />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
