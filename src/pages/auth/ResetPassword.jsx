import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, BarChart2, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (!form.confirm) errs.confirm = 'Please confirm your password'
    else if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await resetPassword(form.password)
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      toast.error(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4 shadow-lg shadow-primary-500/30">
            <BarChart2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">InventoPro</h1>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Password Reset!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Set new password</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Must be at least 8 characters.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="label">New Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className={`${errors.password ? 'input-error' : 'input'} pl-9 pr-10`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div className="form-group">
                  <label className="label">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      className={`${errors.confirm ? 'input-error' : 'input'} pl-9 pr-10`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
                </div>

                <Button type="submit" variant="primary" loading={loading} className="w-full justify-center py-2.5">
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
