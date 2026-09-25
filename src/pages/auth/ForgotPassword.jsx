import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, BarChart2, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email address'); return }

    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox and spam folder.
              </p>
              <Link to="/login" className="btn btn-primary w-full justify-center">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Forgot password?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  error={error}
                  icon={Mail}
                  required
                />
                <Button type="submit" variant="primary" loading={loading} className="w-full justify-center py-2.5">
                  Send Reset Link
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
