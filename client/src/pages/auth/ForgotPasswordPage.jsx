import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      toast.success('Password reset OTP sent to your email address.');
      navigate(`${ROUTES.RESET_PASSWORD}?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const msg = err.userMessage || 'Failed to request password reset OTP.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Forgot Password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email to receive a 6-digit verification OTP
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Registered Email"
          type="email"
          name="email"
          placeholder="user@stocksense.com"
          required
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          icon={Send}
          className="w-full"
        >
          Send Verification Code
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
