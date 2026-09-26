import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, otp, newPassword });
      toast.success('Password successfully reset! Please sign in with your new credentials.');
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      const msg = err.userMessage || 'Failed to reset password. Please check your OTP code.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reset Password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the 6-digit verification code and your new password
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Account Email"
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="6-Digit OTP Code"
          type="text"
          name="otp"
          placeholder="123456"
          maxLength={6}
          required
          icon={KeyRound}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <Input
          label="New Password"
          type="password"
          name="newPassword"
          placeholder="At least 6 characters"
          required
          icon={Lock}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <Input
          label="Confirm New Password"
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          required
          icon={Lock}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          icon={CheckCircle2}
          className="w-full"
        >
          Confirm Reset Password
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
