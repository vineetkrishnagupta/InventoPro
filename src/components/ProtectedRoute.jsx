import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/common/LoadingScreen'

export default function ProtectedRoute({ requiredPermission }) {
  const { user, profile, loading, profileLoading } = useAuth()
  const location = useLocation()

  if (loading || (user && profileLoading && !profile)) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredPermission && profile) {
    const rolePermissions = {
      admin: ['*'],
      manager: ['dashboard', 'products', 'categories', 'stock', 'purchases', 'suppliers', 'sales', 'customers', 'reports', 'notifications', 'settings'],
      staff: ['products', 'sales', 'stock', 'notifications'],
      viewer: ['dashboard', 'products', 'stock', 'reports'],
    }
    const role = profile.role || 'viewer'
    const perms = rolePermissions[role] || []
    if (!perms.includes('*') && !perms.includes(requiredPermission)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
//