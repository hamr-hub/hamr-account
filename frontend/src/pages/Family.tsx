import { useState, useEffect, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, LogIn, UserCheck, Copy, CheckCircle, AlertCircle, Crown, Trash2 } from 'lucide-react'
import { api } from '../api'

interface FamilyMember {
  user_id: string
  email: string
  username: string
  display_name: string | null
  role: string
  joined_at: string
}

interface Family {
  id: string
  name: string
  description: string | null
  owner_id: string
  invite_code: string
  member_count: number
  created_at: string
}

export default function FamilyPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newFamily, setNewFamily] = useState({ name: '', description: '' })
  const [inviteCode, setInviteCode] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    fetchFamilies()
  }, [])

  useEffect(() => {
    if (selectedFamily) fetchMembers(selectedFamily)
  }, [selectedFamily])

  const fetchFamilies = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<Family[]>('/families')
      setFamilies(data)
      if (data.length > 0 && !selectedFamily) {
        setSelectedFamily(data[0].id)
      }
    } catch {
      setError('加载家庭列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async (familyId: string) => {
    try {
      const { data } = await api.get<FamilyMember[]>(`/families/${familyId}/members`)
      setMembers(data)
    } catch {
    }
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<Family>('/families', newFamily)
      setFamilies((prev) => [...prev, data])
      setSelectedFamily(data.id)
      setShowCreate(false)
      setNewFamily({ name: '', description: '' })
      setSuccess('家庭创建成功！')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<Family>('/families/join', { invite_code: inviteCode.trim() })
      setFamilies((prev) => [...prev, data])
      setSelectedFamily(data.id)
      setShowJoin(false)
      setInviteCode('')
      setSuccess('成功加入家庭！')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || '加入失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async (familyId: string) => {
    if (!confirm('确认退出该家庭？')) return
    try {
      await api.post(`/families/${familyId}/leave`)
      setFamilies((prev) => prev.filter((f) => f.id !== familyId))
      if (selectedFamily === familyId) {
        setSelectedFamily(families.find((f) => f.id !== familyId)?.id || null)
      }
      setSuccess('已退出家庭')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || '退出失败')
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const currentFamily = families.find((f) => f.id === selectedFamily)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家庭管理</h1>
          <p className="text-gray-500 mt-1">创建或加入家庭，共同管理家庭事务</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setShowJoin(true)} className="btn-secondary text-sm">
            <LogIn className="w-4 h-4 mr-1" />
            加入家庭
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4 mr-1" />
            创建家庭
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card border-primary-200"
        >
          <h3 className="font-semibold mb-4">创建新家庭</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="label">家庭名称 *</label>
              <input
                type="text"
                value={newFamily.name}
                onChange={(e) => setNewFamily((p) => ({ ...p, name: e.target.value }))}
                className="input-field"
                placeholder="例如：张家大院"
                required
              />
            </div>
            <div>
              <label className="label">描述（可选）</label>
              <input
                type="text"
                value={newFamily.description}
                onChange={(e) => setNewFamily((p) => ({ ...p, description: e.target.value }))}
                className="input-field"
                placeholder="简单介绍你的家庭"
              />
            </div>
            <div className="flex space-x-2 pt-1">
              <button type="submit" disabled={loading} className="btn-primary text-sm">
                {loading ? '创建中...' : '确认创建'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                取消
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {showJoin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card border-blue-200"
        >
          <h3 className="font-semibold mb-4">加入家庭</h3>
          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label className="label">邀请码</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="input-field font-mono"
                placeholder="输入邀请码"
                required
              />
            </div>
            <div className="flex space-x-2 pt-1">
              <button type="submit" disabled={loading} className="btn-primary text-sm">
                {loading ? '加入中...' : '确认加入'}
              </button>
              <button type="button" onClick={() => setShowJoin(false)} className="btn-secondary text-sm">
                取消
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {families.length === 0 && !loading ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">您还没有加入任何家庭</p>
          <p className="text-sm text-gray-400 mt-1">创建一个家庭或使用邀请码加入已有家庭</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            {families.map((family) => (
              <button
                key={family.id}
                onClick={() => setSelectedFamily(family.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedFamily === family.id
                    ? 'bg-primary-50 border-primary-300 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="font-medium text-gray-900 truncate">{family.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{family.member_count} 位成员</div>
              </button>
            ))}
          </div>

          {currentFamily && (
            <motion.div
              key={currentFamily.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="lg:col-span-2 space-y-4"
            >
              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{currentFamily.name}</h2>
                    {currentFamily.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{currentFamily.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleLeave(currentFamily.id)}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>退出</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-xs text-gray-500">邀请码</span>
                    <div className="font-mono font-bold text-gray-900 mt-0.5">{currentFamily.invite_code}</div>
                  </div>
                  <button
                    onClick={() => copyInviteCode(currentFamily.invite_code)}
                    className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700"
                  >
                    {copiedCode ? (
                      <><CheckCircle className="w-4 h-4" /><span>已复制</span></>
                    ) : (
                      <><Copy className="w-4 h-4" /><span>复制</span></>
                    )}
                  </button>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold mb-4 flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-gray-400" />
                  <span>家庭成员（{members.length}）</span>
                </h3>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                          {(member.display_name || member.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                            <span>{member.display_name || member.username}</span>
                            {member.role === 'admin' && (
                              <Crown className="w-3 h-3 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">@{member.username}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        member.role === 'admin'
                          ? 'bg-yellow-50 text-yellow-700'
                          : member.role === 'observer'
                          ? 'bg-gray-50 text-gray-500'
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {member.role === 'admin' ? '管理员' : member.role === 'observer' ? '观察者' : '成员'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
