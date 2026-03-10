import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Key, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store'

export default function ProfilePage() {
  const { user, updateProfile, changePassword, loading, error, clearError } = useAuthStore()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setProfileSuccess(false)
    try {
      await updateProfile({ display_name: displayName })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch {
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)
    if (passwords.new !== passwords.confirm) {
      setPasswordError('两次输入的密码不一致')
      return
    }
    if (passwords.new.length < 8) {
      setPasswordError('新密码至少需要 8 个字符')
      return
    }
    try {
      await changePassword(passwords.old, passwords.new)
      setPasswords({ old: '', new: '', confirm: '' })
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setPasswordError(msg || '修改失败')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">个人信息</h1>
        <p className="text-gray-500 mt-1">管理您的账号信息和安全设置</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">基本信息</h2>
            <p className="text-sm text-gray-500">更新您的显示名称</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-xs text-gray-500 block">邮箱</span>
            <div className="flex items-center space-x-1 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{user?.email}</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">用户名</span>
            <span className="text-sm font-medium text-gray-700 mt-0.5 block">@{user?.username}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {profileSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>个人信息已更新</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="label">显示名称</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
              placeholder="您希望被如何称呼"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '保存中...' : '保存修改'}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Key className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">修改密码</h2>
            <p className="text-sm text-gray-500">定期更换密码保障账号安全</p>
          </div>
        </div>

        {passwordError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>密码已修改，请重新登录</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">当前密码</label>
            <input
              type="password"
              value={passwords.old}
              onChange={(e) => setPasswords((p) => ({ ...p, old: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label">新密码</label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
              className="input-field"
              placeholder="至少 8 个字符"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="label">确认新密码</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '修改中...' : '修改密码'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
