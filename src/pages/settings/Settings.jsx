import { useState, useEffect } from 'react'
import { Settings, Building2, Palette, Save, User, Sun, Moon, Monitor, Check, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Breadcrumb from '../../components/common/Breadcrumb'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import clsx from 'clsx'

const TABS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'app', label: 'Appearance & App', icon: Palette },
]

export default function SettingsPage() {
  const { user, profile, updateProfile } = useAuth()
  const { isDark, themeMode, setThemeMode, accentColor, setAccentColor, accentColors } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)

  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  })
  const [profileErrors, setProfileErrors] = useState({})

  // Password form
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [pwdErrors, setPwdErrors] = useState({})
  const [changingPwd, setChangingPwd] = useState(false)

  const bizStorageKey = user ? `ims_business_settings_${user.id}` : 'ims_business_settings'
  const appStorageKey = user ? `ims_app_settings_${user.id}` : 'ims_app_settings'

  // Business settings (stored per user in localStorage)
  const [businessForm, setBizForm] = useState(() => {
    try {
      const key = user ? `ims_business_settings_${user.id}` : 'ims_business_settings'
      return JSON.parse(localStorage.getItem(key) || '{}')
    } catch { return {} }
  })

  // App settings
  const [appForm, setAppForm] = useState(() => {
    try {
      const key = user ? `ims_app_settings_${user.id}` : 'ims_app_settings'
      return JSON.parse(localStorage.getItem(key) || '{"lowStockThreshold": 5, "currency": "INR", "dateFormat": "dd MMM yyyy"}')
    } catch { return { lowStockThreshold: 5, currency: 'INR', dateFormat: 'dd MMM yyyy' } }
  })

  useEffect(() => {
    if (user?.id) {
      try {
        const biz = JSON.parse(localStorage.getItem(`ims_business_settings_${user.id}`) || '{}')
        setBizForm(biz)
      } catch {}
      try {
        const app = JSON.parse(localStorage.getItem(`ims_app_settings_${user.id}`) || '{"lowStockThreshold": 5, "currency": "INR", "dateFormat": "dd MMM yyyy"}')
        setAppForm(app)
      } catch {}
    }
  }, [user?.id])

  const handleProfileSave = async () => {
    if (!profileForm.full_name?.trim()) { setProfileErrors({ full_name: 'Name is required' }); return }
    setSaving(true)
    try {
      await updateProfile(profileForm)
      toast.success('Profile updated')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handlePasswordChange = async () => {
    const errs = {}
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) errs.newPassword = 'Min 8 characters'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length > 0) { setPwdErrors(errs); return }
    setChangingPwd(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword })
      if (error) throw error
      toast.success('Password changed')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      setPwdErrors({})
    } catch (err) { toast.error(err.message) }
    finally { setChangingPwd(false) }
  }

  const handleBizSave = () => {
    localStorage.setItem(bizStorageKey, JSON.stringify(businessForm))
    toast.success('Business settings saved')
  }

  const handleAppSave = () => {
    localStorage.setItem(appStorageKey, JSON.stringify(appForm))
    toast.success('Application settings saved')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Settings' }]} />
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar tabs */}
        <div className="lg:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <>
              <div className="card p-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-2xl font-semibold">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{profile?.full_name || 'User'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                      <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full capitalize">{profile?.role}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Full Name" value={profileForm.full_name}
                      onChange={(e) => { setProfileForm({ ...profileForm, full_name: e.target.value }); setProfileErrors({}) }}
                      error={profileErrors.full_name} required />
                    <Input label="Phone" value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                    <div className="form-group">
                      <label className="label">Email Address</label>
                      <input className="input bg-gray-50 dark:bg-gray-800 cursor-not-allowed" value={user?.email} disabled />
                      <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="primary" icon={Save} onClick={handleProfileSave} loading={saving}>Save Profile</Button>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="New Password" type="password" placeholder="Min 8 characters" value={passwordForm.newPassword}
                      onChange={(e) => { setPasswordForm({ ...passwordForm, newPassword: e.target.value }); setPwdErrors({}) }}
                      error={pwdErrors.newPassword} />
                    <Input label="Confirm Password" type="password" placeholder="Re-enter password" value={passwordForm.confirmPassword}
                      onChange={(e) => { setPasswordForm({ ...passwordForm, confirmPassword: e.target.value }); setPwdErrors({}) }}
                      error={pwdErrors.confirmPassword} />
                  </div>
                  <div className="flex justify-end">
                    <Button variant="secondary" onClick={handlePasswordChange} loading={changingPwd}>Change Password</Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'business' && (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Business Name" placeholder="Your Business Name" value={businessForm.name || ''}
                  onChange={(e) => setBizForm({ ...businessForm, name: e.target.value })} />
                <Input label="Phone" placeholder="+91 9876543210" value={businessForm.phone || ''}
                  onChange={(e) => setBizForm({ ...businessForm, phone: e.target.value })} />
                <Input label="Email" type="email" placeholder="business@example.com" value={businessForm.email || ''}
                  onChange={(e) => setBizForm({ ...businessForm, email: e.target.value })} />
                <Input label="GST Number" placeholder="GSTIN" value={businessForm.gst || ''}
                  onChange={(e) => setBizForm({ ...businessForm, gst: e.target.value })} />
                <div className="form-group md:col-span-2">
                  <label className="label">Address</label>
                  <textarea value={businessForm.address || ''} onChange={(e) => setBizForm({ ...businessForm, address: e.target.value })}
                    placeholder="Full business address..." rows={3} className="input resize-none" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="primary" icon={Save} onClick={handleBizSave}>Save Business Settings</Button>
              </div>
            </div>
          )}

          {activeTab === 'app' && (
            <div className="space-y-6">
              {/* Theme & Appearance Section */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-5 h-5 text-primary-600" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Theme & Appearance</h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                  Customize the look, color scheme, and mode of your InventoPro workspace
                </p>

                {/* Theme Mode Selector (Light, Dark, System) */}
                <div className="mb-6">
                  <label className="label mb-2">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setThemeMode('light')}
                      className={clsx(
                        'flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all',
                        themeMode === 'light'
                          ? 'border-primary-600 bg-primary-50/60 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      )}
                    >
                      <Sun className="w-5 h-5 text-amber-500" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeMode('dark')}
                      className={clsx(
                        'flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all',
                        themeMode === 'dark'
                          ? 'border-primary-600 bg-primary-50/60 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      )}
                    >
                      <Moon className="w-5 h-5 text-indigo-400" />
                      <span>Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeMode('system')}
                      className={clsx(
                        'flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all',
                        themeMode === 'system'
                          ? 'border-primary-600 bg-primary-50/60 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      )}
                    >
                      <Monitor className="w-5 h-5 text-slate-500" />
                      <span>System</span>
                    </button>
                  </div>
                </div>

                {/* Primary Accent Color Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label">Primary Accent Color</label>
                    <span className="text-xs text-primary-600 font-medium capitalize">
                      {accentColors?.find(c => c.id === accentColor)?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    {accentColors?.map((c) => {
                      const isSelected = accentColor === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setAccentColor(c.id)
                            toast.success(`Theme color changed to ${c.name}`, { icon: '🎨', duration: 2000 })
                          }}
                          className={clsx(
                            'group flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-medium',
                            isSelected
                              ? 'border-gray-400 dark:border-gray-500 ring-2 ring-primary-500/30 bg-gray-50 dark:bg-gray-800'
                              : 'border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-850'
                          )}
                        >
                          <div
                            className="w-7 h-7 rounded-full shadow-sm flex items-center justify-center transition-transform group-hover:scale-110"
                            style={{ backgroundColor: c.colorHex }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                          </div>
                          <span className={clsx('truncate text-[11px]', isSelected ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-400')}>
                            {c.name.split(' ')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Live Color Preview
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" size="sm">Primary Button</Button>
                    <Button variant="secondary" size="sm">Secondary</Button>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                      Primary Badge
                    </span>
                    <span className="text-xs font-medium text-primary-600 hover:underline cursor-pointer">
                      Primary Link Sample
                    </span>
                  </div>
                </div>
              </div>

              {/* General Application Preferences */}
              <div className="card p-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Application Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Low Stock Threshold"
                    type="number"
                    min="1"
                    value={appForm.lowStockThreshold || 5}
                    onChange={(e) => setAppForm({ ...appForm, lowStockThreshold: e.target.value })}
                    hint="Alert when stock falls below this quantity"
                  />
                  <Select
                    label="Currency"
                    value={appForm.currency || 'INR'}
                    options={[
                      { value: 'INR', label: 'INR (₹)' },
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'GBP', label: 'GBP (£)' },
                    ]}
                    onChange={(e) => setAppForm({ ...appForm, currency: e.target.value })}
                    placeholder=""
                  />
                  <Select
                    label="Date Format"
                    value={appForm.dateFormat || 'dd MMM yyyy'}
                    options={[
                      { value: 'dd MMM yyyy', label: 'DD Mon YYYY (25 Sep 2026)' },
                      { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (09/25/2026)' },
                      { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (25/09/2026)' },
                      { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2026-09-25)' },
                    ]}
                    onChange={(e) => setAppForm({ ...appForm, dateFormat: e.target.value })}
                    placeholder=""
                  />
                </div>

                <div className="flex justify-end mt-5">
                  <Button variant="primary" icon={Save} onClick={handleAppSave}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
