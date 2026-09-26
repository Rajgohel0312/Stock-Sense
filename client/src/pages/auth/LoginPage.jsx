import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      toast.success('Successfully signed in!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.userMessage || 'Failed to sign in. Please verify your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your credentials to access the inventory system
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          name="email"
          placeholder="user@stocksense.com"
          required
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-1 flex justify-end">
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          icon={LogIn}
          className="w-full"
        >
          Sign In
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500 font-medium">Or continue with</span>
        </div>
      </div>

      <a
        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`}
        className="flex items-center justify-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Sign in with Google
      </a>

      <div className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link to={ROUTES.SIGNUP} className="font-semibold text-indigo-600 hover:text-indigo-500">
          Create staff account
        </Link>
      </div>
    </div>
  );
}
