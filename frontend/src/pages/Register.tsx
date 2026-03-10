import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store'

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    displayName: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const { register, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    if (form.password.length < 8) return
    try {
      await register(form.email, form.username, form.password, form.displayName || undefined)
      navigate('/profile')
    } catch {
    }
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-warm-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-3">
            <Home className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">创建账号</h1>
          <p className="text-gray-500 mt-1">加入 HamR 家庭智能助理</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">邮箱 *</label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="label">用户名 *</label>
              <input
                type="text"
                value={form.username}
                onChange={update('username')}
                className="input-field"
                placeholder="3-20个字符"
                required
                minLength={3}
                maxLength={20}
              />
            </div>

            <div>
              <label className="label">显示名称</label>
              <input
                type="text"
                value={form.displayName}
                onChange={update('displayName')}
                className="input-field"
                placeholder="如何称呼您（可选）"
              />
            </div>

            <div>
              <label className="label">密码 *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  className="input-field pr-10"
                  placeholder="至少 8 个字符"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="mt-1 text-xs text-red-500">密码至少需要 8 个字符</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? '注册中...' : '创建账号'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            已有账号？{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
