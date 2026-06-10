import { Timer } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../lib/auth-client'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await signUp.email({ name, email, password })
      if (res.error) {
        setError(res.error.message ?? 'Failed to create account')
      } else {
        navigate('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#D97706] flex items-center justify-center">
            <Timer size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">TaskFlow</span>
        </div>

        <div className="bg-[#1E293B] rounded-2xl p-8 border border-white/5 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-sm text-[#64748B] mb-6">Start tracking your productivity</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              placeholder="Your name"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              placeholder="Min. 8 characters"
              helperText="At least 8 characters"
            />

            {error && (
              <p role="alert" className="text-xs text-[#DC2626] bg-[#DC2626]/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-[#64748B] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[#D97706] hover:text-[#F59E0B] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
